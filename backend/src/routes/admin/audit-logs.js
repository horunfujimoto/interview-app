const express = require("express");
const { z } = require("zod");
const prisma = require("../../lib/prisma");

const router = express.Router();

// 監査ログは全管理者・全応募者の操作履歴を含むため OWNER のみ閲覧可
router.use((req, res, next) => {
  if (req.auth.adminRole !== "OWNER") {
    return res.status(403).json({ error: "この操作を行う権限がありません。" });
  }
  next();
});

const PAGE_SIZE = 50;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  actorType: z.enum(["admin", "candidate", "system"]).optional(),
});

/**
 * GET /api/admin/audit-logs?page=1&actorType=admin
 * 新しい順・50件ずつ返す。
 */
router.get("/", async (req, res) => {
  const { page, actorType } = querySchema.parse(req.query);
  const where = actorType ? { actorType } : {};

  const [total, logs] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  res.json({ logs, total, page, pageSize: PAGE_SIZE });
});

module.exports = router;
