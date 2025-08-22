import { amplifyRepositoryFactory } from "backend/lib/adaptor/repository";
import { config } from "../domain/model/config";

export const repository = amplifyRepositoryFactory(config);
