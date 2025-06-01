import { type Schema } from "../../amplify/data/resource";
import { SignUpUserAttributes } from "../../amplify/auth/types";

/**
 * アプリケーションで管理するステートの名前とその型
 */
export type State = {
  signedIn: boolean;
  userAttributes: SignUpUserAttributes | null;
  tenant: Schema["Tenant"]["type"] | null;
};
export type R = {
  [key in keyof State]: {
    get: (defaultValue?: State[key]) => State[key];
    set: (value: State[key], persist: boolean) => void;
  };
};
/**
 * ステートの保存とアクセスの為のリポジトリ仕様
 */
export interface IStateRepository {
  get: <T extends State[k], k extends keyof State>(
    key: k,
    defaultValue: T
  ) => State[k];
  /**
   *
   * @param key
   * @param value
   * @param setState ステートを更新する為の関数
   * @returns
   */
  set: <k extends keyof State>(
    key: k,
    value: State[k],
    setState: (value: State[k]) => void
  ) => void;
  remove: <k extends keyof State>(key: k) => void;
}

/**
 * ステートの保存場所としてローカルストレージを使用するリポジトリの実装
 */
export class LocalStateRepository implements IStateRepository {
  constructor() {}
  public get<T extends State[k], k extends keyof State>(
    key: k,
    defaultValue: T
  ): State[k] {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as State[k];
  }
  public set<k extends keyof State>(
    key: k,
    value: State[k],
    setState: (value: State[k]) => void
  ): void {
    localStorage.setItem(key, JSON.stringify(value));
    setState(value);
  }
  public remove<k extends keyof State>(key: k): void {
    localStorage.removeItem(key);
  }
}
/**
 * 全てのコンポーネントに渡されるべきプロパティ
 */
export interface BaseProps {
  stateRepository: IStateRepository;
}
