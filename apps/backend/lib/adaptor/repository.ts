import { Amplify } from "aws-amplify";
import type { Config } from "../domain/model/config";
import type { IRepository } from "../domain/port/repository";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../domain/model/data";

export const amplifyRepositoryFactory = (config: Config): IRepository => {
  if (config.type === "NO_AMPLIFY") {
    throw Error("NotImplemented");
  }

  Amplify.configure(config.amplifyConfiguration);
  const client = generateClient<Schema>();
  return {
    getTenant: client.models.Tenant.get,
  };
};
