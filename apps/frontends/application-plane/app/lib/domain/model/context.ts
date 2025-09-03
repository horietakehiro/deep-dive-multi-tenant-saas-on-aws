import type { AuthUser } from "aws-amplify/auth";
// import type { Tenant } from "../../../../../backend/lib/domain/model/data";
import type { Tenant } from "@intersection/backend/lib/domain/model/data";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";
import type { Config } from "@intersection/backend/lib/domain/model/config";
// import type { Schema } from "backend/lib/domain/model/data";
// import type { IRepository } from "backend/lib/domain/port/repository";
export interface RootContext {
  authUser?: AuthUser;
  tenant?: Tenant;
  setTenant: (tenant: Tenant) => void;
  repository: IRepository;
  config: Config;
}
