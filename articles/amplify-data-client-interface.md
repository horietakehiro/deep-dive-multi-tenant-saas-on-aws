---
title: "amplify-dataから生成される型情報をインターフェース化する際の注意点と妥協点"
# emoji: "🤿"
type: "tech"
topics: ["AWS", "Amplify", "TypeScript"]
published: false
---

## 要約

- AWS Amplify Gen2の[amplify-data](https://github.com/aws-amplify/amplify-data)ライブラリにて生成される型情報は、そのままインターフェース化して再利用することが出来ない(tscでエラーが発生する)
- 主な原因は各メソッドの`selectionSet`オプションと思われる
- `selectionSet`オプションを除外した独自の型を定義する必要がある

---

## 環境

- node : v22.11.0
- npm : 10.9.0
- @aws-amplify/data-schema : 1.21.1

※その他使用ライブラリのバージョンは[事象再現用リポジトリ](https://github.com/horietakehiro/amplify-issue)に記載

---

## 背景

### amplify-dataで提供されている機能

AWS Amplify Gen2のamplify-dataライブラリでは、以下のようにデータモデルを定義して、バックエンド・フロントエンドから型安全且つ簡単にAWSバックエンドサービス上のデータにアクセス出来る機能が提供されています。

```js: データモデルの定義
const schema = a
  .schema({
    // テナントデータ
    Tenant: a.model({
      name: a.string().required(),
      // 各テナントには複数のユーザが紐づく関係性をモデリング
      users: a.hasMany("User", "TenantId"),
    }),
    // ユーザデータ
    User: a.model({
      name: a.string(),
      // 各ユーザは特定のテナントに紐づく関係性をモデリング
      tenantId: a.id().required(),
      tenant: a.belongsTo("Tenant", "tenantId"),
    }),
  })
  .authorization((allow) => allow.publicApiKey());
export type Schema = ClientSchema<typeof schema>;
```

```js: データクライアントの使用
const client = generateClient<Schema>();
const res = await client.models.Tenant.get({id: "xxx"})
res.data
// const re.datas: {
//     name: string;
//     users: LazyLoader<{
//         tenantId: string;
//         tenant: LazyLoader<... | null, false>;
//         name?: Nullable<string> | undefined;
//         readonly id: string;
//         readonly createdAt: string;
//         readonly updatedAt: string;
//     } | null, true>;
//     readonly id: string;
//     readonly createdAt: string;
//     readonly updatedAt: string;
// }
```

※詳細な情報は[こちら](https://docs.amplify.aws/react/build-a-backend/data/set-up-data/)を参照

---

### 実現したかったこと

上記のようにAWSバックエンドサービスにデータアクセスするクライアントと型情報が提供されている訳ですが、それを以下のようにインターフェース化してより再利用し易くしたいと考えました。

```js: インターフェース化のイメージ
type Client = ReturnType<typeof generateClient<Schema>>;
export interface IClient {
  // 後で述べるようにこの定義の仕方だとエラーになる
  getTenant: Client["models"]["Tenant"]["get"];
}
export class Repository {
  client: IClient;
  constructor(client: IClient) {
    this.client = client;
  }
  getTenant = async (id: string): Promise<Schema["Tenant"]["type"]> => {
    const res = await this.client.getTenant({ id });
    if (res.data === null) {
      throw Error("failed");
    }
    return res.data;
  };
}
```

このようにすることで、AWSバックエンドサービスへのデータアクセスロジックを依存注入可能にしたり、モック化し易くしたりすることで、コード全体のメンテナンス性や開発効率、テスト品質を向上させたいと考えていました。

```js: モック化のイメージ
// 任意のテナントデータを返すリポジトリインスタンス
export const dummyRepository = new Repository({
  getTenant: async (...args) => ({
    data: {
      id: args[0].id,
      name: "test-name",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }),
});

```

---

## 事象内容

### 発生したエラー

最初は単純に以下のように実装してみましたが、モック化時にtscの`TS2322`(≒型の不一致)エラーが発生してしまいます。

<!-- TODO: 絵文字が機能しているか確認 -->

```js: TS2322エラーが発生する実装例
type Client = ReturnType<typeof generateClient<Schema>>;
export interface IClient {
  // :warning: 問題の箇所
  getTenant: Client["models"]["Tenant"]["get"];
}
export class Repository {
  client: IClient;
  constructor(client: IClient) {
    this.client = client;
  }
  getTenant = async (id: string): Promise<Schema["Tenant"]["type"]> => {
    const res = await this.client.getTenant({ id });
    if (res.data === null) {
      throw Error("failed");
    }
    return res.data;
  };
}

const client = generateClient<Schema>();
// :white_check_mark: これはOK
export const productionRepository = new Repository({
  getTenant: client.models.Tenant.get,
})
// :x: これがNG
export const dummyRepository = new Repository({
  getTenant: async (...args) => ({
    data: {
      id: args[0].id,
      name: "test-name",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }),
});

```

```bash: 発生したtscエラー
Type 'Promise<{ data: { id: string; name: string; createdAt: string; updatedAt: string; }; }>' is not assignable to type 'SingularReturnValue<Prettify<ReturnValue<ClientModel<{ Tenant: ClientModel<..., SchemaMetadata<ModelSchema<SetTypeSubArg<{ types: { Tenant: ModelType<{ fields: { name: ModelField<string, "required", undefined, ModelFieldType.String>; }; identifier: ModelDefaultIdentifier; secondaryIndexes: []; authorization: []; dis...'.
  Type '{ data: { id: string; name: string; createdAt: string; updatedAt: string; }; }' is not assignable to type '{ data: Prettify<ReturnValue<ClientModel<{ Tenant: ClientModel<..., SchemaMetadata<ModelSchema<SetTypeSubArg<{ types: { Tenant: ModelType<{ fields: { name: ModelField<string, "required", undefined, ModelFieldType.String>; }; identifier: ModelDefaultIdentifier; secondaryIndexes: []; authorization: []; disabledOperati...'.
    Types of property 'data' are incompatible.
      Type '{ id: string; name: string; createdAt: string; updatedAt: string; }' is not assignable to type 'Prettify<ReturnValue<ClientModel<{ Tenant: ClientModel<..., SchemaMetadata<ModelSchema<SetTypeSubArg<{ types: { Tenant: ModelType<{ fields: { name: ModelField<string, "required", undefined, ModelFieldType.String>; }; identifier: ModelDefaultIdentifier; secondaryIndexes: []; authorization: []; disabledOperations: [];...'.ts(2322)
index.d.ts(340, 5): The expected type comes from the return type of this signature.
```

---

### 原因

[イシュー](https://github.com/aws-amplify/amplify-data/issues/625)として問い合わせてみたところ、「**amplify-dataの型情報を生成する`ModelTypesClient`型は、複雑なジェネリクス型によって動的に型を生成しているため、手動で型をモック化することが不可能**」旨の回答が得られました。

その為結論としては、少なくとも現状のライブラリのバージョンでは、上記のようにシンプルに型情報をインターフェース化して再利用することは不可能となります。

---

## 妥協案

イシューにて提案いただいた妥協案としては以下の通り、コード上必要な型情報のみを適宜抽出して自前でインターフェースを定義するものでした。

```js: 妥協案(イシュー提案版)
export interface IClient {
  getTenant: (args: { id: string }) => Promise<{ data: Schema["Tenant"]["type"] | null }>;
}

export const dummyRepository = new Repository({
  getTenant: async (args) => ({
    data: {
      id: args.id,
      name: "test-name",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }),
});
```

ただし上記の場合、元のデータモデルの変更の度にインターフェースのメンテナンスの負担が増える可能性が高いのと、元のクライアントの型情報が大きく削がれてしまうため、もう少し頑張って最終的に以下のような妥協点に落ち着きました。

```js: 妥協案(最終)
import type {
  ListReturnValue,
  SingularReturnValue,
} from "@aws-amplify/data-schema/runtime";
type SingularFn<
  Fn extends (props: any, options?: { selectionSet?: any }) => any,
  Type,
  Props = Parameters<Fn>[0],
  Options = Parameters<Fn>[1]
> = (
  props: Props,
  options?: Options extends undefined
    ? undefined
    : Omit<Options, "selectionSet">
) => SingularReturnValue<Type>;
type ListFn<
  Fn extends (options?: { selectionSet?: any }) => any,
  Type,
  Options = Parameters<Fn>[0]
> = (
  options?: Options extends undefined
    ? undefined
    : Omit<Options, "selectionSet">
) => ListReturnValue<Type>;

...

export interface IClient {
  getTenant: SingularFn<
    Client["models"]["Tenant"]["get"],
    Schema["Tenant"]["type"]
  >;
  listTenants: ListFn<
    Client["models"]["Tenant"]["list"],
    Schema["Tenant"]["type"]
  >;
}

export class Repository {
  client: IClient;
  constructor(client: IClient) {
    this.client = client;
  }
  getTenant = async (id: string): Promise<Schema["Tenant"]["type"]> => {
    const res = await this.client.getTenant({ id });
                                // (property) IClient.getTenant: (props: {
                                //     readonly id: string;
                                // }, options?: Omit<{
                                //     selectionSet?: readonly ("name" | "id" | "createdAt" | "updatedAt" | "users.*" | "users.name" | "users.tenantId" | "users.id" | "users.createdAt" | "users.updatedAt" | "users.tenant.users.*" | "users.tenant.*" | "users.tenant.name" | "users.tenant.id" | "users.tenant.createdAt" | "users.tenant.updatedAt" | "users.tenant.users.name" | "users.tenant.users.tenantId" | "users.tenant.users.id" | "users.tenant.users.createdAt" | "users.tenant.users.updatedAt" | "users.tenant.users.tenant.users.*" | ... 15 more ... | "users.tenant.users.tenant.users.tenant.*")[] | undefined;
                                //     authMode?: AuthMode;
                                //     authToken?: string;
                                //     headers?: CustomHeaders;
                                // }, "selectionSet"> | undefined) => SingularReturnValue<...>
    if (res.data === null) {
      throw Error("failed");
    }
    return res.data;
  };
}

```

:::message alert
詳しい理由は特定出来ませんでしたが、妥協案の試行錯誤の結果として判明した重要な点は、**`selectionSet`を型定義から除外しなくてはいけない**という点です。
他にもベターな実装が無いか色々と試行錯誤しましたが、`selectionSet`オプションがある(且つ、データモデルが一定以上複雑な)状態だとどうしてもtscのエラーが消えなかったり、tscの処理に非常に大きなCPU負荷が掛かってIDEが激重になったりして結局断念しました。
:::

---

### どうしてもselectionSetの型情報を使用したい場合

以下のように必要な場面で局所的にオリジナルの型情報でアノテーションするのが良いかなと思います。

```js: selectionSetを使用する妥協案
export class Repository {
  client: IClient;
  constructor(client: IClient) {
    this.client = client;
  }
  getTenantName = async (id: string) => {
    // 局所的にオリジナルの型情報でアノテーションする
    const res = await (this.client.getTenant as Client["models"]["Tenant"]["get"])(
      {id}, {selectionSet: ["name"]}
    )
    if (res.data === null) {
      throw Error("failed");
    }
    return res.data.name
  }
}
```

---

## おわりに

同様のことを実現しようとしていて、同様に詰まっている方がいらっしゃれば助けになればと思います。
また、より良い妥協案の実装例や根本原因の回避策をお持ちの方がいらっしゃれば是非教えて頂けますと幸いです。
