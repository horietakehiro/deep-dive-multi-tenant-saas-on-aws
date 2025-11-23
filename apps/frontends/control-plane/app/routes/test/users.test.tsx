import type { Context } from "../users";
import { createRoutesStub } from "react-router";
import Users from "../users";
import type { Tenant, User } from "@intersection/backend/lib/domain/model/data";
import { render, waitFor, screen } from "@testing-library/react";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
describe("ユーザー一覧画面", () => {
  test("テナントに紐づくユーザーの一覧を表示出来る", async () => {
    const Stub = createRoutesStub([
      {
        path: "/users",
        Component: () => {
          return (
            <ReactRouterAppProvider>
              <Users
                loaderData={{
                  useOutletContext: () => ({
                    tenant: {
                      id: "test-id",
                      users: async () => ({
                        data: [
                          {
                            id: "id-1",
                            name: "name-1",
                            role: "ADMIN",
                            email: "email-1@example.com",
                          },
                          {
                            id: "id-2",
                            name: "name-2",
                            role: "ADMIN",
                            email: "email-2@example.com",
                          },
                        ],
                      }),
                    } as Tenant,
                    repository: {
                      listUserRoles: () => ["ADMIN"],
                    } as Context["repository"],
                  }),
                }}
              />
            </ReactRouterAppProvider>
          );
        },
      },
    ]);

    render(<Stub initialEntries={["/users"]} />);

    await waitFor(() => screen.findByText("name-1"));
    await waitFor(() => screen.findByText("name-2"));
  });
});
describe("ユーザー作成画面", () => {
  test("ユーザー新規作成時にはEmailアドレスを設定出来る", async () => {
    const Stub = createRoutesStub([
      {
        path: "/users/new",
        Component: () => (
          <ReactRouterAppProvider>
            <Users
              loaderData={{
                useOutletContext: () => ({
                  tenant: {
                    id: "test-id",
                    users: async () => ({
                      data: [] as User[],
                    }),
                  } as Tenant,
                  repository: {
                    listUserRoles: () => ["ADMIN"],
                  } as Context["repository"],
                }),
              }}
            />
          </ReactRouterAppProvider>
        ),
      },
    ]);

    render(<Stub initialEntries={["/users/new"]} />);

    const textBox = await waitFor(() =>
      screen.getByRole("textbox", { name: "Email" })
    );
    screen.debug();
    expect(textBox).not.toBeDisabled();
    expect(textBox.textContent).toBe("");
  });
});

describe("ユーザー作成画面", () => {
  test("既存ユーザー編集時にはEmailアドレスを編集出来ない", async () => {
    const Stub = createRoutesStub([
      {
        path: "/users/user-1/edit",
        Component: () => (
          <ReactRouterAppProvider>
            <Users
              loaderData={{
                useOutletContext: () => ({
                  tenant: {
                    id: "test-id",
                    users: async () => ({
                      data: [] as User[],
                    }),
                  } as Tenant,
                  repository: {
                    getUser: async (args) => ({
                      data: {
                        id: args.id,
                        name: "test-name",
                        email: "test@example.com",
                      },
                    }),
                    listUserRoles: () => ["ADMIN"],
                  } as Context["repository"],
                }),
              }}
            />
          </ReactRouterAppProvider>
        ),
      },
    ]);

    render(<Stub initialEntries={["/users/user-1/edit"]} />);

    const textBox = await waitFor(() =>
      screen.getByRole("textbox", { name: "Email" })
    );
    expect(textBox).toBeDisabled();
    screen.debug();
    expect(textBox).toHaveValue("test@example.com");
  });
});
