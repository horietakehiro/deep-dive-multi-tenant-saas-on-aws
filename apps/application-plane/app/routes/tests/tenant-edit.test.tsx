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
              name: props.name!,
              url: null,
              createdAt: "",
              updatedAt: "",
            },
          });
        },
        activateTenant: () => {
          throw Error("not used");
        },
        getTenant: () => {
          throw Error("not used");
        },
      },
      tenant: {
        id: "tenant-id",
        status: "pending",
        name: "old-tenant",
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
  test("テナント名を変更できる", async () => {
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
    render(<Stub initialEntries={["/tenant/edit"]} />);

    // 新しいテナント名を入力して編集ボタンをクリックする
    const nameTextBox = await waitFor(() =>
      screen.getByRole("textbox", { name: "Name" })
    );
    await userEvent.type(nameTextBox, "new-tenant");
    const editButton = await waitFor(() =>
      screen.getByRole("button", { name: "Edit" })
    );
    await userEvent.click(editButton);

    // テナント情報の表示画面に遷移する
    await waitFor(() => screen.findByText(/tenant-id/));
  });
});
