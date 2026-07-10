const pino = require("pino");

// アプリ全体で共有する構造化ロガー。
// 本番は JSON 1行1イベント（収集基盤に渡しやすい形式）、開発時は pino-pretty で人間向けに整形する。
// リクエスト紐付きのログは req.log（pino-http が requestId 付きで注入）を優先して使うこと。
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: { translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
        },
});

module.exports = logger;
