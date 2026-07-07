const express = require("express");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const otp = require("otplib");
const qrcode = require("qrcode");
const prisma = require("../lib/prisma");
const { audit } = require("../lib/audit");
const { verifyPassword } = require("../lib/password");
const { COOKIE_NAME, ADMIN_COOKIE_NAME, MFA_COOKIE_NAME, cookieOptions } = require("../middlewares/auth");

// TOTP検証で許容する時計ズレ（前後1ステップ = 30秒）
const TOTP_TOLERANCE = 1;

const router = express.Router();

const loginSchema = z.object({
  loginId: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

const CANDIDATE_TOKEN_TTL = "2h"; // 面接時間 + 余裕

/**
 * POST /api/auth/candidate/login
 * 応募者ログイン。成功時は httpOnly Cookie で JWT を発行する。
 */
router.post("/candidate/login", async (req, res) => {
  const { loginId, password } = loginSchema.parse(req.body);

  const interview = await prisma.interview.findUnique({ where: { loginId } });

  // ログインID不明時もダミーハッシュと比較し、応答時間からIDの存在を推測されにくくする
  const passwordOk = await verifyPassword(password, interview?.passwordHash);

  if (!interview || !passwordOk) {
    await audit("candidate", loginId, "login.failure", null, req.ip);
    return res.status(401).json({ error: "ログインIDまたはパスワードが正しくありません。" });
  }

  // 面接の状態チェック（ワンタイム性の担保）
  if (interview.expiresAt < new Date()) {
    await audit("candidate", interview.id, "login.expired", null, req.ip);
    return res.status(403).json({ error: "この面接の有効期限が切れています。採用担当者にお問い合わせください。" });
  }
  if (["COMPLETED", "EXPIRED", "CANCELLED"].includes(interview.status)) {
    await audit("candidate", interview.id, "login.rejected_status", `status=${interview.status}`, req.ip);
    return res.status(403).json({ error: "この面接はすでに終了しているか、無効になっています。" });
  }

  const token = jwt.sign(
    { interviewId: interview.id, role: "candidate" },
    process.env.JWT_SECRET,
    { expiresIn: CANDIDATE_TOKEN_TTL }
  );

  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 2 * 60 * 60 * 1000 });
  await audit("candidate", interview.id, "login.success", null, req.ip);

  res.json({
    interview: {
      id: interview.id,
      candidateName: interview.candidateName,
      mode: interview.mode,
      status: interview.status,
    },
  });
});

const adminLoginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});

const ADMIN_TOKEN_TTL = "8h";

const MFA_PENDING_TTL = "10m"; // パスワード認証後、コード入力までの猶予

/**
 * POST /api/auth/admin/login
 * 管理者ログイン（第一段階: パスワード認証）。
 * ここではセッションを発行せず、MFA待ちの仮トークンのみ発行する。
 * TOTP 未設定の管理者はセットアップが完了するまで管理画面に入れない（強制）。
 */
router.post("/admin/login", async (req, res) => {
  const { email, password } = adminLoginSchema.parse(req.body);

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  const passwordOk = await verifyPassword(password, admin?.passwordHash);

  if (!admin || !passwordOk) {
    await audit("admin", email, "login.failure", null, req.ip);
    return res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません。" });
  }

  const stage = admin.totpEnabled ? "verify" : "setup";
  const pendingToken = jwt.sign(
    { adminId: admin.id, role: "admin_mfa_pending", stage },
    process.env.JWT_SECRET,
    { expiresIn: MFA_PENDING_TTL }
  );

  res.cookie(MFA_COOKIE_NAME, pendingToken, { ...cookieOptions, maxAge: 10 * 60 * 1000 });
  await audit("admin", String(admin.id), "login.password_ok", `mfaStage=${stage}`, req.ip);

  res.json({ mfa: stage === "setup" ? "setup_required" : "code_required" });
});

/** MFA待ちトークンの検証（第一段階を通過した管理者のみが持つ） */
function requireMfaPending(req, res, next) {
  const token = req.cookies?.[MFA_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "認証が必要です。最初からログインし直してください。" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin_mfa_pending") {
      return res.status(403).json({ error: "この操作を行う権限がありません。" });
    }
    req.mfa = payload;
    next();
  } catch {
    return res.status(401).json({ error: "セッションが期限切れです。最初からログインし直してください。" });
  }
}

/**
 * GET /api/auth/admin/mfa/session
 * 現在の MFA ステージ（setup / verify）を返す。二段階認証画面の初期表示用。
 */
router.get("/admin/mfa/session", requireMfaPending, (req, res) => {
  res.json({ stage: req.mfa.stage });
});

/**
 * GET /api/auth/admin/mfa/setup
 * TOTP 秘密鍵を生成し、認証アプリ登録用の QR コード（data URL）を返す。
 * セットアップ完了（verify 成功）までは何度でも再生成できる。
 */
router.get("/admin/mfa/setup", requireMfaPending, async (req, res) => {
  const admin = await prisma.adminUser.findUnique({ where: { id: req.mfa.adminId } });
  if (!admin) {
    return res.status(404).json({ error: "管理者が見つかりません。" });
  }
  if (admin.totpEnabled) {
    return res.status(409).json({ error: "二段階認証はすでに設定済みです。" });
  }

  const secret = otp.generateSecret();
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { totpSecret: secret },
  });

  const otpauthUri = otp.generateURI({
    strategy: "totp",
    issuer: "AI一次面接",
    label: admin.email,
    secret,
  });
  const qrDataUrl = await qrcode.toDataURL(otpauthUri);

  res.json({ qrDataUrl, secret }); // secret は QR が読めない場合の手動入力用
});

const mfaVerifySchema = z.object({
  code: z.string().regex(/^\d{6}$/, "6桁の数字を入力してください"),
});

/**
 * POST /api/auth/admin/mfa/verify
 * TOTP コードを検証し、成功したら正式な管理者セッションを発行する。
 * 初回（setup ステージ）は検証成功をもって二段階認証を有効化する。
 */
router.post("/admin/mfa/verify", requireMfaPending, async (req, res) => {
  const { code } = mfaVerifySchema.parse(req.body);

  const admin = await prisma.adminUser.findUnique({ where: { id: req.mfa.adminId } });
  if (!admin || !admin.totpSecret) {
    return res.status(400).json({ error: "二段階認証が未設定です。QRコードの読み取りから始めてください。" });
  }

  const result = otp.verifySync({
    secret: admin.totpSecret,
    token: code,
    epochTolerance: TOTP_TOLERANCE,
  });
  if (!result.valid) {
    await audit("admin", String(admin.id), "mfa.failure", null, req.ip);
    return res.status(401).json({ error: "認証コードが正しくありません。" });
  }

  if (!admin.totpEnabled) {
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { totpEnabled: true },
    });
    await audit("admin", String(admin.id), "mfa.enabled", null, req.ip);
  }

  const token = jwt.sign(
    { adminId: admin.id, role: "admin", adminRole: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: ADMIN_TOKEN_TTL }
  );

  res.clearCookie(MFA_COOKIE_NAME, cookieOptions);
  res.cookie(ADMIN_COOKIE_NAME, token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
  await audit("admin", String(admin.id), "login.success", "mfa=totp", req.ip);

  res.json({ admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
});

/**
 * POST /api/auth/logout
 */
router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.clearCookie(ADMIN_COOKIE_NAME, cookieOptions);
  res.clearCookie(MFA_COOKIE_NAME, cookieOptions);
  res.json({ message: "ログアウトしました。" });
});

module.exports = router;
