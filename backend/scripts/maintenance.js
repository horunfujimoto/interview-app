/**
 * 定期メンテナンススクリプト（cron / タスクスケジューラで日次実行を想定）
 * 実行: cd backend && npm run maintenance
 *
 * 1. 期限切れ処理: 有効期限を過ぎた未実施(SCHEDULED)の面接を EXPIRED にする
 * 2. 保持期限処理: 面接終了から RETENTION_DAYS（既定180日）を過ぎた録画を削除する
 *    - 削除対象は録画ファイルと録画メタデータのみ
 *    - 回答・文字起こし・監査ログは保持する（選考記録として残す）
 *
 * 環境変数:
 *   RETENTION_DAYS  録画の保持日数（既定: 180）
 *   DRY_RUN=1       削除を実行せず対象の一覧表示のみ行う
 */
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const prisma = require("../src/lib/prisma");
const { audit } = require("../src/lib/audit");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
// 「0日」も有効な指定として扱う（|| だと 0 が falsy で既定値になってしまう）
const RETENTION_DAYS = Number.isFinite(Number(process.env.RETENTION_DAYS)) && process.env.RETENTION_DAYS !== undefined
  ? Number(process.env.RETENTION_DAYS)
  : 180;
const DRY_RUN = process.env.DRY_RUN === "1";

async function expireOverdueInterviews() {
  const where = { status: "SCHEDULED", expiresAt: { lt: new Date() } };
  if (DRY_RUN) {
    const count = await prisma.interview.count({ where });
    console.log(`[DRY-RUN] 期限切れ処理: ${count} 件の面接が EXPIRED 対象です`);
    return;
  }
  const result = await prisma.interview.updateMany({ where, data: { status: "EXPIRED" } });
  if (result.count > 0) {
    await audit("system", "maintenance", "interview.expire", `count=${result.count}`);
  }
  console.log(`期限切れ処理: ${result.count} 件の面接を EXPIRED にしました`);
}

async function purgeOldRecordings() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const targets = await prisma.interview.findMany({
    where: {
      finishedAt: { lt: cutoff },
      OR: [{ recording: { isNot: null } }, { recordingSegments: { some: {} } }],
    },
    include: { recording: true, recordingSegments: true },
  });

  if (targets.length === 0) {
    console.log(`保持期限処理: 対象なし（保持期間 ${RETENTION_DAYS} 日）`);
    return;
  }

  for (const iv of targets) {
    const keys = [
      ...(iv.recording ? [iv.recording.storageKey] : []),
      ...iv.recordingSegments.map((s) => s.storageKey),
    ];
    console.log(`${DRY_RUN ? "[DRY-RUN] " : ""}面接 ${iv.id}（終了: ${iv.finishedAt?.toISOString()}）の録画 ${keys.length} 件を削除`);
    if (DRY_RUN) continue;

    for (const key of keys) {
      const filePath = path.join(UPLOAD_DIR, path.basename(key));
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        if (err.code !== "ENOENT") throw err; // ファイル既削除は許容
      }
    }
    await prisma.$transaction([
      prisma.recordingSegment.deleteMany({ where: { interviewId: iv.id } }),
      prisma.recording.deleteMany({ where: { interviewId: iv.id } }),
    ]);
    await audit("system", "maintenance", "recording.purge", `interviewId=${iv.id} files=${keys.length} retentionDays=${RETENTION_DAYS}`);
  }
  console.log(`保持期限処理: ${targets.length} 件の面接の録画を${DRY_RUN ? "削除対象として検出（未実行）" : "削除"}しました`);
}

(async () => {
  console.log(`メンテナンス開始 ${new Date().toISOString()}${DRY_RUN ? "（DRY-RUN モード）" : ""}`);
  await expireOverdueInterviews();
  await purgeOldRecordings();
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
