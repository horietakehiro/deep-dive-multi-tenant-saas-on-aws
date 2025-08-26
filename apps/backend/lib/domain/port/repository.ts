import type { Client as AmplifyClient } from "aws-amplify/api";
import type {
  ListReturnValue,
  SingularReturnValue,
} from "@aws-amplify/data-schema/runtime";
import type { Config } from "../model/config";
import type { Schema, Tenant } from "../model/data";

export type Client = AmplifyClient<Schema>;

export type TenantClient = Client["models"]["Tenant"];

// FIXME: 複雑なモデルでselectionSetをそのままにしておくとtscの処理が激重になるので
// インターフェース化する際は一旦無効化する
type SingularFn<
  Fn extends (props: any, options?: { selectionSet?: any }) => any,
  Type,
  Props = Parameters<Fn>[0],
  Options = Parameters<Fn>[1],
> = (
  props: Props,
  options?: Options extends undefined
    ? undefined
    : Omit<Options, "selectionSet"> //& { selectionSet?: readonly never[] }
) => SingularReturnValue<Type>;
type ListFn<
  Fn extends (options?: { selectionSet?: any }) => any,
  Type,
  Options = Parameters<Fn>[0],
> = (
  options?: Options extends undefined
    ? undefined
    : Omit<Options, "selectionSet">
) => ListReturnValue<Type>;

export interface IRepository {
  createTenant: SingularFn<TenantClient["create"], Tenant>;
  getTenant: SingularFn<TenantClient["get"], Tenant>;
  listTenant: ListFn<TenantClient["list"], Tenant>;
}
export type IRepositoryFactory<T extends keyof IRepository | "*" = "*"> = (
  c: Config
) => [T] extends "*"
  ? Promise<IRepository>
  : Promise<Pick<IRepository, Exclude<T, "*">>>;

// export type IRepositoryFactory = (c: Config) => Promise<IRepository>;
