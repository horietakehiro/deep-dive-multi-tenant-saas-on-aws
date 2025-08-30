import { NotImplementedError } from "./domain/model/error";

export const notImplementedFn = () => {
  throw NotImplementedError;
};
