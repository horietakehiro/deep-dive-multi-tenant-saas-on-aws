import { generateClient } from "aws-amplify/api";
import { NotImplementedError } from "../domain/model/error";
import type {
  IRepository,
  IRepositoryFactory,
} from "../domain/port/repository";
import type { Schema } from "../domain/model/data";
import { getTenantByUserAttributes } from "../domain/service/get-tenant-by-user-attributes";

export const amplifyRepositoryFactory: IRepositoryFactory<"*"> = async (c) => {
  if (c.type === "NO_AMPLIFY") {
    throw new NotImplementedError();
  }

  await c.amplifyConfigFn();
  const ac = generateClient<Schema>();
  return {
    createTenant: ac.models.Tenant.create,
    listTenant: ac.models.Tenant.list,
    getTenant: ac.models.Tenant.get,
    updateTenant: ac.models.Tenant.update,
    requestTenantActivation: ac.mutations.requestTenantActivation,
    getTenantByUserAttributes: getTenantByUserAttributes,
    createSpot: ac.models.Spot.create,
    getSpot: ac.models.Spot.get,
    updateSpot: ac.models.Spot.update,
    deleteSpot: ac.models.Spot.delete,

    getUser: ac.models.User.get,
    updateUser: ac.models.User.update,
    deleteUser: ac.models.User.delete,
    createUser: ac.models.User.create,
    createCognitoUser: ac.mutations.createCognitoUser,
    deleteCognitoUser: ac.mutations.deleteCognitoUser,
    listUserRoles: ac.enums.UserRole.values,
  } satisfies IRepository;
};
