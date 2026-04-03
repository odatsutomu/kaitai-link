import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/kaitai/seed-skills
 * Admin-only: seeds comprehensive test data for skill matrix and scoring demos.
 * - 4 skill categories with 3-5 skills each
 * - 20+ teaching records across members
 * - Monthly evaluations for 3 months creating mixed high/low scores
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const companyId = session.companyId;

  // ── 1. Ensure we have enough members (create if < 6) ──
  const existingMembers = await prisma.kaitaiMember.findMany({
    where: { companyId },
    select: { id: true, name: true },
  });

  const DEMO_MEMBERS = [
    { name: "田中 太郎", kana: "タナカ タロウ", role: "職長", licenses: ["解体施工技士", "玉掛け", "足場組立", "車両系建設機械"], avatar: "🧑‍🔧", hireDate: "2018-04-01", type: "正社員", dayRate: 18000 },
    { name: "佐藤 健一", kana: "サトウ ケンイチ", role: "作業員", licenses: ["玉掛け", "足場組立"], avatar: "👷", hireDate: "2020-06-15", type: "正社員", dayRate: 15000 },
    { name: "鈴木 洋平", kana: "スズキ ヨウヘイ", role: "職長", licenses: ["解体施工技士", "玉掛け", "車両系建設機械"], avatar: "🏗️", hireDate: "2019-01-10", type: "正社員", dayRate: 17000 },
    { name: "高橋 真一", kana: "タカハシ シンイチ", role: "作業員", licenses: ["玉掛け"], avatar: "🔨", hireDate: "2022-03-01", type: "正社員", dayRate: 13000 },
    { name: "山田 浩二", kana: "ヤマダ コウジ", role: "作業員", licenses: [], avatar: "🦺", hireDate: "2024-01-15", type: "正社員", dayRate: 12000 },
    { name: "中村 大輔", kana: "ナカムラ ダイスケ", role: "作業員", licenses: ["足場組立", "車両系建設機械"], avatar: "⛑️", hireDate: "2021-08-01", type: "外注", dayRate: 14000 },
  ];

  // Create missing members
  for (const dm of DEMO_MEMBERS) {
    const exists = existingMembers.find(m => m.name === dm.name);
    if (!exists) {
      const created = await prisma.kaitaiMember.create({
        data: { companyId, ...dm },
      });
      existingMembers.push({ id: created.id, name: created.name });
    }
  }

  const members = existingMembers;
  const memberMap = new Map(members.map(m => [m.name, m.id]));

  // ── 2. Create 4 skill categories with skills ──
  const CATEGORIES = [
    { name: "安全管理", skills: ["KY活動実施", "安全帯使用", "火気管理", "危険箇所標示", "緊急時対応"] },
    { name: "重機操作", skills: ["バックホウ操作", "ブレーカー操作", "クレーン操作", "ダンプ運転"] },
    { name: "解体技術", skills: ["木造解体", "RC解体", "鉄骨解体", "内装解体", "基礎解体"] },
    { name: "環境・法令", skills: ["アスベスト対応", "産廃分別", "騒音振動対策"] },
  ];

  // Clear existing categories for this company
  await prisma.kaitaiUserSkill.deleteMany({ where: { companyId } });
  await prisma.kaitaiSkill.deleteMany({ where: { companyId } });
  await prisma.kaitaiSkillCategory.deleteMany({ where: { companyId } });

  const skillIdMap = new Map<string, string>(); // skillName → id

  for (let ci = 0; ci < CATEGORIES.length; ci++) {
    const cat = CATEGORIES[ci];
    const category = await prisma.kaitaiSkillCategory.create({
      data: { companyId, name: cat.name, sortOrder: ci },
    });
    for (let si = 0; si < cat.skills.length; si++) {
      const skill = await prisma.kaitaiSkill.create({
        data: { companyId, categoryId: category.id, name: cat.skills[si], sortOrder: si },
      });
      skillIdMap.set(cat.skills[si], skill.id);
    }
  }

  // ── 3. Create 20+ teaching/learning records ──
  // Define who has which skills and who taught them
  const SKILL_RECORDS: { member: string; skill: string; taughtBy?: string; daysAgo: number }[] = [
    // 田中（ベテラン職長）- 多くのスキルを保有、教える側
    { member: "田中 太郎", skill: "KY活動実施", daysAgo: 60 },
    { member: "田中 太郎", skill: "安全帯使用", daysAgo: 55 },
    { member: "田中 太郎", skill: "火気管理", daysAgo: 50 },
    { member: "田中 太郎", skill: "バックホウ操作", daysAgo: 45 },
    { member: "田中 太郎", skill: "ブレーカー操作", daysAgo: 40 },
    { member: "田中 太郎", skill: "木造解体", daysAgo: 35 },
    { member: "田中 太郎", skill: "RC解体", daysAgo: 30 },
    { member: "田中 太郎", skill: "アスベスト対応", daysAgo: 25 },
    { member: "田中 太郎", skill: "産廃分別", daysAgo: 20 },

    // 鈴木（職長）- 田中から教わった + 独自スキル
    { member: "鈴木 洋平", skill: "KY活動実施", taughtBy: "田中 太郎", daysAgo: 50 },
    { member: "鈴木 洋平", skill: "安全帯使用", taughtBy: "田中 太郎", daysAgo: 48 },
    { member: "鈴木 洋平", skill: "バックホウ操作", daysAgo: 40 },
    { member: "鈴木 洋平", skill: "クレーン操作", daysAgo: 35 },
    { member: "鈴木 洋平", skill: "鉄骨解体", daysAgo: 30 },
    { member: "鈴木 洋平", skill: "木造解体", taughtBy: "田中 太郎", daysAgo: 25 },
    { member: "鈴木 洋平", skill: "産廃分別", taughtBy: "田中 太郎", daysAgo: 15 },

    // 佐藤 - 中堅、田中・鈴木から教わる
    { member: "佐藤 健一", skill: "KY活動実施", taughtBy: "鈴木 洋平", daysAgo: 30 },
    { member: "佐藤 健一", skill: "安全帯使用", taughtBy: "田中 太郎", daysAgo: 28 },
    { member: "佐藤 健一", skill: "バックホウ操作", taughtBy: "鈴木 洋平", daysAgo: 20 },
    { member: "佐藤 健一", skill: "内装解体", daysAgo: 15 },
    { member: "佐藤 健一", skill: "産廃分別", taughtBy: "田中 太郎", daysAgo: 10 },

    // 高橋 - 新人寄り、少なめ
    { member: "高橋 真一", skill: "KY活動実施", taughtBy: "鈴木 洋平", daysAgo: 15 },
    { member: "高橋 真一", skill: "安全帯使用", taughtBy: "佐藤 健一", daysAgo: 12 },
    { member: "高橋 真一", skill: "内装解体", taughtBy: "佐藤 健一", daysAgo: 8 },

    // 中村（外注）- そこそこ
    { member: "中村 大輔", skill: "KY活動実施", daysAgo: 40 },
    { member: "中村 大輔", skill: "安全帯使用", daysAgo: 38 },
    { member: "中村 大輔", skill: "ダンプ運転", daysAgo: 30 },
    { member: "中村 大輔", skill: "基礎解体", daysAgo: 20 },

    // 山田 - 最新人、ほぼ未習得
    { member: "山田 浩二", skill: "KY活動実施", taughtBy: "田中 太郎", daysAgo: 5 },
    { member: "山田 浩二", skill: "安全帯使用", taughtBy: "田中 太郎", daysAgo: 3 },
  ];

  for (const rec of SKILL_RECORDS) {
    const memberId = memberMap.get(rec.member);
    const skillId = skillIdMap.get(rec.skill);
    if (!memberId || !skillId) continue;

    const achievedAt = new Date();
    achievedAt.setDate(achievedAt.getDate() - rec.daysAgo);

    const taughtById = rec.taughtBy ? memberMap.get(rec.taughtBy) ?? null : null;

    await prisma.kaitaiUserSkill.upsert({
      where: { companyId_memberId_skillId: { companyId, memberId, skillId } },
      create: { companyId, memberId, skillId, taughtBy: taughtById, achievedAt },
      update: { taughtBy: taughtById, achievedAt },
    });
  }

  // ── 4. Create monthly evaluations for 3 months ──
  // Mixed scores: 田中/鈴木 high, 高橋/山田 low
  const EVAL_DATA: { member: string; month: string; scores: [number, number, number, number, number] }[] = [
    // 2026-04 (current)
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

  // Clear existing evaluations for these months
  await prisma.kaitaiMonthlyEval.deleteMany({
    where: { companyId, month: { in: ["2026-02", "2026-03", "2026-04"] } },
  });

  for (const ev of EVAL_DATA) {
    const memberId = memberMap.get(ev.member);
    if (!memberId) continue;

    await prisma.kaitaiMonthlyEval.create({
      data: {
        companyId,
        memberId,
        month: ev.month,
        score1: ev.scores[0],
        score2: ev.scores[1],
        score3: ev.scores[2],
        score4: ev.scores[3],
        score5: ev.scores[4],
        confirmed: true,
      },
    });
  }

  // ── 5. Create operation logs for skill achievements ──
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
  }

  return NextResponse.json({
    ok: true,
    seeded: {
      members: members.length,
      categories: CATEGORIES.length,
      skills: Array.from(skillIdMap.keys()).length,
      userSkills: SKILL_RECORDS.length,
      evaluations: EVAL_DATA.length,
    },
  });
}
