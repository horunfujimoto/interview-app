const express = require("express");
const prisma = require("../../lib/prisma");
const { requireAdmin } = require("../../middlewares/auth");
const questionSetsRouter = require("./question-sets");
const interviewsRouter = require("./interviews");
const interviewQuestionsRouter = require("./interview-questions");
const auditLogsRouter = require("./audit-logs");

// /api/admin 配下。リソースごとにファイル分割している（ロジックは各ファイル参照）
const router = express.Router();

router.use(requireAdmin);

/**
 * GET /api/admin/me
 * ログイン中の管理者自身の情報。フロントのロール別表示（サイドバー等）に使う。
 */
router.get("/me", async (req, res) => {
  const admin = await prisma.adminUser.findUnique({
    where: { id: req.auth.adminId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!admin) {
    return res.status(401).json({ error: "セッションが無効か期限切れです。再度ログインしてください。" });
  }
  res.json({ admin });
});

router.use("/question-sets", questionSetsRouter);
router.use("/audit-logs", auditLogsRouter);
// 具体的なパス（questions）を先にマウントし、/:id への誤マッチを防ぐ
router.use("/interviews/:id/questions", interviewQuestionsRouter);
router.use("/interviews", interviewsRouter);

module.exports = router;
