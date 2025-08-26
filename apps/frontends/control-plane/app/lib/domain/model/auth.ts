import {
  fetchUserAttributesFactory,
  signOutFactory,
} from "@intersection/backend/lib/domain/model/auth";
import { config } from "./config";

export const fetchUserAttributes = fetchUserAttributesFactory(config);
export const signOut = signOutFactory(config);
// export const signUp = signUpFactory(config, uuidv4);
