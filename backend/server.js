require("dotenv").config(); // 最初に読み込む（以降の require が環境変数に依存するため）

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");

const authRouter = require("./src/routes/auth");
const interviewsRouter = require("./src/routes/interviews");
const adminRouter = require("./src/routes/admin");
const { errorHandler } = require("./src/middlewares/errorHandler");

// 起動前チェック: 必須の環境変数がなければ即終了（設定漏れの早期発見）
for (const key of ["DATABASE_URL", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`環境変数 ${key} が設定されていません。backend/.env を確認してください。`);
    process.exit(1);
  }
}

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // 全開放は禁止
    credentials: true, // Cookie 認証のため必須
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ログイン総当たり対策: 15分あたり10回まで
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "試行回数が上限に達しました。しばらくしてから再度お試しください。" },
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/interviews", interviewsRouter);
app.use("/api/admin", adminRouter);

app.use((req, res) => {
  res.status(404).json({ error: "エンドポイントが見つかりません。" });
});
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
