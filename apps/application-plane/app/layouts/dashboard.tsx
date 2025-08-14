import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import type { Branding, Navigation, Session } from "@toolpad/core/AppProvider";
import { DashboardLayout as ToolpadDashboardLayout } from "@toolpad/core/DashboardLayout";
import { Outlet, useOutletContext } from "react-router";
import React from "react";
import { fetchUserAttributes, signOut } from "aws-amplify/auth";
import LocationPinIcon from "@mui/icons-material/LocationPin";
import type { Route } from "../+types/root";
import type { RootContext } from "../models/context";
import { getTenantFromUserAttributes } from "../../../control-plane/app/models/tenant";
import type { CustomUserAttributes } from "apps/control-plane/app/models/admin-user";
export default function DashboardLayout({}: Route.ComponentProps) {
  const { authUser, client, setTenant, tenant } =
    useOutletContext<RootContext>();
  console.log(authUser);
  const [session, setSession] = React.useState<Session | null>({
    user: {
      id: authUser.userId,
      name: authUser.signInDetails?.loginId,
      email: authUser.signInDetails?.loginId,
    },
  });

  const branding: Branding = {
    title: `Intersection - Application Plane / ${tenant?.name}`,
    logo: undefined,
  };
  const navigation: Navigation = [
    {
      kind: "header",
      title: "Tenant Management",
    },
    {
      kind: "page",
      segment: "locations",
      title: "Locations",
      icon: <LocationPinIcon />,
    },
  ];
  React.useEffect(() => {
    const f = async () => {
      setTenant!(
        await getTenantFromUserAttributes(
          () => fetchUserAttributes() as Promise<CustomUserAttributes>,
          { getTenant: client.getTenant }
        )
      );
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
          context={{ authUser, tenant, setTenant, client } as RootContext}
        />
      </ToolpadDashboardLayout>
    </ReactRouterAppProvider>
  );
}
