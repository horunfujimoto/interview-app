/**
 * 開発用シードデータ投入スクリプト
 * 実行: cd backend && node prisma/seed.js
 * 何度実行しても重複しない（upsert）。
 * ※ ここの認証情報は開発専用。 本番では管理画面から発行すること。
 */
require("dotenv").config();
const prisma = require("../src/lib/prisma");
const { hashPassword } = require("../src/lib/password");

const QUESTIONS = [
  "あなたのこれまでのキャリアの中で、最も大きな困難は何でしたか？また、それをどのように乗り越えましたか？具体的な例を挙げて説明してください。",
  "その困難を乗り越える過程で、チームメンバーとはどのように連携しましたか？",
  "当社を志望された理由と、あなたが当社で成し遂げたいことを教えてください。",
  "ご自身の強みと弱みを教えてください。また、それぞれの具体的なエピソードを交えて説明してください。",
  "あなたはストレスを感じた時、どのように対処していますか？具体的な方法があれば教えてください。",
  "もし当社の製品やサービスについて改善点があるとしたら、どのような点を提案しますか？",
  "あなたはチームで働くことと、個人で働くことのどちらにやりがいを感じますか？理由も教えてください。",
  "10年後、あなたはどのような自分になっていたいですか？また、そのために何をしますか？",
  "これまでの経験で、最も成功したプロジェクトと失敗したプロジェクトを教えてください。そこから何を学びましたか？",
  "最後に、AI面接官に何か質問はありますか？",
];

async function main() {
  // 管理者
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: await hashPassword("Admin@12345"),
      name: "開発用管理者",
      role: "OWNER",
    },
  });

  // 質問セット（名前で検索し、なければ作成）
  let questionSet = await prisma.questionSet.findFirst({
    where: { name: "一次面接 標準質問セット" },
  });
  if (!questionSet) {
    questionSet = await prisma.questionSet.create({
      data: {
        name: "一次面接 標準質問セット",
        description: "開発用のデフォルト質問セット（10問）",
        questions: {
          create: QUESTIONS.map((text, i) => ({
            sequence: i + 1,
            text,
            timeLimitSec: 180,
          })),
        },
      },
    });
  }

  // テスト用の面接（応募者）
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7日間有効

  await prisma.interview.upsert({
    where: { loginId: "candidate-0001" },
    update: { expiresAt }, // 再実行時は期限だけ延長
    create: {
      candidateName: "テスト 太郎",
      candidateEmail: "taro.test@example.com",
      loginId: "candidate-0001",
      passwordHash: await hashPassword("P@ssword123"),
      mode: "FIXED",
      status: "SCHEDULED",
      questionSetId: questionSet.id,
      expiresAt,
      createdById: admin.id,
    },
  });

  console.log("シード完了:");
  console.log("  管理者:        admin@example.com / Admin@12345");
  console.log("  応募者(開発用): candidate-0001 / P@ssword123（7日間有効）");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
