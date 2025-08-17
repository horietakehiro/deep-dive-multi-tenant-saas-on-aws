import type { Schema } from "./../../amplify/data/resource";
import type { AuthUser } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import type { AmplifyFunction } from "../utils";

type C = ReturnType<typeof generateClient<Schema>>;
export type AmplifyClient = {
  getTenant: AmplifyFunction<
    C["models"]["Tenant"]["get"],
    Schema["Tenant"]["type"]
  >;
  updateTenant: AmplifyFunction<
    C["models"]["Tenant"]["update"],
    Schema["Tenant"]["type"]
  >;
  activateTenant: AmplifyFunction<
    C["queries"]["invokeApplicationPlaneDeployment"],
    Schema["invokeApplicationPlaneDeployment"]["type"]
  >;
  listTenantStatuses: C["enums"]["TenantStatus"]["values"];

  getUser: AmplifyFunction<C["models"]["User"]["get"], Schema["User"]["type"]>;
  createUser: AmplifyFunction<
    C["models"]["User"]["create"],
    Schema["User"]["type"]
  >;
  deleteUser: AmplifyFunction<
    C["models"]["User"]["delete"],
    Schema["User"]["type"]
  >;
  updateUser: AmplifyFunction<
    C["models"]["User"]["update"],
    Schema["User"]["type"]
  >;
  listUsers: AmplifyFunction<
    C["models"]["User"]["list"],
    Schema["User"]["type"][]
  >;
};
export interface RootContext {
  authUser: AuthUser;
  tenant?: Schema["Tenant"]["type"];
  setTenant: (tenant: Schema["Tenant"]["type"]) => void;
  client: AmplifyClient;
}
