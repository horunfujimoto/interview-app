const express = require("express");
const { requireAdmin } = require("../../middlewares/auth");
const questionSetsRouter = require("./question-sets");
const interviewsRouter = require("./interviews");
const interviewQuestionsRouter = require("./interview-questions");

// /api/admin 配下。リソースごとにファイル分割している（ロジックは各ファイル参照）
const router = express.Router();

router.use(requireAdmin);
router.use("/question-sets", questionSetsRouter);
// 具体的なパス（questions）を先にマウントし、/:id への誤マッチを防ぐ
router.use("/interviews/:id/questions", interviewQuestionsRouter);
router.use("/interviews", interviewsRouter);

module.exports = router;
