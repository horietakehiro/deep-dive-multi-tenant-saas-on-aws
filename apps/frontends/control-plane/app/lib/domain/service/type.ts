type OK<T> = {
  result: "OK";
  message: string;
  data: T;
};
type NG = {
  result: "NG";
  message: string;
  data: null;
};
export type ServiceResponse<T> = OK<T> | NG;
