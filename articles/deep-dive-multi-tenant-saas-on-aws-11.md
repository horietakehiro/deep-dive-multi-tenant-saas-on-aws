---
title: "【第11回】Deep Dive マルチテナントSaaS on AWS - 第7章幕間：テナントコンテキストとJWT"
emoji: "🤿"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["aws", "saas", "Lambda", "TypeScript"]
published: false
---

## はじめに

本記事では、「[マルチテナント SaaS アーキテクチャの構築 ― 原則、ベストプラクティス、AWS アーキテクチャパターン](https://www.oreilly.co.jp/books/9784814401017/)の第 7 章「マルチテナントサービスの構築」の内容にて紹介された、テナントコンテキストを考慮した認証ロジックを実際に行っていきます。

具体的には、AWS Amplify Gen2を使用し、AWS Lambdaとしてデプロイされたバックエンドサービス内で、テナントコンテキストを考慮した認証ロジックを実装していきます。

---

## 対象とするバックエンドサービス

ここでは、(第10回と同様に、)テナントへのユーザアイデンティティの作成ロジックを対象としていきます。
ロジックは概ね以下の通りです。

- サービスへの入力として、テナント情報(テナントコンテキスト)と、作成するユーザーアイデンティティに関する情報(ユーザ名やメールアドレス等)を受け取る
- 最初にCognitoユーザプールにユーザを作成する
- その後、対応するユーザ情報をDynamoDBのユーザ管理テーブルに作成する(失敗した場合はCognitoユーザープール上のユーザ情報も削除(ロールバック)する)

これらのロジックを、[Aplify Dataのカスタムミューテーション](https://docs.amplify.aws/react/build-a-backend/data/custom-business-logic/)として実装しています。

※コードの全体像は以下を参照

- [apps/backend/lib/domain/service/create-user-identity.ts](https://github.com/horietakehiro/deep-dive-multi-tenant-saas-on-aws/blob/main/apps/backend/lib/domain/service/create-user-identity.ts)
- [apps/backend/amplify/custom/create-user-identity/handler.ts](https://github.com/horietakehiro/deep-dive-multi-tenant-saas-on-aws/blob/main/apps/backend/amplify/custom/create-user-identity/handler.ts)

現状このバックエンドサービスでは、リクエストペイロードとしてテナントIDを受け取り、そのテナント上にユーザーアイデンティティを作成する作りとなっています。
そのため、ユーザアイデンティティの作成対象とするテナントを識別するという機能自体は実現出来ていますが、セキュリティ面では、バックエンドサービスがテナントの境界を超えてリソースにアクセスしないことを保障出来ていません。何故なら、リクエスタ(クライアント)が自身のテナントではないIDをリクエストした場合、つまり他のテナントにユーザーアイデンティティを作成しようとした場合にそれをブロックする仕組みがないためです。

そこで本記事では、[書籍の第7章](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-09)でも紹介された、JWTを使用したテナントコンテキストの受け渡しとそこからのテナントコンテキストの抽出を活用して、バックエンドサービスのテナント分離を実現したいと思います。

## 実装と結果

### クライアントサイドでのJWTの取得

- Amplifyを使用している場合、`aws-amplify/auth`モジュールの`fetchAuthSession`関数にて、Cognitoから払い出されたJWTを簡単に取得することが可能です。

```js: fetchAuthSessionの使用例
const session = await fetchAuthSession()
// tokensから、アクセストークンとIDトークンを取得可能
console.log(session.tokens?.idToken)
// eyJraWQiOiI2bDhFZlV...
// IDトークンにはCognitoユーザプールのカスタム属性も設定されている
console.log(session.tokens?.idToken?.payload["custom:tenantId"])
// 990eb194-0cc8-473f-b3d1-d5073cb9ee32
```

- 上記から、テナントIDをカスタム属性として設定出来るようCognitoユーザプールを構成することで、テナントコンテキストを埋め込んだJWT(IDトークン)を取得可能になります。

### クライアントサイドからバックエンドへのJWTの渡し方

- ここでは[Amplifyのデータクライアント](https://docs.amplify.aws/react/build-a-backend/data/set-up-data/)を使用する際の、JWTの渡し方を調査します。
- やり方は非常にシンプルで、Amplifyデータクライアントではリクエストヘッダーをカスタマイズすることが可能なので、ここにJWTを設定すれば良さそうです。

```js: リクエスト時にJWTをヘッダーに追加するイメージ
const res = await repository.createUserIdentity(
  {
    tenantId: tenant.id,
    email: props.email!,
    role: props.role!,
    name: props.name!,
  },
  {
    headers: {
      "jwt-id-token": (
        await fetchAuthSession()
      ).tokens?.idToken?.toString()!,
    },
  }
);
```

### バックエンドサービス上でのJWTの扱い方

- 前述の方法で設定されたJWTを含むリクエストヘッダーは、バックエンドサービス(AWS Lambdaハンドラ関数)上では`request`引数からアクセス可能です。
- また、AmplifyではJWTを簡単にデコードするための関数`decodeJWT`が`aws-amplify/auth`モジュールより利用可能です。
- 以上から、バックエンドサービス上では以下のようにJWTから必要なテナントコンテキストを抽出し、それを使用した検証・認証ロジックを実装することが可能です。

```js: バックエンドサービス上でのテナントコンテキストを使用した検証ロジック例
import { decodeJWT } from "aws-amplify/auth";
async ({ arguments: args, request }) => {
  // ヘッダに設定されたJWT(IDトークン)をデコードする
  const idToken = decodeJWT(request.headers["jwt-id-token"]!);
  // JWTからテナントIDを取得する
  const tenantId = idToken.payload["custom:tenantId"];

  // テナント分離に必要な検証等を行う。
  // ここではJWTに設定されているテナントIDと、
  // リクエストペイロードとして渡されたテナントIDが一致することを確認する
  if (tenantId !== args.tenantId) {
    throw Error("invalid tenant id provided");
  }

  // 以下、メインのユーザーアイデンティティ作成ロジック...
}
```

## 終わりに

AmplifyではJWTを簡単に扱える機能(関数)が提供されていることから、テナントコンテキストをJWTに埋め込むことで、それを用いたカスタムな認証や検証ロジックを簡単に実装することが出来そうです。
