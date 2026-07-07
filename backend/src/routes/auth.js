const express = require("express");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { audit } = require("../lib/audit");
const { verifyPassword } = require("../lib/password");
const { COOKIE_NAME, ADMIN_COOKIE_NAME, cookieOptions } = require("../middlewares/auth");

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

/**
 * POST /api/auth/admin/login
 * 管理者ログイン。成功時は応募者とは別の httpOnly Cookie で JWT を発行する。
 */
router.post("/admin/login", async (req, res) => {
  const { email, password } = adminLoginSchema.parse(req.body);

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  const passwordOk = await verifyPassword(password, admin?.passwordHash);

  if (!admin || !passwordOk) {
    await audit("admin", email, "login.failure", null, req.ip);
    return res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません。" });
  }

  const token = jwt.sign(
    { adminId: admin.id, role: "admin", adminRole: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: ADMIN_TOKEN_TTL }
  );

  res.cookie(ADMIN_COOKIE_NAME, token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
  await audit("admin", String(admin.id), "login.success", null, req.ip);

  res.json({ admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
});

/**
 * POST /api/auth/logout
 */
router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.clearCookie(ADMIN_COOKIE_NAME, cookieOptions);
  res.json({ message: "ログアウトしました。" });
});

module.exports = router;
