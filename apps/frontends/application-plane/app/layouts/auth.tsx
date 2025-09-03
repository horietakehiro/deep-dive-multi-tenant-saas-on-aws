import { v4 as uuidv4 } from "uuid";
import { Authenticator as AmplifyAuthenticator } from "@aws-amplify/ui-react";
import { signUpFactory } from "../lib/domain/service/sign-up";
import type { RootContext } from "../lib/domain/model/context";
import { Outlet, useOutletContext } from "react-router";
import { CUSTOM_USER_ATTRIBUTES } from "@intersection/backend/lib/domain/model/user";
import { signUp as amplifySignUp } from "aws-amplify/auth";

export default function Authenticator() {
  const context = useOutletContext<RootContext>();
  const signUp = signUpFactory(amplifySignUp, uuidv4);

  return (
    <AmplifyAuthenticator
      services={{
        handleSignUp: signUp,
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
