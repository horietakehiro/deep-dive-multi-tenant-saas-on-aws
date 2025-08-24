import type { Config } from "../domain/model/config";
import type { IRepository } from "../domain/port/repository";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../domain/model/data";

export const amplifyRepositoryFactory = async (
  config: Config
): Promise<IRepository> => {
  if (config.type === "NO_AMPLIFY") {
    throw Error("NotImplemented");
  }
  await config.amplifyConfigFn();
  const client = generateClient<Schema>();
  return Promise.resolve({
    getTenant: client.models.Tenant.get,
    createTenant: client.models.Tenant.create,
  });
};
