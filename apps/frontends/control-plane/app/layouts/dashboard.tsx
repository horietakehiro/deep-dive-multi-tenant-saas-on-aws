import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import GroupsIcon from "@mui/icons-material/Groups";
import type { Branding, Navigation, Session } from "@toolpad/core/AppProvider";
import { DashboardLayout as ToolpadDashboardLayout } from "@toolpad/core/DashboardLayout";
import { Outlet, useOutletContext } from "react-router";
import React from "react";

import ApartmentIcon from "@mui/icons-material/Apartment";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import RoomIcon from "@mui/icons-material/Room";
import type { Route } from "./+types/dashboard";
import type { RootContext } from "../lib/domain/model/context";
import { fetchUserAttributes, signOut } from "../lib/domain/model/auth";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";

export type Context = Pick<RootContext, "authUser" | "setTenant" | "tenant"> & {
  repository: Pick<IRepository, "getTenant" | "getTenantByUserAttributes">;
};

export const clientLoader = () => {
  return {
    useOutletContext: () => useOutletContext<Context>(),
  };
};

export default function DashboardLayout({
  loaderData,
}: Pick<Route.ComponentProps, "loaderData">) {
  const { authUser, setTenant, tenant, repository } =
    loaderData.useOutletContext();
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
      kind: "header",
      title: "Tenant Management",
    },
    {
      kind: "page",
      segment: "tenant",
      title: "Tenant",
      icon: <ApartmentIcon />,
    },
    {
      kind: "page",
      segment: "Spots",
      icon: <RoomIcon />,
    },
    {
      kind: "page",
      segment: "users",
      title: "Users",
      icon: <GroupsIcon />,
    },
    {
      kind: "page",
      segment: "billing",
      title: "Billing",
      icon: <AttachMoneyIcon />,
    },
  ];
  React.useEffect(() => {
    const f = async () => {
      const tenant = await repository.getTenantByUserAttributes(
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
