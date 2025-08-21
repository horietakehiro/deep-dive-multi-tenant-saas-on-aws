import type { Schema } from "./../../amplify/data/resource";
import type { AuthUser } from "aws-amplify/auth";
import type { AmplifyClient } from "./data";

export interface RootContext {
  authUser: AuthUser;
  tenant?: Schema["Tenant"]["type"];
  setTenant: (tenant: Schema["Tenant"]["type"]) => void;
  client: AmplifyClient;
}
