import type { Spot, Tenant } from "@intersection/backend/lib/domain/model/data";
import { createRoutesStub } from "react-router";
import Spots from "../spots";
import React from "react";
import type { Context } from "../spots";
import { NotImplementedError } from "@intersection/backend/lib/domain/model/error";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
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

describe("スポット管理画面", () => {
  const ComponentFn = (t: Tenant) => {
    return () => {
      const [tenant] = React.useState<Tenant>(t);
      mockUseOutletContext.mockReturnValue({
        tenant,
        repository: {
          createSpot: async (props) => ({
            data: {
              id: "spot-1",
              name: props.name,
              description: props.description,
              tenantId: "test-id",
            } as Spot,
          }),
          getSpot: async ({ id }) => ({
            data: {
              id: id,
              name: "spot-name",
              description: "",
              available: true,
            } as Spot,
          }),
          updateSpot: async (props) => ({
            data: {
              ...props,
              tenantId: "test-id",
            } as Spot,
          }),
          deleteSpot: async (props) => ({
            data: {
              id: props.id,
              tenantId: "test-id",
            } as Spot,
          }),
        },
      });
      return (
        // <AppProvider>
        //   <Spots />
        // </AppProvider>
        <ReactRouterAppProvider>
          <Spots />
        </ReactRouterAppProvider>
      );
    };
  };
  test("テナント配下に登録済みのスポットが一覧に表示される", async () => {
    const Stub = createRoutesStub([
      {
        path: "/spots",
        Component: ComponentFn({
          id: "test-id",
          spots: async () => ({
            data: [{ id: "spot-1" }, { id: "spot-2" }, { id: "spot-3" }],
          }),
        } as Tenant),
      },
    ]);

    render(<Stub initialEntries={["/spots"]} initialIndex={0} />);
    await waitFor(() => screen.findByText("spot-1"));
    await waitFor(() => screen.findByText("spot-2"));
    await waitFor(() => screen.findByText("spot-3"));
  });
  test("新規にスポットを作成出来る", async () => {
    const Component = ComponentFn({
      id: "test-id",
      spots: async () => ({ data: [] as Spot[] }),
    } as Tenant);
    const Stub = createRoutesStub([
      {
        path: "/spots/new",
        Component,
      },
      {
        path: "/spots",
        Component,
      },
    ]);
    render(<Stub initialEntries={["/spots/new", "/spots"]} initialIndex={0} />);

    await waitFor(() => screen.findByText("Create new spot"));
    const name = await waitFor(() =>
      screen.getByRole("textbox", { name: "Name" })
    );
    await userEvent.type(name, "test-name");
    const button = await waitFor(() =>
      screen.getByRole("button", { name: "Create" })
    );
    await userEvent.click(button);
    const alert = await waitFor(() => screen.getByRole("alert"));
    expect(alert.textContent).toMatch(/created successfully/);
  });

  test("既存のスポットを編集出来る", async () => {
    const Component = ComponentFn({ id: "test-id" } as Tenant);
    const Stub = createRoutesStub([
      {
        path: "/spots/spot-1/edit",
        Component,
      },
      {
        path: "/spots",
        Component,
      },
    ]);

    render(
      <Stub
        initialEntries={["/spots/spot-1/edit", "/spots"]}
        initialIndex={0}
      />
    );

    await waitFor(() => screen.findByText(/Edit spot/));
    const button = await waitFor(() =>
      screen.getByRole("button", { name: "Edit" })
    );
    await userEvent.click(button);
    const alert = await waitFor(() => screen.getByRole("alert"));
    expect(alert.textContent).toMatch(/edited successfully/);
  });

  test("既存のスポットを削除出来る", async () => {
    const Component = ComponentFn({
      id: "test-id",
      spots: async () => ({
        data: [{ id: "spot-1" }],
      }),
    } as Tenant);
    const Stub = createRoutesStub([{ path: "/spots", Component }]);
    render(<Stub initialEntries={["/spots"]} />);

    screen.debug();

    const button = await waitFor(() =>
      screen.getByRole("menuitem", { name: "Delete" })
    );
    await userEvent.click(button);
    await waitFor(() => screen.findByRole("heading", { name: "Delete item?" }));
    const dialogButton = await waitFor(() =>
      screen.getByRole("button", { name: "Delete" })
    );
    await userEvent.click(dialogButton);

    const alert = await waitFor(() => screen.getByRole("alert"));
    expect(alert.textContent).toMatch(/deleted successfully/);
  });
});
