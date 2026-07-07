const jwt = require("jsonwebtoken");

const COOKIE_NAME = "iv_token";

/** 認証Cookieの共通オプション */
const cookieOptions = {
  httpOnly: true, // JSからアクセス不可（XSS対策）
  secure: process.env.NODE_ENV === "production", // 本番はHTTPSのみ
  sameSite: "strict",
  path: "/",
};

/**
 * 応募者認証ミドルウェア。
 * Cookie の JWT を検証し、req.auth = { interviewId, role } を設定する。
 */
function requireCandidate(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "認証が必要です。" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "candidate") {
      return res.status(403).json({ error: "この操作を行う権限がありません。" });
    }
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "セッションが無効か期限切れです。再度ログインしてください。" });
  }
}

module.exports = { requireCandidate, COOKIE_NAME, cookieOptions };
