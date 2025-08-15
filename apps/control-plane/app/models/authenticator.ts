import type { AuthContext } from "@aws-amplify/ui";
import type { AuthenticatorProps } from "@aws-amplify/ui-react";

import { signUp, type SignUpInput } from "aws-amplify/auth";
import {
  CUSTOM_USER_ATTRIBUTES,
  type SignupUserAttributes,
} from "./admin-user";
import { v4 as uuidv4 } from "uuid";

export const formFileds: AuthenticatorProps["formFields"] = {
  signUp: {
    [CUSTOM_USER_ATTRIBUTES.TENANT_NAME]: {
      label: "Tenant Name",
      isRequired: true,
      order: 1,
      placeholder: "tenant-1",
    },
  },
};
/**
 *
 * @param idFn テナントIDの生成関数
 * @param signUpFn サインアップリクエストをCognitoユーザープールに送信するための関数
 * @returns
 */
export const handleSignUpFactory = (
  idFn: () => string,
  signUpFn: typeof signUp
): typeof signUp => {
  return async (input: SignUpInput) => {
    const requiredUserAttributes: SignupUserAttributes = {
      "custom:tenantId": idFn(),
      "custom:tenantName":
        input.options!.userAttributes[CUSTOM_USER_ATTRIBUTES.TENANT_NAME]!,
      email: input.options?.userAttributes["email"]!,
    };
    return signUpFn({
      ...input,
      options: {
        ...input.options,
        userAttributes: {
          ...input.options?.userAttributes,
          ...requiredUserAttributes,
        },
      },
    });
  };
};
export const services: AuthContext["services"] = {
  /**
   * テナント管理者のサインアップ時にカスタムユーザー属性としてテナント情報を渡す
   * @param input
   */
  handleSignUp: handleSignUpFactory(uuidv4, signUp),
};
