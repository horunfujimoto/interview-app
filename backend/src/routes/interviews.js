const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { audit } = require("../lib/audit");
const { requireCandidate } = require("../middlewares/auth");

const router = express.Router();

router.use(requireCandidate);

// ===== 録画アップロード設定 =====
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      // ファイル名はサーバー側で決定する（クライアント指定名は使わない: パストラバーサル対策）
      cb(null, `${req.auth.interviewId}-${Date.now()}.webm`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (["video/webm", "audio/webm"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("webm 形式のみアップロード可能です。"));
    }
  },
});

/**
 * GET /api/interviews/me
 * ログイン中の応募者自身の面接情報を返す。
 */
router.get("/me", async (req, res) => {
  const interview = await prisma.interview.findUnique({
    where: { id: req.auth.interviewId },
    include: {
      _count: { select: { questions: true } },
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
      totalQuestions: interview._count.questions,
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

/**
 * GET /api/interviews/me/questions/next
 * 次の質問を返す。モード分岐はここに集約する（フロントはモードを意識しない）。
 * 全問回答済みの場合は { finished: true } を返す。
 */
router.get("/me/questions/next", async (req, res) => {
  const interview = await prisma.interview.findUnique({
    where: { id: req.auth.interviewId },
    include: {
      questions: { orderBy: { sequence: "asc" } }, // 面接ごとにコピー済みの質問
      answers: { select: { sequence: true } },
    },
  });
  if (!interview) {
    return res.status(404).json({ error: "面接情報が見つかりません。" });
  }
  if (interview.status !== "IN_PROGRESS") {
    return res.status(409).json({ error: "面接が開始されていません。" });
  }

  if (interview.mode === "AI") {
    // TODO: Phase 4 で Gemini による質問生成を実装
    return res.status(501).json({ error: "AI面接モードは現在準備中です。" });
  }

  const questions = interview.questions;
  const answeredCount = interview.answers.length;

  if (answeredCount >= questions.length) {
    return res.json({ finished: true, question: null, progress: { current: questions.length, total: questions.length } });
  }

  const next = questions[answeredCount];
  res.json({
    finished: false,
    question: {
      sequence: next.sequence,
      text: next.text,
      timeLimitSec: next.timeLimitSec,
    },
    progress: { current: answeredCount + 1, total: questions.length },
  });
});

const answerSchema = z.object({
  sequence: z.number().int().min(1).max(1000),
  transcript: z.string().max(20000).nullish(),
  durationSec: z.number().int().min(0).max(3600).nullish(),
});

/**
 * POST /api/interviews/me/answers
 * 回答を保存する。同じ sequence への再送信は上書き（リトライを許容）。
 */
router.post("/me/answers", async (req, res) => {
  const { sequence, transcript, durationSec } = answerSchema.parse(req.body);

  const interview = await prisma.interview.findUnique({
    where: { id: req.auth.interviewId },
  });
  if (!interview) {
    return res.status(404).json({ error: "面接情報が見つかりません。" });
  }
  if (interview.status !== "IN_PROGRESS") {
    return res.status(409).json({ error: "面接が進行中ではないため、回答を保存できません。" });
  }

  // この面接の質問から出題時点の質問文をスナップショット保存する
  const question = await prisma.interviewQuestion.findUnique({
    where: {
      interviewId_sequence: { interviewId: interview.id, sequence },
    },
  });
  if (!question) {
    return res.status(400).json({ error: "指定された質問が存在しません。" });
  }

  const answer = await prisma.answer.upsert({
    where: {
      interviewId_sequence: { interviewId: interview.id, sequence },
    },
    update: { transcript: transcript ?? null, durationSec: durationSec ?? null },
    create: {
      interviewId: interview.id,
      questionText: question.text,
      sequence,
      transcript: transcript ?? null,
      durationSec: durationSec ?? null,
    },
  });
  await audit("candidate", interview.id, "answer.submit", `sequence=${sequence}`, req.ip);

  res.json({ answer: { sequence: answer.sequence } });
});

/**
 * POST /api/interviews/me/finish
 * 面接を終了する（IN_PROGRESS → COMPLETED）。
 */
router.post("/me/finish", async (req, res) => {
  const interview = await prisma.interview.findUnique({
    where: { id: req.auth.interviewId },
  });
  if (!interview) {
    return res.status(404).json({ error: "面接情報が見つかりません。" });
  }
  if (interview.status === "COMPLETED") {
    return res.json({ interview: { id: interview.id, status: interview.status } });
  }
  if (interview.status !== "IN_PROGRESS") {
    return res.status(409).json({ error: "この面接は終了できない状態です。" });
  }

  const updated = await prisma.interview.update({
    where: { id: interview.id },
    data: { status: "COMPLETED", finishedAt: new Date() },
  });
  await audit("candidate", interview.id, "interview.finish", null, req.ip);

  res.json({ interview: { id: updated.id, status: updated.status } });
});

// ===== 録画の逐次アップロード =====
// クライアントは5秒ごとのチャンクを連番付きで送信し、サーバーはファイルに追記する。
// リロード等でセッションが切れたら新しい sessionId で別セグメントとして継続。

const SESSION_ID_RE = /^[a-zA-Z0-9-]{8,64}$/;

/**
 * POST /api/interviews/me/recording/chunk?session=...&seq=N
 * ボディは video/webm の生バイト列（最大16MB）。
 * 連番が飛んだ場合は 409 を返し、クライアントは新セッションでやり直す。
 */
router.post(
  "/me/recording/chunk",
  express.raw({ type: ["video/webm", "application/octet-stream"], limit: "16mb" }),
  async (req, res) => {
    const sessionId = String(req.query.session ?? "");
    const seq = Number(req.query.seq);
    if (!SESSION_ID_RE.test(sessionId) || !Number.isInteger(seq) || seq < 1 || seq > 100000) {
      return res.status(400).json({ error: "パラメータが不正です。" });
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: "チャンクが空です。" });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: req.auth.interviewId },
    });
    if (!interview) {
      return res.status(404).json({ error: "面接情報が見つかりません。" });
    }
    if (!["IN_PROGRESS", "COMPLETED"].includes(interview.status)) {
      return res.status(409).json({ error: "この面接には録画をアップロードできません。" });
    }

    // ファイル名はサーバー側で決定（クライアント指定値はIDとして検証済みのもののみ使用）
    const storageKey = `${interview.id}-${sessionId}.webm`;

    const segment = await prisma.recordingSegment.upsert({
      where: {
        interviewId_sessionId: { interviewId: interview.id, sessionId },
      },
      update: {},
      create: { interviewId: interview.id, sessionId, storageKey },
    });

    if (seq <= segment.lastSeq) {
      // 再送された既受理チャンク: 冪等に成功を返す（二重追記しない）
      return res.json({ received: seq, lastSeq: segment.lastSeq });
    }
    if (seq !== segment.lastSeq + 1) {
      // 欠落があるとファイルが壊れるため受理しない → クライアントは新セッションで継続
      return res.status(409).json({ error: "チャンクの順序が不正です。", expected: segment.lastSeq + 1 });
    }

    await fs.promises.appendFile(path.join(UPLOAD_DIR, storageKey), req.body);
    const updated = await prisma.recordingSegment.update({
      where: { id: segment.id },
      data: { lastSeq: seq, sizeBytes: segment.sizeBytes + BigInt(req.body.length) },
    });
    if (seq === 1) {
      await audit("candidate", interview.id, "recording.segment_start", `session=${sessionId}`, req.ip);
    }

    res.json({ received: seq, lastSeq: updated.lastSeq });
  }
);

/**
 * POST /api/interviews/me/recording
 * 録画ファイル（webm）をアップロードする。
 * 面接終了直後に呼ばれるため COMPLETED 状態でも受け付ける。
 */
router.post("/me/recording", upload.single("recording"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "録画ファイルが添付されていません。" });
  }

  const interview = await prisma.interview.findUnique({
    where: { id: req.auth.interviewId },
  });
  if (!interview) {
    return res.status(404).json({ error: "面接情報が見つかりません。" });
  }
  if (!["IN_PROGRESS", "COMPLETED"].includes(interview.status)) {
    fs.unlink(req.file.path, () => {});
    return res.status(409).json({ error: "この面接には録画をアップロードできません。" });
  }

  const recording = await prisma.recording.upsert({
    where: { interviewId: interview.id },
    update: {
      storageKey: req.file.filename,
      mimeType: req.file.mimetype,
      sizeBytes: BigInt(req.file.size),
    },
    create: {
      interviewId: interview.id,
      storageKey: req.file.filename,
      mimeType: req.file.mimetype,
      sizeBytes: BigInt(req.file.size),
    },
  });
  await audit("candidate", interview.id, "recording.upload", `size=${req.file.size}`, req.ip);

  res.json({ recording: { uploadedAt: recording.uploadedAt } });
});

module.exports = router;
