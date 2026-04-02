"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Send,
  Users,
  ClipboardCheck,
  X,
} from "lucide-react";
import { useAppContext } from "../lib/app-context";
import {
  EVAL_CATEGORIES,
  SCORE_META,
  type EvalScore,
  type WorkerEval,
} from "../lib/evaluation-data";

const C = {
  text: "#1E293B",
  sub: "#64748B",
  muted: "#94A3B8",
  border: "#E2E8F0",
  card: "#FFFFFF",
  amber: "#F59E0B",
  amberDk: "#D97706",
};

const SITES = [
  { id: "s1", name: "山田邸解体工事" },
  { id: "s2", name: "旧田中倉庫解体" },
  { id: "s3", name: "松本アパート解体" },
];

const WORKERS = [
  { id: "m2", name: "鈴木 浩二" },
  { id: "m4", name: "高橋 武" },
  { id: "m5", name: "中村 隼人" },
  { id: "m6", name: "渡辺 純" },
  { id: "m7", name: "伊藤 研二" },
];

type Step = "select" | "evaluate" | "done";
type CategoryKey = keyof Pick<
  WorkerEval,
  "attendance" | "safety" | "speed" | "equipment" | "neighborhood"
>;

function initScores(workerIds: string[]): Record<string, Record<CategoryKey, EvalScore>> {
  const scores: Record<string, Record<CategoryKey, EvalScore>> = {};
  for (const id of workerIds) {
    scores[id] = {
      attendance: 2,
      safety: 2,
      speed: 2,
      equipment: 2,
      neighborhood: 2,
    };
  }
  return scores;
}

export default function EvaluationPage() {
  const { addEvaluation } = useAppContext();
  const router = useRouter();

  const [step, setStep] = useState<Step>("select");
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, Record<CategoryKey, EvalScore>>>({});
  const [memos, setMemos] = useState<Record<string, string>>({});

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  function toggleWorker(id: string) {
    setSelectedWorkers((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  }

  function proceedToEvaluate() {
    setScores(initScores(selectedWorkers));
    setMemos({});
    setStep("evaluate");
  }

  function setScore(workerId: string, key: CategoryKey, val: EvalScore) {
    setScores((prev) => ({
      ...prev,
      [workerId]: { ...prev[workerId], [key]: val },
    }));
  }

  function workerHasIssue(workerId: string): boolean {
    if (!scores[workerId]) return false;
    return EVAL_CATEGORIES.some((cat) => scores[workerId][cat.key] === 1);
  }

  function handleSubmit() {
    const site = SITES.find((s) => s.id === selectedSite);
    if (!site) return;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    for (const workerId of selectedWorkers) {
      const worker = WORKERS.find((w) => w.id === workerId);
      if (!worker) continue;
      const entry: WorkerEval = {
        id: `ev_${Date.now().toString(36)}_${workerId}`,
        evaluatorId: "m1",
        evaluatorName: "田中 義雄",
        targetWorkerId: workerId,
        targetWorkerName: worker.name,
        projectId: site.id,
        projectName: site.name,
        date: dateStr,
        timestamp: now.toISOString(),
        attendance: scores[workerId].attendance,
        safety: scores[workerId].safety,
        speed: scores[workerId].speed,
        equipment: scores[workerId].equipment,
        neighborhood: scores[workerId].neighborhood,
        memo: memos[workerId] || undefined,
      };
      addEvaluation(entry);
    }
    setStep("done");
  }

  // ── Select step ──────────────────────────────────────────────────────────────
  if (step === "select") {
    return (
      <div className="py-6 pb-28 md:pb-8 flex flex-col gap-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>本日の評価入力</h1>
          <p className="text-sm mt-1" style={{ color: C.sub }}>{today}</p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Site selection */}
          <section>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.sub,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 12,
              }}
            >
              現場を選択
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SITES.map((site) => {
                const active = selectedSite === site.id;
                return (
                  <button
                    key={site.id}
                    onClick={() => setSelectedSite(site.id)}
                    style={{
                      width: "100%",
                      height: 60,
                      borderRadius: 12,
                      border: `2px solid ${active ? C.amber : C.border}`,
                      background: active ? "#FFFBEB" : C.card,
                      color: active ? C.amberDk : C.text,
                      fontSize: 16,
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 20,
                      gap: 10,
                      transition: "all 0.15s",
                    }}
                  >
                    {active && (
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: C.amber,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircle2 size={14} color="#fff" />
                      </span>
                    )}
                    {!active && (
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: `2px solid ${C.muted}`,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {site.name}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Worker selection */}
          <section>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.sub,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Users size={14} />
              作業員を選択
              {selectedWorkers.length > 0 && (
                <span
                  style={{
                    background: C.amber,
                    color: "#fff",
                    borderRadius: 20,
                    padding: "1px 8px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {selectedWorkers.length}名
                </span>
              )}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {WORKERS.map((w) => {
                const selected = selectedWorkers.includes(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => toggleWorker(w.id)}
                    style={{
                      height: 64,
                      borderRadius: 12,
                      border: `2px solid ${selected ? C.amber : C.border}`,
                      background: selected ? "#FFFBEB" : C.card,
                      color: selected ? C.amberDk : C.text,
                      fontSize: 15,
                      fontWeight: selected ? 700 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      transition: "all 0.15s",
                    }}
                  >
                    {selected && <CheckCircle2 size={16} color={C.amber} />}
                    {w.name}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Bottom CTA */}
        <div className="pt-2">
          <button
            onClick={proceedToEvaluate}
            disabled={!selectedSite || selectedWorkers.length === 0}
            style={{
              width: "100%",
              minHeight: 56,
              borderRadius: 12,
              border: "none",
              background:
                !selectedSite || selectedWorkers.length === 0
                  ? C.muted
                  : `linear-gradient(135deg, ${C.amber}, ${C.amberDk})`,
              color: "#fff",
              fontSize: 17,
              fontWeight: 700,
              cursor:
                !selectedSite || selectedWorkers.length === 0
                  ? "not-allowed"
                  : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow:
                !selectedSite || selectedWorkers.length === 0
                  ? "none"
                  : "0 4px 16px rgba(245,158,11,0.4)",
              transition: "all 0.15s",
            }}
          >
            評価へ進む →
          </button>
        </div>
      </div>
    );
  }

  // ── Evaluate step ────────────────────────────────────────────────────────────
  if (step === "evaluate") {
    return (
      <div className="py-6 pb-28 md:pb-8 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep("select")}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: "#F1F5F9", border: "none", cursor: "pointer", color: C.sub }}
          >
            <X size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: C.text }}>評価入力</h1>
            <p className="text-sm mt-0.5" style={{ color: C.sub }}>
              {SITES.find((s) => s.id === selectedSite)?.name} · {selectedWorkers.length}名
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {selectedWorkers.map((workerId) => {
            const worker = WORKERS.find((w) => w.id === workerId);
            if (!worker || !scores[workerId]) return null;
            const hasIssue = workerHasIssue(workerId);

            return (
              <div
                key={workerId}
                style={{
                  background: C.card,
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                  borderLeft: `4px solid ${C.amber}`,
                }}
              >
                {/* Worker name header */}
                <div
                  style={{
                    padding: "16px 20px 12px",
                    borderBottom: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#FFFBEB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      color: C.amberDk,
                    }}
                  >
                    {worker.name.slice(0, 1)}
                  </div>
                  <span
                    style={{ fontSize: 17, fontWeight: 700, color: C.text }}
                  >
                    {worker.name}
                  </span>
                </div>

                {/* Category rows */}
                <div style={{ padding: "12px 16px" }}>
                  {EVAL_CATEGORIES.map((cat) => {
                    const current = scores[workerId][cat.key];
                    return (
                      <div
                        key={cat.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 0",
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        <div
                          style={{
                            width: 80,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: C.sub,
                            }}
                          >
                            {cat.label}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flex: 1,
                            justifyContent: "flex-end",
                          }}
                        >
                          {([1, 2, 3] as EvalScore[]).map((score) => {
                            const meta = SCORE_META[score];
                            const active = current === score;
                            return (
                              <button
                                key={score}
                                onClick={() => setScore(workerId, cat.key, score)}
                                style={{
                                  width: 80,
                                  height: 48,
                                  borderRadius: 10,
                                  border: `2px solid ${active ? meta.color : C.border}`,
                                  background: active ? meta.bg : "#FAFAFA",
                                  color: active ? meta.color : C.muted,
                                  fontSize: 13,
                                  fontWeight: active ? 700 : 500,
                                  cursor: "pointer",
                                  transition: "all 0.12s",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 4,
                                }}
                              >
                                <span>{meta.icon}</span>
                                <span>{meta.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Memo field shown when any score is 1 */}
                {hasIssue && (
                  <div style={{ padding: "0 16px 16px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#DC2626",
                        marginBottom: 6,
                        marginTop: 8,
                      }}
                    >
                      課題メモ（任意）
                    </label>
                    <textarea
                      value={memos[workerId] ?? ""}
                      onChange={(e) =>
                        setMemos((prev) => ({
                          ...prev,
                          [workerId]: e.target.value,
                        }))
                      }
                      placeholder="例：ヘルメット着用忘れあり、9時15分遅刻 など"
                      rows={3}
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        border: `1px solid #FECACA`,
                        background: "#FEF2F2",
                        padding: "10px 12px",
                        fontSize: 14,
                        color: C.text,
                        resize: "vertical",
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            className="w-full rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${C.amber}, ${C.amberDk})`,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(245,158,11,0.4)",
            }}
          >
            <Send size={18} />
            提出する
          </button>
        </div>
      </div>
    );
  }

  // ── Done step ────────────────────────────────────────────────────────────────
  return (
    <div className="py-6 pb-28 md:pb-8 flex items-center justify-center" style={{ minHeight: "60vh" }}>
      <div
        style={{
          background: C.card,
          borderRadius: 24,
          padding: "48px 32px",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "#F0FDF4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle2 size={48} color="#16A34A" strokeWidth={2} />
        </div>
        <div>
          <div
            style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}
          >
            評価を送信しました
          </div>
          <div style={{ fontSize: 16, color: C.sub }}>
            <span style={{ fontWeight: 700, color: C.amber, fontSize: 20 }}>
              {selectedWorkers.length}名
            </span>{" "}
            の評価を記録しました
          </div>
        </div>
        <div
          style={{
            background: "#F8FAFC",
            borderRadius: 12,
            padding: "12px 20px",
            width: "100%",
          }}
        >
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>
            現場
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
            {SITES.find((s) => s.id === selectedSite)?.name}
          </div>
        </div>
        <Link
          href="/kaitai"
          style={{
            width: "100%",
            minHeight: 56,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${C.amber}, ${C.amberDk})`,
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(245,158,11,0.35)",
          }}
        >
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}
