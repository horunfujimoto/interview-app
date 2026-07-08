/**
 * 開発用: テスト応募者(candidate-0001)の面接を初期状態に戻すスクリプト
 * 実行: cd backend && node prisma/reset-interview.js
 * 回答・録画レコードを削除し、状態を SCHEDULED に戻す（動作確認のやり直し用）。
 */
require("dotenv").config();
const prisma = require("../src/lib/prisma");

async function main() {
  const interview = await prisma.interview.findUnique({
    where: { loginId: "candidate-0001" },
  });
  if (!interview) {
    console.log("candidate-0001 の面接が見つかりません。先に seed.js を実行してください。");
    return;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.$transaction([
    prisma.answer.deleteMany({ where: { interviewId: interview.id } }),
    prisma.recording.deleteMany({ where: { interviewId: interview.id } }),
    prisma.recordingSegment.deleteMany({ where: { interviewId: interview.id } }),
    prisma.interview.update({
      where: { id: interview.id },
      data: { status: "SCHEDULED", startedAt: null, finishedAt: null, expiresAt },
    }),
  ]);

  console.log("リセット完了: candidate-0001 は再び SCHEDULED 状態です（期限7日延長）。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
