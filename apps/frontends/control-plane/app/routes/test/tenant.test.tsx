import { render, waitFor, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import type { Tenant as TenantType } from "@intersection/backend/lib/domain/model/data";
import { NotImplementedError } from "@intersection/backend/lib/domain/model/error";
// TODO: ReactRouterAppProviderではなくAppProviderを使うのが正しい？
// ※後者を使用すると`useLocation() may be used only in the context of a <Router> component.`というエラーが発生する
import { AppProvider } from "@toolpad/core";
// import { ReactRouterAppProvider } from "@toolpad/core/react-router";
// import { useState } from "react";
import "@testing-library/jest-dom";
import Tenant, { type Context } from "../tenant";
import React, { useState } from "react";
import TenantEdit from "../tenant-edit";
import userEvent from "@testing-library/user-event";
import { notImplementedFn } from "@intersection/backend/lib/util";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
// import type { EmotionJSX } from "@emotion/react/dist/declarations/src/jsx-namespace";

const mockUseOutletContext = vi.hoisted(() => {
  return vi.fn<() => Context>(() => {
    throw NotImplementedError;
  });
});
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useOutletContext: mockUseOutletContext,
  };
});

describe("テナント詳細画面", () => {
  test("自身の所属するテナントの情報を閲覧出来る", async () => {
    const Stub = createRoutesStub([
      {
        path: "/tenant",
        // Component: Tenant,
        Component: () => {
          const [tenant, setTenant] = useState<Context["tenant"]>({
            id: "test-id",
            name: "test-name",
            status: "pending",
          } as TenantType);

          mockUseOutletContext.mockReturnValue({
            tenant,
            setTenant,
            repository: {
              getTenant: async () => ({
                data: {
                  id: "test-id",
                  name: "test-name",
                  status: "pending",
                } as TenantType,
              }),
              updateTenant: async () => ({
                data: {
                  id: "test-id",
                  name: "test-name",
                  status: "pending",
                } as TenantType,
              }),
              requestTenantActivation: notImplementedFn,
            },
          });
          return (
            // <ReactRouterAppProvider>
            //   <Tenant />
            // </ReactRouterAppProvider>
            <AppProvider>
              <Tenant />
            </AppProvider>
          );
        },
      },
    ]);
    render(<Stub initialEntries={["/tenant"]} />);
    screen.debug();
    // テナントの詳細情報が表示される
    await waitFor(() => screen.findByText(/test-id/));
    await waitFor(() => screen.findByText(/test-name/));
    await waitFor(() => screen.findByText(/pending/));
  });

  test("編集ボタンをクリックすることで編集画面に遷移出来る", async () => {
    const Component = (CUT: typeof Tenant) => {
      return () => {
        const [tenant, setTenant] = React.useState<Context["tenant"]>({
          id: "test-id",
          name: "test-name",
          status: "pending",
        } as TenantType);
        mockUseOutletContext.mockReturnValue({
          tenant,
          setTenant,
          repository: {
            getTenant: async () => ({
              data: {
                id: "test-id",
                name: "test-name",
                status: "pending",
              } as TenantType,
            }),
            updateTenant: async (...args) => ({
              data: {
                id: "test-id",
                name: args[0].name!,
                status: "pending",
              } as TenantType,
            }),
            requestTenantActivation: notImplementedFn,
          },
        });
        return (
          <AppProvider>
            <CUT />
          </AppProvider>
        );
      };
    };
    const Stub = createRoutesStub([
      {
        path: "/tenant",
        Component: Component(Tenant),
      },
      {
        path: "/tenant/edit",
        Component: Component(TenantEdit),
      },
    ]);
    render(<Stub initialEntries={["/tenant"]} />);
    screen.debug();
    const editButton = await waitFor(() =>
      screen.getByRole("button", { name: "Edit" })
    );
    userEvent.click(editButton);
    await waitFor(() =>
      screen.findByRole("heading", { name: "Edit Tenant Detail" })
    );
  });

  describe("テナントアクティベーション機能", () => {
    const ComponentFn = (
      status: TenantType["status"],
      fn: IRepository["requestTenantActivation"]
    ) => {
      const t = { id: "test-id", name: "test-name", status } as TenantType;
      let tenant: TenantType | undefined;
      let setTenant: (tenant: TenantType) => void;
      return () => {
        if (tenant === undefined) {
          [tenant, setTenant] = useState<Context["tenant"]>({
            ...t,
          } as TenantType);
        }
        mockUseOutletContext.mockReturnValue({
          tenant,
          setTenant,
          repository: {
            getTenant: async () => ({
              data: {
                ...tenant,
              } as TenantType,
            }),
            updateTenant: async (...args) => ({
              data: { ...tenant, status: args[0].status } as TenantType,
            }),
            requestTenantActivation: fn,
          },
        });
        return (
          <ReactRouterAppProvider>
            <Tenant />
          </ReactRouterAppProvider>
        );
      };
    };
    test("テナントステータスがpengin時にのみアクティベーションボタンをクリック出来る", async () => {
      const Stub = createRoutesStub([
        {
          path: "/tenant",
          Component: ComponentFn("pending", async () => ({ data: "" })),
        },
      ]);
      render(<Stub initialEntries={["/tenant"]} />);

      const button = await waitFor(() =>
        screen.getByRole("button", { name: "ACTIVATE TENANT" })
      );
      await userEvent.click(button);
      const alert = await waitFor(() => screen.getByRole("alert", {}));
      expect(alert.textContent).toBe(
        "tenant activation successfully requested"
      );
    });
    test("テナントステータスがpendingでなければアクティベーションボタンはクリック出来ない", async () => {
      const Stub = createRoutesStub([
        { path: "/tenant", Component: ComponentFn("active", notImplementedFn) },
      ]);
      render(<Stub initialEntries={["/tenant"]} />);

      const button = await waitFor(() =>
        screen.getByRole("button", { name: "ACTIVATE TENANT" })
      );
      expect(button).toBeDisabled();
    });
    test("テナントのアクティベーションボタンに失敗した場合はエラーアラートが表示される", async () => {
      const Stub = createRoutesStub([
        {
          path: "/tenant",
          Component: ComponentFn("pending", async () => ({
            data: null,
            errors: [
              {
                errorInfo: {},
                errorType: "",
                message: "",
              },
            ],
          })),
        },
      ]);
      render(<Stub initialEntries={["/tenant"]} />);

      const button = await waitFor(() =>
        screen.getByRole("button", { name: "ACTIVATE TENANT" })
      );
      await userEvent.click(button);
      screen.debug();
      await waitFor(() => screen.findByTestId("ErrorOutlineIcon"));
    });
  });
});
