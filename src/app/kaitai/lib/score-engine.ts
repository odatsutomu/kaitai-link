/**
 * 減衰型スコア算出エンジン
 *
 * - 月次評価は直近90日（3ヶ月）のみ使用
 * - 加重移動平均: 当月 * 0.5 + 先月 * 0.3 + 先々月 * 0.2
 * - 資格ベースポイント: 1資格あたり LICENSE_POINTS pt（減衰対象外）
 */

// ─── Config ──────────────────────────────────────────────────────────────────

/** Points per license (floor component, immune to decay) */
export const LICENSE_POINTS = 50;

/** Score floor — skilled workers never drop below this */
export const SCORE_FLOOR = 200;

/** Weights for weighted moving average (index 0 = current month) */
const MONTH_WEIGHTS = [0.5, 0.3, 0.2] as const;

/** Max possible evaluation score per month (5 criteria × 5 points each) */
const MAX_MONTHLY_RAW = 25;

/** Normalized scale: raw monthly score mapped to this range */
const NORMALIZED_MAX = 500;

// ─── Types ───────────────────────────────────────────────────────────────────

export type MonthlyEvalRecord = {
  month: string; // "2026-04"
  score1: number;
  score2: number;
  score3: number;
  score4: number;
  score5: number;
};

export type MemberScoreInput = {
  memberId: string;
  licenses: string[];
  evaluations: MonthlyEvalRecord[];
  /** Number of skills this member taught others (within 90-day window) */
  teachingCount?: number;
  /** Number of skills this member learned (within 90-day window) */
  learningCount?: number;
};

/** Points per teaching event (90-day decay) */
export const TEACHING_POINTS = 15;

/** Points per skill learned (90-day decay) */
export const LEARNING_POINTS = 20;

export type ComputedScore = {
  memberId: string;
  /** Weighted moving average of normalized monthly scores (0–500) */
  evalScore: number;
  /** License-based floor points (licenses.length × LICENSE_POINTS) */
  licenseFloor: number;
  /** Teaching bonus: teachingCount × TEACHING_POINTS */
  teachingBonus: number;
  /** Growth momentum: learningCount × LEARNING_POINTS */
  growthBonus: number;
  /** Total = max(evalScore + licenseFloor + teachingBonus + growthBonus, SCORE_FLOOR if licenses > 0) */
  totalScore: number;
  /** Per-criteria weighted averages (1–5 scale) */
  criteria: {
    score1: number;
    score2: number;
    score3: number;
    score4: number;
    score5: number;
  };
  /** How many months of data were used (0–3) */
  monthsUsed: number;
  /** Grade label based on total score */
  grade: string;
  /** Grade color */
  gradeColor: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get the 3 relevant months ending at `referenceMonth` (inclusive) */
export function getWindowMonths(referenceMonth: string): string[] {
  const months: string[] = [];
  const d = new Date(referenceMonth + "-01");
  for (let i = 0; i < 3; i++) {
    months.push(d.toISOString().slice(0, 7));
    d.setMonth(d.getMonth() - 1);
  }
  return months; // [current, last, twoAgo]
}

function rawMonthlyScore(ev: MonthlyEvalRecord): number {
  return ev.score1 + ev.score2 + ev.score3 + ev.score4 + ev.score5;
}

function normalizeScore(raw: number): number {
  return (raw / MAX_MONTHLY_RAW) * NORMALIZED_MAX;
}

function gradeFromScore(total: number): { grade: string; color: string } {
  if (total >= 600) return { grade: "S", color: "#7C3AED" };
  if (total >= 500) return { grade: "A", color: "#16A34A" };
  if (total >= 400) return { grade: "B", color: "#3B82F6" };
  if (total >= 300) return { grade: "C", color: "#F59E0B" };
  if (total >= 200) return { grade: "D", color: "#F97316" };
  return { grade: "E", color: "#EF4444" };
}

// ─── Main Calculation ────────────────────────────────────────────────────────

export function computeScore(
  input: MemberScoreInput,
  referenceMonth: string,
): ComputedScore {
  const windowMonths = getWindowMonths(referenceMonth);

  // Map evaluations by month (only within window)
  const byMonth = new Map<string, MonthlyEvalRecord>();
  for (const ev of input.evaluations) {
    if (windowMonths.includes(ev.month)) {
      byMonth.set(ev.month, ev);
    }
  }

  // Weighted moving average
  let weightedSum = 0;
  let weightTotal = 0;
  let monthsUsed = 0;

  // Per-criteria weighted sums
  const criteriaSum = { score1: 0, score2: 0, score3: 0, score4: 0, score5: 0 };

  for (let i = 0; i < windowMonths.length; i++) {
    const ev = byMonth.get(windowMonths[i]);
    if (!ev) continue;

    const raw = rawMonthlyScore(ev);
    if (raw === 0) continue; // Skip months with no actual scores

    const weight = MONTH_WEIGHTS[i];
    weightedSum += normalizeScore(raw) * weight;
    weightTotal += weight;
    monthsUsed++;

    criteriaSum.score1 += ev.score1 * weight;
    criteriaSum.score2 += ev.score2 * weight;
    criteriaSum.score3 += ev.score3 * weight;
    criteriaSum.score4 += ev.score4 * weight;
    criteriaSum.score5 += ev.score5 * weight;
  }

  const evalScore = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;

  // Normalize per-criteria to 1–5 scale
  const criteria = weightTotal > 0
    ? {
        score1: Math.round((criteriaSum.score1 / weightTotal) * 10) / 10,
        score2: Math.round((criteriaSum.score2 / weightTotal) * 10) / 10,
        score3: Math.round((criteriaSum.score3 / weightTotal) * 10) / 10,
        score4: Math.round((criteriaSum.score4 / weightTotal) * 10) / 10,
        score5: Math.round((criteriaSum.score5 / weightTotal) * 10) / 10,
      }
    : { score1: 0, score2: 0, score3: 0, score4: 0, score5: 0 };

  // License floor
  const licenseFloor = input.licenses.length * LICENSE_POINTS;

  // Skill-based bonuses (90-day decay built-in via windowed counts)
  const teachingBonus = (input.teachingCount ?? 0) * TEACHING_POINTS;
  const growthBonus = (input.learningCount ?? 0) * LEARNING_POINTS;

  // Total with floor protection
  let totalScore = evalScore + licenseFloor + teachingBonus + growthBonus;
  if (input.licenses.length > 0 && totalScore < SCORE_FLOOR) {
    totalScore = SCORE_FLOOR;
  }

  const { grade, color } = gradeFromScore(totalScore);

  return {
    memberId: input.memberId,
    evalScore,
    licenseFloor,
    teachingBonus,
    growthBonus,
    totalScore,
    criteria,
    monthsUsed,
    grade,
    gradeColor: color,
  };
}

/**
 * Compute scores for all members at once.
 */
export function computeAllScores(
  members: MemberScoreInput[],
  referenceMonth: string,
): ComputedScore[] {
  return members
    .map(m => computeScore(m, referenceMonth))
    .sort((a, b) => b.totalScore - a.totalScore);
}
