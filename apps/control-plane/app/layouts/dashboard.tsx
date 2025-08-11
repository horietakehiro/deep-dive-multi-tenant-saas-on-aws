import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import GroupsIcon from "@mui/icons-material/Groups";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import type { Branding, Navigation, Session } from "@toolpad/core/AppProvider";
import { DashboardLayout as ToolpadDashboardLayout } from "@toolpad/core/DashboardLayout";
import { Outlet, useOutletContext } from "react-router";
import React from "react";
import { signOut } from "aws-amplify/auth";

import type { Route } from "./+types/dashboard";
import type { OutletContext } from "~/root";

const branding: Branding = {
  title: "Intersection - Admin Console",
  logo: undefined,
};
const navigation: Navigation = [
  {
    kind: "header",
    title: "Tenant Management",
  },
  {
    kind: "page",
    segment: "tenants",
    title: "Tenants",
    icon: <GroupsIcon />,
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "Admin Management",
  },
  {
    kind: "page",
    segment: "admin-users",
    title: "Admin Users",
    pattern: "admin-users{/:userId}*",
    icon: <SupervisorAccountIcon />,
  },
];

// export const clientLoader = async () => {
//   console.log("client loader of dashboard");
//   const user = await getCurrentUser();
//   return {
//     user: {
//       id: user.signInDetails?.loginId,
//       name: user.signInDetails?.loginId,
//     },
//   } as Session;
// };
export default function DashboardLayout({}: Route.ComponentProps) {
  const { authUser } = useOutletContext<OutletContext>();
  console.log(authUser);
  const [session, setSession] = React.useState<Session | null>({
    user: {
      id: authUser.userId,
      name: authUser.signInDetails?.loginId,
      email: authUser.signInDetails?.loginId,
    },
  });
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
        <Outlet />
      </ToolpadDashboardLayout>
    </ReactRouterAppProvider>
  );
}
