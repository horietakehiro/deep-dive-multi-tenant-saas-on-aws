import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  fetchUserAttributes as amplifyFetchUserAttributes,
} from "aws-amplify/auth";
import {
  fetchUserAttributesFactory,
  signInFactory,
  signOutFactory,
} from "@intersection/backend/lib/domain/model/auth";
import { config } from "./config";

export const fetchUserAttributes = fetchUserAttributesFactory(
  amplifyFetchUserAttributes,
  config
);
export const signOut = signOutFactory(amplifySignOut, config);
export const signIn = signInFactory(amplifySignIn, config);
// export const signUp = signUpFactory(config, uuidv4);
