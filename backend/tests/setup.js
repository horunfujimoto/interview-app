/**
 * 統合テスト用セットアップ。
 * - 開発DBとは別のテスト専用DB（<dbname>_test）を自動作成・マイグレーション
 * - テスト用ポートでサーバーを起動
 * - シードデータ投入とテーブルクリア
 *
 * 注意: レート制限は本番同等に有効（サーバープロセスごとにメモリストアが
 * リセットされるため、テスト全体で認証系リクエストを IP 上限 60 回未満に抑える設計）。
 */
require("dotenv").config(); // backend/.env から DATABASE_URL を読む（既存環境変数は上書きしない）
const { execSync, spawn } = require("child_process");
const path = require("path");
const { Client } = require("pg");

const TEST_PORT = 3101;
const BASE = `http://localhost:${TEST_PORT}`;
const JWT_SECRET = "integration-test-secret";

function buildTestDatabaseUrl() {
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `${url.pathname.replace(/\/$/, "")}_test`;
  return url.toString();
}

async function ensureTestDatabase() {
  const testUrl = new URL(buildTestDatabaseUrl());
  const dbName = testUrl.pathname.slice(1);
  const admin = new Client({ connectionString: process.env.DATABASE_URL });
  await admin.connect();
  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
  }
  await admin.end();
}

function migrateTestDatabase(testDbUrl) {
  execSync("npx prisma migrate deploy", {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: "pipe",
  });
}

function createTestPrisma(testDbUrl) {
  // src/lib/prisma は process.env.DATABASE_URL を参照するため、require 前に差し替える
  process.env.DATABASE_URL = testDbUrl;
  return require("../src/lib/prisma");
}

async function startServer(testDbUrl) {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      DATABASE_URL: testDbUrl,
      JWT_SECRET,
      FRONTEND_URL: "http://localhost:5173",
      PORT: String(TEST_PORT),
      NODE_ENV: "test",
    },
    stdio: "pipe",
  });
  child.stderr.on("data", (d) => process.stderr.write(`[server] ${d}`));

  // ヘルスチェックが通るまで待つ（最大10秒）
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return child;
    } catch {
      /* 起動待ち */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  child.kill();
  throw new Error("テストサーバーが起動しませんでした");
}

async function truncateAll(prisma) {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "AuditLog", "Answer", "RecordingSegment", "Recording", "InterviewQuestion", "Interview", "Question", "QuestionSet", "AiInterviewConfig", "AiSummary", "AdminUser" RESTART IDENTITY CASCADE'
  );
}

/** テストシナリオが前提とする初期データを投入し、参照用のオブジェクトを返す */
async function seedTestData(prisma) {
  const bcrypt = require("bcryptjs");
  const otp = require("otplib");

  const totpSecret = otp.generateSecret();
  const passwordHash = await bcrypt.hash("Owner@Test123", 12);

  const owner = await prisma.adminUser.create({
    data: { email: "owner@test.local", passwordHash, name: "テストOWNER", role: "OWNER", totpSecret, totpEnabled: true },
  });
  const recruiterSecret = otp.generateSecret();
  const recruiter = await prisma.adminUser.create({
    data: { email: "recruiter@test.local", passwordHash, name: "テストRECRUITER", role: "RECRUITER", totpSecret: recruiterSecret, totpEnabled: true },
  });

  const questionSet = await prisma.questionSet.create({
    data: {
      name: "統合テスト用セット",
      questions: {
        create: [
          { sequence: 1, text: "テスト質問1", timeLimitSec: 60 },
          { sequence: 2, text: "テスト質問2", timeLimitSec: 90 },
        ],
      },
    },
    include: { questions: true },
  });

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const candidateHash = await bcrypt.hash("Cand@Test123", 12);

  const makeInterview = (loginId, createdById, status = "SCHEDULED") =>
    prisma.interview.create({
      data: {
        candidateName: `応募者 ${loginId}`,
        loginId,
        passwordHash: candidateHash,
        mode: "FIXED",
        status,
        questionSetId: questionSet.id,
        expiresAt,
        createdById,
        questions: {
          create: questionSet.questions.map((q) => ({ sequence: q.sequence, text: q.text, timeLimitSec: q.timeLimitSec })),
        },
      },
    });

  const interview = await makeInterview("test-cand-main", owner.id);
  const completedInterview = await makeInterview("test-cand-done", owner.id, "COMPLETED");
  const ownerOnlyInterview = await makeInterview("test-cand-scope", owner.id);

  return {
    owner: { email: "owner@test.local", password: "Owner@Test123", totpSecret },
    recruiter: { email: "recruiter@test.local", password: "Owner@Test123", totpSecret: recruiterSecret, id: recruiter.id },
    candidate: { loginId: "test-cand-main", password: "Cand@Test123" },
    completedCandidate: { loginId: "test-cand-done", password: "Cand@Test123" },
    interview,
    completedInterview,
    ownerOnlyInterview,
    questionSet,
  };
}

const getCookie = (res) =>
  (res.headers.getSetCookie() || []).map((c) => c.split(";")[0]).join("; ");

async function adminLogin(account) {
  const otp = require("otplib");
  let res = await fetch(`${BASE}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  const mfaCookie = getCookie(res);
  const code = otp.generateSync({ secret: account.totpSecret });
  res = await fetch(`${BASE}/api/auth/admin/mfa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: mfaCookie },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(`管理者ログイン失敗: ${res.status}`);
  return getCookie(res);
}

module.exports = {
  BASE,
  buildTestDatabaseUrl,
  ensureTestDatabase,
  migrateTestDatabase,
  createTestPrisma,
  startServer,
  truncateAll,
  seedTestData,
  getCookie,
  adminLogin,
};
