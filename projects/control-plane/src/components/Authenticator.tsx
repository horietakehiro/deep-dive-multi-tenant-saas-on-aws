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
import { BaseProps, State } from "./utils";

export interface AuthenticatorProps
  extends BaseProps,
    AmplifyAuthenticatorProps {
  setSignedIn: (b: State["signedIn"]) => void;
  setTenant: (t: State["tenant"]) => void;
  setUserAttributes: (t: State["userAttributes"]) => void;
}

export default function Authenticator(props: AuthenticatorProps) {
  Hub.listen("auth", ({ payload }) => {
    switch (payload.event) {
      case "signedIn":
        console.log("サインイン成功");
        props.stateRepository.set("signedIn", true, props.setSignedIn);
        break;
      case "signedOut":
        console.log("サインアウト成功");
        props.stateRepository.set("tenant", null, props.setTenant);
        props.stateRepository.set(
          "userAttributes",
          null,
          props.setUserAttributes
        );
        props.stateRepository.set("signedIn", false, props.setSignedIn);
        break;
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
          // サインアップ時にテナント名をユーザーに入力してもらう
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
      </AmplifyAuthenticator>
    </>
  );
}
