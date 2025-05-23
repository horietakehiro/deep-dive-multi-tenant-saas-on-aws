---
title: "【第03回】Deep Dive マルチテナントSaaS on AWS - 第2章幕間：初期環境構築"
emoji: "🤿"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["aws", "saas"]
published: true
---

## はじめに

[第 02 章](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-02)にて、マルチテナント SaaS アプリケーションはアプリケーションプレーンとコントロールプレーンの 2 つのプレーンから構成されるものであると学びました。
[第 00 章](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-00)でも述べた通り、この学習を通して簡易的なマルチテナント SaaS アプリケーション(`intersection`)及びそれを管理するためのコントロールプレーンを実際に開発していきます。ここではその初期検討 - 使用する技術スタックの選定やプロジェクト構成の検討 - を行い、初期環境を構築していきたいと思います。

## 使用する技術スタック

- アプリケーションプレーン(intersection)、コントロールプレーン共に、SPA(シングルページアプリケーション)として実装する。バックエンドは Lambda や DynamoDB を始めとするサーバレスサービスを極力使用する。主に AWS 利用料節約のため
  - フレームワークとして React を使用する。私が現在辛うじて馴染みのあるフレームワークであるため
  - AWS サービスとの連携及び SPA のホスティングには、[Amplify Gen2](https://docs.amplify.aws/)を使用する。

## 検討・実施事項

上記より、React + Amplify の開発環境を準備していきます。本記事内で検討及び実施していきたい事項は以下の通りです。

- **アプリケーションの分割戦略を検討する** : 本プロジェクトでは intersection とコントロールプレーンの 2 種類のアプリケーションを開発・デプロイする必要がある。それらをどのように分割して管理すべきかを検討する。具体的には、リポジトリ単位で分割するか、1 つのリポジトリに集約管理するか。
- **具体的な初期環境の構築手順を調査し実行する** : 上記の分割戦略に基づいて、React + Amplify の WEB アプリケーションの開発に着手するための初期環境を具体的にどういった手順で構築すべきかを調査し実施する。
- **ワンパスレベルの簡単な動確を一通り行う** : 構築した初期環境で、Amplify と連携して WEB アプリケーションが動作するかをワンパスレベルで動確する

### アプリケーションの分割戦略

結論から述べると、本プロジェクトではモノレポ構成を採用したいと思います。つまり、[単一のリポジトリ](https://github.com/horietakehiro/deep-dive-multi-tenant-saas-on-aws)内にフォルダを分けて、intersection とコントロールプレーンの 2 種類のアプリケーションを管理していきます。そのようにする理由は以下の通りです。

- intersection とコントロールプレーン間で共有したいリソース設定や型情報が今後発生することが見込まれる。モノレポ構成にすることでそういった共有をスムーズに行えることを期待する。
- 加えて、Amplify Gen2 では[モノレポ内の特定アプリケーションのデプロイ](https://docs.aws.amazon.com/ja_jp/amplify/latest/userguide/monorepo-configuration.html)にも対応しているため。

### 初期環境構築

プロジェクトの基本構成として[AWS がサンプルで公開しているこちらのリポジトリ](https://github.com/aws-samples/amplify-vite-react-template)を参考に、vite 経由で React プロジェクトのベースを作成し、そこに Amplify の初期設定を加える、という形にしました。

```bash
$ node -v
v22.11.0
$ npm -v
10.9.0
# まずはコントロールプレーン側を初期設定
$ mkdir projects && cd projects
# フレームワークとしてReact、バリアントとしてTypeScriptを選択
$ npm create vite@latest
> npx
> create-vite

│
◇  Project name:
│  control-plane
│
◇  Select a framework:
│  React
│
◇  Select a variant:
│  TypeScript
│
◇  Scaffolding project in /home/horie-t/deep-dive-multi-tenant-saas-on-aws/projects/control-plane/control-plane...
│
└  Done. Now run:

  cd control-plane
  npm install
  npm run dev
$ npm create amplify@latest

> control-plane@0.0.0 npx
> create-amplify

✔ Where should we create your project? .

10:29:03 AM Installing devDependencies:
10:29:03 AM  - @aws-amplify/backend
10:29:03 AM  - @aws-amplify/backend-cli
10:29:03 AM  - aws-cdk-lib@2.189.1
10:29:03 AM  - constructs@^10.0.0
10:29:03 AM  - typescript@^5.0.0
10:29:03 AM  - tsx
10:29:03 AM  - esbuild

10:29:03 AM Installing dependencies:
10:29:03 AM  - aws-amplify

10:29:03 AM ✔ 10:30:41 AM DevDependencies installed
10:30:41 AM ✔ 10:34:16 AM Dependencies installed
10:34:16 AM ✔ 10:34:16 AM Template files created
10:34:16 AM Successfully created a new project!

10:34:16 AM Welcome to AWS Amplify!
10:34:16 AM  - Get started by running npx ampx sandbox.
10:34:16 AM  - Run npx ampx help for a list of available commands.

10:34:16 AM Amplify collects anonymous telemetry data about general usage of the CLI. Participation is optional, and you may opt-out by using npx ampx configure telemetry disable. To learn more about telemetry, visit https://docs.amplify.aws/react/reference/telemetry
# 上記コマンドだけではインストールされないライブラリは手動でインストールする
$ npm install @aws-amplify/ui-react
```

コマンド`npm create vite@latest`によってまず(vite によって)React の環境が作成され、次にコマンド`npm create amplify@latest`によって Amplify 向けのファイルの作成とライブラリのインストールが一通り実行されました。

## ワンパスレベルの動確

### ローカルでの動確

まずは Amplify の Sandbok 環境にデプロイしたリソースと、ローカルで起動した WEB ページとが正しく連携して動作するかを簡単に確認していきます。

- Amplify 上にサンドボックス環境をデプロイし、

```bash
$ npx ampx sandbox
```

- 初期設定直後のコードに、Cognito と連携する Authenticator の設定を追加し、

```js: src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Authenticator>
      <App />
    </Authenticator>
  </StrictMode>
);

```

- ローカルで WEB ページを起動し、Cognito と連携したサインアップ及びサインインが成功するかを確認します。

```bash
$ npm run dev
```

![](/images/00-interlude/signup.png)

![](/images/00-interlude/signin.png)

React と Amplify(Cognito)との連携がワンパス通っていることを確認できました。

同じ要領で、intersection 側のプロジェクトも初期化していきます。

### Amplify へのデプロイ

Sandbok 上でワンパス通ることが確認出来たので、試しにコントロールプレーンを Amplify にデプロイしていきます。

Amplify 公式のガイドを参考に、モノレポ向けのビルド設定ファイルを作成します。

```yaml: amplify.yml
applications:
  - appRoot: projects/control-plane
    frontend:
      phases:
        preBuild:
          commands:
            - npm install
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - .npm/**/*
          - node_modules/**/*
    backend:
      phases:
        build:
          commands:
            - npm ci --cache .npm --prefer-offline
            - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
```

リポジトリを GitHub にプッシュして、Amplify コンソール上で GitHub リポジトリとの連携設を行ってアプリケーションをデプロイし、期待通り(Cognito と連携した状態の)コントロールプレーンのアプリケーションのデプロイに成功しました

![](/images/00-interlude/control-plane-deploy-success.png)

### プロジェクト間の連携を確認する

[こちら](#アプリケーションの分割戦略)で述べたように、プロジェクト間でリソースや型情報を共有しあえるようにするというのがモノレポ構成を採用した狙いでした。現在のリポジトリ構成でそれが上手く機能しているか確認していきます。具体的には以下の 2 点を確認していきます。

1. コントロールプレーン側で実装した型情報や関数を intersection 側でも使用できること
2. コントロールプレーン側で実装した AWS リソースを intersection 側でも使用できること

まずは`1.`について対応していきます。

- コントロールプレーン側に適当な型情報と関数を定義し、

```js: projects/control-plane/src/share.ts
export interface GreetProps {
  from: string;
  to: string;
}
export const greet = (props: GreetProps): string => {
  return `Hello ${props.to} ! by ${props.from}`;
};
```

- intersection 側の`tsconfig`でその定義を参照できるようにします。

```json: projects/intersection/tsconfig.app.json
    "baseUrl": ".",
    "paths": {
      "@/shared": ["../control-plane/src/share"]
    }
```

- 上記の通り`paths`をカスタマイズするので、必要な vite のプラグインもインストール及び設定します。

```bash
$ npm i -D vite-tsconfig-paths
```

```js: projects/intersection/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigpaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigpaths()],
});
```

- intersection 側でその型情報と関数を使用します。

```js: projects/intersection/src/App.tsx
        <p>
          {greet({ from: "James", to: "Curry" })}
          {/* Edit <code>src/App.tsx</code> and save to test HMR */}
        </p>
```

少なくとも IDE 上は、そしてローカルの WEB ページ上は問題無く動作することを確認できました。

次に`2.`について対応していきます。

- control-plane 側で既にデプロイ済みの AWS リソース(Cognito ユーザープール)の設定を intersection 側で参照できるよう、amplify のアウトプットファイルをディレクトリを分けてエクスポートします。

```bash
$ npx ampx generate outputs --branch main --app-id $CONTROL_PLANE_APP_ID --out-dir shared
File written: shared/amplify_outputs.json
```

- intersection の Amplify 設定読み込みロジックを以下のように修正し、(今回の例であれば)コントロールプレーン側の Cognito リソースを参照できるようにします。

```js: projects/intersection/src/main.tsx
import sharedOutputs from "../shared/amplify_outputs.json";
// コントロールプレーン側から共有したい
// リソース設定を上書きする
Amplify.configure({
  ...outputs,
  auth: sharedOutputs.auth,
});
```

- 上記内容をビルド設定にも追記して、intersection のアプリを Amplify 上でデプロイします。

```yaml: amplify.yml
  - appRoot: projects/intersection
    env:
      variables:
        CONTROL_PLANE_APP_ID: d2tluq7eukvnud
    frontend:
      phases:
        preBuild:
          commands:
            - npm install
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - .npm/**/*
          - node_modules/**/*
    backend:
      phases:
        build:
          commands:
            - npm ci --cache .npm --prefer-offline
            # リソースを共有したい、作成済みのコントロールプレーン側のリソース設定をエクスポートする
            - npx ampx generate outputs --branch $AWS_BRANCH --app-id $CONTROL_PLANE_APP_ID --out-dir shared
            # 自分自身のリソースをデプロイする
            - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
```

- 上記の設定を施して intersection を Amplify にデプロイすると、無事コントロールプレーン側の Cognito 及び関数を使用出来ていることが確認出来ました。

## まとめ

以上で、React + Amplify の 2 種類のアプリケーション開発環境をモノレポ内に初期構築し、一通りのワンパスが通ることを確認出来ました。開発の過程でフォルダ構成等はその都度変更していくかもしれませんが、ひとまずはこの構成をベースに進めていきたいと思います。
