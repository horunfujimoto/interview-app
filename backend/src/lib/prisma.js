const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// Prisma 7 は Rust エンジン非依存のため、DB接続はドライバアダプタ経由で行う
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// PrismaClient はアプリ全体で1インスタンスを共有する
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
