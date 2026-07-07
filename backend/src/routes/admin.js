const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { audit } = require("../lib/audit");
const { hashPassword } = require("../lib/password");
const { requireAdmin } = require("../middlewares/auth");

const router = express.Router();

router.use(requireAdmin);

/** RECRUITER は自分が発行した面接のみ、OWNER は全件を扱える */
const interviewScope = (auth) =>
  auth.adminRole === "OWNER" ? {} : { createdById: auth.adminId };

// ===== 質問セット =====

/**
 * GET /api/admin/question-sets
 */
router.get("/question-sets", async (req, res) => {
  const sets = await prisma.questionSet.findMany({
    where: { isArchived: false },
    include: { _count: { select: { questions: true, interviews: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({
    questionSets: sets.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      questionCount: s._count.questions,
      interviewCount: s._count.interviews,
      createdAt: s.createdAt,
    })),
  });
});

/**
 * GET /api/admin/question-sets/:id
 */
router.get("/question-sets/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "IDが不正です。" });
  }
  const set = await prisma.questionSet.findUnique({
    where: { id },
    include: { questions: { orderBy: { sequence: "asc" } } },
  });
  if (!set) {
    return res.status(404).json({ error: "質問セットが見つかりません。" });
  }
  res.json({ questionSet: set });
});

const questionSetSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullish(),
  questions: z
    .array(
      z.object({
        text: z.string().min(1).max(2000),
        timeLimitSec: z.number().int().min(30).max(1800).default(180),
      })
    )
    .min(1)
    .max(50),
});

/**
 * POST /api/admin/question-sets
 * 質問セットを質問ごと新規作成する。
 */
router.post("/question-sets", async (req, res) => {
  const data = questionSetSchema.parse(req.body);

  const set = await prisma.questionSet.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      questions: {
        create: data.questions.map((q, i) => ({
          sequence: i + 1,
          text: q.text,
          timeLimitSec: q.timeLimitSec,
        })),
      },
    },
    include: { questions: true },
  });
  await audit("admin", String(req.auth.adminId), "questionSet.create", `id=${set.id}`, req.ip);

  res.status(201).json({ questionSet: set });
});

/**
 * POST /api/admin/question-sets/:id/archive
 * 質問セットをアーカイブする（面接から参照されるため物理削除はしない）。
 */
router.post("/question-sets/:id/archive", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "IDが不正です。" });
  }
  const set = await prisma.questionSet.findUnique({ where: { id } });
  if (!set) {
    return res.status(404).json({ error: "質問セットが見つかりません。" });
  }
  await prisma.questionSet.update({ where: { id }, data: { isArchived: true } });
  await audit("admin", String(req.auth.adminId), "questionSet.archive", `id=${id}`, req.ip);
  res.json({ message: "アーカイブしました。" });
});

// ===== 面接 =====

/**
 * GET /api/admin/interviews
 */
router.get("/interviews", async (req, res) => {
  const interviews = await prisma.interview.findMany({
    where: interviewScope(req.auth),
    include: {
      questionSet: { select: { name: true } },
      recording: { select: { id: true } },
      _count: { select: { answers: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({
    interviews: interviews.map((iv) => ({
      id: iv.id,
      candidateName: iv.candidateName,
      candidateEmail: iv.candidateEmail,
      loginId: iv.loginId,
      mode: iv.mode,
      status: iv.status,
      questionSetName: iv.questionSet?.name ?? null,
      answerCount: iv._count.answers,
      hasRecording: !!iv.recording,
      expiresAt: iv.expiresAt,
      startedAt: iv.startedAt,
      finishedAt: iv.finishedAt,
      createdAt: iv.createdAt,
    })),
  });
});

const createInterviewSchema = z.object({
  candidateName: z.string().min(1).max(100),
  candidateEmail: z.email().max(200).nullish(),
  mode: z.enum(["FIXED", "AI", "HYBRID"]).default("FIXED"),
  questionSetId: z.number().int().nullish(),
  validDays: z.number().int().min(1).max(60).default(7),
});

/**
 * POST /api/admin/interviews
 * 面接を発行する。ワンタイムの loginId / パスワードを生成して一度だけ平文で返す。
 */
router.post("/interviews", async (req, res) => {
  const data = createInterviewSchema.parse(req.body);

  // FIXED / HYBRID は質問セット必須
  if (data.mode !== "AI") {
    if (!data.questionSetId) {
      return res.status(400).json({ error: "このモードでは質問セットの指定が必要です。" });
    }
    const set = await prisma.questionSet.findUnique({ where: { id: data.questionSetId } });
    if (!set || set.isArchived) {
      return res.status(400).json({ error: "指定された質問セットが存在しません。" });
    }
  }

  // 認証情報の生成（パスワードは一度だけ平文で返し、DBにはハッシュのみ保存）
  const loginId = `cand-${crypto.randomBytes(4).toString("hex")}`;
  const plainPassword = crypto.randomBytes(9).toString("base64url"); // 12文字

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + data.validDays);

  const interview = await prisma.interview.create({
    data: {
      candidateName: data.candidateName,
      candidateEmail: data.candidateEmail ?? null,
      loginId,
      passwordHash: await hashPassword(plainPassword),
      mode: data.mode,
      questionSetId: data.mode === "AI" ? null : data.questionSetId,
      expiresAt,
      createdById: req.auth.adminId,
    },
  });
  await audit("admin", String(req.auth.adminId), "interview.create", `id=${interview.id} mode=${data.mode}`, req.ip);

  res.status(201).json({
    interview: {
      id: interview.id,
      candidateName: interview.candidateName,
      mode: interview.mode,
      expiresAt: interview.expiresAt,
    },
    credentials: { loginId, password: plainPassword }, // この応答でのみ取得可能
  });
});

/**
 * GET /api/admin/interviews/:id
 * 結果閲覧（回答一覧・録画の有無・AIサマリー）。
 */
router.get("/interviews/:id", async (req, res) => {
  const interview = await prisma.interview.findFirst({
    where: { id: req.params.id, ...interviewScope(req.auth) },
    include: {
      questionSet: { select: { name: true } },
      answers: {
        orderBy: { sequence: "asc" },
        include: { question: { select: { text: true } } },
      },
      recording: { select: { mimeType: true, sizeBytes: true, uploadedAt: true } },
      aiSummary: true,
      createdBy: { select: { name: true } },
    },
  });
  if (!interview) {
    return res.status(404).json({ error: "面接が見つかりません。" });
  }

  res.json({
    interview: {
      id: interview.id,
      candidateName: interview.candidateName,
      candidateEmail: interview.candidateEmail,
      loginId: interview.loginId,
      mode: interview.mode,
      status: interview.status,
      questionSetName: interview.questionSet?.name ?? null,
      expiresAt: interview.expiresAt,
      startedAt: interview.startedAt,
      finishedAt: interview.finishedAt,
      createdBy: interview.createdBy.name,
      answers: interview.answers.map((a) => ({
        sequence: a.sequence,
        questionText: a.question?.text ?? a.aiQuestionText ?? "",
        transcript: a.transcript,
        durationSec: a.durationSec,
        answeredAt: a.answeredAt,
      })),
      recording: interview.recording
        ? {
            mimeType: interview.recording.mimeType,
            sizeBytes: interview.recording.sizeBytes?.toString() ?? null,
            uploadedAt: interview.recording.uploadedAt,
          }
        : null,
      aiSummary: interview.aiSummary,
    },
  });
});

/**
 * GET /api/admin/interviews/:id/recording
 * 録画ファイルのダウンロード。閲覧は監査ログに記録する。
 */
router.get("/interviews/:id/recording", async (req, res) => {
  const interview = await prisma.interview.findFirst({
    where: { id: req.params.id, ...interviewScope(req.auth) },
    include: { recording: true },
  });
  if (!interview || !interview.recording) {
    return res.status(404).json({ error: "録画が見つかりません。" });
  }

  await audit("admin", String(req.auth.adminId), "recording.download", `interviewId=${interview.id}`, req.ip);

  const filePath = path.join(__dirname, "..", "..", "uploads", path.basename(interview.recording.storageKey));
  res.download(filePath, `recording-${interview.id}.webm`, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: "録画ファイルが見つかりません。" });
    }
  });
});

module.exports = router;
