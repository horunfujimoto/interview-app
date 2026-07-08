const express = require("express");
const crypto = require("crypto");
const { z } = require("zod");
const prisma = require("../../lib/prisma");
const { audit } = require("../../lib/audit");
const { resolveUploadPath } = require("../../lib/storage");
const { hashPassword } = require("../../lib/password");
const { interviewScope } = require("./scope");

const router = express.Router();

/**
 * GET /api/admin/interviews
 */
router.get("/", async (req, res) => {
  const interviews = await prisma.interview.findMany({
    where: interviewScope(req.auth),
    include: {
      questionSet: { select: { name: true } },
      recording: { select: { id: true } },
      _count: { select: { answers: true, recordingSegments: true } },
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
      hasRecording: !!iv.recording || iv._count.recordingSegments > 0,
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
router.post("/", async (req, res) => {
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

  // セットの質問を面接専用にコピーする（後から応募者ごとにカスタマイズ可能。元セットには影響しない）
  const setQuestions =
    data.mode === "AI"
      ? []
      : await prisma.question.findMany({
          where: { questionSetId: data.questionSetId },
          orderBy: { sequence: "asc" },
        });

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
      questions: {
        create: setQuestions.map((q) => ({
          sequence: q.sequence,
          text: q.text,
          timeLimitSec: q.timeLimitSec,
        })),
      },
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
 * 結果閲覧（この面接の質問一覧・回答一覧・録画の有無・AIサマリー）。
 */
router.get("/:id", async (req, res) => {
  const interview = await prisma.interview.findFirst({
    where: { id: req.params.id, ...interviewScope(req.auth) },
    include: {
      questionSet: { select: { name: true } },
      questions: { orderBy: { sequence: "asc" } },
      answers: { orderBy: { sequence: "asc" } },
      recording: { select: { mimeType: true, sizeBytes: true, uploadedAt: true } },
      recordingSegments: { orderBy: { createdAt: "asc" } },
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
      canEditQuestions: interview.status === "SCHEDULED",
      questions: interview.questions.map((q) => ({
        id: q.id,
        sequence: q.sequence,
        text: q.text,
        timeLimitSec: q.timeLimitSec,
      })),
      answers: interview.answers.map((a) => ({
        sequence: a.sequence,
        questionText: a.questionText,
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
      recordingSegments: interview.recordingSegments.map((s) => ({
        id: s.id,
        sizeBytes: s.sizeBytes.toString(),
        createdAt: s.createdAt,
      })),
      aiSummary: interview.aiSummary,
    },
  });
});

/**
 * GET /api/admin/interviews/:id/recordings/:segmentId
 * 逐次アップロードされた録画セグメントのダウンロード。閲覧は監査ログに記録する。
 */
router.get("/:id/recordings/:segmentId", async (req, res) => {
  const segmentId = Number(req.params.segmentId);
  if (!Number.isInteger(segmentId)) {
    return res.status(400).json({ error: "IDが不正です。" });
  }
  const interview = await prisma.interview.findFirst({
    where: { id: req.params.id, ...interviewScope(req.auth) },
    include: { recordingSegments: { where: { id: segmentId } } },
  });
  const segment = interview?.recordingSegments[0];
  if (!interview || !segment) {
    return res.status(404).json({ error: "録画が見つかりません。" });
  }

  await audit("admin", String(req.auth.adminId), "recording.download", `interviewId=${interview.id} segmentId=${segmentId}`, req.ip);

  const filePath = resolveUploadPath(segment.storageKey);
  res.download(filePath, `recording-${interview.id}-part${segmentId}.webm`, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: "録画ファイルが見つかりません。" });
    }
  });
});

/**
 * GET /api/admin/interviews/:id/recording
 * 録画ファイルのダウンロード（旧・一括アップロード形式）。閲覧は監査ログに記録する。
 */
router.get("/:id/recording", async (req, res) => {
  const interview = await prisma.interview.findFirst({
    where: { id: req.params.id, ...interviewScope(req.auth) },
    include: { recording: true },
  });
  if (!interview || !interview.recording) {
    return res.status(404).json({ error: "録画が見つかりません。" });
  }

  await audit("admin", String(req.auth.adminId), "recording.download", `interviewId=${interview.id}`, req.ip);

  const filePath = resolveUploadPath(interview.recording.storageKey);
  res.download(filePath, `recording-${interview.id}.webm`, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: "録画ファイルが見つかりません。" });
    }
  });
});

module.exports = router;
