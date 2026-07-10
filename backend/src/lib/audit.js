const prisma = require("./prisma");
const logger = require("./logger");

/**
 * 監査ログを記録する。ログ失敗で本処理を止めないよう例外は握りつぶす。
 * @param {"admin"|"candidate"|"system"} actorType
 * @param {string} actorId
 * @param {string} action - 例: "login.success", "interview.start"
 * @param {string|null} detail
 * @param {string|null} ipAddress
 */
async function audit(actorType, actorId, action, detail = null, ipAddress = null) {
  try {
    await prisma.auditLog.create({
      data: { actorType, actorId, action, detail, ipAddress },
    });
  } catch (err) {
    logger.error({ err, actorType, actorId, action }, "監査ログの記録に失敗");
  }
}

module.exports = { audit };
