import type { GraphQLFormattedError } from "@aws-amplify/data-schema/runtime";
/**
 * TODO: 単純に`type F<T extends (...args: any) => any> = T`とすると
 * 関数の戻り値がanyになったりExcessive stack depth comparing typesエラーが発生したりするので
 * 妥協点として以下のように定義する
 */
export type AmplifyFunction<Function extends (...args: any) => any, T> = (
  ...args: Parameters<Function>
) => Promise<{
  data: Partial<T> | null;
  errors?: GraphQLFormattedError[];
}>;
// export type F<T extends (...args: any) => any> = (
//   ...args: Parameters<T>
// ) => ReturnType<T> extends any ? ReturnType<T> : never;
// export type F<T> = T extends (...args: any) => any ? T : never;
