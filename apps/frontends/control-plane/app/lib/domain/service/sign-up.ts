import { signUp as amplifySignUp } from "aws-amplify/auth";
import {
  CUSTOM_USER_ATTRIBUTES,
  type SignupUserAttributes,
} from "@intersection/backend/lib/domain/model/user";

export const signUpFactory = (
  signUpFn: typeof amplifySignUp,
  idFn: () => string
): typeof amplifySignUp => {
  return async (input) => {
    const userAttributes = input.options?.userAttributes!;
    const requiredUserAttributes: SignupUserAttributes = {
      "custom:tenantId": idFn(),
      email: input.options?.userAttributes["email"]!,
      "custom:tenantName": userAttributes[CUSTOM_USER_ATTRIBUTES.TENANT_NAME]!,
      "custom:tenantRole": "OWNER",
      "custom:ownerName": userAttributes[CUSTOM_USER_ATTRIBUTES.OWNER_NAME]!,
      "custom:ownerDepartmentName":
        userAttributes[CUSTOM_USER_ATTRIBUTES.OWNER_DEPARTMENT_NAME] ?? "",
      "custom:ownerTeamName":
        userAttributes[CUSTOM_USER_ATTRIBUTES.OWNER_TEAM_NAME] ?? "",
    };
    return signUpFn({
      ...input,
      options: {
        ...input.options,
        userAttributes: {
          ...input.options?.userAttributes,
          ...requiredUserAttributes,
        },
        // TODO: 動作確認用(後で消す)
        clientMetadata: {
          hoge: "fuga",
        },
      },
    });
  };
};
