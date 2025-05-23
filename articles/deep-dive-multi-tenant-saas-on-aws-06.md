---
title: "【第06回】Deep Dive マルチテナントSaaS on AWS - 第4章幕間：デプロイモデルとオンボーディングの実践"
emoji: "🤿"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["aws", "saas"]
published: false
---

## はじめに

本記事では、「[【第 04 回】Deep Dive マルチテナント SaaS on AWS - 第 3 章振返り](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-04)」で取り上げたデプロイモデル、及び、「[【第 05 回】Deep Dive マルチテナント SaaS on AWS - 第 4 章振返り](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-05)」で取り上げたオンボーディングプロセスを、実際の React + Amplify のアプリケーションでどの様に実現出来るのかを探っていきます。

まずはベースライン環境をデプロイし、第 3 章で取り上げた下記 3 種類のデプロイモデルそれぞれについて、オンボーディングプロセスを通した具体的なデプロイプロセスを実現してみます。

- フルスタックのサイロデプロイモデル
- ハイブリッドなフルスタックのデプロイモデル
- 混合モードのデプロイモデル

※フルスタックのプールデプロイモデルは Amplify がデフォルトでサポートしているデプロイモデルであり、実現方式は自明なので、割愛します。

## フルスタックのサイロデプロイモデル

ここでは下図の様に、Amplify アプリケーション単位でアプリケーションプレーンをサイロ化したいと思います。

![](/images/06/full-silo-resource-separation.drawio.png)

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

ここでは具体的に以下のようなオンボーディングプロセスを実現したいと思います。

1. テナント所有者のサインアップ(≒ ユーザーアイデンティティの作成)の過程で、テナントアイデンティティも併せて作成する

   1. 具体的には Cognito の`preSignUp`トリガーを用いてテナントアイデンティティを作成し、ユーザーアイデンティティと関連づける

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

- 次に、アプリケーションプレーンの一連のデプロイジョブを実行するためのステートマシン及び関連リソース(サービスロール等)をカスタムリソースとして定義しコントロールプレーンのバックエンドリソースとして追加します。

```js projects/control-plane/amplify/backend.ts
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

オンボーディング機能に必要な一通りの部品が揃いましたので、それらをデプロイし、実際にコントロールプレーンにテナント所有者としてサインアップした結果が以下の通りです。

- サインアップ直後のコントロールプレーン上の画面

![](/images/06/full-silo-control-plane-signup.png)

- バックグラウンドで非同期実行されたアプリケーションプレーンのデプロイジョブ

![](TODO:)

- アプリケーションプレーンへのサインインに成功

![](TODO:)

TODO:

2025-05-18T06:35:55.355Z [INFO]: ../control-plane/amplify/data/resource.ts(1,50): error TS2307: Cannot find module '@aws-amplify/backend' or its corresponding type declarations.

294

2025-05-18T06:35:55.361Z [INFO]: ../control-plane/amplify/data/resource.ts(11,21): error TS7006: Parameter 'allow' implicitly has an 'any' type.



TODO:参考資料
https://ui.docs.amplify.aws/react/connected-components/authenticator/customization#override-function-calls

https://dev.classmethod.jp/articles/amplify-auth-get-user-info/
```
