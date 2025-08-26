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
    const requiredUserAttributes: SignupUserAttributes = {
      "custom:tenantId": idFn(),
      "custom:tenantName":
        input.options!.userAttributes[CUSTOM_USER_ATTRIBUTES.TENANT_NAME]!,
      email: input.options?.userAttributes["email"]!,
      "custom:tenantRole": "OWNER",
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
