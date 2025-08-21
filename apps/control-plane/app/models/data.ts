import type { Schema } from "apps/control-plane/amplify/data/resource";
import type { AmplifyFunction } from "../utils";
import type { generateClient } from "aws-amplify/api";
export type C = ReturnType<typeof generateClient<Schema>>;
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
