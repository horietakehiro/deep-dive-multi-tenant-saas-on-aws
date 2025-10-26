import type { Client as AmplifyClient } from "aws-amplify/api";
import type {
  ListReturnValue,
  SingularReturnValue,
} from "@aws-amplify/data-schema/runtime";
import type { Config } from "../model/config";
import type { Appointment, Schema, Spot, Tenant, User } from "../model/data";
import type { fetchUserAttributes } from "aws-amplify/auth";

export type Client = AmplifyClient<Schema>;

export type TenantClient = Client["models"]["Tenant"];
export type SpotClient = Client["models"]["Spot"];
export type UserClient = Client["models"]["User"];
export type Mutations = Client["mutations"];
export type AppointmentClient = Client["models"]["Appointment"];

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
  updateTenant: SingularFn<TenantClient["update"], Tenant>;
  requestTenantActivation: Mutations["requestTenantActivation"];

  getTenantByUserAttributes: (
    fetchUserAttributesFn: typeof fetchUserAttributes,
    getTenantFn: IRepository["getTenant"]
  ) => Promise<Tenant>;

  createSpot: SingularFn<SpotClient["create"], Spot>;
  getSpot: SingularFn<SpotClient["get"], Spot>;
  updateSpot: SingularFn<SpotClient["update"], Spot>;
  deleteSpot: SingularFn<SpotClient["delete"], Spot>;
  listSpots: ListFn<SpotClient["list"], Spot>;

  createUser: SingularFn<UserClient["create"], User>;
  getUser: SingularFn<UserClient["get"], User>;
  updateUser: SingularFn<UserClient["update"], User>;
  deleteUser: SingularFn<UserClient["delete"], User>;
  listUserRoles: () => Schema["UserRole"]["type"][];
  createUserIdentity: Mutations["createUserIdentity"];
  deleteUserIdentity: Mutations["deleteUserIdentity"];

  listAppointments: ListFn<AppointmentClient["list"], Appointment>;
  createAppoinment: SingularFn<AppointmentClient["create"], Appointment>;
}
export type IRepositoryFactory<T extends keyof IRepository | "*" = "*"> = (
  c: Config
) => [T] extends "*"
  ? Promise<IRepository>
  : Promise<Pick<IRepository, Exclude<T, "*">>>;

// export type IRepositoryFactory = (c: Config) => Promise<IRepository>;
