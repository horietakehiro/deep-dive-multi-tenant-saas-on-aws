import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import type { Branding, Navigation, Session } from "@toolpad/core/AppProvider";
import { DashboardLayout as ToolpadDashboardLayout } from "@toolpad/core/DashboardLayout";
import { Outlet, useOutletContext } from "react-router";
import React from "react";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import type { Route } from "./+types/dashboard";
import type { RootContext } from "../lib/domain/model/context";
import { fetchUserAttributes, signOut } from "../lib/domain/model/auth";
import { getTenantByUserAttributes } from "../lib/domain/service/get-tenant-by-user-attributes";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";

export default function DashboardLayout({}: Route.ComponentProps) {
  const { authUser, setTenant, tenant, repository } = useOutletContext<
    Omit<RootContext, "repository"> & {
      repository: Pick<IRepository, "getTenant">;
    }
  >();
  const [session, setSession] = React.useState<Session | null>({
    user: {
      id: authUser?.userId ?? null,
      name: authUser?.signInDetails?.loginId ?? null,
      email: authUser?.signInDetails?.loginId ?? null,
    },
  });

  const branding: Branding = {
    title: `Intersection - Controle Plane / ${tenant?.name}`,
    logo: undefined,
  };
  const navigation: Navigation = [
    {
      kind: "page",
      segment: "appointments",
      title: "Appointments",
      icon: <CalendarMonthIcon />,
    },
  ];
  React.useEffect(() => {
    const f = async () => {
      const tenant = await getTenantByUserAttributes(
        fetchUserAttributes,
        repository.getTenant
      );
      setTenant(tenant);
    };
    f();
  }, []);
  return (
    <ReactRouterAppProvider
      navigation={navigation}
      branding={branding}
      authentication={React.useMemo(() => {
        return {
          signOut: async () => {
            setSession(null);
            await signOut();
          },
          signIn: async () => {},
        };
      }, [])}
      session={session}
    >
      <ToolpadDashboardLayout>
        <Outlet context={{ authUser, tenant, setTenant, repository }} />
      </ToolpadDashboardLayout>
    </ReactRouterAppProvider>
  );
}
