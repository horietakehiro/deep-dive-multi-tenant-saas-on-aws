---
title: "【第06回】Deep Dive マルチテナントSaaS on AWS - 第4章幕間：デプロイモデルとオンボーディングの実践"
emoji: "🤿"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["aws", "saas"]
published: false
---

## はじめに

本記事では、「[【第 04 回】Deep Dive マルチテナント SaaS on AWS - 第 3 章振返り](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-04)」で取り上げたデプロイモデル、及び、「[【第 05 回】Deep Dive マルチテナント SaaS on AWS - 第 4 章振返り](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-05)」で取り上げたオンボーディングプロセスを、実際の React + Amplify のアプリケーションでどの様に実現出来るのかを探っていきます。

まずはベースライン環境をデプロイし、第 3 章で取り上げた下記 2 種類のデプロイモデルそれぞれについて、オンボーディングプロセスを通した具体的なデプロイプロセスを実現してみます。

- フルスタックのサイロデプロイモデル
- 混合モードのデプロイモデル

## フルスタックのサイロデプロイモデル

ここでは下図の様に、Amplify アプリケーション単位でアプリケーションプレーンをサイロ化したいと思います。

![](/images/06/full-silo-resource-separation.drawio.png)

:::message
[Amplify アプリケーションのリージョンあたりの最大数](https://docs.aws.amazon.com/ja_jp/amplify/latest/userguide/quotas-chapter.html)ははデフォルトで 25(引き上げ可能)となっています。引き上げ可能な最大数が幾つかは不明ですが、実際のビジネスでアプリケーションプレーンを Amplify アプリケーション単位でサイロ化する場合、こういったサービスクォートに抵触しないかは重要な確認観点となります。
:::

### コントロールプレーンの実装

#### ベースライン環境のデプロイ

- まずはベースライン環境として、必要最低限の機能(サインアップとオンボーディング)が実装されたコントロールプレーンを Amplify 上にデプロイします。
  - ※デプロイ資材(CDK コード)は[こちら](https://github.com/horietakehiro/deep-dive-multi-tenant-saas-on-aws/blob/main/lib/full-stack-silo-deploy-model.ts)

```bash: ベースライン環境(コントロールプレーン)のデプロイ
cdk deploy ...(省略)...
```

- まずは適当な空のページからスタートします。ここにテナントのオンボーディングに必要なロジックを実装していきます。

![](/images/06/empty-control-plane.png)

#### オンボーディング機能の実装

実現方法は様々ありますが、ここでは具体的に以下のようなオンボーディングプロセスを実現したいと思います。

1. テナント所有者のサインアップ(≒ ユーザーアイデンティティの作成)の過程で、テナントアイデンティティも併せて作成する

   1. 具体的には Cognito の`preSignUp`トリガーを用いてテナントアイデンティティを DynamoDB に作成し、Cognito ユーザープールのユーザーアイデンティティと関連づける
   2. テナント所有者のサインアップ完了直後のテナントの初期状態は`pending`とする

2. サインアップが完了したら、非同期でテナント個別のアプリケーションプレーンのデプロイを実行する

   1. 具体的には Cognito の`confirmSignUp`トリガーを用いてアプリケーションプレーンのデプロイジョブを非同期実行する
   2. デプロイジョブは StepFunctions で実装する
   3. アプリケーションプレーンのデプロイが完了したら、テナントの状態を`active`に更新する

3. テナント所有者はコントロールプレーンと同じ認証情報で、デプロイが完了したアプリケーションプレーンにアクセス出来る

   1. 具体的には、Cognito の`userMigration`機能を使用して、アプリケーションプレーンへの初回サインイン時に、コントロールプレーンの Cognito ユーザープールからユーザーアイデンティティをアプリケーションプレーンに移行(レプリケーションする)

![](/images/06/full-silo-onboarding-flow.drawio.png)

まずは`1.`のロジックを実装していきます。

- まずは DynamoDB に保管する為のテナントアイデンティティをモデリングします。

```js: projects/control-plane/amplify/data/resource.ts
const schema = a.schema({
  Tenant: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      status: a.enum(["pending", "active", "inactive"]),
      url: a.url(),
    })
    .authorization((allow) => [
      allow.publicApiKey(),
    ]),
});
```

- 次に、ユーザーアイデンティティとテナントアイデンティティとを関連付けられるようユーザープールを設定します。具体的には、カスタム属性としてユーザーアイデンティティにテナント ID(及びテナント名) を設定出来るようにします。また、サインアップの過程で、ユーザ属性に設定されたテナント情報に基づき DynamoDB 上にテナントアイデンティティを作成するための Lambda 関数も用意しトリガーとして設定します。

```js: projects/control-plane/amplify/auth/resource.ts
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    "custom:tenantId": {
      dataType: "String",
      mutable: true,
    },
    "custom:tenantName": {
      dataType: "String",
      mutable: true,
    },
  },
  triggers: {
    preSignUp,
  },
});
```

```js: projects/control-plane/amplify/auth/pre-sign-up/handler.ts
/**
 * テナント所有者に対応するテナントアイデンティティを作成する
 * @param event
 */
export const handler: PreSignUpTriggerHandler = async (event) => {
  console.log(event);
  const userAttributes = event.request.userAttributes as SignUpUserAttributes;
  // テナントアイデンティティを作成
  const tenant = await client.models.Tenant.create({
    id: userAttributes["custom:tenantId"],
    name: userAttributes["custom:tenantName"],
    status: "pending",
  });
  console.log(tenant);
  return event;
};

```

- 最後に、サインアップの過程でテナント ID(及びテナント名) を上記の Lambda 関数に渡せるよう、サインアップの UI をカスタマイズします。

```js: projects/control-plane/src/components/Authenticator.tsx
  const services = {
    /**
     * サインアップ時にカスタムのユーザー属性としてテナント情報を渡す
     * @param input
     * @returns
     */
    handleSignUp: async (input: SignUpInput) => {
      const userAttributes: SignUpUserAttributes = {
        // テナントIDはUUIDを生成し、テナント名はユーザから入力してもらう
        "custom:tenantId": uuidv4(),
        "custom:tenantName":
          input.options!.userAttributes[
            SIGNUP_CUSTOM_USER_ATTRIBUTES.TENANT_NAME
          ]!,
        email: input.options!.userAttributes["email"]!,
      };
      console.log(input);
      return signUp({
        ...input,
        options: {
          ...input.options,
          userAttributes: {
            ...input.options?.userAttributes,
            ...userAttributes,
          },
        },
      });
    },
  };
  return (
    <>
      <AmplifyAuthenticator
        formFields={{
          // サインアップ時にテナント名をユーザーに入力してもらう
          signUp: {
            [SIGNUP_CUSTOM_USER_ATTRIBUTES.TENANT_NAME]: {
              label: "Tenant Name",
              isRequired: true,
              order: 1,
            },
          },
        }}
        services={services}
      >
        {props.children}
      </AmplifyAuthenticator>
    </>
  );
```

- これによって、以下のようなサインアップの UI が作成されます。

![](/images/06/full-silo-signup-with-tenant.png)

- 実際にサインアップを行うとその過程でトリガー関数によって DynamoDB 上にテナントアイデンティティが作成されること、及び、サインアップ成功後にフロントエンドからそのテナントアイデンティティを取得出来るところまで確認出来ました。

![](/images/06/full-silo-after-signup.png)

`1.`(サインアップ及びテナントアイデンティティの作成)まで完了したので、次に`2.`(アプリケーションプレーンのデプロイジョブの実行)の実装に移ります

- サインアップ成功後(`ConfirmSignUp`)にトリガーされ、アプリケーションプレーンデプロイジョブ(ステートマシン)を実行するための Lambda 関数を用意します。
  - この時、AWS SDK を使用してステートマシンの ARN をパラメータストアから取得してステートマシンを実行します
  - また、ステートマシンの ARN が格納されたパラメータストア上のパラメータ名は環境変数に設定しておきます。
  - そのため、ロジックの実装と共に、必要な IAM 権限及び環境変数も合わせて設定します

```js: projects/control-plane/amplify/auth/confirm-sign-up/handler.ts

/**
 * テナント専用のアプリケーションプレーンのデプロイジョブを実行する
 * @param event
 */
export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log(event);
  console.log("パラメータストアからステートマシンのARNを取得する");
  const ssmRes = await ssmClient.send(
    new GetParameterCommand({
      Name: paramNameForSFNArn,
    })
  );
  console.log(ssmRes);
  if (ssmRes.Parameter === undefined || ssmRes.Parameter.Value === undefined) {
    throw Error(`パラメータ[${paramNameForSFNArn}]からARNの取得に失敗`);
  }
  const arn = ssmRes.Parameter.Value;

  console.log("アプリケーションプレーンのデプロイジョブを非同期実行");
  const res = await sfnClient.send(
    new StartExecutionCommand({
      stateMachineArn: arn,
      input: JSON.stringify({
        tenantId: event.request.userAttributes["custom:tenantId"],
      }),
    })
  );
  console.log(res);
  return event;
};

```

```js: projects/control-plane/amplify/backend.ts
const backend = defineBackend({
  auth,
  data,
  // 必要なIAM権限を下のコードで別途追加出来るよう、明示的にバックエンドに追加する
  confirmSignUp,
});

...(省略)...

// アプリケーションプレーンのデプロイに必要な権限をconfirmSignUpトリガー関数に追加する
backend.confirmSignUp.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ["ssm:GetParameter", "states:StartExecution"],
    resources: ["*"],
  })
);
// ステートマシンのARNを参照するためのパラメータ名を環境変数に設定する
const cfnFunction = backend.confirmSignUp.resources.cfnResources.cfnFunction;
cfnFunction.environment = {
  variables: {
    [PARAM_NAME_FOR_SFN_ARN]: applicationPlaneDeployment.arnParam.parameterName,
  },
};

```

- 次に、アプリケーションプレーンの一連のデプロイジョブを実行するためのステートマシン及び関連リソース(サービスロールやステートマシンから呼び出される Lambda 関数)をカスタムリソースとして定義しコントロールプレーンのバックエンドリソースとして追加します。

```js projects/control-plane/amplify/backend.ts
const backend = defineBackend({
  auth,
  data,
  // "aws-amplify/data"のclientを使用してdataにアクセスする関数は明示的にバックエンドに追加する必要あり
  updateTenantFunction,
});
...(省略)...

// アプリケーションプレーンのデプロイジョブ用のステートマシンを追加する
const applicationPlaneDeployment = new ApplicationPlaneDeployment(
  backend.createStack("ApplicationPlaneDeployment"),
  "ApplicationPlaneDeployment",
  {
    paramNameForGithubAccessToken: "/GitHub/MyClassicToken",
    domainName: "ht-burdock.com",
    repositoryURL:
      "https://github.com/horietakehiro/deep-dive-multi-tenant-saas-on-aws",
    branchName: "main",
    updateTenantFunction: backend.updateTenantFunction.resources.lambda,
  }
);
```

- 今回ステートマシンで実行する具体的なデプロイジョブの中身は以下の通りです。
  - アプリケーションプレーン用の Amplify アプリケーションを作成
  - Amplify アプリケーションにデプロイ用のブランチ設定を作成
  - Amplify アプリケーションにカスタムドメインを関連付け、処理が完了するまで待機
  - アプリケーションプレーンの初回デプロイを手動実行し、デプロイが完了するまで待機
  - DB 上のテナント情報を更新する(ステータスを`active`に更新する)

![](/images/06/full-silo-application-plane-deploy-job-state-machine.png)

- 最後に、テナント所有者がアプリケーションプレーンに初回サインインした際に、コントロールプレーン側のユーザープール上のテナント所有者のユーザーアイデンティティをアプリケーションプレーン側に移行するためのトリガーを実装します。これによって、再度サインアップを実施することなく、コントロールプレーン側と同じ認証情報(パスワード)でアプリケーションプレーンにもテナント所有者がサインインすることが出来るようになります。

```js projects/intersection/amplify/auth/user-migration/handler.ts
export const handler = async (
  event: UserMigrationAuthenticationTriggerEvent
): Promise<UserMigrationAuthenticationTriggerEvent> => {
  securelyLogEvent(event);
  // テナント所有者がサインインしようとしているか否かを判定する
  // 具体的には、リクエスト情報に含まれるユーザー名とパスワードで
  // コントロールプレーンのユーザープールにサインインを試行して成功するか否かを確認する
  const username = event.userName;
  const password = event.request.password;

  try {
    // 認証エラーが発生しなければユーザー名とパスワードが正しいと判断する
    const authResponse = await client.send(
      new AdminInitiateAuthCommand({
        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
        UserPoolId: sharedOutputs.auth.user_pool_id,
        ClientId: sharedOutputs.auth.user_pool_client_id,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      })
    );
    console.log(authResponse);

    console.log("sub以外の全てのユーザー属性も移行する");
    const userResponse = await client.send(
      new AdminGetUserCommand({
        Username: username,
        UserPoolId: sharedOutputs.auth.user_pool_id,
      })
    );
    const migrateAttributes: { [name: string]: string } = Object.fromEntries(
      (userResponse.UserAttributes ?? [])
        .filter((att) => att.Name !== "sub")
        .map((att) => [att.Name, att.Value])
    );
    console.log(migrateAttributes);

    event.response.userAttributes = {
      ...migrateAttributes,
      username: event.userName,
    };
    event.response.finalUserStatus = "CONFIRMED";
    event.response.messageAction = "SUPPRESS";
    securelyLogEvent(event);
    return event;
  } catch (error: unknown) {
    console.error(error);
    throw error;
  }
};
```

```js: projects/intersection/amplify/backend.ts
const backend = defineBackend({
  auth,
  userMigration,
});

const { cfnUserPoolClient } = backend.auth.resources.cfnResources;
cfnUserPoolClient.explicitAuthFlows = [
  "ALLOW_CUSTOM_AUTH",
  "ALLOW_REFRESH_TOKEN_AUTH",
  "ALLOW_USER_SRP_AUTH",
  // ユーザー移行トリガーのために必要
  "ALLOW_USER_PASSWORD_AUTH",
];

backend.userMigration.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ["cognito-idp:AdminInitiateAuth", "cognito-idp:AdminGetUser"],
    resources: ["*"],
  })
);
```

オンボーディング機能に必要な一通りの部品が揃いましたので、それらをデプロイし、実際にコントロールプレーンにテナント所有者としてサインアップした結果が以下の通りです。

- バックグラウンドで非同期実行されたアプリケーションプレーンのデプロイジョブ

![](/images/06/full-silo-deploy-job-conplete.png)

- オンボーディング完了後のコントロールプレーン上の画面

![](/images/06/full-silo-control-plane-signup.png)

- アプリケーションプレーンへのサインインに成功

![](/images/06/full-silo-application-plane-signin.png)

- 初回サインイン時に、コントロールプレーン側のユーザープール上のユーザーアイデンティティが、アプリケーションプレーン側のユーザープールに移行されていることも確認

![](/images/06/full-silo-migrated-user.png)

## 混合モードのデプロイモデル

ここでは下図のように、アプリケーションプレーン内の S3 バケットのみサイロデプロイモデルとして運用し、残りのリソース(Amplify のホスティング及び Cognito ユーザープール)はプールデプロイモデルとして運用する混合デプロイモデルを実装したいと思います。

![](/images/06/mix-resource-separation.drawio.png)

:::message alert
2025 年 6 月 1 日時点の Amplify では、一つの Amplify アプリケーション内で複数の`data`リソース(DynamoDB,AppSync)や`Auth`リソース(Cognito ユーザープール)を定義し使用する機能が提供されていません。そのため、それらのリソースを個別にサイロデプロイモデルとして運用したい場合は、Amplify に依らないフレームワークやアーキテクチャを選定する必要があると言えます。
本記事ではあくまで、Amplify のフレームワークの中でデプロイモデルを使い分ける方法を実演していくため、ここでは一つの Amplify アプリケーション内で複数種類の定義が可能な、`storage`リソース(S3 バケット)を実装例として使用します。
:::

### アプリケーションプレーンの実装

#### ベースライン環境のデプロイ

- ベースライン環境として、コントロールプレーンとアプリケーションプレーン(プールリソースのみ)をそれぞれ個別の Amplify アプリケーションとしてデプロイします。

#### オンボーディング機能の実装

大枠は[フルスタックのサイロデプロイモデルで実装したオンボーディング機能](#オンボーディング機能の実装)を踏襲しつつ、以下のようなオンボーディング機能を実装していきます。

1. テナント所有者のサインアップ(≒ ユーザーアイデンティティの作成)の過程で、テナントアイデンティティも併せて作成する

   1. 具体的には Cognito の`preSignUp`トリガーを用いてテナントアイデンティティを DynamoDB に作成し、Cognito ユーザープールのユーザーアイデンティティと関連づける
   2. テナント所有者のサインアップ完了直後のテナントの初期状態は`pending`とする

2. サインアップが完了したら、非同期でテナント個別のサイロリソース(今回は`storage`リソース(S3 バケット))アプリケーションプレーンにデプロイする

   1. 具体的には Cognito の`confirmSignUp`トリガーを用いてアプリケーションプレーン内のサイロリソースのデプロイジョブを非同期実行する
   2. デプロイジョブは StepFunctions で実装する
   3. アプリケーションプレーンのサイロリソースのデプロイが完了したら、テナントの状態を`active`に更新する

3. テナントの状態が`active`になったら、アプリケーションプレーンにアクセスして、テナント個別のサイロリソース(S3 バケット)にアクセス出来る

   1. 具体的には、Cognito の`userMigration`機能を使用して、アプリケーションプレーンへの初回サインイン時に、コントロールプレーンの Cognito ユーザープールからユーザーアイデンティティをアプリケーションプレーンに移行(レプリケーションする)
   2. ユーザーアイデンティティに紐づくテナントアイデンティティに基づいで、データを取得すべき S3 バケットを動的に決定してデータを取得する

![](/images/06/mix-onboarding-flow.drawio.png)

- `1.`はフルスタックのサイロデプロイモデルで実装した内容と同じなので割愛します。

- `2.`で実行するステートマシンの具体的なデプロイジョブの中身は以下の通りです。

  - アプリケーションプレーン用の作成済みの Amplify アプリケーションでデプロイジョブを手動実行する
    - デプロイジョブの中で、コントロールプレーンの DynamoDB に格納されているテナント情報のリストを取得する
    - 取得したテナントそれぞれについてサイロリソースをデプロイする。
  - デプロイが完了するまで待機する
  - DB 上のテナント情報を更新する(ステータスを`active`に更新する)

- アプリケーションプレーン用の`data`リソース及びバックエンドを以下のように定義することで、デプロイ時にテナント情報のリストをコントロールプレーン上の DynamoDB から動的に取得し、テナント個別に`data`リソースを動的にデプロイ出来るようにします。

```js: projects/intersection/amplify/storage/resource.ts
import { generateClient } from "aws-amplify/data";
import { type Schema } from "../../../control-plane/amplify/data/resource";
import { defineStorage } from "@aws-amplify/backend";

// コントロールプレーン上のDynamoDBにアクセスするためのGraphQLクライアントを構成
import { Amplify } from "aws-amplify";
import sharedOutputs from "../../shared/amplify_outputs.json";
Amplify.configure(sharedOutputs);
const client = generateClient<Schema>();

export const storages: {
  [tenantName: string]: ReturnType<typeof defineStorage>;
} = {
  // Amplifyの仕様上デフォルトのストレージを設定する必要がある(アクセスは許可しない)
  defaultStorage: defineStorage({
    name: "defaultStorage",
    isDefault: true,
    access: (allow) => ({}),
  }),
};
console.log("コントロールプレーンからテナントのリストを取得");
const { data, errors } = await client.models.Tenant.list();
if (errors !== undefined) {
  console.error("コントロールプレーンからテナントのリストの取得に失敗");
  console.error(errors);
}
console.log("取得に成功したコントロールプレーン : ");
console.log(data);
data.forEach((tenant) => {
  storages[`storage${tenant.id}`] = defineStorage({
    name: `storage-${tenant.id}`,
    access: (allow) => ({
      "data/*": [allow.authenticated.to(["list", "get", "write"])],
    }),
  });
});

```

```js:　projects/intersection/amplify/backend.ts
import { storages } from "./storage/resource";

const backend = defineBackend({
  auth,
  userMigration,
  ...storages,
});
```

- コントロールプレーンに 2 つのアカウントでサインアップして、テナントリソース 2 つ分のオンボーディングプロセスを実行させ、結果を確認します。

- コントロールプレーンにサインアップすると、StepFunctions によってオンボーディングプロセスが実行され、サイロリソースのデプロイとテナント情報の更新が実行されます。

![](/images/06/mix-onboarding-process-result.png)

- テストテナント ① としてアプリケーションプレーンにサインインし、適当にファイルを幾つかアップロードします。

![](/images/06/mix-test-tenant-1-app.png)

- 次にテストテナント ② としてアプリケーションプレーンにサインインすると、テストテナント ① とは別の(テナントごとに個別の)S3 バケットを使用していることを確認出来ました。

![](/images/06/mix-test-tenant-2-app.png)

---

## おわりに

ここでは、フルスタックのサイロデプロイモデルと混合モードのデプロイモデルの 2 種類のオンボーディングプロセスの一例を、Amplify を活用して実装しました。
Amplify Gen2 はこの取り組みを通して始めて利用してみましたが、CDK(バックエンド AWS リソース)とのシームレスな統合やバックエンド<->フロントエンド間でスキーマ/型情報の共有が可能で、非常に効率的にオンボーディングプロセスを実装出来たという実感があります。一方で、Amplify を使用することによって、デプロイモデルの選択に制約がもたらされる一例(サービスクォートの存在や、サイロ化可能なリソースの種類)を確認することも出来ました。

### 参考資料

- [Amplify Documentation](https://docs.amplify.aws/)
- [Amplify UI Authenticator](https://ui.docs.amplify.aws/react/connected-components/authenticator/customization#override-function-calls)
- [AWS Amplify で認証中のユーザー情報を取得・表示してみた](https://dev.classmethod.jp/articles/amplify-auth-get-user-info/)

```

```
