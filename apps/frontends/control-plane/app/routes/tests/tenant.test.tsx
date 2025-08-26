import { render, waitFor, screen } from "@testing-library/react";
import type { Tenant as TenantType } from "@intersection/backend/lib/domain/model/data";
import { NotImplementedError } from "@intersection/backend/lib/domain/model/error";
import React from "react";
import { createRoutesStub } from "react-router";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
// import "@testing-library/jest-dom";
import Tenant, { type Context } from "../tenant";

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

describe("テナント詳細画面", () => {
  test("自身の所属するテナントの情報を閲覧出来る", async () => {
    const Stub = createRoutesStub([
      {
        path: "/tenant",
        Component: () => {
          console.log("JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ");
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
              updateTenant: async () => ({
                data: {
                  id: "test-id",
                  name: "test-name",
                  status: "pending",
                } as TenantType,
              }),
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
    screen.debug();
    // テナントの詳細情報が表示される
    // await waitFor(() => screen.findByText(/test-id/));
    // await waitFor(() => screen.findByText(/test-name/));
  });
});
