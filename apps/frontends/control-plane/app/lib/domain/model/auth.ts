import {
  fetchUserAttributesFactory,
  getCurrentUserFactory,
  signInFactory,
  signOutFactory,
  type AuthContext,
} from "backend/lib/domain/model/auth";
import { config } from "./config";

export const services: AuthContext["services"] = {
  handleSignIn: signInFactory(config),
  getCurrentUser: getCurrentUserFactory(config),
};
export const fetchUserAttributes = fetchUserAttributesFactory(config);
export const signOut = signOutFactory(config);
