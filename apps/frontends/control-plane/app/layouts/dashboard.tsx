import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import GroupsIcon from "@mui/icons-material/Groups";
import type { Branding, Navigation, Session } from "@toolpad/core/AppProvider";
import { DashboardLayout as ToolpadDashboardLayout } from "@toolpad/core/DashboardLayout";
import { Outlet, useOutletContext } from "react-router";
import React from "react";

import ApartmentIcon from "@mui/icons-material/Apartment";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import type { Route } from "./+types/dashboard";
import type { RootContext } from "../lib/domain/model/context";
import { signOut } from "../lib/domain/model/auth";
export default function DashboardLayout({}: Route.ComponentProps) {
  const { authUser, setTenant, tenant, repository } =
    useOutletContext<RootContext>();
  const [session, setSession] = React.useState<Session | null>({
    user: {
      id: authUser.userId,
      name: authUser.signInDetails?.loginId,
      email: authUser.signInDetails?.loginId,
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
      setTenant();
      // await getTenantFromUserAttributes(
      //   () => fetchUserAttributes() as Promise<CustomUserAttributes>,
      //   { getTenant: client.getTenant }
      // )
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
        <Outlet
          context={{ authUser, tenant, setTenant } satisfies RootContext}
        />
      </ToolpadDashboardLayout>
    </ReactRouterAppProvider>
  );
}
