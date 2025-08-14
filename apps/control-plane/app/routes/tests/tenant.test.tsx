import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import Tenant from "../tenant";
import type { RootContext } from "../../models/context";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import TenantEdit from "../tenant-edit";
const useOutletContext = vi.hoisted(() =>
  vi.fn(() => {
    return {
      client: {
        updateTenant: (props) => {
          return Promise.resolve({
            data: {
              id: props.id,
              status: "pending",
              name: "test",
              url: null,
              createdAt: "",
              updatedAt: "",
            },
          });
        },
        activateTenant: () => {
          return Promise.resolve({
            data: "",
          });
        },
        getTenant: () => {
          throw Error("not used");
        },
      },
      tenant: {
        id: "tenant-id",
        status: "pending",
        name: "tenant-name",
        url: null,
        createdAt: "",
        updatedAt: "",
      },
      setTenant: () => {},
    } satisfies Pick<RootContext, "client" | "tenant" | "setTenant">;
  })
);
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useOutletContext,
  };
});

describe("テナント管理画面", () => {
  test("自身の所属するテナントの情報を閲覧できる", async () => {
    const Stub = createRoutesStub([
      {
        path: "/tenant",
        Component: () => (
          <ReactRouterAppProvider>
            <Tenant />
          </ReactRouterAppProvider>
        ),
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
    const Stub = createRoutesStub([
      {
        path: "/tenant",
        Component: () => (
          <ReactRouterAppProvider>
            <Tenant />
          </ReactRouterAppProvider>
        ),
      },
      {
        path: "/tenant/edit",
        Component: () => (
          <ReactRouterAppProvider>
            <TenantEdit />
          </ReactRouterAppProvider>
        ),
      },
    ]);
    render(<Stub initialEntries={["/tenant"]} />);
    const editButton = await waitFor(() =>
      screen.getByRole("button", { name: "Edit" })
    );
    userEvent.click(editButton);
    await waitFor(() => screen.findByText(/Edit Tenant Information/));
  });

  // test("テナントのアクティベーションボタンをクリックすることでテナントのアクティベーションを実行できる", async () => {
  //   const Stub = createRoutesStub([
  //     {
  //       path: "/tenant",
  //       Component: () => (
  //         <ReactRouterAppProvider>
  //           <Tenant />
  //         </ReactRouterAppProvider>
  //       ),
  //     },
  //   ]);
  //   render(<Stub initialEntries={["/tenant"]} />);
  //   const editButton = await waitFor(() =>
  //     screen.getByRole("button", { name: "ACTIVATE TENANT" })
  //   );
  //   userEvent.click(editButton);
  //   await waitFor(() => screen.findByText(/Edit Tenant Information/));
  // });
});
