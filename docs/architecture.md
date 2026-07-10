# アーキテクチャ

## 全体像

```
[応募者ブラウザ]──┐
                  ├── React/Vite (5173) ── fetch(credentials: include) ──> Express (3001) ── Prisma ──> PostgreSQL
[管理者ブラウザ]──┘                                                            │
                                                                              └──> uploads/（録画ファイル）
```

- 認証はすべて **httpOnly Cookie の JWT**。フロントにトークンを持たせない（XSS対策）
- 応募者用（`iv_token`）と管理者用（`iv_admin_token`）は別Cookieにして相互干渉を防ぐ
- API層の入力検証は zod、エラーは `errorHandler` に集約（内部情報をクライアントに返さない）

## 認証フロー

### 応募者（ワンタイムID/PW）

1. 管理者が面接を発行すると `loginId` / パスワード（bcryptハッシュのみ保存）が生成される
2. `POST /api/auth/candidate/login` — ID不明時もダミーハッシュと比較し、応答時間からIDの存在を推測されにくくしている
3. 有効期限切れ・終了済み面接はログイン拒否（ワンタイム性の担保）
4. JWT は 2時間有効（面接時間 + 余裕）

### 管理者（パスワード + TOTP強制）

1. `POST /api/auth/admin/login` — パスワード認証。ここではセッションを発行せず **MFA待ち仮トークン**（10分）のみ発行
2. TOTP未設定の管理者は `GET /api/auth/admin/mfa/setup` でQRコードを取得しセットアップ（完了までは管理画面に入れない）
3. `POST /api/auth/admin/mfa/verify` — コード検証成功で正式セッション（8時間）を発行
4. `requireAdmin` は毎リクエストでDBの管理者の現存と現在のロールを照合する（JWTは発行後取り消せないため、削除された管理者のセッションを最長8時間生かさない）

### 権限（RBAC）

- `OWNER` — 全件操作可
- `RECRUITER` — 自分が発行した面接のみ（`src/routes/admin/scope.js`）。他人の面接は404を返し、存在自体を漏らさない

### ログイン総当たり対策（2層レート制限）

- アカウント単位: IP + ログインID/メール ごとに15分10回（同一NAT内の複数応募者が互いのカウントを消費しない）
- IP単位: 15分60回（単一IPからの総当たりの総量を抑える）

## 面接フロー（サーバー主導）

```
SCHEDULED ──start──> IN_PROGRESS ──finish──> COMPLETED
     │                                            
     └─（期限切れバッチ）──> EXPIRED    （管理者操作）──> CANCELLED
```

- 質問の進行は `GET /me/questions/next` に集約し、**フロントはモード（FIXED/AI/HYBRID）を意識しない**
- 質問は面接発行時にセットから**面接ごとにコピー**され（`InterviewQuestion`）、応募者別に追加・編集できる。開始前（SCHEDULED）のみ編集可
- 回答保存時に質問文を `Answer.questionText` へ**スナップショット保存**する（後から質問が編集されても「実際に何を聞かれたか」の記録が変わらない）
- 同じ sequence への再送信は上書き（リトライ許容・冪等）

> AIモード（Gemini による質問生成・深掘り）は未実装（Phase 4 予定）。
> 現状 `GET /me/questions/next` は AI モードに 501 を返す。
> `AiInterviewConfig` / `AiSummary` テーブルと `Question.aiFollowUp` はこのための先行定義。

## 録画アップロード（逐次チャンク方式）

面接中、約5秒ごとの webm チャンクを `POST /me/recording/chunk?session=...&seq=N` で送信し、サーバーがファイルに追記する。クラッシュしてもアップロード済み分は保全される。

- **順序保証**: `lastSeq = seq - 1` の行だけを更新するアトミックな「席取り」（`updateMany`）に勝った1リクエストだけが追記する。重複再送は冪等に成功を返す
- **欠番**: 409 を返し、クライアントは新しい `sessionId` で別セグメントとして継続する（リロード時も同様）
- **追記失敗時**: DB上の受理（lastSeq/sizeBytes）を巻き戻してから500を返す。DBとファイルの不整合で以降のセグメントが壊れるのを防ぐ
- ファイル名はサーバー側で決定し、`path.basename` でパストラバーサルを構造的に防ぐ（`src/lib/storage.js`）
- 旧方式の一括アップロード（`POST /me/recording` / `Recording` テーブル）は互換のため残している

## データモデル要点

スキーマの正は `backend/prisma/schema.prisma`（各モデルに設計コメントあり）。

- `Interview.id` は cuid（URL推測防止）。1応募者=1面接
- `AuditLog` — ログイン成否・面接開始/終了・録画操作などを記録（actorType: admin/candidate/system）
- フロントの `InterviewMode` / `InterviewStatus` 型（`frontend/src/lib/api.ts`）はスキーマのenumと**手動同期**。enum変更時は両方更新すること
