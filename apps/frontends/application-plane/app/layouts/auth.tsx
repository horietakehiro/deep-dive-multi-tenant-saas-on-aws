import { Authenticator as AmplifyAuthenticator } from "@aws-amplify/ui-react";
import type { RootContext } from "../lib/domain/model/context";
import { Outlet, useOutletContext } from "react-router";
import { CUSTOM_USER_ATTRIBUTES } from "@intersection/backend/lib/domain/model/user";
import { signIn } from "../lib/domain/model/auth";

export default function Authenticator() {
  const context = useOutletContext<RootContext>();

  return (
    <AmplifyAuthenticator
      services={{
        handleSignIn: signIn,
      }}
      formFields={{
        signUp: {
          [CUSTOM_USER_ATTRIBUTES.TENANT_NAME]: {
            label: "Tenant Name",
            isRequired: true,
            order: 1,
            placeholder: "tenant-xxxx",
          },
        },
      }}
    >
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
