import type { Schema } from "./../../amplify/data/resource";
import type { AuthUser } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";

type Client = ReturnType<typeof generateClient<Schema>>;
type MTenant = Client["models"]["Tenant"];
export interface RootContext {
  authUser: AuthUser;
  tenant?: Schema["Tenant"]["type"];
  setTenant: (tenant: Schema["Tenant"]["type"]) => void;
  client: {
    getTenant: (
      ...args: Parameters<MTenant["get"]>
    ) => ReturnType<MTenant["get"]>;
    updateTenant: (
      ...args: Parameters<MTenant["update"]>
    ) => ReturnType<MTenant["update"]>;
    activateTenant: (
      ...args: Parameters<Client["queries"]["invokeApplicationPlaneDeployment"]>
    ) => ReturnType<Client["queries"]["invokeApplicationPlaneDeployment"]>;
  };
}
