const express = require("express");
const { z } = require("zod");
const prisma = require("../../lib/prisma");
const { audit } = require("../../lib/audit");
const { interviewScope } = require("./scope");

// /api/admin/interviews/:id/questions 配下。親ルータの :id を受け取る
const router = express.Router({ mergeParams: true });

/** 対象面接を取得し、編集可能（SCHEDULED かつ自分のスコープ内）か検証する */
async function findEditableInterview(req, res) {
  const interview = await prisma.interview.findFirst({
    where: { id: req.params.id, ...interviewScope(req.auth) },
  });
  if (!interview) {
    res.status(404).json({ error: "面接が見つかりません。" });
    return null;
  }
  if (interview.status !== "SCHEDULED") {
    res.status(409).json({ error: "面接開始後は質問を変更できません。" });
    return null;
  }
  return interview;
}

const interviewQuestionSchema = z.object({
  text: z.string().min(1).max(2000),
  timeLimitSec: z.number().int().min(30).max(1800).default(180),
});

/**
 * POST /api/admin/interviews/:id/questions
 * この面接に質問を1問追加する（末尾に追加）。
 */
router.post("/", async (req, res) => {
  const interview = await findEditableInterview(req, res);
  if (!interview) return;
  const data = interviewQuestionSchema.parse(req.body);

  const last = await prisma.interviewQuestion.findFirst({
    where: { interviewId: interview.id },
    orderBy: { sequence: "desc" },
  });
  const question = await prisma.interviewQuestion.create({
    data: {
      interviewId: interview.id,
      sequence: (last?.sequence ?? 0) + 1,
      text: data.text,
      timeLimitSec: data.timeLimitSec,
    },
  });
  await audit("admin", String(req.auth.adminId), "interviewQuestion.add", `interviewId=${interview.id}`, req.ip);
  res.status(201).json({ question });
});

const applySetSchema = z.object({
  questionSetId: z.number().int(),
});

/**
 * POST /api/admin/interviews/:id/questions/apply-set
 * 質問セットの内容でこの面接の質問を丸ごと置き換える（その後さらに個別編集可能）。
 */
router.post("/apply-set", async (req, res) => {
  const interview = await findEditableInterview(req, res);
  if (!interview) return;
  const { questionSetId } = applySetSchema.parse(req.body);

  const set = await prisma.questionSet.findUnique({
    where: { id: questionSetId },
    include: { questions: { orderBy: { sequence: "asc" } } },
  });
  if (!set || set.isArchived) {
    return res.status(400).json({ error: "指定された質問セットが存在しません。" });
  }

  await prisma.$transaction([
    prisma.interviewQuestion.deleteMany({ where: { interviewId: interview.id } }),
    prisma.interviewQuestion.createMany({
      data: set.questions.map((q) => ({
        interviewId: interview.id,
        sequence: q.sequence,
        text: q.text,
        timeLimitSec: q.timeLimitSec,
      })),
    }),
    prisma.interview.update({
      where: { id: interview.id },
      data: { questionSetId: set.id },
    }),
  ]);
  await audit("admin", String(req.auth.adminId), "interviewQuestion.applySet", `interviewId=${interview.id} setId=${set.id}`, req.ip);

  const questions = await prisma.interviewQuestion.findMany({
    where: { interviewId: interview.id },
    orderBy: { sequence: "asc" },
  });
  res.json({ questions });
});

/**
 * PUT /api/admin/interviews/:id/questions/:questionId
 * この面接の質問を1問編集する。
 */
router.put("/:questionId", async (req, res) => {
  const interview = await findEditableInterview(req, res);
  if (!interview) return;
  const questionId = Number(req.params.questionId);
  if (!Number.isInteger(questionId)) {
    return res.status(400).json({ error: "IDが不正です。" });
  }
  const data = interviewQuestionSchema.parse(req.body);

  const existing = await prisma.interviewQuestion.findFirst({
    where: { id: questionId, interviewId: interview.id },
  });
  if (!existing) {
    return res.status(404).json({ error: "質問が見つかりません。" });
  }

  const question = await prisma.interviewQuestion.update({
    where: { id: questionId },
    data: { text: data.text, timeLimitSec: data.timeLimitSec },
  });
  await audit("admin", String(req.auth.adminId), "interviewQuestion.edit", `interviewId=${interview.id} qid=${questionId}`, req.ip);
  res.json({ question });
});

/**
 * DELETE /api/admin/interviews/:id/questions/:questionId
 * この面接の質問を1問削除し、以降の出題順を詰める。
 */
router.delete("/:questionId", async (req, res) => {
  const interview = await findEditableInterview(req, res);
  if (!interview) return;
  const questionId = Number(req.params.questionId);
  if (!Number.isInteger(questionId)) {
    return res.status(400).json({ error: "IDが不正です。" });
  }

  const existing = await prisma.interviewQuestion.findFirst({
    where: { id: questionId, interviewId: interview.id },
  });
  if (!existing) {
    return res.status(404).json({ error: "質問が見つかりません。" });
  }

  // 削除して残りの sequence を 1 から振り直す（トランザクションで一貫性を保証）
  await prisma.$transaction(async (tx) => {
    await tx.interviewQuestion.delete({ where: { id: questionId } });
    const rest = await tx.interviewQuestion.findMany({
      where: { interviewId: interview.id },
      orderBy: { sequence: "asc" },
    });
    // 一意制約(interviewId, sequence)との衝突を避けるため一旦オフセットしてから振り直す
    for (const [i, q] of rest.entries()) {
      await tx.interviewQuestion.update({ where: { id: q.id }, data: { sequence: 10000 + i } });
    }
    for (const [i, q] of rest.entries()) {
      await tx.interviewQuestion.update({ where: { id: q.id }, data: { sequence: i + 1 } });
    }
  });
  await audit("admin", String(req.auth.adminId), "interviewQuestion.delete", `interviewId=${interview.id} qid=${questionId}`, req.ip);
  res.json({ message: "削除しました。" });
});

module.exports = router;
