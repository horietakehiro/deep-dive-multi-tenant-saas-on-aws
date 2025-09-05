import { signIn as amplifySignIn } from "aws-amplify/auth";
import {
  fetchUserAttributesFactory,
  signOutFactory,
} from "@intersection/backend/lib/domain/model/auth";
import { config } from "./config";

export const fetchUserAttributes = fetchUserAttributesFactory(config);
export const signOut = signOutFactory(config);
// export const signUp = signUpFactory(config, uuidv4);

export const signIn: typeof amplifySignIn = async (input) => {
  return amplifySignIn({
    ...input,
    options: {
      ...input.options,
      clientMetadata: {
        ...input.options?.clientMetadata,
        domain: "control-plane",
      },
    },
  });
};
