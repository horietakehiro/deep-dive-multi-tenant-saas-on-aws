import type { AuthUser } from "aws-amplify/auth";
import type { Schema } from "backend/lib/domain/model/data";
import type { IRepository } from "backend/lib/domain/port/repository";
export interface RootContext {
  authUser: AuthUser;
  tenant?: Schema["Tenant"]["type"];
  setTenant: (tenant: Schema["Tenant"]["type"]) => void;
  repository: IRepository;
}
