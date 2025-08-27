import { NotImplementedError } from "@intersection/backend/lib/domain/model/error";
import type { Context } from "../tenant-edit";
import type { Tenant as TenantType } from "@intersection/backend/lib/domain/model/data";
import TenantEdit from "../tenant-edit";
import React from "react";
import { AppProvider } from "@toolpad/core";
import { createRoutesStub } from "react-router";
import Tenant from "../tenant";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
describe("テナント情報編集画面", () => {
  test("テナント情報のうちテナント名を編集出来る", async () => {
    const Component = (CUT: typeof TenantEdit) => {
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
    render(
      <Stub initialEntries={["/tenant/edit", "/tenant"]} initialIndex={0} />
    );
    screen.debug();
    // 初期状態のテナント名が設定されていることを確認
    await waitFor(() => screen.findByText(/test-name/));
    // テナント名の入力テキストボックスに新しいテナント名を入力する
    const textBox = await waitFor(() =>
      screen.getByRole("textbox", { name: "Name" })
    );
    await userEvent.type(textBox, "-new");
    // 編集確定ボタンをクリックする
    const editButton = await waitFor(() =>
      screen.getByRole("button", { name: "Edit" })
    );
    await userEvent.click(editButton);
    // テナント詳細画面に遷移し、テナント名が更新されていることを確認
    await expect(() =>
      waitFor(() => screen.findByText(/Edit Tenant Information/))
    ).rejects.toThrow();
    await waitFor(() => screen.findByText(/test-name-new/));
  });
});
