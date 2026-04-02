// ─── 資格タグ定義 ──────────────────────────────────────────────────────────────

export const LICENSE_LABELS: Record<string, string> = {
  kaitai:   "車両系(解体)",
  crane:    "小型クレーン",
  tamakake: "玉掛け",
  ashiba:   "足場作業主任",
  sekimen:  "石綿作業主任",
  taikei:   "大型免許",
  futsuu:   "普通免許",
  sanpai:   "産廃収集運搬",
  shikaku5: "解体工事施工技士",
};

export type License = keyof typeof LICENSE_LABELS;

// ─── メンバー型 ────────────────────────────────────────────────────────────────

export type Member = {
  id: string;
  name: string;
  kana: string;
  type: "直用" | "外注";
  company?: string;
  birthDate: string;
  hireDate: string;
  address: string;
  emergency: string;
  licenses: License[];
  preYears: number;
  siteCount: number;
  dayRate: number;
  role: string;
  avatar: string;
};

// ─── 経験レベル計算 ────────────────────────────────────────────────────────────

export function experienceYears(m: Member): number {
  const hired = new Date(m.hireDate);
  const now   = new Date("2026-04-02");
  const inHouseYears = (now.getTime() - hired.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.round((m.preYears + inHouseYears) * 10) / 10;
}

export function experienceLevel(totalYears: number): {
  label: string; stars: number; color: string; bg: string;
} {
  if (totalYears >= 15) return { label: "職長",  stars: 5, color: "#FBBF24", bg: "rgba(251,191,36,0.12)" };
  if (totalYears >= 10) return { label: "熟練",  stars: 4, color: "#F97316", bg: "rgba(249,115,22,0.12)" };
  if (totalYears >=  5) return { label: "中堅",  stars: 3, color: "#4ADE80", bg: "rgba(74,222,128,0.12)" };
  if (totalYears >=  2) return { label: "一般",  stars: 2, color: "#60A5FA", bg: "rgba(96,165,250,0.12)" };
  return                       { label: "見習い", stars: 1, color: "#94A3B8", bg: "rgba(148,163,184,0.12)" };
}

// ─── モックデータ ──────────────────────────────────────────────────────────────

export const MEMBERS: Member[] = [
  {
    id: "m1",
    name: "田中 義雄", kana: "タナカ ヨシオ", type: "直用",
    birthDate: "1975-06-12", hireDate: "2010-04-01",
    address: "東京都葛飾区亀有3-2-1", emergency: "090-1111-2222（妻・田中花子）",
    licenses: ["kaitai", "sekimen", "ashiba", "taikei", "futsuu", "shikaku5"],
    preYears: 8, siteCount: 312, dayRate: 28_000, role: "職長", avatar: "田",
  },
  {
    id: "m2",
    name: "佐藤 健太", kana: "サトウ ケンタ", type: "直用",
    birthDate: "1985-03-22", hireDate: "2015-08-01",
    address: "埼玉県川口市並木2-8-4", emergency: "090-3333-4444（兄・佐藤誠）",
    licenses: ["kaitai", "tamakake", "futsuu", "sanpai"],
    preYears: 4, siteCount: 198, dayRate: 22_000, role: "解体工（経験者）", avatar: "佐",
  },
  {
    id: "m3",
    name: "鈴木 大地", kana: "スズキ ダイチ", type: "直用",
    birthDate: "1992-11-05", hireDate: "2020-04-01",
    address: "千葉県市川市行徳駅前2-15-7", emergency: "080-5555-6666（母・鈴木幸子）",
    licenses: ["futsuu", "tamakake"],
    preYears: 1, siteCount: 87, dayRate: 18_000, role: "解体工（一般）", avatar: "鈴",
  },
  {
    id: "m4",
    name: "山本 拓也", kana: "ヤマモト タクヤ", type: "直用",
    birthDate: "1998-07-30", hireDate: "2023-04-01",
    address: "神奈川県横浜市鶴見区末広町1-14", emergency: "080-7777-8888（父・山本浩二）",
    licenses: ["futsuu"],
    preYears: 0, siteCount: 42, dayRate: 16_000, role: "解体工（見習い）", avatar: "山",
  },
  {
    id: "m5",
    name: "伊藤 組", kana: "イトウグミ", type: "外注", company: "有限会社 伊藤組",
    birthDate: "1970-01-15", hireDate: "2018-06-01",
    address: "東京都足立区西新井栄町1-3-2", emergency: "03-4444-5555（代表直通）",
    licenses: ["kaitai", "crane", "tamakake", "sekimen", "taikei", "futsuu"],
    preYears: 20, siteCount: 156, dayRate: 25_000, role: "外注（解体専門）", avatar: "伊",
  },
  {
    id: "m6",
    name: "高橋 真一", kana: "タカハシ シンイチ", type: "直用",
    birthDate: "1988-09-18", hireDate: "2012-07-15",
    address: "東京都江戸川区平井5-22-1", emergency: "090-9999-0000（妻・高橋久美子）",
    licenses: ["kaitai", "ashiba", "tamakake", "taikei", "futsuu", "sanpai"],
    preYears: 5, siteCount: 267, dayRate: 24_000, role: "解体工（経験者）", avatar: "高",
  },
];

// ─── パフォーマンス型 ──────────────────────────────────────────────────────────

export type DayStatus = "出勤" | "遅刻" | "欠勤" | "休日" | "未来";

export type TroubleRecord = {
  id: string;
  date: string;
  site: string;
  type: "近隣クレーム" | "埋設物" | "事故" | "機材故障" | "ルール違反" | "その他";
  detail: string;
  adminScore: 1 | 2 | 3 | null; // 1=要改善 2=普通 3=適切
  adminMemo?: string;
};

export type SiteEval = {
  date: string;
  site: string;
  role: "責任者" | "作業員";
  tags: string[];
  memo?: string;
};

export type MemberStats = {
  memberId: string;
  workDays: number;
  lateDays: number;
  absentDays: number;
  totalHours: number;
  avgOvertime: number;
  attendancePct: number;
  /** 30 items = April 1–30 */
  calendar: DayStatus[];
  radar: {
    attendance: number;    // 勤怠率
    safety: number;        // 安全性
    skill: number;         // 技術力
    communication: number; // コミュニケーション
    efficiency: number;    // 効率
  };
  efficiencyDelta: number; // % vs standard (+= faster)
  ruleViolations: number;
  positiveFeedback: string[];
  troubles: TroubleRecord[];
  siteEvals: SiteEval[];
};

// April 2026: day 1 = Wednesday (index 0)
// Sat indices (0-based): 3,10,17,24  |  Sun indices: 4,11,18,25
const APR_WEEKENDS = new Set([3, 4, 10, 11, 17, 18, 24, 25]);

/** Build a 30-element DayStatus array for April 2026.
 *  Days 21–30 are always "未来".
 *  overrides: 0-based index → status */
function mkCal(overrides: Record<number, DayStatus>): DayStatus[] {
  return Array.from({ length: 30 }, (_, i) => {
    if (i >= 20) return "未来";
    if (APR_WEEKENDS.has(i)) return "休日";
    return overrides[i] ?? "出勤";
  });
}

export const MEMBER_STATS: MemberStats[] = [
  // ── m1 田中 義雄 ──────────────────────────────────────────
  {
    memberId: "m1",
    workDays: 14, lateDays: 0, absentDays: 0,
    totalHours: 119, avgOvertime: 0.5, attendancePct: 100,
    calendar: mkCal({}),
    radar: { attendance: 100, safety: 98, skill: 96, communication: 92, efficiency: 88 },
    efficiencyDelta: +8,
    ruleViolations: 0,
    positiveFeedback: [
      "石綿撤去作業の段取りが丁寧で後輩への指導も自発的",
      "近隣への挨拶・騒音配慮が徹底されており高評価",
    ],
    troubles: [],
    siteEvals: [
      { date: "4月10日", site: "旧田中倉庫解体", role: "責任者", tags: ["#リーダーシップ", "#効率的"], memo: "全体マネジメントが安定。若手への技術共有も積極的だった" },
      { date: "3月28日", site: "川口市渡辺邸", role: "責任者", tags: ["#安全模範", "#効率的"], memo: "" },
    ],
  },

  // ── m2 佐藤 健太 ──────────────────────────────────────────
  {
    memberId: "m2",
    workDays: 13, lateDays: 1, absentDays: 1,
    totalHours: 108, avgOvertime: 1.2, attendancePct: 93,
    calendar: mkCal({ 2: "遅刻", 9: "欠勤" }),
    radar: { attendance: 88, safety: 80, skill: 78, communication: 74, efficiency: 85 },
    efficiencyDelta: +3,
    ruleViolations: 1,
    positiveFeedback: ["作業スピードが安定しており廃棄分別が正確"],
    troubles: [
      {
        id: "t1", date: "4月8日", site: "山田邸解体工事",
        type: "近隣クレーム",
        detail: "粉塵飛散により隣家から苦情。対応は迅速だったが事前養生の範囲が不十分だった。",
        adminScore: 2, adminMemo: "次回は養生範囲を広げるよう指示済み",
      },
    ],
    siteEvals: [
      { date: "4月8日", site: "山田邸解体工事", role: "作業員", tags: ["#要注意", "#粉塵管理"], memo: "養生不足による近隣苦情あり。指導済み" },
      { date: "3月20日", site: "川口市渡辺邸", role: "作業員", tags: ["#効率的"], memo: "" },
    ],
  },

  // ── m3 鈴木 大地 ──────────────────────────────────────────
  {
    memberId: "m3",
    workDays: 12, lateDays: 2, absentDays: 0,
    totalHours: 96, avgOvertime: 0.8, attendancePct: 86,
    calendar: mkCal({ 1: "遅刻", 13: "遅刻" }),
    radar: { attendance: 86, safety: 80, skill: 60, communication: 72, efficiency: 92 },
    efficiencyDelta: +15,
    ruleViolations: 0,
    positiveFeedback: ["作業スピードが急成長中。直近2現場で予定より早く完了"],
    troubles: [],
    siteEvals: [
      { date: "4月10日", site: "さいたま市木造解体", role: "作業員", tags: ["#効率的", "#成長中"], memo: "今月2現場で作業時間が標準比マイナス15%" },
    ],
  },

  // ── m4 山本 拓也 ──────────────────────────────────────────
  {
    memberId: "m4",
    workDays: 10, lateDays: 3, absentDays: 2,
    totalHours: 80, avgOvertime: 0.2, attendancePct: 71,
    calendar: mkCal({ 1: "遅刻", 6: "欠勤", 8: "遅刻", 12: "欠勤", 14: "遅刻" }),
    radar: { attendance: 71, safety: 65, skill: 42, communication: 65, efficiency: 58 },
    efficiencyDelta: -10,
    ruleViolations: 2,
    positiveFeedback: [],
    troubles: [
      {
        id: "t2", date: "4月7日", site: "旧田中倉庫解体",
        type: "ルール違反",
        detail: "ヘルメット未着用を現場監督が発見。注意後は着用したが繰り返し発生している。",
        adminScore: 1, adminMemo: "ルール徹底を再指導。次回は始末書対応",
      },
      {
        id: "t3", date: "4月13日", site: "山田邸解体工事",
        type: "ルール違反",
        detail: "指定外エリアでの喫煙が発覚。",
        adminScore: 1, adminMemo: "厳重注意。3回目で処分対象とする",
      },
    ],
    siteEvals: [
      { date: "4月13日", site: "山田邸解体工事", role: "作業員", tags: ["#要注意", "#ルール違反"], memo: "喫煙場所違反。安全意識の根本的な改善が必要" },
      { date: "4月7日", site: "旧田中倉庫解体", role: "作業員", tags: ["#要注意"], memo: "ヘルメット未着用を複数回確認" },
    ],
  },

  // ── m5 伊藤 組 ────────────────────────────────────────────
  {
    memberId: "m5",
    workDays: 14, lateDays: 0, absentDays: 0,
    totalHours: 126, avgOvertime: 1.5, attendancePct: 100,
    calendar: mkCal({}),
    radar: { attendance: 100, safety: 95, skill: 94, communication: 88, efficiency: 90 },
    efficiencyDelta: +10,
    ruleViolations: 0,
    positiveFeedback: [
      "クレーン操作が熟練しており段取りが非常に速い",
      "チームへの技術共有が積極的で若手の成長に貢献",
    ],
    troubles: [],
    siteEvals: [
      { date: "4月10日", site: "さいたま市木造解体", role: "責任者", tags: ["#リーダーシップ", "#効率的", "#安全模範"], memo: "クレーン作業で大幅な時短達成。安全確認も徹底" },
    ],
  },

  // ── m6 高橋 真一 ──────────────────────────────────────────
  {
    memberId: "m6",
    workDays: 13, lateDays: 0, absentDays: 1,
    totalHours: 110, avgOvertime: 0.8, attendancePct: 93,
    calendar: mkCal({ 15: "欠勤" }),
    radar: { attendance: 93, safety: 90, skill: 88, communication: 85, efficiency: 82 },
    efficiencyDelta: +5,
    ruleViolations: 0,
    positiveFeedback: ["足場組立の段取りが素早く安全チェックも丁寧"],
    troubles: [
      {
        id: "t4", date: "4月3日", site: "川口市渡辺邸",
        type: "埋設物",
        detail: "掘削中に未知の配管を発見。即座に工事を停止し設計者・発注者に連絡。完璧な初期対応だった。",
        adminScore: 3, adminMemo: "マニュアル通りの完璧な対応。社内表彰を検討",
      },
    ],
    siteEvals: [
      { date: "4月3日", site: "川口市渡辺邸", role: "責任者", tags: ["#冷静対応", "#安全模範"], memo: "埋設物発見時の判断・対応が模範的" },
      { date: "3月28日", site: "旧田中倉庫解体", role: "作業員", tags: ["#効率的"], memo: "" },
    ],
  },
];
