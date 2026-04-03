export type EvalScore = 1 | 2 | 3; // 1=課題 2=普通 3=良

export interface WorkerEval {
  id: string;
  evaluatorId: string;
  evaluatorName: string;
  targetWorkerId: string;
  targetWorkerName: string;
  projectId: string;
  projectName: string;
  date: string;        // YYYY-MM-DD
  timestamp: string;   // ISO
  attendance: EvalScore;    // 勤怠
  safety: EvalScore;        // 安全
  speed: EvalScore;         // スピード
  equipment: EvalScore;     // 機材
  neighborhood: EvalScore;  // 近隣規律
  memo?: string;
}

export const EVAL_CATEGORIES: {
  key: keyof Pick<WorkerEval, "attendance" | "safety" | "speed" | "equipment" | "neighborhood">;
  label: string;
  emoji: string;
}[] = [
  { key: "attendance",   label: "勤怠",     emoji: "🕐" },
  { key: "safety",       label: "安全",     emoji: "⛑️" },
  { key: "speed",        label: "スピード",  emoji: "⚡" },
  { key: "equipment",    label: "機材",     emoji: "🚛" },
  { key: "neighborhood", label: "近隣規律",  emoji: "🏘️" },
];

export const SCORE_META: Record<EvalScore, { label: string; color: string; bg: string; icon: string }> = {
  3: { label: "良",   color: "#16A34A", bg: "#F0FDF4", icon: "✓" },
  2: { label: "普通", color: "#64748B", bg: "#F8FAFC", icon: "=" },
  1: { label: "課題", color: "#DC2626", bg: "#FEF2F2", icon: "!" },
};

export const SEED_EVALS: WorkerEval[] = [];
