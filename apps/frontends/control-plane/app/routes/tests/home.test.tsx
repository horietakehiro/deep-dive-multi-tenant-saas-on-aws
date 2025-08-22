import type { RootContext } from "../../lib/domain/model/context";
import { render, screen, waitFor } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import Home from "../home";
const useOutletContext = vi.hoisted(() =>
  vi.fn(() => {
    return {
      authUser: {
        userId: "test-id",
        username: "test-name",
        signInDetails: {
          loginId: "test@example.com",
        },
      },
    } satisfies Pick<RootContext, "authUser">;
  })
);
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useOutletContext,
  };
});
describe("home画面", () => {
  test("ログインしているユーザのメールアドレスと共にウェルカムメッセージが表示される", async () => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: Home,
      },
    ]);
    render(<Stub initialEntries={["/"]} />);

    await waitFor(() => screen.findByText(/WELCOME/));
    await waitFor(() => screen.findByText(/test@example.com/));
  });
});
