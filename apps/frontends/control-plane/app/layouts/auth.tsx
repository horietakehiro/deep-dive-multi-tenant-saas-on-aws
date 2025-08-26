import { Authenticator as AmplifyAuthenticator } from "@aws-amplify/ui-react";
import type { RootContext } from "app/lib/domain/model/context";
import { Outlet, useOutletContext } from "react-router";

export default function Authenticator() {
  const context = useOutletContext<RootContext>();
  return (
    <AmplifyAuthenticator>
      {({ user }) => {
        if (user === undefined) {
          return <></>;
        }
        return (
          <Outlet
            context={{
              ...context,
              authUser: user,
            }}
          />
        );
      }}
    </AmplifyAuthenticator>
  );
}
