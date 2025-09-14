import { render, screen, waitFor } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { NotImplementedError } from "@intersection/backend/lib/domain/model/error";
import type { Tenant } from "@intersection/backend/lib/domain/model/data";

import Appointments, {
  SelectUsersDiablog,
  type Context,
} from "../appointments";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { notImplementedFn } from "@intersection/backend/lib/util";
import userEvent from "@testing-library/user-event";
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

describe("予約画面", () => {
  test("hello", async () => {
    mockUseOutletContext.mockReturnValue({
      tenant: {
        id: "id",
      } as Tenant,
    });
    const Stub = createRoutesStub([
      {
        path: "/appointments",
        Component: () => {
          return (
            <ReactRouterAppProvider>
              <Appointments />
            </ReactRouterAppProvider>
          );
        },
      },
    ]);
    render(<Stub initialEntries={["/appointments"]} />);
    screen.debug();
    await waitFor(() => screen.findByRole("button", { name: "Today" }));
  });
});

describe("ユーザー選択ダイアログ", () => {
  test("選択可能なユーザーの一覧が表示される", async () => {
    render(
      <SelectUsersDiablog
        open={true}
        onClose={notImplementedFn}
        payload={{
          tenant: {
            id: "test-id",
            users: async () => ({
              data: [
                { id: "id-1", name: "name-1" },
                { id: "id-2", name: "name-2" },
              ],
            }),
          } as Tenant,
          selectedUserIds: [],
        }}
      />
    );
    await waitFor(() => screen.findByText(/Select Users/));
    await waitFor(() => screen.findByText(/name-1/));
    await waitFor(() => screen.findByText(/name-2/));
  });

  test("選択済みのユーザはチェックボックスが入力済みの状態で表示される", async () => {
    render(
      <SelectUsersDiablog
        open={true}
        onClose={notImplementedFn}
        payload={{
          tenant: {
            id: "test-id",
            users: async () => ({
              data: [
                { id: "id-1", name: "name-1" },
                { id: "id-2", name: "name-2" },
              ],
            }),
          } as Tenant,
          selectedUserIds: ["id-1"],
        }}
      />
    );
    const checkboxes = await waitFor(() =>
      screen.getAllByRole("checkbox", { name: /row$/ })
    );
    screen.debug(checkboxes);
    expect(checkboxes.length).toBe(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  test("選択済みのユーザーのみ表示するよう一覧表示を切り替えることが出来る", async () => {
    render(
      <SelectUsersDiablog
        open={true}
        onClose={notImplementedFn}
        payload={{
          tenant: {
            id: "test-id",
            users: async () => ({
              data: [
                { id: "id-1", name: "name-1" },
                { id: "id-2", name: "name-2" },
              ],
            }),
          } as Tenant,
          selectedUserIds: ["id-1"],
        }}
      />
    );
    // 最初は全ユーザが表示されていることを確認
    await waitFor(() => screen.findByText(/name-1/));
    await waitFor(() => screen.findByText(/name-2/));

    const toggle = await waitFor(() => screen.getByRole("switch"));
    await userEvent.click(toggle);

    await waitFor(() => screen.findByText(/name-1/));
    expect(() => screen.findByText(/name-2/)).rejects.toThrow();
  });
});
