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

フルスタックのサイロデプロイモデルは、ここでは下図の様なオンボーディングとデプロイプロセスを実現していきます。

![](/images/06/full-silo-onboarding-flow.drawio.png)

### コントロールプレーンの実装

- まずはベースライン環境として、必要最低限の機能(サインアップとオンボーディング)が実装されたコントロールプレーンを Amplify 上にデプロイします。
  - ※デプロイ資材(CDK コード)は[こちら](https://github.com/horietakehiro/deep-dive-multi-tenant-saas-on-aws/blob/main/lib/full-stack-silo-deploy-model.ts)

```bash: ベースライン環境(コントロールプレーン)のデプロイ
cdk deploy ...(省略)...
```

- まずは適当な空のページからスタートします。ここにテナントのオンボーディングに必要なロジックを実装していきます。

TODO:参考資料
https://dev.classmethod.jp/articles/amplify-auth-get-user-info/
