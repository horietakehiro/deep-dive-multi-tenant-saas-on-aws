---
title: "【第00回】Deep Dive マルチテナントSaaS on AWS - イントロダクション"
emoji: "🤿"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["aws", "saas"]
published: true
---

## はじめに

本記事は、私が今年度掛けて取り組む予定である一連の自己学習についての行動宣言となります。 **具体的には、2025 年 1 月にオライリー・ジャパンから発売された書籍「[マルチテナント SaaS アーキテクチャの構築 ― 原則、ベストプラクティス、AWS アーキテクチャパターン](https://www.oreilly.co.jp/books/9784814401017/)」の内容を振り返り、深堀りすることを中心に、AWS 上でマルチテナント SaaS アーキテクチを構築・運用するための実践的なスキルとノウハウを習得していく、という取り組みを実践していきます。**

---

## 学習の目的

冒頭にも述べた通り、AWS 上でマルチテナント SaaS アーキテクチャを構築・運用するための実践的なスキルとノウハウを習得したいというのが、この学習の目的です。

私は AWS インフラエンジニアとして 5 年程のキャリアを積んでおり、これまで AWS 上で様々なシステムの構築や運用、調査検証に携わってきました。一方で、SaaS をはじめとするプロダクト開発やモダンな開発に(憧れはあるものの)参画した経験が乏しく、自分のややアンバランスなキャリアに不安を抱くようになりました。
そういった経緯と、元来オライリー社の書籍が好きだった背景もあり、件の書籍「マルチテナント SaaS アーキテクチャの構築」を読んで、AWS 上での SaaS 開発に関するノウハウを学習するに至りました。
この書籍は、タイトルの通り AWS 上でマルチテナント SaaS アーキテクチャを構築するためのマインドセットや概念的なプラクティスを幅広く紹介してくれる一方で、アーキテクチャの実装例やツールの扱い方といった具体的・技術的な解説には乏しいものがありました。
そのため、この取り組みを通して書籍の内容をおさらいして理解を深めると共に、書籍上では表面的にのみ触れられていた(或いは触れられていないが関連しそうなトピック)も独自に深堀りし、1 年掛けて実践的なスキルとノウハウを身に着けようと決心するに至りました。

---

## 学習の進め方

学習は以下 2 種類の成果物を柱として進めていきます。

### zenn の記事

主に以下 3 種類の記事を執筆し、zenn に公開していこうと思います。

- 書籍を章ごとに振り返り、内容を自分なりに要約する記事
- 書籍を振り返る過程で気になった関連トピックを深堀りする記事
- 後述のマルチテナント SaaS アプリケーションの設計や実装の過程を残す記事

公開頻度は最低でも １記事/月を目指したいと思います。

### マルチテナント SaaS アプリケーション

マルチテナント SaaS アーキテクチャの具体的な設計・構築・運用を学習をしていくわけなので、簡易的にでも何らかのマルチテナント SaaS アプリケーションを用意して、そのアプリケーションを相手に書籍で学んだことを実践していく、という形式を取りたいと思います。

そこで、「**intersection**」という、社内コミュニケーション活性化のためのマッチング WEB アプリケーション、及びそのアプリケーションを管理するためのコントロールプレーンを開発していきたいと思います。

「intersection」の仕様は[こちら](https://github.com/horietakehiro/deep-dive-multi-tenant-saas-on-aws/blob/main/projects/intersection/README.md)に順次追記していきます。

---

## 記事一覧

各記事へのリンクを順次追記していきます。

- [【第 01 回】Deep Dive マルチテナント SaaS on AWS - 第 1 章振返り](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-01)
- [【第 02 回】Deep Dive マルチテナント SaaS on AWS - 第 2 章振返り](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-02)
- [【第 03 回】Deep Dive マルチテナント SaaS on AWS - 第 2 章幕間：初期環境構築](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-03)
- [【第 04 回】Deep Dive マルチテナント SaaS on AVS - 第 3 章振返り](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-04)
- [【第 05 回】Deep Dive マルチテナント SaaS on AVS - 第 4 章振返り](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-05)
