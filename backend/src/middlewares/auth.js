const jwt = require("jsonwebtoken");

const COOKIE_NAME = "iv_token"; // 応募者用
const ADMIN_COOKIE_NAME = "iv_admin_token"; // 管理者用（応募者と別Cookieにして相互干渉を防ぐ）
const MFA_COOKIE_NAME = "iv_admin_mfa"; // 管理者のMFA待ち仮トークン用

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

/**
 * 管理者認証ミドルウェア。
 * req.auth = { adminId, role: "admin", adminRole: "OWNER"|"RECRUITER" } を設定する。
 */
function requireAdmin(req, res, next) {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "認証が必要です。" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "この操作を行う権限がありません。" });
    }
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "セッションが無効か期限切れです。再度ログインしてください。" });
  }
}

module.exports = { requireCandidate, requireAdmin, COOKIE_NAME, ADMIN_COOKIE_NAME, MFA_COOKIE_NAME, cookieOptions };
