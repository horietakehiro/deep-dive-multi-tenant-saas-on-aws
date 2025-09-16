import { createRoutesStub } from "react-router";
import DashboardLayout from "../dashboard";
import type { Tenant } from "@intersection/backend/lib/domain/model/data";
import { notImplementedFn } from "@intersection/backend/lib/util";
import { render, waitFor, screen } from "@testing-library/react";
import { useState } from "react";

describe("ダッシュボードレイアウト", () => {
  test("所属するテナント名がヘッダーに表示される", async () => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: () => {
          const [tenant, setTenant] = useState<Tenant | undefined>(undefined);
          return (
            <DashboardLayout
              loaderData={{
                useOutletContext: () => ({
                  tenant,
                  setTenant,
                  authUser: {
                    userId: "",
                    username: "",
                    signInDetails: {
                      authFlowType: "USER_AUTH",
                      loginId: "",
                    },
                  },
                  repository: {
                    getTenant: notImplementedFn,
                    getTenantByUserAttributes: async () => {
                      return {
                        name: "test-name",
                      } as Tenant;
                    },
                  },
                }),
              }}
            />
          );
        },
      },
    ]);

    render(<Stub initialEntries={["/"]} />);

    await waitFor(() => screen.findByText(/test-name/));
  });
});
