const bcrypt = require("bcryptjs");

// bcrypt コストはここで一元管理する。
// ダミーハッシュと実ハッシュでコストがズレると、応答時間の差から
// ログインIDの存在有無を推測されてしまう（タイミング攻撃）。
const BCRYPT_COST = 12;

// ログインID不明時にも比較を行い、応答時間を実ハッシュ検証と揃えるためのダミー
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_COST);

const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_COST);
const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash ?? DUMMY_HASH);

module.exports = { BCRYPT_COST, DUMMY_HASH, hashPassword, verifyPassword };
