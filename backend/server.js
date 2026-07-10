require("dotenv").config(); // 最初に読み込む（以降の require が環境変数に依存するため）

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const pinoHttp = require("pino-http");

const logger = require("./src/lib/logger");
const prisma = require("./src/lib/prisma");
const authRouter = require("./src/routes/auth");
const interviewsRouter = require("./src/routes/interviews");
const adminRouter = require("./src/routes/admin");
const { errorHandler } = require("./src/middlewares/errorHandler");

// 起動前チェック: 必須の環境変数がなければ即終了（設定漏れの早期発見）
for (const key of ["DATABASE_URL", "JWT_SECRET"]) {
  if (!process.env[key]) {
    logger.fatal(`環境変数 ${key} が設定されていません。backend/.env を確認してください。`);
    process.exit(1);
  }
}

const app = express();

// リクエストログ（requestId 付き）。各リクエストの開始〜完了とステータスを記録し、
// ルート内では req.log 経由でリクエストに紐付いたログを出せる。
app.use(
  pinoHttp({
    logger,
    // Cookie には認証トークンが入るためログへ出力しない
    redact: ["req.headers.cookie", "req.headers.authorization"],
    // 死活監視の定期アクセスでログが埋まらないようにする
    autoLogging: { ignore: (req) => req.url === "/api/health" },
  })
);

// リバースプロキシ（nginx / ALB 等）配下では TRUST_PROXY にホップ数を設定する（例: 1）。
// 未設定のまま本番プロキシ配下に置くと、全ユーザーの req.ip がプロキシの IP になり、
// レート制限の共有や監査ログの IP 誤記録が起きる。
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
}

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // 全開放は禁止
    credentials: true, // Cookie 認証のため必須
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ログイン総当たり対策は2層構成:
// 1層目（アカウント単位）: IP + ログインID/メール ごとに 15分10回。
//   同一ネットワーク（大学・企業のNAT）から複数の応募者が同時にログインしても
//   互いのカウントを消費しない。
// 2層目（IP単位）: 15分60回。単一IPから多数のIDを総当たりする攻撃の総量を抑える。
const RATE_MESSAGE = { error: "試行回数が上限に達しました。しばらくしてから再度お試しください。" };

const accountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const account = String(req.body?.loginId ?? req.body?.email ?? "").slice(0, 200).toLowerCase();
    return `${ipKeyGenerator(req.ip)}|${account}`;
  },
  message: RATE_MESSAGE,
});

const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: RATE_MESSAGE,
});

// 死活監視用。DBに到達できない場合は 503 を返す（プロセス生存だけでは「正常」としない）
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "error", detail: "database_unreachable" });
  }
});

app.use("/api/auth", ipLimiter, accountLimiter, authRouter);
app.use("/api/interviews", interviewsRouter);
app.use("/api/admin", adminRouter);

app.use((req, res) => {
  res.status(404).json({ error: "エンドポイントが見つかりません。" });
});
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3001;
const server = app.listen(PORT, () => {
  logger.info(`Backend running on http://localhost:${PORT}`);
});

// 終了シグナル受信時は新規接続の受付を止め、処理中のリクエスト完了と
// DB切断を待ってから終了する（デプロイ・再起動時のリクエスト切断を防ぐ）
let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0));
  });
  server.closeIdleConnections?.(); // keep-alive の遊休接続が close を妨げないようにする
  setTimeout(() => process.exit(1), 10_000).unref(); // 最長10秒で強制終了（ハング防止）
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
