# 運用ガイド

## 定期メンテナンスバッチ

`backend/scripts/ops/maintenance.js` を **日次実行**する想定（cron / Windowsタスクスケジューラ）。

```bash
cd backend && npm run maintenance
```

処理内容:

1. **期限切れ処理** — 有効期限を過ぎた未実施（SCHEDULED）の面接を EXPIRED にする
2. **保持期限処理** — 面接終了から `RETENTION_DAYS`（既定180日）を過ぎた録画ファイルと録画メタデータを削除する。回答・文字起こし・監査ログは選考記録として保持する

オプション:

| 環境変数 | 意味 |
| --- | --- |
| `RETENTION_DAYS` | 録画の保持日数（既定: 180、`0` も有効） |
| `DRY_RUN=1` | 削除せず対象一覧の表示のみ（本番導入前の確認に使う） |

登録例（Linux cron、毎日 4:00）:

```cron
0 4 * * * cd /path/to/interview-app/backend && npm run maintenance >> /var/log/interview-maintenance.log 2>&1
```

## 録画ファイルの保存先

- `backend/uploads/` にローカル保存（git管理外・個人情報を含む）
- 保存先の定義は `src/lib/storage.js` に集約されており、S3等へ移行する際はこのモジュールを差し替える
- 応募者1人あたり最大500MB（一括アップロード上限）。**ディスク空き容量の監視を推奨**
- バックアップ対象: PostgreSQL（`pg_dump`）と `uploads/` の両方

## ヘルスチェック

`GET /api/health` — DBへ疎通確認（`SELECT 1`）を行い、到達できない場合は503を返す。死活監視はこのエンドポイントを見る。

## アプリケーションログ

pino による構造化ログを標準出力に出す（`src/lib/logger.js`）。

- 本番（`NODE_ENV=production`）: JSON 1行1イベント。systemd / Docker / CloudWatch 等の収集基盤にそのまま渡せる
- 開発時: pino-pretty で整形表示
- 全リクエストに requestId が付与され、エラーログと突き合わせられる（`/api/health` は記録しない）
- Cookie / Authorization ヘッダはトークンを含むため必ずマスクされる
- `LOG_LEVEL` で出力レベルを変更できる（既定: info）

## 監査ログ

`AuditLog` テーブルに記録される（アプリからの削除機能は無い）:

- ログイン成功/失敗（応募者・管理者）、MFA有効化/失敗
- 面接開始・終了、回答送信、録画アップロード
- メンテナンスバッチの実行結果（actorType: `system`）

## 本番デプロイ時のチェックリスト

- [ ] `NODE_ENV=production` — 認証CookieがHTTPS限定（`secure`）になる。**HTTPS必須**
- [ ] `JWT_SECRET` — 開発と別の十分に長いランダム値
- [ ] `FRONTEND_URL` — 本番フロントのオリジン（CORS許可先。未設定だと localhost:5173 のみ許可）
- [ ] `TRUST_PROXY` — リバースプロキシ（nginx / ALB等）配下ではホップ数を設定（例: `1`）。未設定だと全ユーザーの req.ip がプロキシIPになり、レート制限の共有・監査ログのIP誤記録が起きる
- [ ] マイグレーションは `npx prisma migrate deploy` を使う（`migrate dev` は開発専用）
- [ ] メンテナンスバッチのスケジュール登録（上記）
- [ ] `uploads/` とDBのバックアップ設定

## 既知の制限

- AIモード（Gemini連携）は未実装。AIモードの面接は応募者側で質問取得時に501になる
- 応募者のJWT（2時間）は発行後に失効させられない。面接をCANCELLEDにしても、ログイン済みセッションの参照系APIは期限まで有効（回答保存・開始などの更新系は状態チェックで拒否される）
- TOTPは同一30秒窓内のコード再利用を検出しない
