/**
 * Seed script: テスト企業「岡山解体工業」+ サンプルデータ一式を投入
 *
 * 使い方: npx tsx prisma/seed.ts
 *
 * ログイン情報:
 *   メール: test@okayama-kaitai.jp
 *   作業員パスワード: test1234
 *   管理者PIN: 0000
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "test@okayama-kaitai.jp";

  // 既存テスト企業があれば削除（Cascade で子データも消える）
  const existing = await prisma.kaitaiCompany.findUnique({ where: { adminEmail: email } });
  if (existing) {
    await prisma.kaitaiCompany.delete({ where: { id: existing.id } });
    console.log("既存テスト企業を削除しました");
  }

  // ── 1. 企業 ──────────────────────────────────────────────
  const password1Hash = await bcrypt.hash("test1234", 10);
  const password2Hash = await bcrypt.hash("0000", 10);

  const company = await prisma.kaitaiCompany.create({
    data: {
      name: "岡山解体工業株式会社",
      address: "岡山県岡山市北区駅前町1-8-18",
      phone: "086-123-4567",
      adminName: "田中 義雄",
      adminEmail: email,
      password1Hash,
      password2Hash,
      plan: "business",
    },
  });
  console.log(`企業作成: ${company.name} (${company.id})`);

  // ── 2. 元請け ────────────────────────────────────────────
  const clients = await Promise.all([
    prisma.kaitaiClient.create({ data: {
      companyId: company.id, name: "株式会社大和建設", contactName: "前田 健二",
      phone: "086-234-5678", email: "maeda@yamato-const.jp",
      address: "岡山市北区表町1-5-1", memo: "大手ゼネコン。年間10件以上の紹介実績あり。", status: "active",
    }}),
    prisma.kaitaiClient.create({ data: {
      companyId: company.id, name: "三和不動産株式会社", contactName: "高橋 美咲",
      phone: "086-345-6789", email: "takahashi@sanwa-re.jp",
      address: "岡山市北区本町6-36", memo: "マンション解体案件多い。支払い条件：翌月末。", status: "active",
    }}),
    prisma.kaitaiClient.create({ data: {
      companyId: company.id, name: "田村工務店", contactName: "田村 浩",
      phone: "086-456-7890", address: "岡山市中区湊1-2-3", memo: "個人工務店。紹介ベース。", status: "active",
    }}),
  ]);
  console.log(`元請け ${clients.length} 社作成`);

  // ── 3. 現場 ──────────────────────────────────────────────
  const sites = await Promise.all([
    prisma.kaitaiSite.create({ data: {
      companyId: company.id, clientId: clients[0].id,
      name: "田辺邸解体工事", address: "岡山市北区鹿田町1-1-1",
      status: "施工中", startDate: "2026-03-18", endDate: "2026-04-10",
      contractAmount: 8_500_000, costAmount: 4_120_000, progressPct: 68,
      lat: 34.6617, lng: 133.9175, structureType: "木造",
      notes: "隣家との距離が狭いため養生に十分注意。搬出は北側より。",
    }}),
    prisma.kaitaiSite.create({ data: {
      companyId: company.id, clientId: clients[0].id,
      name: "旧山陽倉庫解体", address: "岡山市北区奉還町2-3-5",
      status: "施工中", startDate: "2026-03-25", endDate: "2026-04-20",
      contractAmount: 11_500_000, costAmount: 5_920_000, progressPct: 42,
      lat: 34.6572, lng: 133.9143, structureType: "鉄骨",
      notes: "重機は15t以下。敷地内転回可。アスベスト L2処理完了。",
    }}),
    prisma.kaitaiSite.create({ data: {
      companyId: company.id, clientId: clients[1].id,
      name: "森本アパート解体", address: "岡山市中区円山560",
      status: "着工前", startDate: "2026-04-15", endDate: "2026-04-30",
      contractAmount: 2_800_000, costAmount: 0, progressPct: 0,
      lat: 34.6480, lng: 133.9520, structureType: "RC",
    }}),
    prisma.kaitaiSite.create({ data: {
      companyId: company.id, clientId: clients[2].id,
      name: "旧備前工場棟解体（第1期）", address: "岡山市南区大福900",
      status: "完工", startDate: "2026-02-01", endDate: "2026-03-28",
      contractAmount: 8_400_000, costAmount: 6_100_000, progressPct: 100,
      lat: 34.6221, lng: 133.9126, structureType: "鉄骨",
    }}),
  ]);
  console.log(`現場 ${sites.length} 件作成`);

  // ── 4. メンバー ──────────────────────────────────────────
  const members = await Promise.all([
    prisma.kaitaiMember.create({ data: {
      companyId: company.id, name: "田中 義雄", kana: "タナカ ヨシオ", type: "直用",
      role: "職長", birthDate: "1975-06-12", hireDate: "2010-04-01",
      address: "岡山市北区津島福居1-3-5", emergency: "090-1111-2222（妻・田中花子）",
      licenses: ["kaitai", "sekimen", "ashiba", "taikei", "futsuu", "shikaku5"],
      preYears: 8, siteCount: 312, dayRate: 28_000, avatar: "田",
    }}),
    prisma.kaitaiMember.create({ data: {
      companyId: company.id, name: "佐藤 健太", kana: "サトウ ケンタ", type: "直用",
      role: "解体工（経験者）", birthDate: "1985-03-22", hireDate: "2015-08-01",
      address: "岡山市北区野田屋町2-8-4", emergency: "090-3333-4444（兄・佐藤誠）",
      licenses: ["kaitai", "tamakake", "futsuu", "sanpai"],
      preYears: 4, siteCount: 198, dayRate: 22_000, avatar: "佐",
    }}),
    prisma.kaitaiMember.create({ data: {
      companyId: company.id, name: "鈴木 大地", kana: "スズキ ダイチ", type: "直用",
      role: "解体工（一般）", birthDate: "1992-11-05", hireDate: "2020-04-01",
      address: "岡山市中区浜2-15-7", emergency: "080-5555-6666（母・鈴木幸子）",
      licenses: ["futsuu", "tamakake"],
      preYears: 1, siteCount: 87, dayRate: 18_000, avatar: "鈴",
    }}),
    prisma.kaitaiMember.create({ data: {
      companyId: company.id, name: "山本 拓也", kana: "ヤマモト タクヤ", type: "直用",
      role: "解体工（見習い）", birthDate: "1998-07-30", hireDate: "2023-04-01",
      address: "岡山市南区福田1-14", emergency: "080-7777-8888（父・山本浩二）",
      licenses: ["futsuu"],
      preYears: 0, siteCount: 42, dayRate: 16_000, avatar: "山",
    }}),
    prisma.kaitaiMember.create({ data: {
      companyId: company.id, name: "伊藤 組", kana: "イトウグミ", type: "外注", company2: "有限会社 伊藤組",
      role: "外注（解体専門）", birthDate: "1970-01-15", hireDate: "2018-06-01",
      address: "倉敷市阿知1-3-2", emergency: "086-444-5555（代表直通）",
      licenses: ["kaitai", "crane", "tamakake", "sekimen", "taikei", "futsuu"],
      preYears: 20, siteCount: 156, dayRate: 25_000, avatar: "伊",
    }}),
    prisma.kaitaiMember.create({ data: {
      companyId: company.id, name: "高橋 真一", kana: "タカハシ シンイチ", type: "直用",
      role: "解体工（経験者）", birthDate: "1988-09-18", hireDate: "2012-07-15",
      address: "岡山市東区西大寺5-22-1", emergency: "090-9999-0000（妻・高橋久美子）",
      licenses: ["kaitai", "ashiba", "tamakake", "taikei", "futsuu", "sanpai"],
      preYears: 5, siteCount: 267, dayRate: 24_000, avatar: "高",
    }}),
  ]);
  console.log(`メンバー ${members.length} 名作成`);

  // ── 5. 機材 ──────────────────────────────────────────────
  const equipment = await Promise.all([
    prisma.kaitaiEquipment.create({ data: {
      companyId: company.id, name: "0.7バックホー", category: "自社保有", type: "重機",
      supplier: "自社（本社倉庫）", unitPrice: 25_000, status: "稼働中",
      notes: "コマツ PC78US-10",
    }}),
    prisma.kaitaiEquipment.create({ data: {
      companyId: company.id, name: "解体用アタッチメント", category: "自社保有", type: "アタッチメント",
      supplier: "自社（本社倉庫）", unitPrice: 8_000, status: "稼働中",
      notes: "クラッシャー・ブレーカー兼用",
    }}),
    prisma.kaitaiEquipment.create({ data: {
      companyId: company.id, name: "2tダンプ", category: "自社保有", type: "車両",
      supplier: "自社（本社倉庫）", unitPrice: 12_000, status: "稼働中",
      notes: "日野 デュトロ",
    }}),
    prisma.kaitaiEquipment.create({ data: {
      companyId: company.id, name: "10tダンプ", category: "リース", type: "車両",
      supplier: "東洋リース株式会社", unitPrice: 30_000, status: "稼働中",
      returnDeadline: "2026-04-30", notes: "いすゞ ギガ。月額リース契約。",
    }}),
    prisma.kaitaiEquipment.create({ data: {
      companyId: company.id, name: "散水車", category: "レンタル", type: "車両",
      supplier: "レントオール岡山", unitPrice: 18_000, status: "待機中",
      returnDeadline: "2026-04-10", notes: "防塵用。粉塵が多い現場で使用。",
    }}),
    prisma.kaitaiEquipment.create({ data: {
      companyId: company.id, name: "1.4バックホー", category: "リース", type: "重機",
      supplier: "カナモト", unitPrice: 35_000, status: "修理中",
      returnDeadline: "2026-05-15", notes: "コマツ PC128US。油圧シリンダー修理中。",
    }}),
  ]);
  console.log(`機材 ${equipment.length} 台作成`);

  // ── 6. 経費ログ ──────────────────────────────────────────
  const expenses = await Promise.all([
    prisma.kaitaiExpenseLog.create({ data: {
      companyId: company.id, siteId: sites[0].id, siteName: "田辺邸解体工事",
      category: "燃料費", amount: 6_975, description: "0.7バックホー 軽油",
      reporter: "田中", date: "2026-03-20", equipmentName: "0.7バックホー",
      liters: 45, pricePerLiter: 155,
    }}),
    prisma.kaitaiExpenseLog.create({ data: {
      companyId: company.id, siteId: sites[0].id, siteName: "田辺邸解体工事",
      category: "燃料費", amount: 4_350, description: "2tダンプ 軽油",
      reporter: "鈴木", date: "2026-03-22", equipmentName: "2tダンプ",
      liters: 30, pricePerLiter: 145,
    }}),
    prisma.kaitaiExpenseLog.create({ data: {
      companyId: company.id, siteId: sites[1].id, siteName: "旧山陽倉庫解体",
      category: "資材購入", amount: 35_000, description: "養生シート追加購入",
      reporter: "佐藤", date: "2026-03-28",
    }}),
    prisma.kaitaiExpenseLog.create({ data: {
      companyId: company.id, siteId: sites[0].id, siteName: "田辺邸解体工事",
      category: "工具・消耗品", amount: 12_800, description: "ブレーカーチゼル交換",
      reporter: "田中", date: "2026-04-01",
    }}),
  ]);
  console.log(`経費ログ ${expenses.length} 件作成`);

  console.log("\n✅ テストデータ投入完了!");
  console.log("─────────────────────────────────");
  console.log(`メール:     test@okayama-kaitai.jp`);
  console.log(`パスワード: test1234`);
  console.log(`管理者PIN:  0000`);
  console.log("─────────────────────────────────");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
