export type F<T extends (...args: any) => any> = (
  ...args: Parameters<T>
) => ReturnType<T>;
