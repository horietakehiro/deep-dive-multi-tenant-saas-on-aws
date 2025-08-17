import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import Tenant, { type Context } from "../tenant";
// import type { RootContext } from "../../models/context";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
// import TenantEdit from "../tenant-edit";
import React from "react";
import "@testing-library/jest-dom";
import TenantEdit from "../tenant-edit";
import type { EmotionJSX } from "node_modules/@emotion/react/dist/declarations/src/jsx-namespace";

const mockUseOutletContext = vi.hoisted(() => {
  return vi.fn<() => Context>(() => {
    throw Error("後続のテストコード内で返す値を設定 ");
  });
});
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useOutletContext: mockUseOutletContext,
  };
});

describe("テナント管理画面", () => {
  test("自身の所属するテナントの情報を閲覧できる", async () => {
    const Stub = createRoutesStub([
      {
        path: "/tenant",
        Component: () => {
          const [tenant, setTenant] = React.useState<Context["tenant"]>({
            id: "tenant-id",
            name: "tenant-name",
            status: "pending",
            createdAt: "",
            updatedAt: "",
            users: () => {
              throw Error("このテストでは不要");
            },
            appointments: () => {
              throw Error("このテストでは不要");
            },
            spots: () => {
              throw Error("このテストでは不要");
            },
          });
          mockUseOutletContext.mockReturnValue({
            tenant,
            setTenant,
            client: {
              activateTenant: () => {
                throw Error("このテストでは不要");
              },
              updateTenant: () => {
                throw Error("このテストでは不要");
              },
              listTenantStatuses: () => [],
            },
          });

          return (
            <ReactRouterAppProvider>
              <Tenant />
            </ReactRouterAppProvider>
          );
        },
      },
    ]);
    render(<Stub initialEntries={["/tenant"]} />);
    // テナント情報が表示される
    await waitFor(() => screen.findByText(/tenant-id/));
    await waitFor(() => screen.findByText(/tenant-name/));

    screen.debug();
    // テナント情報の編集ボタンが表示される
    await waitFor(() => screen.findByRole("button", { name: "Edit" }));
    // テナントのアクティベーションボタンが表示される
    await waitFor(() =>
      screen.findByRole("button", { name: "ACTIVATE TENANT" })
    );
  });

  test("編集ボタンをクリックすることでテナント情報の編集画面に遷移できる", async () => {
    const C = (CUT: () => EmotionJSX.Element) => {
      return () => {
        const [tenant, setTenant] = React.useState<Context["tenant"]>({
          id: "test-id",
          name: "test-name",
          status: "pending",
          createdAt: "",
          updatedAt: "",
          users: () => {
            throw Error("このテストでは不要");
          },
          appointments: () => {
            throw Error("このテストでは不要");
          },
          spots: () => {
            throw Error("このテストでは不要");
          },
        });
        mockUseOutletContext.mockReturnValue({
          tenant,
          setTenant,
          client: {
            listTenantStatuses: () => [],
            updateTenant: () => {
              throw Error();
            },
            activateTenant: () => {
              throw Error();
            },
          },
        });
        return (
          <ReactRouterAppProvider>
            <CUT />
          </ReactRouterAppProvider>
        );
      };
    };
    const Stub = createRoutesStub([
      {
        path: "/tenant",
        Component: C(Tenant),
      },
      {
        path: "/tenant/edit",
        Component: C(TenantEdit),
      },
    ]);
    render(<Stub initialEntries={["/tenant"]} />);
    const editButton = await waitFor(() =>
      screen.getByRole("button", { name: "Edit" })
    );
    userEvent.click(editButton);
    await waitFor(() => screen.findByText(/Edit Tenant Information/));
  });

  test("テナントのアクティベーションボタンをクリックすることでテナントのアクティベーションを実行できる", async () => {
    const Stub = createRoutesStub([
      {
        path: "/tenant",
        Component: () => {
          const [tenant, setTenant] = React.useState<Context["tenant"]>({
            id: "tenant-id",
            status: "pending",
            name: "tenant-name",
            url: null,
            createdAt: "",
            updatedAt: "",
            users: () => {
              throw Error("このテストでは不要");
            },
            appointments: () => {
              throw Error("このテストでは不要");
            },
            spots: () => {
              throw Error("このテストでは不要");
            },
          });
          mockUseOutletContext.mockReturnValue({
            tenant,
            setTenant,
            client: {
              listTenantStatuses: () => [],
              updateTenant: (props) => {
                return Promise.resolve({
                  data: {
                    id: props.id,
                    name: props.name!,
                    status: props.status!,
                    url: null,
                    createdAt: "",
                    updatedAt: "",
                    users: () => {
                      throw Error("このテストでは不要");
                    },
                    appointments: () => {
                      throw Error("このテストでは不要");
                    },
                    spots: () => {
                      throw Error("このテストでは不要");
                    },
                  },
                });
              },
              activateTenant: (props) => {
                return Promise.resolve({ data: props.tenantId! });
              },
            },
          });
          return (
            <ReactRouterAppProvider>
              <Tenant />
            </ReactRouterAppProvider>
          );
        },
      },
    ]);
    render(<Stub initialEntries={["/tenant"]} />);
    // テナントの初期状態はpendingであること
    await waitFor(() => screen.getByText(/pending/));
    // アクティベーションボタンボタンを押すことで、テナントの状態がactivatingに更新されること
    await userEvent.click(
      await waitFor(() =>
        screen.getByRole("button", { name: "ACTIVATE TENANT" })
      )
    );
    await waitFor(() => screen.findByText(/activating/));
    // ボタンは無効化(押せない)状態になる
    expect(
      await waitFor(() =>
        screen.getByRole("button", { name: "ACTIVATE TENANT" })
      )
    ).toBeDisabled();
  });
});
