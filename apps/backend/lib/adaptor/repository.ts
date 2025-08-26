import { generateClient } from "aws-amplify/api";
import { NotImplementedError } from "../domain/model/error";
import type {
  IRepository,
  IRepositoryFactory,
} from "../domain/port/repository";
import type { Schema } from "../domain/model/data";

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
    // listTenants: async (props) => await ac.models.Tenant.list(props),
    // updateTenant: async (props) => await ac.models.Tenant.update(props),
  } satisfies IRepository;
};
