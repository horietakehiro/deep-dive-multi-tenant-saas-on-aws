/**
 * アプリケーションで管理するステートの名前とその型
 */
export type StateKey = {
  signedIn: boolean;
  tenantId: string;
};
/**
 * ステートの保存とアクセスの為のリポジトリ仕様
 */
export interface IStateRepository {
  get: <T extends StateKey[k], k extends keyof StateKey>(
    key: k,
    defaultValue: T
  ) => StateKey[k] | null;
  /**
   *
   * @param key
   * @param value
   * @param setState ステートを更新する為の関数
   * @returns
   */
  set: <k extends keyof StateKey>(
    key: k,
    value: StateKey[k],
    setState: (value: StateKey[k]) => void
  ) => void;
  remove: <k extends keyof StateKey>(key: k) => void;
}

/**
 * ステートの保存場所としてローカルストレージを使用するリポジトリの実装
 */
export class LocalStateRepository implements IStateRepository {
  constructor() {}
  public get<T extends StateKey[k], k extends keyof StateKey>(
    key: k,
    defaultValue: T
  ): StateKey[k] {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as StateKey[k];
  }
  public set<k extends keyof StateKey>(
    key: k,
    value: StateKey[k],
    setFn: (value: StateKey[k]) => void
  ): void {
    localStorage.setItem(key, JSON.stringify(value));
    setFn(value);
  }
  public remove<k extends keyof StateKey>(key: k): void {
    localStorage.removeItem(key);
  }
}
/**
 * 全てのコンポーネントに渡されるべきプロパティ
 */
export interface BaseProps {
  stateRepository: IStateRepository;
}
