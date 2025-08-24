import type { GraphQLFormattedError } from "@aws-amplify/data-schema/runtime";
import type { Client, Schema } from "../model/data";

type F<Function extends (...args: any) => any, T> = (
  ...args: Parameters<Function>
) => Promise<{
  data: T | null;
  errors?: GraphQLFormattedError[];
}>;

type Tenant = Schema["Tenant"]["type"];
type TenantClient = Client["models"]["Tenant"];
export interface IRepository {
  getTenant: F<TenantClient["get"], Tenant>;
  createTenant: F<TenantClient["create"], Tenant>;
}
