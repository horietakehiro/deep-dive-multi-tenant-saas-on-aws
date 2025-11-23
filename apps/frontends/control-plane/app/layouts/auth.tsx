import { v4 as uuidv4 } from "uuid";
import { Authenticator as AmplifyAuthenticator } from "@aws-amplify/ui-react";
import { signUpFactory } from "../lib/domain/service/sign-up";
import type { RootContext } from "../lib/domain/model/context";
import { Outlet, useOutletContext } from "react-router";
import { CUSTOM_USER_ATTRIBUTES } from "@intersection/backend/lib/domain/model/user";
import { signUp as amplifySignUp } from "aws-amplify/auth";
import { signIn } from "../lib/domain/model/auth";
import type { Route } from "./+types/auth";

export const clientLoader = async () => {
  return {
    useOutletContext: () => useOutletContext<RootContext>(),
  };
};

export default function Authenticator({ loaderData }: Route.ComponentProps) {
  const context = loaderData.useOutletContext();
  const signUp = signUpFactory(amplifySignUp, uuidv4);

  return (
    <AmplifyAuthenticator
      services={{
        handleSignUp: signUp,
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
          [CUSTOM_USER_ATTRIBUTES.OWNER_NAME]: {
            label: "Tenant Owner Name",
            isRequired: true,
            order: 2,
            placeholder: "John Doe",
          },
          [CUSTOM_USER_ATTRIBUTES.OWNER_DEPARTMENT_NAME]: {
            label: "Tenant Owner's Department Name",
            isRequired: false,
            order: 3,
          },
          [CUSTOM_USER_ATTRIBUTES.OWNER_TEAM_NAME]: {
            label: "Tenant Owner's Team Name",
            isRequired: false,
            order: 4,
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
