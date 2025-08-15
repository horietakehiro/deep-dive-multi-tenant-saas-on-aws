import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import Tenant from "../tenant";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import TenantEdit, { type Context } from "../tenant-edit";
import React from "react";
const mockUseOutletContext = vi.hoisted(() =>
  vi.fn<() => Context>(() => {
    throw Error("後続のテストコード内で戻り値を設定する");
  })
);
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useOutletContext: mockUseOutletContext,
  };
});

describe("テナント管理画面", () => {
  test("テナント名を変更できる", async () => {
    const Stub = createRoutesStub([
      {
        path: "/tenant/edit",
        Component: () => {
          const [tenant, setTenant] = React.useState<Context["tenant"]>({
            id: "test-id",
            name: "test-name",
            status: "pending",
            createdAt: "",
            updatedAt: "",
          });
          mockUseOutletContext.mockReturnValue({
            tenant,
            setTenant,
            client: {
              listTenantStatuses: () => [],
              activateTenant: () => {
                throw Error("このテストでは不要");
              },
              updateTenant: (props) => {
                return Promise.resolve({
                  data: {
                    id: props.id,
                    name: props.name!,
                    status: props.status!,
                    url: null,
                    createdAt: "",
                    updatedAt: "",
                  },
                });
              },
            },
          });
          return (
            <ReactRouterAppProvider>
              <TenantEdit />
            </ReactRouterAppProvider>
          );
        },
      },
      // 最初に上記で設定したステートとモックを基にテナント編集画面で操作が実行され、
      // 最後にテナント表示画面に遷移する
      {
        path: "/tenant",
        Component: () => (
          <ReactRouterAppProvider>
            <Tenant />
          </ReactRouterAppProvider>
        ),
      },
    ]);
    render(<Stub initialEntries={["/tenant/edit"]} />);

    // 新しいテナント名を入力して編集ボタンをクリックする
    const nameTextBox = await waitFor(() =>
      screen.getByRole("textbox", { name: "Name" })
    );
    await userEvent.clear(nameTextBox);
    await userEvent.type(nameTextBox, "new-tenant");
    const editButton = await waitFor(() =>
      screen.getByRole("button", { name: "Edit" })
    );
    await userEvent.click(editButton);

    // テナント情報の表示画面に遷移する
    await waitFor(() => screen.findByText(/new-tenant/), {});
  });
});
