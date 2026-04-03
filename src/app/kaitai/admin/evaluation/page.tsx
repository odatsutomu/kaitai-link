"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Download,
  BarChart2,
  Users,
  Calendar,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  type WorkerEval,
  type EvalScore,
  EVAL_CATEGORIES,
  SCORE_META,
  SEED_EVALS,
} from "../../lib/evaluation-data";
import { useAppContext } from "../../lib/app-context";
import { T } from "../../lib/design-tokens";

const C = {
  text: T.text,
  sub: T.sub,
  muted: T.muted,
  border: T.border,
  card: T.surface,
  amber: T.primary,
  amberDk: T.primaryDk,
};

type Tab = "daily" | "aggregate" | "bias";

function avgScore(vals: number[]): number {
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function evalAvg(e: WorkerEval): number {
  return avgScore([e.attendance, e.safety, e.speed, e.equipment, e.neighborhood]);
}

function scoreColor(avg: number): string {
  if (avg >= 2.7) return "#16A34A";
  if (avg >= 2.0) return C.amberDk;
  return "#DC2626";
}

function scoreBg(avg: number): string {
  if (avg >= 2.7) return "#F0FDF4";
  if (avg >= 2.0) return T.primaryLt;
  return "#FEF2F2";
}

function ScoreBadge({ score }: { score: EvalScore }) {
  const meta = SCORE_META[score];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 44,
        height: 24,
        borderRadius: 6,
        background: meta.bg,
        color: meta.color,
        fontSize: 14,
        fontWeight: 700,
        padding: "0 8px",
      }}
    >
      {meta.label}
    </span>
  );
}

function AvgCell({ avg }: { avg: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 48,
        height: 24,
        borderRadius: 6,
        background: scoreBg(avg),
        color: scoreColor(avg),
        fontSize: 14,
        fontWeight: 700,
        padding: "0 8px",
      }}
    >
      {avg.toFixed(2)}
    </span>
  );
}

function exportCSV(data: WorkerEval[]) {
  const header =
    "日付,現場,評価者,対象者,勤怠,安全,スピード,機材,近隣規律,メモ";
  const rows = data.map((e) =>
    [
      e.date,
      e.projectName,
      e.evaluatorName,
      e.targetWorkerName,
      e.attendance,
      e.safety,
      e.speed,
      e.equipment,
      e.neighborhood,
      e.memo ?? "",
    ].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `eval_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

const TH_STYLE: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: 14,
  fontWeight: 700,
  color: C.sub,
  background: T.bg,
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: "nowrap",
};

const TD_STYLE: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 14,
  color: C.text,
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: "nowrap",
};

export default function AdminEvaluationPage() {
  const { evaluations } = useAppContext();

  const allEvals: WorkerEval[] = useMemo(() => {
    const merged = [...SEED_EVALS, ...evaluations];
    const seen = new Set<string>();
    return merged.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }, [evaluations]);

  const [tab, setTab] = useState<Tab>("daily");
  const [filterWorker, setFilterWorker] = useState<string>("");
  const [filterEvaluator, setFilterEvaluator] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");

  // Derive filter options
  const workerOptions = useMemo(() => {
    const names = Array.from(
      new Set(allEvals.map((e) => e.targetWorkerName))
    ).sort();
    return names;
  }, [allEvals]);

  const evaluatorOptions = useMemo(() => {
    const names = Array.from(
      new Set(allEvals.map((e) => e.evaluatorName))
    ).sort();
    return names;
  }, [allEvals]);

  const monthOptions = useMemo(() => {
    const months = Array.from(
      new Set(allEvals.map((e) => e.date.slice(0, 7)))
    ).sort().reverse();
    return months;
  }, [allEvals]);

  const filtered = useMemo(() => {
    return allEvals.filter((e) => {
      if (filterWorker && e.targetWorkerName !== filterWorker) return false;
      if (filterEvaluator && e.evaluatorName !== filterEvaluator) return false;
      if (filterMonth && !e.date.startsWith(filterMonth)) return false;
      return true;
    });
  }, [allEvals, filterWorker, filterEvaluator, filterMonth]);

  const sortedDaily = useMemo(
    () => [...filtered].sort((a, b) => b.date.localeCompare(a.date)),
    [filtered]
  );

  // KPI
  const totalCount = allEvals.length;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthCount = allEvals.filter((e) =>
    e.date.startsWith(currentMonth)
  ).length;
  const overallAvg =
    allEvals.length > 0
      ? avgScore(allEvals.map((e) => evalAvg(e)))
      : 0;

  // Per-worker aggregate
  const workerAgg = useMemo(() => {
    const map = new Map<
      string,
      { name: string; evals: WorkerEval[] }
    >();
    for (const e of filtered) {
      if (!map.has(e.targetWorkerId)) {
        map.set(e.targetWorkerId, { name: e.targetWorkerName, evals: [] });
      }
      map.get(e.targetWorkerId)!.evals.push(e);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "ja")
    );
  }, [filtered]);

  // Per-evaluator aggregate
  const evaluatorAgg = useMemo(() => {
    const map = new Map<
      string,
      { name: string; evals: WorkerEval[] }
    >();
    for (const e of filtered) {
      if (!map.has(e.evaluatorId)) {
        map.set(e.evaluatorId, { name: e.evaluatorName, evals: [] });
      }
      map.get(e.evaluatorId)!.evals.push(e);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "ja")
    );
  }, [filtered]);

  // Selected worker for trend chart
  const [trendWorker, setTrendWorker] = useState<string>("");
  const trendData = useMemo(() => {
    const target = trendWorker || (workerAgg[0]?.name ?? "");
    const workerEvals = allEvals
      .filter((e) => e.targetWorkerName === target)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8);
    return workerEvals.map((e) => ({
      date: e.date.slice(5),
      avg: evalAvg(e),
    }));
  }, [allEvals, trendWorker, workerAgg]);

  return (
    <div style={{ paddingTop: "32px", paddingBottom: "32px" }}>
      {/* Page title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <BarChart2 size={28} color={C.amber} />
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: C.text,
            margin: 0,
          }}
        >
          評価分析ダッシュボード
        </h1>
      </div>

      {/* KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          {
            icon: <ClipboardIcon />,
            label: "総評価件数",
            value: `${totalCount}件`,
            color: C.amber,
          },
          {
            icon: <Calendar size={20} color="#3B82F6" />,
            label: "今月評価件数",
            value: `${thisMonthCount}件`,
            color: "#3B82F6",
          },
          {
            icon: <TrendingUp size={20} color="#16A34A" />,
            label: "全体平均スコア",
            value: overallAvg.toFixed(2),
            color: scoreColor(overallAvg),
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: C.card,
              borderRadius: 16,
              padding: "20px 24px",
              border: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              {kpi.icon}
              <span style={{ fontSize: 14, color: C.sub, fontWeight: 600 }}>
                {kpi.label}
              </span>
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: kpi.color,
                lineHeight: 1,
              }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: `2px solid ${C.border}`,
          marginBottom: 20,
        }}
      >
        {(
          [
            { key: "daily", label: "デイリーログ" },
            { key: "aggregate", label: "期間集計" },
            { key: "bias", label: "評価者バイアス" },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 22px",
              fontSize: 15,
              fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? C.amberDk : C.sub,
              background: "none",
              border: "none",
              borderBottom: tab === t.key
                ? `3px solid ${C.amber}`
                : "3px solid transparent",
              cursor: "pointer",
              marginBottom: -2,
              transition: "all 0.12s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={selectStyle}
        >
          <option value="">月：すべて</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={filterWorker}
          onChange={(e) => setFilterWorker(e.target.value)}
          style={selectStyle}
        >
          <option value="">作業員：すべて</option>
          {workerOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          value={filterEvaluator}
          onChange={(e) => setFilterEvaluator(e.target.value)}
          style={selectStyle}
        >
          <option value="">評価者：すべて</option>
          {evaluatorOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 14, color: C.muted, marginLeft: "auto" }}>
          {filtered.length}件
        </span>
      </div>

      {/* ── Tab: デイリーログ ─────────────────────────────────────────────────── */}
      {tab === "daily" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
            }}
          >
            <button
              onClick={() => exportCSV(filtered)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                minHeight: 36,
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.card,
                fontSize: 14,
                fontWeight: 600,
                color: C.sub,
                cursor: "pointer",
              }}
            >
              <Download size={14} />
              CSVエクスポート
            </button>
          </div>
          <div
            style={{
              background: C.card,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              overflow: "auto",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    "日付",
                    "現場",
                    "評価者",
                    "対象者",
                    "勤怠",
                    "安全",
                    "スピード",
                    "機材",
                    "近隣",
                    "平均",
                    "メモ",
                  ].map((h) => (
                    <th key={h} style={TH_STYLE}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedDaily.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      style={{
                        ...TD_STYLE,
                        textAlign: "center",
                        color: C.muted,
                        padding: 32,
                      }}
                    >
                      該当する評価データがありません
                    </td>
                  </tr>
                ) : (
                  sortedDaily.map((e) => {
                    const avg = evalAvg(e);
                    return (
                      <tr key={e.id}>
                        <td style={TD_STYLE}>{e.date}</td>
                        <td style={{ ...TD_STYLE, maxWidth: 140 }}>
                          <span
                            style={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 140,
                            }}
                          >
                            {e.projectName}
                          </span>
                        </td>
                        <td style={TD_STYLE}>{e.evaluatorName}</td>
                        <td style={TD_STYLE}>{e.targetWorkerName}</td>
                        <td style={{ ...TD_STYLE, textAlign: "center" }}>
                          <ScoreBadge score={e.attendance} />
                        </td>
                        <td style={{ ...TD_STYLE, textAlign: "center" }}>
                          <ScoreBadge score={e.safety} />
                        </td>
                        <td style={{ ...TD_STYLE, textAlign: "center" }}>
                          <ScoreBadge score={e.speed} />
                        </td>
                        <td style={{ ...TD_STYLE, textAlign: "center" }}>
                          <ScoreBadge score={e.equipment} />
                        </td>
                        <td style={{ ...TD_STYLE, textAlign: "center" }}>
                          <ScoreBadge score={e.neighborhood} />
                        </td>
                        <td style={{ ...TD_STYLE, textAlign: "center" }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: scoreColor(avg),
                              fontSize: 14,
                            }}
                          >
                            {avg.toFixed(2)}
                          </span>
                        </td>
                        <td
                          style={{
                            ...TD_STYLE,
                            maxWidth: 180,
                            color: C.muted,
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 180,
                            }}
                          >
                            {e.memo ?? "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: 期間集計 ──────────────────────────────────────────────────────── */}
      {tab === "aggregate" && (
        <div>
          <div
            style={{
              background: C.card,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              overflow: "auto",
              marginBottom: 28,
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    "名前",
                    "件数",
                    "勤怠",
                    "安全",
                    "スピード",
                    "機材",
                    "近隣",
                    "総合",
                  ].map((h) => (
                    <th key={h} style={TH_STYLE}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workerAgg.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        ...TD_STYLE,
                        textAlign: "center",
                        color: C.muted,
                        padding: 32,
                      }}
                    >
                      該当する評価データがありません
                    </td>
                  </tr>
                ) : (
                  workerAgg.map(({ name, evals: we }) => {
                    const catAvgs = EVAL_CATEGORIES.map((cat) =>
                      avgScore(we.map((e) => e[cat.key] as number))
                    );
                    const overall = avgScore(we.map((e) => evalAvg(e)));
                    return (
                      <tr
                        key={name}
                        style={{ cursor: "pointer" }}
                        onClick={() => setTrendWorker(name)}
                      >
                        <td style={{ ...TD_STYLE, fontWeight: 600 }}>
                          {name}
                        </td>
                        <td style={TD_STYLE}>{we.length}件</td>
                        {catAvgs.map((avg, i) => (
                          <td
                            key={i}
                            style={{ ...TD_STYLE, textAlign: "center" }}
                          >
                            <AvgCell avg={avg} />
                          </td>
                        ))}
                        <td style={{ ...TD_STYLE, textAlign: "center" }}>
                          <AvgCell avg={overall} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Trend chart */}
          {trendData.length > 0 && (
            <div
              style={{
                background: C.card,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <TrendingUp size={18} color={C.amber} />
                <span
                  style={{ fontSize: 15, fontWeight: 700, color: C.text }}
                >
                  スコア推移
                </span>
                <span style={{ fontSize: 14, color: C.sub }}>
                  （{trendWorker || workerAgg[0]?.name}・直近8件）
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {trendData.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        fontSize: 14,
                        color: C.muted,
                        flexShrink: 0,
                      }}
                    >
                      {d.date}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 20,
                        background: T.bg,
                        borderRadius: 10,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(d.avg / 3) * 100}%`,
                          height: "100%",
                          background: scoreColor(d.avg),
                          borderRadius: 10,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        width: 36,
                        fontSize: 14,
                        fontWeight: 700,
                        color: scoreColor(d.avg),
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {d.avg.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: 評価者バイアス ──────────────────────────────────────────────── */}
      {tab === "bias" && (
        <div
          style={{
            background: C.card,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            overflow: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "評価者",
                  "件数",
                  "勤怠",
                  "安全",
                  "スピード",
                  "機材",
                  "近隣",
                  "全体平均",
                  "判定",
                ].map((h) => (
                  <th key={h} style={TH_STYLE}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evaluatorAgg.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      ...TD_STYLE,
                      textAlign: "center",
                      color: C.muted,
                      padding: 32,
                    }}
                  >
                    該当する評価データがありません
                  </td>
                </tr>
              ) : (
                evaluatorAgg.map(({ name, evals: ee }) => {
                  const catAvgs = EVAL_CATEGORIES.map((cat) =>
                    avgScore(ee.map((e) => e[cat.key] as number))
                  );
                  const overall = avgScore(ee.map((e) => evalAvg(e)));
                  const isStrict = overall < 1.8;
                  const isLenient = overall > 2.8;
                  const flag = isStrict ? "⚠️ 厳格傾向" : isLenient ? "⚠️ 甘め傾向" : "✓ 標準";
                  const flagColor = isStrict || isLenient ? T.primaryDk : "#16A34A";
                  const flagBg = isStrict ? T.primaryLt : isLenient ? T.primaryLt : "#F0FDF4";

                  return (
                    <tr key={name}>
                      <td style={{ ...TD_STYLE, fontWeight: 600 }}>{name}</td>
                      <td style={TD_STYLE}>{ee.length}件</td>
                      {catAvgs.map((avg, i) => (
                        <td
                          key={i}
                          style={{ ...TD_STYLE, textAlign: "center" }}
                        >
                          <AvgCell avg={avg} />
                        </td>
                      ))}
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <AvgCell avg={overall} />
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "5px 12px",
                            borderRadius: 8,
                            background: flagBg,
                            color: flagColor,
                            fontSize: 14,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {(isStrict || isLenient) && (
                            <AlertTriangle size={12} />
                          )}
                          {flag}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div
            style={{
              padding: "12px 20px",
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 14, color: C.muted }}>
              ⚠️ 全体平均 &lt; 1.8：厳格傾向フラグ
            </span>
            <span style={{ fontSize: 14, color: C.muted }}>
              ⚠️ 全体平均 &gt; 2.8：甘め傾向フラグ
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ClipboardIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={C.amber}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  background: C.card,
  fontSize: 14,
  color: C.text,
  cursor: "pointer",
  outline: "none",
  minWidth: 140,
};
