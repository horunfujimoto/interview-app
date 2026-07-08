/** RECRUITER は自分が発行した面接のみ、OWNER は全件を扱える */
const interviewScope = (auth) =>
  auth.adminRole === "OWNER" ? {} : { createdById: auth.adminId };

module.exports = { interviewScope };
