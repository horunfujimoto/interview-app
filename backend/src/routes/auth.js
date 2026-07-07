const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { audit } = require("../lib/audit");
const { COOKIE_NAME, cookieOptions } = require("../middlewares/auth");

const router = express.Router();

const loginSchema = z.object({
  loginId: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

// ログインID不明時にも bcrypt を実行し、応答時間からIDの存在を推測されにくくする
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

const CANDIDATE_TOKEN_TTL = "2h"; // 面接時間 + 余裕

/**
 * POST /api/auth/candidate/login
 * 応募者ログイン。成功時は httpOnly Cookie で JWT を発行する。
 */
router.post("/candidate/login", async (req, res) => {
  const { loginId, password } = loginSchema.parse(req.body);

  const interview = await prisma.interview.findUnique({ where: { loginId } });

  const passwordOk = await bcrypt.compare(
    password,
    interview ? interview.passwordHash : DUMMY_HASH
  );

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

/**
 * POST /api/auth/logout
 */
router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ message: "ログアウトしました。" });
});

module.exports = router;
