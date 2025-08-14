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

export const services: AuthContext["services"] = {
  /**
   * テナント管理者のサインアップ時にカスタムユーザー属性としてテナント情報を渡す
   * @param input
   */
  handleSignUp: async (input: SignUpInput) => {
    console.log(input);
    const requiredUserAttributes: SignupUserAttributes = {
      "custom:tenantId": uuidv4(),
      "custom:tenantName":
        input.options!.userAttributes[CUSTOM_USER_ATTRIBUTES.TENANT_NAME]!,
      email: input.options?.userAttributes["email"]!,
    };

    console.log(requiredUserAttributes);
    return signUp({
      ...input,
      options: {
        ...input.options,
        userAttributes: {
          ...input.options?.userAttributes,
          ...requiredUserAttributes,
        },
      },
    });
  },
};
