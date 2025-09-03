export interface ServiceResponse<T> {
  result: "OK" | "NG";
  message: string;
  data: T;
}
