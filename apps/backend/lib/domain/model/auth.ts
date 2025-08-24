import {
  signIn as amplifySignIn,
  getCurrentUser as amplifyGetCurrentUser,
  fetchUserAttributes as amplifyFetchUserAttributes,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
} from "aws-amplify/auth";
import type { Config } from "./config";
import { CUSTOM_USER_ATTRIBUTES, type SignupUserAttributes } from "./user";

export const signInFactory = (config: Config): typeof amplifySignIn => {
  if (config.type === "NO_AMPLIFY") {
    return () => {
      return Promise.resolve({
        isSignedIn: true,
        nextStep: {
          signInStep: "DONE",
        },
      });
    };
  }
  return amplifySignIn;
};
export const getCurrentUserFactory = (
  config: Config
): typeof amplifyGetCurrentUser => {
  if (config.type === "NO_AMPLIFY") {
    return () => {
      return Promise.resolve({
        userId: "dummy-id",
        username: "dummy-name",
        signInDetails: {
          authFlowType: "USER_SRP_AUTH",
          loginId: "dummy@example.com",
        },
      });
    };
  }
  return amplifyGetCurrentUser;
};

export const fetchUserAttributesFactory = (
  config: Config
): typeof amplifyFetchUserAttributes => {
  if (config.type === "NO_AMPLIFY") {
    return () => Promise.resolve({ ...config.dummyUserAttributes });
  }
  return amplifyFetchUserAttributes;
};
export const signOutFactory = (config: Config): typeof amplifySignOut => {
  if (config.type === "NO_AMPLIFY") {
    return (input) => {
      console.debug(input);
      return Promise.resolve();
    };
  }
  return amplifySignOut;
};

export const signUpFactory = (
  config: Config,
  idFn: () => string
): typeof amplifySignUp => {
  if (config.type === "NO_AMPLIFY") {
    return (input) => {
      console.debug(input);
      return Promise.resolve({
        isSignUpComplete: true,
        nextStep: {
          signUpStep: "DONE",
        },
      });
    };
  }
  return async (input) => {
    const requiredUserAttributes: SignupUserAttributes = {
      "custom:tenantId": idFn(),
      "custom:tenantName":
        input.options!.userAttributes[CUSTOM_USER_ATTRIBUTES.TENANT_NAME]!,
      email: input.options?.userAttributes["email"]!,
      "custom:tenantRole": "ADMIN",
    };
    return amplifySignUp({
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
