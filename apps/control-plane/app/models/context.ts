import type { Schema } from "./../../amplify/data/resource";
import type { AuthUser } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import type { F } from "../utils";

type C = ReturnType<typeof generateClient<Schema>>;
export type AmplifyClient = {
  getTenant: F<C["models"]["Tenant"]["get"]>;
  updateTenant: F<C["models"]["Tenant"]["update"]>;
  activateTenant: F<C["queries"]["invokeApplicationPlaneDeployment"]>;
  listTenantStatuses: F<C["enums"]["TenantStatus"]["values"]>;
  // getTenant: <T extends AmplifyClient["models"]["Tenant"]["get"]>(
  //   ...args: Parameters<T>
  // ) => ReturnType<T>;

  // updateTenant: <T extends AmplifyClient["models"]["Tenant"]["update"]>(
  //   ...args: Parameters<T>
  // ) => ReturnType<T>;

  // activateTenant: <
  //   T extends AmplifyClient["queries"]["invokeApplicationPlaneDeployment"],
  // >(
  //   ...args: Parameters<T>
  // ) => ReturnType<T>;
};
export interface RootContext {
  authUser: AuthUser;
  tenant?: Schema["Tenant"]["type"];
  setTenant: (tenant: Schema["Tenant"]["type"]) => void;
  client: AmplifyClient;
}
