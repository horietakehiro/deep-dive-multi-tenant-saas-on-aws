import type { RootContext as cpRootContext } from "../../../control-plane/app/models/context";
// import type { ResourcesConfig } from "aws-amplify";

export interface CPRootContext extends cpRootContext {}
export interface RootContext {
  tenant: cpRootContext["tenant"];
  setTenant: cpRootContext["setTenant"];
  authUser: cpRootContext["authUser"];
  // cpAmplifyConfig: ResourcesConfig;
  client: Pick<cpRootContext["client"], "getTenant">;
}
