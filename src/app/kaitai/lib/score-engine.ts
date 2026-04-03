/**
 * 減衰型スコア算出エンジン（1000点満点）
 *
 * 3要素合計:
 *   基礎スキル点  MAX 200  — 資格数 × LICENSE_POINTS（上限4資格分）
 *   実績・ボーナス点 MAX 500 — 月次評価加重平均 + 指導ボーナス + 成長ボーナス
 *   信頼性点     MAX 300  — 出勤率 × 200 + 日報提出率 × 100
 *
 * - 月次評価は直近90日（3ヶ月）のみ使用
 * - 加重移動平均: 当月 × 0.5 + 先月 × 0.3 + 先々月 × 0.2
 */

// ─── Config ──────────────────────────────────────────────────────────────────

/** Points per license (max 4 licenses counted = 200 pts) */
export const LICENSE_POINTS = 50;

/** Max base skill score */
const BASE_MAX = 200;

/** Max performance score */
const PERF_MAX = 500;

/** Max reliability score */
const RELIABILITY_MAX = 300;

/** Score floor — licensed workers never drop below this */
export const SCORE_FLOOR = 200;

/** Weights for weighted moving average (index 0 = current month) */
const MONTH_WEIGHTS = [0.5, 0.3, 0.2] as const;

/** Max possible evaluation score per month (5 criteria × 5 points each) */
const MAX_MONTHLY_RAW = 25;

/** Normalized eval scale: raw monthly score mapped to 0–400 (leaving room for bonuses within 500 cap) */
const NORMALIZED_EVAL_MAX = 400;

/** Points per teaching event (90-day decay) */
export const TEACHING_POINTS = 15;

/** Points per skill learned (90-day decay) */
export const LEARNING_POINTS = 20;

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
  /** Attendance percentage 0–100 */
  attendancePct?: number;
  /** Report submission percentage 0–100 */
  reportPct?: number;
};

export type ComputedScore = {
  memberId: string;
  /** 基礎スキル点 (0–200): licenses × LICENSE_POINTS, capped */
  baseScore: number;
  /** 実績・ボーナス点 (0–500): eval avg + teaching + growth, capped */
  perfScore: number;
  /** Eval component within perfScore (0–400) */
  evalScore: number;
  /** Teaching bonus within perfScore */
  teachingBonus: number;
  /** Growth bonus within perfScore */
  growthBonus: number;
  /** 信頼性点 (0–300): attendance + report rates */
  reliabilityScore: number;
  /** Total = baseScore + perfScore + reliabilityScore (0–1000) */
  totalScore: number;
  /** Per-criteria weighted averages (1–5 scale) */
  criteria: {
    score1: number;
    score2: number;
    score3: number;
    score4: number;
    score5: number;
  };
  /** How many months of eval data were used (0–3) */
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
  return (raw / MAX_MONTHLY_RAW) * NORMALIZED_EVAL_MAX;
}

function gradeFromScore(total: number): { grade: string; color: string } {
  if (total >= 900) return { grade: "S", color: "#7C3AED" };
  if (total >= 750) return { grade: "A", color: "#16A34A" };
  if (total >= 600) return { grade: "B", color: "#3B82F6" };
  if (total >= 450) return { grade: "C", color: "#F59E0B" };
  if (total >= 300) return { grade: "D", color: "#F97316" };
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

  // ── 1. 基礎スキル点 (MAX 200) ──
  const baseScore = Math.min(input.licenses.length * LICENSE_POINTS, BASE_MAX);

  // ── 2. 実績・ボーナス点 (MAX 500) ──
  // Weighted moving average of evaluations
  let weightedSum = 0;
  let weightTotal = 0;
  let monthsUsed = 0;

  const criteriaSum = { score1: 0, score2: 0, score3: 0, score4: 0, score5: 0 };

  for (let i = 0; i < windowMonths.length; i++) {
    const ev = byMonth.get(windowMonths[i]);
    if (!ev) continue;

    const raw = rawMonthlyScore(ev);
    if (raw === 0) continue;

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

  const criteria = weightTotal > 0
    ? {
        score1: Math.round((criteriaSum.score1 / weightTotal) * 10) / 10,
        score2: Math.round((criteriaSum.score2 / weightTotal) * 10) / 10,
        score3: Math.round((criteriaSum.score3 / weightTotal) * 10) / 10,
        score4: Math.round((criteriaSum.score4 / weightTotal) * 10) / 10,
        score5: Math.round((criteriaSum.score5 / weightTotal) * 10) / 10,
      }
    : { score1: 0, score2: 0, score3: 0, score4: 0, score5: 0 };

  const teachingBonus = (input.teachingCount ?? 0) * TEACHING_POINTS;
  const growthBonus = (input.learningCount ?? 0) * LEARNING_POINTS;

  const perfScore = Math.min(evalScore + teachingBonus + growthBonus, PERF_MAX);

  // ── 3. 信頼性点 (MAX 300) ──
  // attendance rate contributes up to 200, report rate up to 100
  const attendancePart = Math.round(((input.attendancePct ?? 0) / 100) * 200);
  const reportPart = Math.round(((input.reportPct ?? 0) / 100) * 100);
  const reliabilityScore = Math.min(attendancePart + reportPart, RELIABILITY_MAX);

  // ── Total ──
  let totalScore = baseScore + perfScore + reliabilityScore;

  // Floor protection for licensed workers
  if (input.licenses.length > 0 && totalScore < SCORE_FLOOR) {
    totalScore = SCORE_FLOOR;
  }

  const { grade, color } = gradeFromScore(totalScore);

  return {
    memberId: input.memberId,
    baseScore,
    perfScore,
    evalScore,
    teachingBonus,
    growthBonus,
    reliabilityScore,
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
