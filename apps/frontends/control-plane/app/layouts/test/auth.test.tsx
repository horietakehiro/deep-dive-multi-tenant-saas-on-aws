import { createRoutesStub } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import Authenticator from "../auth";

describe("認証画面", () => {
  test("サインアップ画面にテナント名を入力するテキストフィールドが表示されること", async () => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: Authenticator,
      },
    ]);
    render(<Stub initialEntries={["/"]} />);
    screen.debug();

    // サインアップのタブを開く
    const button = await waitFor(() => screen.getByText("Create Account"));
    await userEvent.click(button);
    await waitFor(() => screen.findByRole("textbox", { name: "Tenant Name" }));
  });
});
