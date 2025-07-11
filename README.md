# プランニングポーカー

アジャイル開発のプランニング時に使う「ポイントポーカー（プランニングポーカー）」を、SkyWay を使ってリアルタイム同期する Web アプリケーションです。

## 機能

- 🏠 **ルーム作成・参加**: ファシリテーターがルームを作成し、参加者がIDで参加
- 👥 **参加者管理**: ニックネームでの参加者一覧表示
- 📝 **タスク管理**: ファシリテーターがタスクを設定・共有
- 🃏 **ポイント投票**: フィボナッチ数列のカード（1,2,3,5,8,13,21,?,☕）で投票
- 🔒 **非公開投票**: 投票中は他の人の選択は見えない
- 📊 **結果表示**: 全員投票後にカードを一斉公開、平均ポイント表示
- 💬 **コメント機能**: 投票結果に対するコメント入力
- 📱 **モバイル対応**: レスポンシブデザインでモバイルでも使いやすい

## 技術スタック

- **フロントエンド**: React + TypeScript
- **UI**: Tailwind CSS
- **通信**: SkyWay（MeshルームでP2P通信）
- **フレームワーク**: Next.js
- **デプロイ**: Vercel（または任意の静的ホスティング）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. SkyWay APIキーの設定

1. [SkyWay開発者コンソール](https://console.skyway.ntt.com/)でアカウントを作成
2. 新しいプロジェクトを作成してAPIキーを取得
3. プロジェクトルートに`.env.local`ファイルを作成：

```env
NEXT_PUBLIC_SKYWAY_TOKEN=your_skyway_token_here
```

**注意**: SkyWayのAPIキーは公開リポジトリにコミットしないでください。`.env.local`ファイルは`.gitignore`に含まれています。

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## 使用方法

### ルーム作成（ファシリテーター）

1. トップページでニックネームを入力
2. 「ルームを作成する」ボタンをクリック
3. 自動生成されたルームIDを参加者に共有

### ルーム参加

1. トップページでニックネームとルームIDを入力
2. 「参加する」ボタンをクリック

### プランニングポーカー

1. ファシリテーターがタスク名を入力・送信
2. 参加者がポイントカードを選択（非公開）
3. 全員が投票後、ファシリテーターが「カードを公開」
4. 投票結果と平均ポイントを確認
5. 「次のタスクへ」でリセット

## 開発

### スクリプト

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm run start

# テスト実行
npm run test

# Storybook起動
npm run storybook

# 型チェック
npm run type-check
```

### プロジェクト構造

```
src/
├── components/          # 共通コンポーネント
├── pages/              # Next.jsページ
│   ├── index.tsx       # トップページ
│   └── room/[roomId].tsx # ルームページ
├── views/              # ビューレベルコンポーネント
│   ├── TopView/        # トップ画面
│   │   ├── index.tsx   # メインコンポーネント
│   │   ├── hooks.ts    # カスタムフック
│   │   └── index.stories.tsx # Storybook
│   └── RoomView/       # ルーム画面
│       ├── index.tsx   # メインコンポーネント
│       ├── hooks.ts    # カスタムフック
│       └── index.stories.tsx # Storybook
└── styles/             # スタイルファイル
```

## デプロイ

### Vercel

1. GitHubリポジトリをVercelに接続
2. 環境変数`NEXT_PUBLIC_SKYWAY_TOKEN`を設定
3. デプロイ実行

### その他の静的ホスティング

```bash
npm run build
```

ビルドされたファイルを任意の静的ホスティングサービスにデプロイできます。

## ライセンス

MIT License

[![codecov](https://codecov.io/gh/NiheiKeita/next-example-app/graph/badge.svg?token=MY9YAIW9F6)](https://codecov.io/gh/NiheiKeita/next-example-app)
