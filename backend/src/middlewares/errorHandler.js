const { ZodError } = require("zod");

/**
 * 集約エラーハンドラ。
 * 内部情報（スタックトレース等）はクライアントに返さない。
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "入力内容が正しくありません。" });
  }
  console.error(`[${req.method} ${req.originalUrl}]`, err);
  res.status(500).json({ error: "サーバーエラーが発生しました。しばらくしてから再度お試しください。" });
}

module.exports = { errorHandler };
