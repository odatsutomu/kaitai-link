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

// ─── データ（新規企業は空スタート） ──────────────────────────────────────────────

export const MEMBERS: Member[] = [];

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

export const MEMBER_STATS: MemberStats[] = [];
