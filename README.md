# AI一次面接アプリ

採用の一次面接を非同期化するWebアプリケーション。採用担当者が面接（質問セット + ワンタイムID/PW）を発行し、応募者はブラウザから録画付きで回答する。

## 技術スタック

| 領域 | 技術 |
| --- | --- |
| フロントエンド | React + TypeScript + Vite（Atomic Design構成） |
| バックエンド | Node.js + Express 5 |
| DB / ORM | PostgreSQL + Prisma 7（ドライバアダプタ `@prisma/adapter-pg`） |
| 認証 | JWT（httpOnly Cookie）/ 管理者はTOTPによる二段階認証を強制 |

## クイックスタート

前提: Node.js 20以上 / PostgreSQL 15以上（詳細は [docs/setup.md](docs/setup.md)）

```bash
npm install

# バックエンドの環境変数を用意
cd backend
cp .env.example .env   # DATABASE_URL と JWT_SECRET を設定する

# DB作成 + マイグレーション + 開発データ投入
npx prisma migrate dev

# ルートに戻って両サーバー起動（backend: 3001 / frontend: 5173）
cd ..
npm run dev
```

開発用ログイン情報（seed投入後）:

- 管理者: `admin@example.com` / `Admin@12345`（初回ログイン時にTOTPセットアップを求められる）
- 応募者: `candidate-0001` / `P@ssword123`

## npmスクリプト（ルート）

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | backend + frontend を並行起動 |
| `npm run backend` / `npm run frontend` | 個別起動 |
| `npm test` | バックエンドの統合テストを実行（テスト専用DBを自動作成） |

バックエンド側のスクリプトは `backend/package.json` を参照（`seed` / `maintenance` / `db:migrate` など）。

## ディレクトリ構成

```
backend/
  server.js             エントリポイント（CORS・レート制限・ルーティング）
  prisma/               スキーマとマイグレーション
  src/routes/           API（auth / interviews=応募者向け / admin/*=管理者向け）
  src/middlewares/      認証・エラーハンドラ
  src/lib/              prisma / storage / audit / password
  scripts/dev/          seed 等の開発用スクリプト
  scripts/ops/          maintenance 等の運用スクリプト
  tests/                統合テスト（node:test）
frontend/
  src/atoms|molecules|organisms/   UIコンポーネント（Atomic Design）
  src/pages/            画面（応募者フロー / admin/ 管理画面）
  src/hooks/            録画・タイマー等のロジック
  src/lib/api.ts        APIクライアントと型定義
docs/                   ドキュメント
```

## ドキュメント

- [docs/setup.md](docs/setup.md) — 開発環境の構築手順・トラブルシューティング
- [docs/architecture.md](docs/architecture.md) — 認証・面接フロー・録画アップロードの設計
- [docs/operations.md](docs/operations.md) — 運用（メンテナンスバッチ・データ保持・本番設定）
