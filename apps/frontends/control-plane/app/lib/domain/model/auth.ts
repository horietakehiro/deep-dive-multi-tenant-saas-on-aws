import { v4 as uuidv4 } from "uuid";
import {
  fetchUserAttributesFactory,
  signOutFactory,
  signUpFactory,
} from "backend/lib/domain/model/auth";
import { config } from "./config";

export const fetchUserAttributes = fetchUserAttributesFactory(config);
export const signOut = signOutFactory(config);
export const signUp = signUpFactory(config, uuidv4);
