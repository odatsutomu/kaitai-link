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

export const SEED_EVALS: WorkerEval[] = [
  // ── 鈴木 浩二 (m2) ──────────────────────────────────────────────────────────
  {
    id: "ev001",
    evaluatorId: "m1", evaluatorName: "田中 義雄",
    targetWorkerId: "m2", targetWorkerName: "鈴木 浩二",
    projectId: "s1", projectName: "山田邸解体工事",
    date: "2026-03-05", timestamp: "2026-03-05T17:30:00.000Z",
    attendance: 3, safety: 3, speed: 3, equipment: 2, neighborhood: 3,
  },
  {
    id: "ev002",
    evaluatorId: "m1", evaluatorName: "田中 義雄",
    targetWorkerId: "m2", targetWorkerName: "鈴木 浩二",
    projectId: "s1", projectName: "山田邸解体工事",
    date: "2026-03-14", timestamp: "2026-03-14T17:45:00.000Z",
    attendance: 2, safety: 1, speed: 3, equipment: 3, neighborhood: 2,
    memo: "ヘルメット着用忘れあり",
  },
  {
    id: "ev003",
    evaluatorId: "m3", evaluatorName: "佐藤 誠",
    targetWorkerId: "m2", targetWorkerName: "鈴木 浩二",
    projectId: "s2", projectName: "旧田中倉庫解体",
    date: "2026-03-24", timestamp: "2026-03-24T18:00:00.000Z",
    attendance: 3, safety: 2, speed: 2, equipment: 3, neighborhood: 3,
  },
  {
    id: "ev004",
    evaluatorId: "m1", evaluatorName: "田中 義雄",
    targetWorkerId: "m2", targetWorkerName: "鈴木 浩二",
    projectId: "s1", projectName: "山田邸解体工事",
    date: "2026-04-01", timestamp: "2026-04-01T17:20:00.000Z",
    attendance: 3, safety: 3, speed: 3, equipment: 3, neighborhood: 3,
  },

  // ── 高橋 武 (m4) ────────────────────────────────────────────────────────────
  {
    id: "ev005",
    evaluatorId: "m1", evaluatorName: "田中 義雄",
    targetWorkerId: "m4", targetWorkerName: "高橋 武",
    projectId: "s1", projectName: "山田邸解体工事",
    date: "2026-03-06", timestamp: "2026-03-06T17:30:00.000Z",
    attendance: 1, safety: 2, speed: 2, equipment: 2, neighborhood: 2,
    memo: "9時15分遅刻",
  },
  {
    id: "ev006",
    evaluatorId: "m3", evaluatorName: "佐藤 誠",
    targetWorkerId: "m4", targetWorkerName: "高橋 武",
    projectId: "s2", projectName: "旧田中倉庫解体",
    date: "2026-03-17", timestamp: "2026-03-17T17:55:00.000Z",
    attendance: 2, safety: 2, speed: 2, equipment: 1, neighborhood: 2,
    memo: "重機の清掃未実施",
  },
  {
    id: "ev007",
    evaluatorId: "m1", evaluatorName: "田中 義雄",
    targetWorkerId: "m4", targetWorkerName: "高橋 武",
    projectId: "s1", projectName: "山田邸解体工事",
    date: "2026-03-27", timestamp: "2026-03-27T17:40:00.000Z",
    attendance: 3, safety: 3, speed: 2, equipment: 2, neighborhood: 3,
  },
  {
    id: "ev008",
    evaluatorId: "m3", evaluatorName: "佐藤 誠",
    targetWorkerId: "m4", targetWorkerName: "高橋 武",
    projectId: "s2", projectName: "旧田中倉庫解体",
    date: "2026-04-02", timestamp: "2026-04-02T17:50:00.000Z",
    attendance: 2, safety: 2, speed: 3, equipment: 2, neighborhood: 2,
  },

  // ── 中村 隼人 (m5) ──────────────────────────────────────────────────────────
  {
    id: "ev009",
    evaluatorId: "m3", evaluatorName: "佐藤 誠",
    targetWorkerId: "m5", targetWorkerName: "中村 隼人",
    projectId: "s2", projectName: "旧田中倉庫解体",
    date: "2026-03-08", timestamp: "2026-03-08T17:30:00.000Z",
    attendance: 3, safety: 3, speed: 3, equipment: 3, neighborhood: 2,
  },
  {
    id: "ev010",
    evaluatorId: "m1", evaluatorName: "田中 義雄",
    targetWorkerId: "m5", targetWorkerName: "中村 隼人",
    projectId: "s1", projectName: "山田邸解体工事",
    date: "2026-03-19", timestamp: "2026-03-19T17:45:00.000Z",
    attendance: 2, safety: 1, speed: 2, equipment: 3, neighborhood: 3,
    memo: "安全帯の点検未実施",
  },
  {
    id: "ev011",
    evaluatorId: "m3", evaluatorName: "佐藤 誠",
    targetWorkerId: "m5", targetWorkerName: "中村 隼人",
    projectId: "s2", projectName: "旧田中倉庫解体",
    date: "2026-03-28", timestamp: "2026-03-28T18:00:00.000Z",
    attendance: 3, safety: 2, speed: 3, equipment: 2, neighborhood: 3,
  },
  {
    id: "ev012",
    evaluatorId: "m1", evaluatorName: "田中 義雄",
    targetWorkerId: "m5", targetWorkerName: "中村 隼人",
    projectId: "s1", projectName: "山田邸解体工事",
    date: "2026-04-02", timestamp: "2026-04-02T17:30:00.000Z",
    attendance: 3, safety: 3, speed: 3, equipment: 3, neighborhood: 3,
  },

  // ── 渡辺 純 (m6) ────────────────────────────────────────────────────────────
  {
    id: "ev013",
    evaluatorId: "m1", evaluatorName: "田中 義雄",
    targetWorkerId: "m6", targetWorkerName: "渡辺 純",
    projectId: "s1", projectName: "山田邸解体工事",
    date: "2026-03-10", timestamp: "2026-03-10T17:30:00.000Z",
    attendance: 2, safety: 2, speed: 1, equipment: 2, neighborhood: 2,
    memo: "作業ペースが遅く工程に影響",
  },
  {
    id: "ev014",
    evaluatorId: "m3", evaluatorName: "佐藤 誠",
    targetWorkerId: "m6", targetWorkerName: "渡辺 純",
    projectId: "s2", projectName: "旧田中倉庫解体",
    date: "2026-03-20", timestamp: "2026-03-20T17:55:00.000Z",
    attendance: 3, safety: 3, speed: 2, equipment: 2, neighborhood: 1,
    memo: "近隣住民への挨拶なし",
  },
  {
    id: "ev015",
    evaluatorId: "m1", evaluatorName: "田中 義雄",
    targetWorkerId: "m6", targetWorkerName: "渡辺 純",
    projectId: "s1", projectName: "山田邸解体工事",
    date: "2026-03-30", timestamp: "2026-03-30T17:40:00.000Z",
    attendance: 3, safety: 3, speed: 2, equipment: 3, neighborhood: 2,
  },
  {
    id: "ev016",
    evaluatorId: "m3", evaluatorName: "佐藤 誠",
    targetWorkerId: "m6", targetWorkerName: "渡辺 純",
    projectId: "s2", projectName: "旧田中倉庫解体",
    date: "2026-04-01", timestamp: "2026-04-01T18:00:00.000Z",
    attendance: 2, safety: 2, speed: 2, equipment: 2, neighborhood: 3,
  },

  // ── 伊藤 研二 (m7) ──────────────────────────────────────────────────────────
  {
    id: "ev017",
    evaluatorId: "m3", evaluatorName: "佐藤 誠",
    targetWorkerId: "m7", targetWorkerName: "伊藤 研二",
    projectId: "s2", projectName: "旧田中倉庫解体",
    date: "2026-03-12", timestamp: "2026-03-12T17:30:00.000Z",
    attendance: 3, safety: 2, speed: 2, equipment: 2, neighborhood: 2,
  },
  {
    id: "ev018",
    evaluatorId: "m1", evaluatorName: "田中 義雄",
    targetWorkerId: "m7", targetWorkerName: "伊藤 研二",
    projectId: "s1", projectName: "山田邸解体工事",
    date: "2026-03-22", timestamp: "2026-03-22T17:45:00.000Z",
    attendance: 1, safety: 3, speed: 2, equipment: 2, neighborhood: 3,
    memo: "8時50分遅刻。事前連絡なし。",
  },
  {
    id: "ev019",
    evaluatorId: "m3", evaluatorName: "佐藤 誠",
    targetWorkerId: "m7", targetWorkerName: "伊藤 研二",
    projectId: "s2", projectName: "旧田中倉庫解体",
    date: "2026-03-31", timestamp: "2026-03-31T18:00:00.000Z",
    attendance: 2, safety: 3, speed: 3, equipment: 3, neighborhood: 2,
  },
  {
    id: "ev020",
    evaluatorId: "m1", evaluatorName: "田中 義雄",
    targetWorkerId: "m7", targetWorkerName: "伊藤 研二",
    projectId: "s1", projectName: "山田邸解体工事",
    date: "2026-04-02", timestamp: "2026-04-02T17:35:00.000Z",
    attendance: 3, safety: 3, speed: 3, equipment: 3, neighborhood: 3,
  },
];
