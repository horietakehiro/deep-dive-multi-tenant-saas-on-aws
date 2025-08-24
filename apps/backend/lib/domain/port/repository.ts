import type { Config } from "../model/config";
import type { Client, Schema, F } from "../model/data";

type Tenant = Schema["Tenant"]["type"];
type TenantClient = Client["models"]["Tenant"];
export interface IRepository {
  getTenant: F<TenantClient["get"], Tenant>;
  createTenant: F<TenantClient["create"], Tenant>;
  listTenant: F<TenantClient["list"], Tenant[]>;
}
export type IRepositoryFactory<T extends keyof IRepository | "*" = "*"> = (
  c: Config
) => [T] extends "*"
  ? Promise<IRepository>
  : Promise<Pick<IRepository, Exclude<T, "*">>>;
