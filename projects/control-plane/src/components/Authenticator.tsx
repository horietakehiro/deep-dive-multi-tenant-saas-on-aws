import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import { signUp, SignUpInput } from "aws-amplify/auth";
import "./../App.css";
import {
  Authenticator as AmplifyAuthenticator,
  AuthenticatorProps as AmplifyAuthenticatorProps,
} from "@aws-amplify/ui-react";
import {} from "aws-amplify/auth";
import {
  type SignUpUserAttributes,
  SIGNUP_CUSTOM_USER_ATTRIBUTES,
} from "./../../amplify/auth/types";
import { Hub } from "aws-amplify/utils";
import { BaseProps, StateKey } from "./utils";

export interface AuthenticatorProps
  extends BaseProps,
    AmplifyAuthenticatorProps {}

export default function Authenticator(props: AuthenticatorProps) {
  const [, setSignedIn] = React.useState<StateKey["signedIn"]>(
    props.stateRepository.get("signedIn", false)
  );
  Hub.listen("auth", async ({ payload }) => {
    switch (payload.event) {
      case "signedIn":
        console.log("サインイン成功");
        props.stateRepository.set("signedIn", true, setSignedIn);
        break;
      case "signedOut":
        console.log("サインアウト成功");
        props.stateRepository.set("signedIn", false, setSignedIn);
    }
  });

  const services = {
    /**
     * サインアップ時にカスタムのユーザー属性としてテナント情報を渡す
     * @param input
     * @returns
     */
    handleSignUp: async (input: SignUpInput) => {
      const userAttributes: SignUpUserAttributes = {
        // テナントIDはUUIDを生成し、テナント名はユーザから入力してもらう
        "custom:tenantId": uuidv4(),
        "custom:tenantName":
          input.options!.userAttributes[
            SIGNUP_CUSTOM_USER_ATTRIBUTES.TENANT_NAME
          ]!,
        email: input.options!.userAttributes["email"]!,
      };
      console.log(input);
      return signUp({
        ...input,
        options: {
          ...input.options,
          userAttributes: {
            ...input.options?.userAttributes,
            ...userAttributes,
          },
        },
      });
    },
  };
  return (
    <>
      <AmplifyAuthenticator
        formFields={{
          signUp: {
            [SIGNUP_CUSTOM_USER_ATTRIBUTES.TENANT_NAME]: {
              label: "Tenant Name",
              isRequired: true,
              order: 1,
            },
          },
        }}
        services={services}
      >
        {props.children}
        {/* {() => <main>{props.children.map((child) => child)}</main>} */}
      </AmplifyAuthenticator>
    </>
  );
}
