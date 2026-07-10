# 開発環境セットアップ

## 前提ソフトウェア

- **Node.js 20以上**（Prisma 7 の要件）
- **PostgreSQL 15以上**（開発時の動作確認は 17）
  - Windows: [EDBインストーラ](https://www.postgresql.org/download/windows/) または `winget install PostgreSQL.PostgreSQL.17`
  - ポートは既定の **5432**、スーパーユーザー `postgres` のパスワードを控えておく
  - データベース自体は後述の `prisma migrate dev` が自動作成するので、手動で `CREATE DATABASE` する必要はない

> **注意:** 本プロジェクトのスキーマ・マイグレーション履歴は PostgreSQL 用
> （`prisma/migrations/migration_lock.toml` 参照）。MySQL 等の接続文字列を
> 設定すると `P1013` エラーで全ての prisma コマンドが失敗する。

## 手順

### 1. 依存パッケージのインストール

```bash
npm install   # ルートで実行（workspaces で backend / frontend 両方に入る）
```

### 2. 環境変数の設定

```bash
cd backend
cp .env.example .env
```

`.env` を開いて最低限この2つを設定する:

- `DATABASE_URL` — PostgreSQLの接続文字列（例: `postgresql://postgres:0000@localhost:5432/interview_app`）
- `JWT_SECRET` — ランダムな長い文字列。生成例:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
  ```

### 3. DBのマイグレーションと開発データ投入

```bash
cd backend
npx prisma migrate dev
```

- `interview_app` データベースが無ければ自動作成される
- マイグレーション適用後、`prisma.config.ts` の設定により seed（`scripts/dev/seed.js`）が自動実行される
- seed だけ再実行したい場合: `npm run seed`（upsert なので何度実行しても安全）

### 4. 起動

```bash
cd ..        # ルートへ
npm run dev  # backend(3001) + frontend(5173) を並行起動
```

- 管理画面: http://localhost:5173 → `admin@example.com` / `Admin@12345`
  - 初回ログイン時にTOTP（Google Authenticator等）のセットアップが必須
- 応募者ログイン: `candidate-0001` / `P@ssword123`（seed実行から7日間有効）

## テストの実行

```bash
npm test   # ルートから（backend の統合テストを実行）
```

- `DATABASE_URL` のDB名に `_test` を付けたテスト専用DB（例: `interview_app_test`）を自動作成し、実サーバーを起動して検証する。開発DBには触れない
- レート制限が本番同等に有効なため、テストを15分以内に何度も連続実行すると認証系がレート制限（429）に達することがある

## トラブルシューティング

| 症状 | 原因と対処 |
| --- | --- |
| `P1013: The provided database string is invalid` | `DATABASE_URL` が `postgresql://` で始まっていない（MySQL用のURL等）。`.env.example` の形式に合わせる |
| `P1001: Can't reach database server` | PostgreSQLが起動していない。Windowsは `services.msc` で `postgresql-x64-17` サービスを開始 |
| 起動時に「環境変数 JWT_SECRET が設定されていません」 | `backend/.env` が無いか値が空。手順2を実施 |
| 管理者ログインで429が返る | レート制限（15分で10回）。15分待つか、開発中はバックエンドを再起動する（メモリストアがリセットされる） |
| TOTPコードが「正しくありません」になる | 端末の時計ズレ。許容は前後30秒。スマホの時刻自動設定を確認 |
