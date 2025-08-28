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
// import type { EmotionJSX } from "@emotion/react/dist/declarations/src/jsx-namespace";

const mockUseOutletContext = vi.hoisted(() => {
  return vi.fn<() => Context>(() => {
    throw new NotImplementedError("hogefuga");
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
});
