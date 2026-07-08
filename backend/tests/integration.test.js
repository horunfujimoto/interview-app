/**
 * バックエンド統合テスト（node:test / 追加依存なし）
 * 実行: npm test -w backend
 *
 * テスト専用DB（<dbname>_test）に対して実サーバーを起動して検証する。
 * レート制限は本番同等に有効なため、認証系リクエストの総数を
 * IP 上限（15分60回）未満に収めている（現在 約12回）。
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const {
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
} = require("./setup");

let server;
let prisma;
let seed;
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const createdUploadFiles = [];

before(async () => {
  await ensureTestDatabase();
  const testDbUrl = buildTestDatabaseUrl();
  migrateTestDatabase(testDbUrl);
  prisma = createTestPrisma(testDbUrl);
  await truncateAll(prisma);
  seed = await seedTestData(prisma);
  server = await startServer(testDbUrl);
});

after(async () => {
  server?.kill();
  for (const f of createdUploadFiles) {
    try {
      fs.unlinkSync(f);
    } catch {
      /* 既に無ければ無視 */
    }
  }
  await prisma?.$disconnect();
});

const candidateLogin = async (loginId, password) => {
  const res = await fetch(`${BASE}/api/auth/candidate/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId, password }),
  });
  return res;
};

// ---------- 応募者認証 ----------

test("応募者ログイン: 誤パスワードは401（ID存在の有無を漏らさない文言）", async () => {
  const res = await candidateLogin(seed.candidate.loginId, "wrong-password");
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.match(body.error, /ログインIDまたはパスワード/);
});

test("応募者ログイン: COMPLETED の面接は403で拒否（ワンタイム性）", async () => {
  const res = await candidateLogin(seed.completedCandidate.loginId, seed.completedCandidate.password);
  assert.equal(res.status, 403);
});

test("応募者フロー: ログイン→開始→質問進行→回答冪等→完了", async (t) => {
  const loginRes = await candidateLogin(seed.candidate.loginId, seed.candidate.password);
  assert.equal(loginRes.status, 200);
  const cookie = getCookie(loginRes);

  await t.test("未認証アクセスは401", async () => {
    const res = await fetch(`${BASE}/api/interviews/me`);
    assert.equal(res.status, 401);
  });

  await t.test("開始前の質問取得は409", async () => {
    const res = await fetch(`${BASE}/api/interviews/me/questions/next`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 409);
  });

  await t.test("開始でIN_PROGRESSになり再入場も許容", async () => {
    let res = await fetch(`${BASE}/api/interviews/me/start`, { method: "POST", headers: { Cookie: cookie } });
    assert.equal(res.status, 200);
    res = await fetch(`${BASE}/api/interviews/me/start`, { method: "POST", headers: { Cookie: cookie } });
    assert.equal(res.status, 200); // リロード等の再入場
  });

  await t.test("質問はサーバー主導で進行し、回答は冪等に上書き", async () => {
    let res = await fetch(`${BASE}/api/interviews/me/questions/next`, { headers: { Cookie: cookie } });
    let body = await res.json();
    assert.equal(body.question.sequence, 1);
    assert.equal(body.progress.total, 2);

    const answer = (sequence, durationSec) =>
      fetch(`${BASE}/api/interviews/me/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ sequence, durationSec }),
      });

    assert.equal((await answer(1, 10)).status, 200);
    assert.equal((await answer(1, 25)).status, 200); // 再送は上書き
    const saved = await prisma.answer.findUnique({
      where: { interviewId_sequence: { interviewId: seed.interview.id, sequence: 1 } },
    });
    assert.equal(saved.durationSec, 25);
    assert.equal(saved.questionText, "テスト質問1"); // 出題時点のスナップショット

    res = await fetch(`${BASE}/api/interviews/me/questions/next`, { headers: { Cookie: cookie } });
    body = await res.json();
    assert.equal(body.question.sequence, 2);

    assert.equal((await answer(2, 30)).status, 200);
    res = await fetch(`${BASE}/api/interviews/me/questions/next`, { headers: { Cookie: cookie } });
    body = await res.json();
    assert.equal(body.finished, true);
  });

  await t.test("録画チャンク: 連番受理・重複冪等・欠番409・並列同seqで追記1回", async () => {
    const sendChunk = (session, seq, size) =>
      fetch(`${BASE}/api/interviews/me/recording/chunk?session=${session}&seq=${seq}`, {
        method: "POST",
        headers: { "Content-Type": "video/webm", Cookie: cookie },
        body: Buffer.alloc(size, 1),
      });

    const session = "itest-session-0001";
    assert.equal((await sendChunk(session, 1, 1000)).status, 200);
    assert.equal((await sendChunk(session, 2, 1000)).status, 200);
    assert.equal((await sendChunk(session, 2, 1000)).status, 200); // 重複は冪等
    assert.equal((await sendChunk(session, 9, 1000)).status, 409); // 欠番は拒否

    // 並列に同じ seq=3 を2本 → 追記は1回だけ
    await Promise.all([sendChunk(session, 3, 1000), sendChunk(session, 3, 1000)]);

    const segment = await prisma.recordingSegment.findUnique({
      where: { interviewId_sessionId: { interviewId: seed.interview.id, sessionId: session } },
    });
    const filePath = path.join(UPLOAD_DIR, segment.storageKey);
    createdUploadFiles.push(filePath);
    assert.equal(Number(segment.sizeBytes), 3000);
    assert.equal(fs.statSync(filePath).size, 3000);
    assert.equal(segment.lastSeq, 3);

    // 新セッションの「初回チャンク」を並列2本 → セグメント作成競合(P2002)でも500にならない
    const race = "itest-race-session1";
    const results = await Promise.all([sendChunk(race, 1, 500), sendChunk(race, 1, 500)]);
    for (const r of results) {
      assert.ok(r.status === 200, `初回並列で500が出た: ${r.status}`);
    }
    const raceSeg = await prisma.recordingSegment.findUnique({
      where: { interviewId_sessionId: { interviewId: seed.interview.id, sessionId: race } },
    });
    createdUploadFiles.push(path.join(UPLOAD_DIR, raceSeg.storageKey));
    assert.equal(Number(raceSeg.sizeBytes), 500); // 追記は1回分のみ
  });

  await t.test("終了でCOMPLETEDになり、以後の質問取得は409", async () => {
    let res = await fetch(`${BASE}/api/interviews/me/finish`, { method: "POST", headers: { Cookie: cookie } });
    assert.equal(res.status, 200);
    res = await fetch(`${BASE}/api/interviews/me/questions/next`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 409);
  });
});

// ---------- エラーハンドリング ----------

test("errorHandler: 不正JSONは400・16MB超チャンクは413（500に丸めない）", async () => {
  const badJson = await fetch(`${BASE}/api/auth/candidate/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{broken json",
  });
  assert.equal(badJson.status, 400);
  const body = await badJson.json();
  assert.ok(!/[A-Za-z]+Error|at /.test(body.error), "内部情報が漏れている");

  // 認証済みで 16MB 超のチャンク → 413（メインの面接は完了済みのため専用面接を使う）
  const loginRes = await fetch(`${BASE}/api/auth/candidate/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId: seed.errorCandidate.loginId, password: seed.errorCandidate.password }),
  });
  const cookie = getCookie(loginRes);
  const tooBig = await fetch(`${BASE}/api/interviews/me/recording/chunk?session=itest-too-big-01&seq=1`, {
    method: "POST",
    headers: { "Content-Type": "video/webm", Cookie: cookie },
    body: Buffer.alloc(17 * 1024 * 1024, 1),
  });
  assert.equal(tooBig.status, 413);
});

// ---------- 管理者認可 ----------

test("管理者: MFA未完了トークンでは管理APIに入れず、RECRUITERは他人の面接を見られない", async (t) => {
  await t.test("パスワード認証のみ（MFA待ち）では管理APIは401", async () => {
    const res = await fetch(`${BASE}/api/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: seed.owner.email, password: seed.owner.password }),
    });
    assert.equal(res.status, 200);
    const mfaCookie = getCookie(res);
    const apiRes = await fetch(`${BASE}/api/admin/interviews`, { headers: { Cookie: mfaCookie } });
    assert.equal(apiRes.status, 401);
  });

  await t.test("OWNERは全件見え、RECRUITERは他人の面接が404", async () => {
    const ownerCookie = await adminLogin(seed.owner);
    let res = await fetch(`${BASE}/api/admin/interviews/${seed.ownerOnlyInterview.id}`, { headers: { Cookie: ownerCookie } });
    assert.equal(res.status, 200);

    const recruiterCookie = await adminLogin(seed.recruiter);
    res = await fetch(`${BASE}/api/admin/interviews/${seed.ownerOnlyInterview.id}`, { headers: { Cookie: recruiterCookie } });
    assert.equal(res.status, 404); // 存在自体を漏らさない
  });
});
