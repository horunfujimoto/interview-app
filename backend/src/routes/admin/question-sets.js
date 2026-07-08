const express = require("express");
const { z } = require("zod");
const prisma = require("../../lib/prisma");
const { audit } = require("../../lib/audit");

const router = express.Router();

/**
 * GET /api/admin/question-sets
 */
router.get("/", async (req, res) => {
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
router.get("/:id", async (req, res) => {
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
router.post("/", async (req, res) => {
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
router.post("/:id/archive", async (req, res) => {
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

module.exports = router;
