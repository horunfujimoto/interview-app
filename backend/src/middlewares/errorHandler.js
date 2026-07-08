const { ZodError } = require("zod");

/**
 * 集約エラーハンドラ。
 * - 入力起因のエラー（zod / body-parser の JSON 構文 / multer のサイズ超過等、
 *   ステータス付き・expose 可能なもの）は適切な 4xx を返す
 * - それ以外は 500。内部情報（スタックトレース等）はクライアントに返さない
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "入力内容が正しくありません。" });
  }

  // multer のファイルサイズ超過（err.code = LIMIT_FILE_SIZE, status 未設定）
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "ファイルサイズが上限を超えています。" });
  }

  // http-errors 系（body-parser の JSON 構文エラー 400、raw の entity.too.large 413 等）。
  // expose=true は「メッセージをクライアントに見せてよい」印だが、内部文言の直返しは
  // 避け、ステータスのみ引き継いで汎用メッセージを返す。
  const status = err.status ?? err.statusCode;
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return res.status(status).json({ error: "リクエストの形式が正しくありません。" });
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err);
  res.status(500).json({ error: "サーバーエラーが発生しました。しばらくしてから再度お試しください。" });
}

module.exports = { errorHandler };
