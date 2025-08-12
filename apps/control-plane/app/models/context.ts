import type { Schema } from "./../../amplify/data/resource";
import type { AuthUser } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";

export interface OutletContext {
  authUser: AuthUser;
  tenant?: Schema["Tenant"]["type"];
  setTenant: (tenant: Schema["Tenant"]["type"]) => void;
  client: ReturnType<typeof generateClient<Schema>>;
}
