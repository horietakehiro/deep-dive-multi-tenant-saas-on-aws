import { generateClient } from "aws-amplify/api";
import type { Config } from "../domain/model/config";
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
    getTenant: async (props) => await ac.models.Tenant.get(props),
    createTenant: async (props) => await ac.models.Tenant.create(props),
    listTenant: async (props) => await ac.models.Tenant.list(props),
  } satisfies IRepository;
};
