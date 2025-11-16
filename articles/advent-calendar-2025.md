# 「マルチテナントSaaSアーキテクチャの構築」の実践

TODO: アドカレ用の挨拶

## はじめに

今年度を通して、「Deep Dive マルチテナントSaaS on AWS(https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-00)」という取り組みを行っています。
内容としては、今年の始めにオライリー社より出版された書籍「マルチテナント SaaS アーキテクチャの構築 ― 原則、ベストプラクティス、AWS アーキテクチャパターン(https://www.oreilly.co.jp/books/9784814401017/)」の内容を振返り、自分でマルチテナントSaaSアプリケーションを実装することを通して理解と実践力を深めるというものです。

この記事では、ここまで実装したマルチテナントアプリケーションのリポジトリをツアーしながら、実装の過程で私が考えたことや挑戦したこと、苦戦したことを振返り、ノウハウとして共有していきたいと思います。

## 前提

### 使用しているライブラリ・フレームワーク

マルチテナントアプリケーションを実装するにあたって、以下の技術スタックを使用しています。

- AWS Amplify Gen2
- React Router v7
- Toolpad Core(Material UI)

### アプリケーションの概要

この取り組みで私が作成しようとしているアプリケーションは、`intersection`と名付けた、社内交流アプリケーションです。
簡単にいえば、社員同士で気軽に雑談の場を予約し合ったり、趣味や話題の会う社員を見つけたり出来る機能を提供するアプリケーションです。

![アプリの画面イメージ](../images/99/advent-calendar/app-sample-image.png)

## リポジトリツアー

### リポジトリ構成

現在のリポジトリ構成は以下のように、複数種類のアプリケーションを単一のリポジトリに集約したモノリポ構成となっています。

```bash
# ※一部ディレクトリ、ファイルは省略
├── apps
│   ├── backend
│   │   ├── amplify
│   │   └── lib
│   └── frontends
│       ├── application-plane
│       │   └── app
│       └── control-plane
│           └── app
└── baseline-infrastructure
```

| アプリケーション                        | 役割                                                                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| バックエンド                            | Amplifyリソース(AppSyncやCognito等)やバックエンドロジック、フロントエンドから共用されるその他ロジックやドメインモデルを定義       |
| フロントエンド/コントロールプレーン     | マルチテナントアプリケーションのテナント管理者がアクセスするアプリケーション。</br>ユーザやテナントの管理を行う為の機能を提供する |
| フロントエンド.アプリケーションプレーン | テナントのユーザ(エンドユーザ)がアクセスするアプリケーション                                                                      |
| ベースライン環境                        | 上記アプリケーションをAmplifyとしてAWSアカウント上にデプロイするためのAWSリソースをCDKとして定義                                  |

コントロールプレーンとは、マルチテナントのSaaS環境の基盤となる要件(テナントのオンボーディングや請求等)を司るコンポーネントであり、エンドユーザが使用するアプリケーションプレーンとは異なる要素であると書籍では紹介されています。そのため、コントロールプレーンとアプリケーションプレーンは上記のようにフロントエンドを分割するという設計に至りました。
一方で、それらが使用するバックエンドロジック及びリソースは、下図のように共通化する必要がありました。イメージとしては、コントロールプレーン上でテナント情報を更新したり、テナントにユーザを追加したりして、アプリケーションプレーンではそのテナント情報を参照したり、ユーザの認証を行ったりといったイメージです。

![](../images/99/advent-calendar/2frontend-1backend.drawio.png)

複数のTypeScriptアプリケーションをモノリポ構成を実現するにあたっては、[npmのワークスペース機能](https://docs.npmjs.com/cli/v7/using-npm/workspaces)と[tsconfigのプロジェクト参照機能](https://typescriptbook.jp/reference/advanced-topics/project-references)を活用しました。

ルートレベルの`package.json`及び`tsconfig.json`は以下のようになります。

```json: package.json
{
  // 各アプリケーションコンポーネントをワークスペースとして記載
  "workspaces": [
    "apps/backend",
    "apps/frontends/control-plane",
    "baseline-infrastructure",
    "apps/frontends/application-plane"
  ],
  "devDependencies": {
    // 開発に必要なパッケージも記載
  }
}

```

```json: tsconfig.json
// 子プロジェクトごとに参照すべきtsconfigを指定
{
  "references": [
    {
      "path": "./apps/backend/"
    },
    {
      "path": "./apps/frontends/control-plane/"
    },
    {
      "path": "./baseline-infrastructure/"
    }
  ]
}

```

```json: tsconfig.base.json
// 共通的な設定は集約管理
{
  "compilerOptions": {
    // 記載省略
  }
}
```

子プロジェクト(例えばコントロールプレーン)は以下のようになります。

```json: apps/frontends/control-plane/package.json
{
  "name": "@intersection/control-plane",
  "dependencies": {
    // アプリケーションに必要なパッケージを記載
  }
}
```

```json: apps/frontends/control-plane/tsconfig.json
{
  // ルートレベルの共通設定を拡張
  "extends": "../../../tsconfig.base.json",
  "include": [
    "**/*",
    "**/.client/**/*",
    ".react-router/types/**/*",
    // バックエンドのコードを使用出来るように参照対象に加える
    "../../backend/**/*"
  ],
  "exclude": [
    "dist",
    "vitest.config.ts",
    "../../backend/amplify",
    "../../backend/vite*",
    "../../backend/dist",
    "../../backend/node_modules"
  ],
  "compilerOptions": {
    "types": ["node", "vite/client", "vitest/globals"],
    "composite": true,
    "rootDirs": [".", "./.react-router/types"],
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "baseUrl": ".",
    "jsxImportSource": "react",
    // バックエンドのコードを使用しやすいようにパスエイリアスを設定
    "paths": {
      "@intersection/backend/*": ["../../backend/*"]
    }
  },
  "references": [
    {
      "path": "./tsconfig.node.json"
    },
    {
      "path": "../../backend/"
    }
  ]
}
```

また、モノレポ構成下でのAmplifyのデプロイ設定は以下のようになります。

```yaml: baseline-infrastructure/amplify.yml
applications:
  # バックエンドのビルド設定
  - appRoot: apps/backend
    env:
      variables:
        W: apps/backend
    # フロントエンドのセクションを省略することはできないので、空ページを適当にデプロイする
    frontend:
      buildPath: /
      phases:
        preBuild:
          commands:
            - echo "preBuild"
        # 空のフロントエンドをデプロイする
        build:
          commands:
            - mkdir dist && touch dist/index.html
      artifacts:
        files:
            - "**/*"
        baseDirectory: dist
    backend:
      # ルートディレクトリからコマンドを実行する
      buildPath: /
      phases:
        build:
          commands:
            - npm ci -w ${W}
            - npm run ampx -w ${W} -- pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID

  # フロントエンド(コントロールプレーン)のビルド設定
  - appRoot: apps/frontends/control-plane
    env:
      variables:
        W: apps/frontends/control-plane
    frontend:
      buildPath: /
      phases:
        preBuild:
          commands:
            - npm ci --cache .npm --prefer-offline
        build:
          commands:
            - npm run build -w ${W}
      artifacts:
        baseDirectory: apps/frontends/control-plane/build/client
        files:
          - "**/*"
      cache:
        paths:
          - .npm/**/*
          - node_modules/**/*
    backend:
      buildPath: /
      phases:
        build:
          commands:
            # apps/backendでデプロイしたバックエンドの設定ファイルを生成する
            - npm ci -w apps/backend --cache .npm --prefer-offline
            - NPM RUN -W APPS/BACKEND AMPX -- GENERATE OUTPUTS --BRANCH $AWS_BRANCH --APP-ID $BACKEND_APP_ID
```

これによって、複数のプロジェクトを効率的に管理するためのモノレポ構成が出来上がりました。

### アーキテクチャ

#### Amplifyデータモデルの置き場所

### テストコード

TODO:

## アプリケーションの構成

今回登場させるアプリケーションコンポーネントは以下の 3 つです。

上記 3 種類のアプリケーションを以下のようなモノレポ構成で管理していきます。
