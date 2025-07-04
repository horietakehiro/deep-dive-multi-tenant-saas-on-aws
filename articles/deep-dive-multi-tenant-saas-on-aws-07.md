---
title: "【第07回】Deep Dive マルチテナントSaaS on AWS - 第5章振返り"
emoji: "🤿"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["aws", "saas"]
published: false
---

## はじめに

本記事では、「[マルチテナント SaaS アーキテクチャの構築 ― 原則、ベストプラクティス、AWS アーキテクチャパターン](https://www.oreilly.co.jp/books/9784814401017/)の第 5 章「テナント管理」の内容を振り返り、自分なりに要点を整理していきます。

5 章では、テナント管理サービスを構築する意味を確認するところから始め、その役割やユーザー体験に及ぼす様々な影響を確認していきます。

---

## テナント管理の基礎

テナント管理という業務は、様々なサービスやプロセスが関係しています。下図ではテナント管理と特に頻繁に関係する要素を記載した図になります。

![](/images/07/tenant-manage-concept.drawio.png)

図上部のオンボーディングは 4 章にて述べた通り、テナントが作成されるたびに、新しい点後に関連する様々なリソースの構成と設定処理が実行されます。他にも、請求やオフボーディングは、テナントのライフサイクルにおける状態の変化(ティアの変化や解約等)時に関係してきます。
図の右側では、テナント管理に関係する属性情報を記載しています。コアテナント属性と名付けられているデータとして、テナント識別子や状態、ティアといった、基本的なデータを管理します。テナントアイデンティティ構成として、MFA やパスワードポリシー、アイデンティティプロバイダの割り当てといったアイデンティティにまつわる設定を管理します。テナントルーティング構成として、各テナントとアプリケーションを構成するリソースとのルーティング設定(URL 等)を管理します。
図の左に記載しているテナントキー/シークレットは、テナントの様々なセキュリティに関する構成(テナント分離やテナントごとの暗号鍵等)を管理します。
図の下部では、テナントに割り当て可能な様々な種類のユーザを記載しています。テナント管理者はテナント払い出し時に登録され、テナントユーザはテナント管理者によってテナントに追加されます。なお、特に B2C 環境では、テナントとユーザは 1 対 1 の関係をとることが多いですが、そのような場合でも、テナントという単位を導入し、ユーザ管理とテナント管理との間に境界線を設けるべきだと著者は述べています。

次に、テナント管理サービスの概念的な役割を確認していきます。

テナント管理サービスが司る役割は大きく 2 つのカテゴリに分類されます。一つがデータの基本的な管理に焦点を当てた CRUD 操作。2 つが、より広範なテナント管理業務(テナントの無効化や解約等)に関する操操です。

![](/images/07/tenant-manage-two-ops.drawio.png)

データベース(ここでは NoSQL DB)に保管したテナントデータの CRUD を行うとともに、テナントのライフサイクルに関係する様々なイベント(ティアの変更や解約)を管理する必要があります。
テナント管理サービスは、テナントのライフサイクルを一的に管理し、マルチテナントアーキテクチャの実装と動作に直接影響を与える、テナント状態の管理を司る中心的な役割を果たしているといえます。

テナント管理サービスの実装において、各テナントを一意に識別するためのテナント識別子(一般的には GUID)を生成することが必要です。これによって、テナントに関する具体的な情報を使用することなく、テナントを区別できるようになります。
システムによっては、より分かりやすい代替情報(例えば企業名)でテナントを識別している場合もあります。　例えば個々のテナントにサブドメインが割り振られる場合、そのサブドメイン名としてテナント識別子(企業名)を付与する(company123.saasapp.com)といった場合です。しかしそういった代替情報をテナント識別子として運用すべきではなく、適切な識別子(GUID)と分けて扱うべきです。大きな理由としては、GUID でテナントを識別することで、システム全体に影響を与えることなく、そういった代替情報を簡単に変更できるというメリットがあるためです。

テナント管理サービスでは、テナント属性を管理するだけでなく、テナント固有のインフラストラクをャの構成情報を管理するためにも使用を考えることができます。例えば、テナント環境をサイロ化し、アプリケーション URL やアイデンティティプロバイダがテナント個別に存在している場合は、テナント管理サービスを使用してそれらを各テナントに関連づける。といった具合です。

このようにテナント管理サービスはテナントの状態や構成を一元的に管理するためのサービスであることから、このサービスがシステム全体で見た場合のボトルネックにならないようにすることが重要です。具体的な例としては、テナント情報を参照するために各サービスから頻繁にテナント管理サービスにアクセスさせるのではなく、テナント情報を JWT に埋め込んでサービス間で伝番させるようにする、といった具合です。

---

## テナント構成の管理

テナント管理サービスは、テナントのオンボーディング(作成及び構成)に留まらず、様々な操作やユースケースをサポートする必要があります。例えばテナント管理サービスのコンソール上では、テナントに関する情報を表示できるだけでなく、特定のテナントのティアや状態を更新する等です。また、テナントに関する情報として、テナント固有リソースの管理ページへのリンクや、テナント固有のログのダッシュボードへのリンクが表示されることで、運用の効率性を向上させること出来るでしょう。

[第 05 回](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-05)及び[第 06 回](https://zenn.dev/horietakehiro/articles/deep-dive-multi-tenant-saas-on-aws-06)では、テナントのセルフオンボーディングプロセスを実装してみましたが、内部オンボーディングを行えるようにするための機能をテナント管理サービスに実装することも考えられえます。

---

## 5.3 テナントライフサイクルの管理

ここでは、テナントがシステム内に存在する間に経験する可能性のある様々な状態とその管理について考えていきます。

まずはテナントのアクティブ状態(有効化/無効化)についてです。一般的にはこの設定によって、テナントがシステムにアクセス可能か否かが制御されます。この状態を持つことで、テナントを物理的に削除することなく、システムへのアクセス可否を制御できます。
テナントのアクティブ状態の管理は、アプリケーションの請求体験と関連していきます。下図の例では、料金の支払いが滞納しているテナントをサードパーティの請求プロバイダが無効化し(①)、そのイベントをコントロールプレーン上の請求サービスがキャッチし、テナント管理サービス上のテナントのアクティブ状態を無効化にし(②)、ユーザー管理サービスがアクティブなユーザのセッションを無効化する、という一連の処理を表しています。

![](/images/07/disable-tenant.drawio.png)

重要なのは、テナントの状態はテナント管理サービスが信頼できる唯一の信頼源として一元管理すべきであり、状態の変化による影響を他のサービスと確実に同期させる必要があるという点です。

次に、テナントの廃止について考えていきます。
例えばサブスクリプションを更新しないテナントがある場合、最初は無効化の状態に遷移し、一定の猶予期間を設けて利用者がテナントの再開を容易に出来るようにするのが良いかも知れません。しかし時間が経つと、無効化されたテナントのリソースはシステム上純粋なコストや複雑性の要因となるため、それらを削除するため廃止の状態に移行する必要があります。

テナントの廃止方針は様々な要因によって左右されます。単純にデータベース上の全てのテナントデータを削除することも、削除前に一通りのデータをアーカイブすることもあり得ます。コストや複雑性によっては、一部のテナントを要素は削除せず残して、廃止後の容易な再復帰をサポートするという選択肢も考えられます。

下図は、テナントの廃止モデルに関連する可能性のある要素の概念図です。

![](/images/07/abandon-tenant.drawio.png)

この図では、テナント管理サービスと独立して、テナントの廃止プロセスを定義しています。テナントデータがプール化されたストレージに保存されている場合、廃止プロセスは他のテナントデータと削除対象のデータを区別し、後者のみを選択的に削除出来る必要があります。テナントデータが複数のテーブルや異なるタイプのストレージに保されている場合、このプロセスの複雑性は大きくなるでしょう。
廃止プロセスは他の有効なテナントデータやパフォーマンスに影響を与えることなく実施すべきであるため、一般的には非常に負荷の低い非同期プロセスとして実現することが考えられます。

廃止時にテナントデータのアーカイブ(エクスポート)をサポートしたいケースもあるかも知れませんが、特にプールモデルのシステムでは、テナント環境のスナップショットを取得する、という標準的な方法は存在しないため、独自のツールやプロセスを模索する必要があるという点にも注意が必要です。

最後に、テナントのティアの切替について考えていきます。
まずは単純なユースケースとして、ベーシックティアからプレミアムティアへ切り替えることで、高いスループットと追加機能の利用が可能になる下図のような例を考えます。

![](/images/07/tier-switch-full-stack.drawio.png)

この例でティアの切替によって影響を受けるのは、アプリケーションコード内の機能フラグと API ゲートウェイ上のスロットリングポリシーのみと、影響範囲は限定的でティアの切替は容易であると考えられます。

次に、環境が複雑になることで、ティア間の切替がそれに伴い困難になる例を見ていきます。具体的には、ティアの切替によって、テナントがフルスタックのプールモデルからフルスタックのサイロデプロイモデルへ移行する下図のようなユースケースを見ていきます。

![](/images/07/from-pool-to-silo.drawio.png)

ここで難しいのは、プール環境上の現行のテナントデータをサイロ環境に移行する一連の処理です。ゼロダウンタイムの移行を実現するのか、一時的なテナントの無効化を必要とするのか等も検討する必要もあり、移行のためのコードの実装も重労働となります。

フルスタックのサイロ環境への移行はまだ比較的単純である可能性がありますが、環境内の複数のマイクロサービスがティアに基づいてサイロとプールを細かく使い分けている下図のような混合モデルのシステムである場合、複雑性が更に増すことは想像に難くないでしょう・

![](/images/07/tier-switch-mix.drawio.png)

ここで見たいずれのティア移行も、システムを利用している他のテナントに影響を与えず実現できるにににすることが重要です。
また、ここでは下位ティアから上位ティアへの移行のみを見ましたが、上位ティアから下位ティアへの移行についても同時に考える必要があります。

---

## 終わりに

ここでは、テナントの全ての可動部分を管理するための、テナント管理に関する主要な要素を確認しました。テナント管理サービスが、SaaS アーキテクチャのあらゆる可動部分で使用されるテナントデータの単一の格納場所であり、どのようなデータが管理され、どのような操作をサポートする必要があるのかを確認しました。
また、テナントのライフサイクル全体に渡って起こり得る様々なイベントを取り上げ、それらの課題や、テナント管理サービスがテナントの状態変化イベントをどのようにサポートするのかを確認しました。
