const express = require("express");
const prisma = require("../lib/prisma");
const { audit } = require("../lib/audit");
const { requireCandidate } = require("../middlewares/auth");

const router = express.Router();

router.use(requireCandidate);

/**
 * GET /api/interviews/me
 * ログイン中の応募者自身の面接情報を返す。
 */
router.get("/me", async (req, res) => {
  const interview = await prisma.interview.findUnique({
    where: { id: req.auth.interviewId },
    include: {
      questionSet: { include: { _count: { select: { questions: true } } } },
    },
  });
  if (!interview) {
    return res.status(404).json({ error: "面接情報が見つかりません。" });
  }

  res.json({
    interview: {
      id: interview.id,
      candidateName: interview.candidateName,
      mode: interview.mode,
      status: interview.status,
      totalQuestions: interview.questionSet?._count.questions ?? null,
      expiresAt: interview.expiresAt,
      startedAt: interview.startedAt,
    },
  });
});

/**
 * POST /api/interviews/me/start
 * 面接を開始する（SCHEDULED → IN_PROGRESS）。
 */
router.post("/me/start", async (req, res) => {
  const interview = await prisma.interview.findUnique({
    where: { id: req.auth.interviewId },
  });
  if (!interview) {
    return res.status(404).json({ error: "面接情報が見つかりません。" });
  }
  if (interview.status === "IN_PROGRESS") {
    // 再入場（リロード等）は許容する
    return res.json({ interview: { id: interview.id, status: interview.status } });
  }
  if (interview.status !== "SCHEDULED") {
    return res.status(409).json({ error: "この面接は開始できない状態です。" });
  }

  const updated = await prisma.interview.update({
    where: { id: interview.id },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });
  await audit("candidate", interview.id, "interview.start", null, req.ip);

  res.json({ interview: { id: updated.id, status: updated.status } });
});

module.exports = router;
