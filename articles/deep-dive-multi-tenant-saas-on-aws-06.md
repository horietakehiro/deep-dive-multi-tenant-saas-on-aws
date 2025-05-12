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

   1. 具体的には Cognito の`postSignUp`トリガーを用いてアプリケーションプレーンのデプロイジョブを非同期実行する
   2. デプロイジョブは StepFunctions で実装する
   3. アプリケーションプレーンのデプロイが完了したら、テナントの状態を`active`に更新する

3. テナント所有者はコントロールプレーンと同じ認証情報で、デプロイが完了したアプリケーションプレーンにアクセス出来る

   1. 具体的には、Cognito の`userMigration`機能を使用して、アプリケーションプレーンへの初回サインイン時に、コントロールプレーンの Cognito ユーザープールからユーザーアイデンティティをアプリケーションプレーンに移行(レプリケーションする)

![](/images/06/full-silo-onboarding-flow.drawio.png)

TODO:参考資料
https://dev.classmethod.jp/articles/amplify-auth-get-user-info/
