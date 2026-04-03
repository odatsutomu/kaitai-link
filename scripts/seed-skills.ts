import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find company by name or use first
  const targetName = process.argv[2];
  const company = targetName
    ? await prisma.kaitaiCompany.findFirst({ where: { name: { contains: targetName } } })
    : await prisma.kaitaiCompany.findFirst();
  if (!company) {
    console.error("No company found. Please create a company first.");
    process.exit(1);
  }
  const companyId = company.id;
  console.log(`Using company: ${company.name} (${companyId})`);

  // ── 1. Ensure we have enough members ──
  const existingMembers = await prisma.kaitaiMember.findMany({
    where: { companyId },
    select: { id: true, name: true },
  });
  console.log(`Existing members: ${existingMembers.length}`);

  const DEMO_MEMBERS = [
    { name: "田中 太郎", kana: "タナカ タロウ", role: "職長", licenses: ["解体施工技士", "玉掛け", "足場組立", "車両系建設機械"], avatar: "🧑‍🔧", hireDate: "2018-04-01", type: "正社員", dayRate: 18000 },
    { name: "佐藤 健一", kana: "サトウ ケンイチ", role: "作業員", licenses: ["玉掛け", "足場組立"], avatar: "👷", hireDate: "2020-06-15", type: "正社員", dayRate: 15000 },
    { name: "鈴木 洋平", kana: "スズキ ヨウヘイ", role: "職長", licenses: ["解体施工技士", "玉掛け", "車両系建設機械"], avatar: "🏗️", hireDate: "2019-01-10", type: "正社員", dayRate: 17000 },
    { name: "高橋 真一", kana: "タカハシ シンイチ", role: "作業員", licenses: ["玉掛け"], avatar: "🔨", hireDate: "2022-03-01", type: "正社員", dayRate: 13000 },
    { name: "山田 浩二", kana: "ヤマダ コウジ", role: "作業員", licenses: [], avatar: "🦺", hireDate: "2024-01-15", type: "正社員", dayRate: 12000 },
    { name: "中村 大輔", kana: "ナカムラ ダイスケ", role: "作業員", licenses: ["足場組立", "車両系建設機械"], avatar: "⛑️", hireDate: "2021-08-01", type: "外注", dayRate: 14000 },
  ];

  for (const dm of DEMO_MEMBERS) {
    const exists = existingMembers.find(m => m.name === dm.name);
    if (!exists) {
      const created = await prisma.kaitaiMember.create({
        data: { companyId, ...dm },
      });
      existingMembers.push({ id: created.id, name: created.name });
      console.log(`  Created member: ${dm.name}`);
    }
  }

  const memberMap = new Map(existingMembers.map(m => [m.name, m.id]));

  // ── 2. Create 4 skill categories with skills ──
  console.log("\nClearing existing skill data...");
  await prisma.kaitaiUserSkill.deleteMany({ where: { companyId } });
  await prisma.kaitaiSkill.deleteMany({ where: { companyId } });
  await prisma.kaitaiSkillCategory.deleteMany({ where: { companyId } });

  const CATEGORIES = [
    { name: "安全管理", skills: ["KY活動実施", "安全帯使用", "火気管理", "危険箇所標示", "緊急時対応"] },
    { name: "重機操作", skills: ["バックホウ操作", "ブレーカー操作", "クレーン操作", "ダンプ運転"] },
    { name: "解体技術", skills: ["木造解体", "RC解体", "鉄骨解体", "内装解体", "基礎解体"] },
    { name: "環境・法令", skills: ["アスベスト対応", "産廃分別", "騒音振動対策"] },
  ];

  const skillIdMap = new Map<string, string>();

  for (let ci = 0; ci < CATEGORIES.length; ci++) {
    const cat = CATEGORIES[ci];
    const category = await prisma.kaitaiSkillCategory.create({
      data: { companyId, name: cat.name, sortOrder: ci },
    });
    console.log(`  Category: ${cat.name} (${cat.skills.length} skills)`);
    for (let si = 0; si < cat.skills.length; si++) {
      const skill = await prisma.kaitaiSkill.create({
        data: { companyId, categoryId: category.id, name: cat.skills[si], sortOrder: si },
      });
      skillIdMap.set(cat.skills[si], skill.id);
    }
  }

  // ── 3. Create teaching/learning records ──
  console.log("\nCreating skill achievement records...");
  const SKILL_RECORDS: { member: string; skill: string; taughtBy?: string; daysAgo: number }[] = [
    // 田中（ベテラン職長）- 多数のスキル保有、指導者
    { member: "田中 太郎", skill: "KY活動実施", daysAgo: 60 },
    { member: "田中 太郎", skill: "安全帯使用", daysAgo: 55 },
    { member: "田中 太郎", skill: "火気管理", daysAgo: 50 },
    { member: "田中 太郎", skill: "危険箇所標示", daysAgo: 48 },
    { member: "田中 太郎", skill: "緊急時対応", daysAgo: 46 },
    { member: "田中 太郎", skill: "バックホウ操作", daysAgo: 45 },
    { member: "田中 太郎", skill: "ブレーカー操作", daysAgo: 40 },
    { member: "田中 太郎", skill: "木造解体", daysAgo: 35 },
    { member: "田中 太郎", skill: "RC解体", daysAgo: 30 },
    { member: "田中 太郎", skill: "鉄骨解体", daysAgo: 28 },
    { member: "田中 太郎", skill: "アスベスト対応", daysAgo: 25 },
    { member: "田中 太郎", skill: "産廃分別", daysAgo: 20 },
    { member: "田中 太郎", skill: "騒音振動対策", daysAgo: 18 },

    // 鈴木（職長）- 田中に教わりつつ独自スキルも
    { member: "鈴木 洋平", skill: "KY活動実施", taughtBy: "田中 太郎", daysAgo: 50 },
    { member: "鈴木 洋平", skill: "安全帯使用", taughtBy: "田中 太郎", daysAgo: 48 },
    { member: "鈴木 洋平", skill: "火気管理", taughtBy: "田中 太郎", daysAgo: 45 },
    { member: "鈴木 洋平", skill: "バックホウ操作", daysAgo: 40 },
    { member: "鈴木 洋平", skill: "クレーン操作", daysAgo: 35 },
    { member: "鈴木 洋平", skill: "鉄骨解体", daysAgo: 30 },
    { member: "鈴木 洋平", skill: "木造解体", taughtBy: "田中 太郎", daysAgo: 25 },
    { member: "鈴木 洋平", skill: "産廃分別", taughtBy: "田中 太郎", daysAgo: 15 },
    { member: "鈴木 洋平", skill: "騒音振動対策", taughtBy: "田中 太郎", daysAgo: 12 },

    // 佐藤 - 中堅、田中・鈴木から教わる
    { member: "佐藤 健一", skill: "KY活動実施", taughtBy: "鈴木 洋平", daysAgo: 30 },
    { member: "佐藤 健一", skill: "安全帯使用", taughtBy: "田中 太郎", daysAgo: 28 },
    { member: "佐藤 健一", skill: "バックホウ操作", taughtBy: "鈴木 洋平", daysAgo: 20 },
    { member: "佐藤 健一", skill: "内装解体", daysAgo: 15 },
    { member: "佐藤 健一", skill: "木造解体", taughtBy: "田中 太郎", daysAgo: 12 },
    { member: "佐藤 健一", skill: "産廃分別", taughtBy: "田中 太郎", daysAgo: 10 },

    // 高橋 - 新人寄り
    { member: "高橋 真一", skill: "KY活動実施", taughtBy: "鈴木 洋平", daysAgo: 15 },
    { member: "高橋 真一", skill: "安全帯使用", taughtBy: "佐藤 健一", daysAgo: 12 },
    { member: "高橋 真一", skill: "内装解体", taughtBy: "佐藤 健一", daysAgo: 8 },

    // 中村（外注）- そこそこ
    { member: "中村 大輔", skill: "KY活動実施", daysAgo: 40 },
    { member: "中村 大輔", skill: "安全帯使用", daysAgo: 38 },
    { member: "中村 大輔", skill: "ダンプ運転", daysAgo: 30 },
    { member: "中村 大輔", skill: "基礎解体", daysAgo: 20 },
    { member: "中村 大輔", skill: "木造解体", taughtBy: "鈴木 洋平", daysAgo: 15 },

    // 山田 - 最新人
    { member: "山田 浩二", skill: "KY活動実施", taughtBy: "田中 太郎", daysAgo: 5 },
    { member: "山田 浩二", skill: "安全帯使用", taughtBy: "田中 太郎", daysAgo: 3 },
  ];

  let created = 0;
  for (const rec of SKILL_RECORDS) {
    const memberId = memberMap.get(rec.member);
    const skillId = skillIdMap.get(rec.skill);
    if (!memberId || !skillId) {
      console.warn(`  Skipped: ${rec.member} / ${rec.skill} (not found)`);
      continue;
    }

    const achievedAt = new Date();
    achievedAt.setDate(achievedAt.getDate() - rec.daysAgo);
    const taughtById = rec.taughtBy ? memberMap.get(rec.taughtBy) ?? null : null;

    await prisma.kaitaiUserSkill.upsert({
      where: { companyId_memberId_skillId: { companyId, memberId, skillId } },
      create: { companyId, memberId, skillId, taughtBy: taughtById, achievedAt },
      update: { taughtBy: taughtById, achievedAt },
    });
    created++;
  }
  console.log(`  Created ${created} skill records`);

  // ── 4. Monthly evaluations for 3 months ──
  console.log("\nCreating monthly evaluations...");
  const EVAL_DATA: { member: string; month: string; scores: [number, number, number, number, number] }[] = [
    // 2026-04
    { member: "田中 太郎", month: "2026-04", scores: [5, 5, 4, 5, 4] },
    { member: "鈴木 洋平", month: "2026-04", scores: [5, 4, 5, 4, 4] },
    { member: "佐藤 健一", month: "2026-04", scores: [4, 3, 4, 3, 4] },
    { member: "高橋 真一", month: "2026-04", scores: [3, 2, 3, 2, 3] },
    { member: "山田 浩二", month: "2026-04", scores: [2, 2, 2, 1, 2] },
    { member: "中村 大輔", month: "2026-04", scores: [4, 3, 3, 4, 3] },
    // 2026-03
    { member: "田中 太郎", month: "2026-03", scores: [5, 4, 5, 4, 5] },
    { member: "鈴木 洋平", month: "2026-03", scores: [4, 4, 4, 4, 5] },
    { member: "佐藤 健一", month: "2026-03", scores: [3, 3, 4, 3, 3] },
    { member: "高橋 真一", month: "2026-03", scores: [2, 2, 3, 2, 2] },
    { member: "山田 浩二", month: "2026-03", scores: [2, 1, 2, 1, 1] },
    { member: "中村 大輔", month: "2026-03", scores: [3, 3, 3, 3, 3] },
    // 2026-02
    { member: "田中 太郎", month: "2026-02", scores: [5, 5, 5, 5, 4] },
    { member: "鈴木 洋平", month: "2026-02", scores: [4, 5, 4, 4, 4] },
    { member: "佐藤 健一", month: "2026-02", scores: [3, 3, 3, 3, 4] },
    { member: "高橋 真一", month: "2026-02", scores: [2, 2, 2, 2, 2] },
    { member: "山田 浩二", month: "2026-02", scores: [1, 1, 2, 1, 1] },
    { member: "中村 大輔", month: "2026-02", scores: [4, 3, 3, 3, 3] },
  ];

  await prisma.kaitaiMonthlyEval.deleteMany({
    where: { companyId, month: { in: ["2026-02", "2026-03", "2026-04"] } },
  });

  let evalCount = 0;
  for (const ev of EVAL_DATA) {
    const memberId = memberMap.get(ev.member);
    if (!memberId) continue;

    await prisma.kaitaiMonthlyEval.create({
      data: {
        companyId, memberId, month: ev.month,
        score1: ev.scores[0], score2: ev.scores[1], score3: ev.scores[2],
        score4: ev.scores[3], score5: ev.scores[4],
        confirmed: true,
      },
    });
    evalCount++;
  }
  console.log(`  Created ${evalCount} evaluations`);

  // ── 5. Operation logs for skill achievements ──
  console.log("\nCreating operation logs...");
  let logCount = 0;
  for (const rec of SKILL_RECORDS) {
    const memberId = memberMap.get(rec.member);
    if (!memberId) continue;

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - rec.daysAgo);
    const teacherName = rec.taughtBy ?? "自主";

    await prisma.kaitaiOperationLog.create({
      data: {
        companyId,
        action: `skill_achieve:${teacherName}→${rec.member}:${rec.skill}`,
        user: teacherName === "自主" ? rec.member : teacherName,
        createdAt,
      },
    });
    logCount++;
  }
  console.log(`  Created ${logCount} operation logs`);

  console.log("\n✅ Seed complete!");
  console.log(`  Members: ${existingMembers.length}`);
  console.log(`  Categories: ${CATEGORIES.length}`);
  console.log(`  Skills: ${skillIdMap.size}`);
  console.log(`  User skills: ${created}`);
  console.log(`  Evaluations: ${evalCount}`);
  console.log(`  Operation logs: ${logCount}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
