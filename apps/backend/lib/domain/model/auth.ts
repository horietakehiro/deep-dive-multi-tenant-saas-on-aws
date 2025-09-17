import {
  signIn as amplifySignIn,
  getCurrentUser as amplifyGetCurrentUser,
  fetchUserAttributes as amplifyFetchUserAttributes,
  signOut as amplifySignOut,
} from "aws-amplify/auth";
import type { Config, AppType } from "./config";
import type { CustomUserAttributes } from "./user";

export type ClientMetadata = {
  appType: AppType;
};
export const signInFactory = (
  amplifyFn: typeof amplifySignIn,
  config: Config
): typeof amplifySignIn => {
  return async (input) => {
    return amplifyFn({
      ...input,
      options: {
        ...input.options,
        clientMetadata: {
          ...input.options?.clientMetadata,
          appType: config.appType,
        } satisfies ClientMetadata,
      },
    });
  };
};
export const getCurrentUserFactory = (
  config: Config
): typeof amplifyGetCurrentUser => {
  return amplifyGetCurrentUser;
};

export const fetchUserAttributesFactory = (
  amplifyFn: typeof amplifyFetchUserAttributes,
  config: Config
): (() => Promise<CustomUserAttributes>) => {
  return amplifyFn as () => Promise<CustomUserAttributes>;
};
export const signOutFactory = (
  amplifyFn: typeof amplifySignOut,
  config: Config
): typeof amplifySignOut => {
  return amplifyFn;
};
