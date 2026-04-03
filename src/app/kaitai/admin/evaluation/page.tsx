"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertTriangle, Check, ChevronLeft, ChevronRight, Save,
  Users, ClipboardList, Star, TrendingUp, Shield, Award,
} from "lucide-react";
import { T } from "../../lib/design-tokens";
import { LICENSE_POINTS } from "../../lib/score-engine";

type ComputedScore = {
  memberId: string;
  evalScore: number;
  licenseFloor: number;
  totalScore: number;
  criteria: { score1: number; score2: number; score3: number; score4: number; score5: number };
  monthsUsed: number;
  grade: string;
  gradeColor: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT = "#9A3412";
const ACCENT_LT = "rgba(154,52,18,0.08)";
const ACCENT_MD = "rgba(154,52,18,0.15)";

const CRITERIA = [
  { key: "score1", label: "現場実績", sub: "安全・品質・スピード" },
  { key: "score2", label: "方針遵守", sub: "近隣配慮・マナー" },
  { key: "score3", label: "責任感", sub: "車両・機材・報連相" },
  { key: "score4", label: "後進育成", sub: "指導・好影響" },
  { key: "score5", label: "向上心", sub: "資格・主体性" },
] as const;

type CriteriaKey = (typeof CRITERIA)[number]["key"];

// ─── Types ───────────────────────────────────────────────────────────────────

type ApiMember = {
  id: string; name: string; kana?: string | null;
  type?: string | null; role?: string | null; avatar?: string | null;
};

type EvalRow = {
  memberId: string;
  score1: number; score2: number; score3: number; score4: number; score5: number;
  memo: string;
  confirmed: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return `${y}年${parseInt(mo)}月`;
}

function prevMonth(m: string) {
  const d = new Date(m + "-01");
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

function nextMonth(m: string) {
  const d = new Date(m + "-01");
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 7);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function avgScore(row: EvalRow) {
  const sum = row.score1 + row.score2 + row.score3 + row.score4 + row.score5;
  return sum > 0 ? (sum / 5).toFixed(1) : "—";
}

function isComplete(row: EvalRow) {
  return row.score1 > 0 && row.score2 > 0 && row.score3 > 0 && row.score4 > 0 && row.score5 > 0;
}

// ─── Score Picker ────────────────────────────────────────────────────────────

function ScorePicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            width: 32, height: 32, borderRadius: 6, fontSize: 13, fontWeight: 700,
            border: value === n ? `2px solid ${ACCENT}` : `1px solid ${T.border}`,
            background: value === n ? ACCENT_LT : "transparent",
            color: value === n ? ACCENT : value > 0 ? T.sub : T.muted,
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminMonthlyEvalPage() {
  const [month, setMonth] = useState(currentMonth);
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [rows, setRows] = useState<Record<string, EvalRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [scores, setScores] = useState<ComputedScore[]>([]);
  const pendingRef = useRef<HTMLDivElement>(null);

  // Fetch decay scores
  const fetchScores = useCallback(async (m: string) => {
    try {
      const res = await fetch(`/api/kaitai/scores?month=${m}`);
      const data = await res.json();
      if (data.ok) setScores(data.scores);
    } catch { /* ignore */ }
  }, []);

  // Fetch members + existing evaluations
  const fetchData = useCallback(async (m: string) => {
    setLoading(true); setSaved(false);
    try {
      const [mRes, eRes] = await Promise.all([
        fetch("/api/kaitai/members"),
        fetch(`/api/kaitai/evaluations?month=${m}`),
      ]);
      const mData = await mRes.json();
      const eData = await eRes.json();

      const memberList: ApiMember[] = mData.ok ? mData.members : [];
      setMembers(memberList);

      const existingEvals: Record<string, EvalRow> = {};
      if (eData.ok && Array.isArray(eData.evaluations)) {
        for (const ev of eData.evaluations) {
          existingEvals[ev.memberId] = {
            memberId: ev.memberId,
            score1: ev.score1, score2: ev.score2, score3: ev.score3,
            score4: ev.score4, score5: ev.score5,
            memo: ev.memo ?? "", confirmed: ev.confirmed,
          };
        }
      }

      // Initialize rows for all members
      const allRows: Record<string, EvalRow> = {};
      for (const mem of memberList) {
        allRows[mem.id] = existingEvals[mem.id] ?? {
          memberId: mem.id,
          score1: 0, score2: 0, score3: 0, score4: 0, score5: 0,
          memo: "", confirmed: false,
        };
      }
      setRows(allRows);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(month); fetchScores(month); }, [month, fetchData, fetchScores]);

  // Update a score
  const setScore = (memberId: string, key: CriteriaKey, value: number) => {
    setRows(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], [key]: value, confirmed: false },
    }));
    setSaved(false);
  };

  const setMemo = (memberId: string, memo: string) => {
    setRows(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], memo, confirmed: false },
    }));
    setSaved(false);
  };

  // Bulk save
  const handleSave = async () => {
    setSaving(true);
    try {
      const evaluations = Object.values(rows)
        .filter(r => r.score1 > 0 || r.score2 > 0 || r.score3 > 0 || r.score4 > 0 || r.score5 > 0)
        .map(r => ({
          memberId: r.memberId,
          score1: r.score1, score2: r.score2, score3: r.score3,
          score4: r.score4, score5: r.score5,
          memo: r.memo || undefined,
        }));

      if (evaluations.length === 0) {
        alert("評価が入力されていません");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/kaitai/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, evaluations }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");

      setSaved(true);
      fetchScores(month); // Refresh scores after save
      // Mark all saved rows as confirmed
      setRows(prev => {
        const next = { ...prev };
        for (const ev of evaluations) {
          if (next[ev.memberId]) next[ev.memberId] = { ...next[ev.memberId], confirmed: true };
        }
        return next;
      });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "エラーが発生しました");
    } finally { setSaving(false); }
  };

  // Stats
  const total = members.length;
  const completed = Object.values(rows).filter(r => isComplete(r)).length;
  const pending = total - completed;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ fontSize: 15, color: T.sub }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 0", maxWidth: 1280 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>月次評価</h1>
          <p style={{ fontSize: 14, color: T.sub, marginTop: 4 }}>
            経営者による全従業員の月次パフォーマンス評価
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700,
            background: saving ? T.muted : ACCENT, color: "#fff",
            border: "none", cursor: saving ? "default" : "pointer",
            transition: "all 0.15s",
          }}
        >
          <Save size={16} />
          {saving ? "保存中..." : saved ? "保存済み ✓" : "評価を確定して保存"}
        </button>
      </div>

      {/* ── Month nav ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, marginBottom: 20,
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 20px",
      }}>
        <button onClick={() => setMonth(prevMonth(month))} style={{
          padding: 6, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", color: T.sub,
        }}><ChevronLeft size={18} /></button>
        <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{monthLabel(month)}</span>
        <button onClick={() => setMonth(nextMonth(month))} style={{
          padding: 6, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", color: T.sub,
        }}><ChevronRight size={18} /></button>
        <button onClick={() => setMonth(currentMonth())} style={{
          marginLeft: 8, padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: ACCENT_LT, color: ACCENT, border: `1px solid ${ACCENT_MD}`, cursor: "pointer",
        }}>今月</button>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Users size={16} style={{ color: "#3B82F6" }} />
            <span style={{ fontSize: 13, color: T.sub }}>対象メンバー</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#3B82F6", lineHeight: 1 }}>{total}<span style={{ fontSize: 14, fontWeight: 600 }}>名</span></p>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Check size={16} style={{ color: "#10B981" }} />
            <span style={{ fontSize: 13, color: T.sub }}>評価完了</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#10B981", lineHeight: 1 }}>{completed}<span style={{ fontSize: 14, fontWeight: 600 }}>名</span></p>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={16} style={{ color: pending > 0 ? "#EF4444" : "#10B981" }} />
            <span style={{ fontSize: 13, color: T.sub }}>未入力</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: pending > 0 ? "#EF4444" : "#10B981", lineHeight: 1 }}>{pending}<span style={{ fontSize: 14, fontWeight: 600 }}>名</span></p>
        </div>
      </div>

      {/* ── Alert Banner ── */}
      {pending > 0 && (
        <button
          onClick={() => pendingRef.current?.scrollIntoView({ behavior: "smooth" })}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "14px 20px", borderRadius: 12, marginBottom: 20,
            background: "#FEF2F2", border: "1px solid #FECACA", cursor: "pointer",
            textAlign: "left",
          }}
        >
          <AlertTriangle size={18} style={{ color: "#DC2626", flexShrink: 0 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#DC2626" }}>
            {monthLabel(month)}度の評価が未完了のメンバー：{pending}名
          </span>
          <span style={{ fontSize: 13, color: "#DC2626", marginLeft: "auto", opacity: 0.7 }}>
            クリックして未入力者へスクロール ↓
          </span>
        </button>
      )}

      {/* ── Evaluation Table ── */}
      {members.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <ClipboardList size={40} style={{ color: T.muted, marginBottom: 12 }} />
          <p style={{ fontSize: 15, color: T.muted }}>メンバーが登録されていません</p>
        </div>
      ) : (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          {/* Sticky header */}
          <div style={{
            position: "sticky", top: 0, zIndex: 10,
            display: "grid", gridTemplateColumns: "44px 160px repeat(5, 1fr) 80px 200px",
            background: "#F8FAFC", borderBottom: `2px solid ${T.border}`,
            padding: "12px 16px", gap: 8, alignItems: "end",
          }}>
            <div />
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>メンバー</div>
            {CRITERIA.map(c => (
              <div key={c.key} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: ACCENT, lineHeight: 1.2 }}>{c.label}</p>
                <p style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{c.sub}</p>
              </div>
            ))}
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, textAlign: "center" }}>平均</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>非公開メモ</div>
          </div>

          {/* Rows — completed first, then pending */}
          {(() => {
            const sorted = [...members].sort((a, b) => {
              const aComplete = isComplete(rows[a.id]);
              const bComplete = isComplete(rows[b.id]);
              if (aComplete !== bComplete) return aComplete ? 1 : -1; // pending first
              return (a.kana ?? a.name).localeCompare(b.kana ?? b.name, "ja");
            });

            let pendingMarkerPlaced = false;

            return sorted.map((mem) => {
              const row = rows[mem.id];
              if (!row) return null;
              const complete = isComplete(row);
              const avg = avgScore(row);
              const avgNum = parseFloat(avg);
              const avgColor = isNaN(avgNum) ? T.muted : avgNum >= 4 ? "#10B981" : avgNum >= 3 ? ACCENT : avgNum >= 2 ? "#F59E0B" : "#EF4444";

              // Place scroll anchor before first pending member
              let anchor = null;
              if (!complete && !pendingMarkerPlaced) {
                pendingMarkerPlaced = true;
                anchor = <div key="anchor" ref={pendingRef} style={{ height: 0 }} />;
              }

              return (
                <div key={mem.id}>
                  {anchor}
                  <div
                    style={{
                      display: "grid", gridTemplateColumns: "44px 160px repeat(5, 1fr) 80px 200px",
                      padding: "14px 16px", gap: 8, alignItems: "center",
                      borderBottom: `1px solid ${T.border}`,
                      background: complete ? "transparent" : "rgba(239,68,68,0.03)",
                    }}
                  >
                    {/* Status badge */}
                    <div>
                      <span style={{
                        display: "inline-block", width: 10, height: 10, borderRadius: "50%",
                        background: complete ? "#10B981" : "#EF4444",
                      }} />
                    </div>

                    {/* Name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{
                        flexShrink: 0, width: 32, height: 32, borderRadius: 8,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: ACCENT_LT, fontSize: 14,
                      }}>{mem.avatar ?? "👤"}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {mem.name}
                        </p>
                        <p style={{ fontSize: 11, color: T.muted }}>{mem.role ?? "作業員"}{mem.type === "外注" ? " ・外注" : ""}</p>
                      </div>
                    </div>

                    {/* 5 score pickers */}
                    {CRITERIA.map(c => (
                      <div key={c.key} style={{ display: "flex", justifyContent: "center" }}>
                        <ScorePicker
                          value={row[c.key]}
                          onChange={v => setScore(mem.id, c.key, v)}
                        />
                      </div>
                    ))}

                    {/* Average */}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: avgColor }}>{avg}</span>
                    </div>

                    {/* Memo */}
                    <div>
                      <input
                        type="text"
                        value={row.memo}
                        onChange={e => setMemo(mem.id, e.target.value)}
                        placeholder="昇給検討メモ..."
                        style={{
                          width: "100%", padding: "6px 10px", fontSize: 12, borderRadius: 6,
                          border: `1px solid ${T.border}`, background: T.bg, color: T.text,
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* ── Score Legend ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 24, marginTop: 16, padding: "12px 20px",
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>評価基準：</span>
        {[
          { score: 1, label: "要改善" },
          { score: 2, label: "やや不足" },
          { score: 3, label: "標準" },
          { score: 4, label: "良好" },
          { score: 5, label: "優秀" },
        ].map(({ score, label }) => (
          <div key={score} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 24, height: 24, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, background: ACCENT_LT, color: ACCENT, border: `1px solid ${ACCENT_MD}`,
            }}>{score}</span>
            <span style={{ fontSize: 12, color: T.sub }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Decay Score Ranking ── */}
      {scores.length > 0 && (
        <div style={{
          marginTop: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 20px", borderBottom: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <TrendingUp size={18} style={{ color: ACCENT }} />
            <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>
              減衰型パフォーマンススコア
            </span>
            <span style={{ fontSize: 12, color: T.muted, marginLeft: 4 }}>
              直近3ヶ月加重平均（当月×0.5 + 先月×0.3 + 先々月×0.2）+ 資格ベース
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 100px 100px 100px 80px", padding: "10px 20px", gap: 8, background: "#F8FAFC", borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, color: T.sub }}>
            <div style={{ textAlign: "center" }}>順位</div>
            <div>メンバー</div>
            <div style={{ textAlign: "center" }}>
              <div>評価スコア</div>
              <div style={{ fontWeight: 500, fontSize: 10, color: T.muted }}>減衰加重平均</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div>資格ベース</div>
              <div style={{ fontWeight: 500, fontSize: 10, color: T.muted }}>{LICENSE_POINTS}pt × 保有数</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div>合計スコア</div>
            </div>
            <div style={{ textAlign: "center" }}>グレード</div>
          </div>

          {scores.map((sc, i) => {
            const mem = members.find(m => m.id === sc.memberId);
            if (!mem) return null;
            return (
              <div key={sc.memberId} style={{
                display: "grid", gridTemplateColumns: "50px 1fr 100px 100px 100px 80px",
                padding: "12px 20px", gap: 8, alignItems: "center",
                borderBottom: `1px solid ${T.border}`,
                background: i < 3 ? "rgba(154,52,18,0.03)" : "transparent",
              }}>
                <div style={{ textAlign: "center" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: 8, fontSize: 13, fontWeight: 800,
                    ...(i === 0 ? { background: "#FEF3C7", color: "#B45309" }
                      : i === 1 ? { background: "#F1F5F9", color: "#475569" }
                      : i === 2 ? { background: "#FFF7ED", color: "#9A3412" }
                      : { background: T.bg, color: T.muted }),
                  }}>{i + 1}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: ACCENT_LT, fontSize: 13,
                  }}>{mem.avatar ?? "👤"}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {mem.name}
                  </span>
                </div>

                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: sc.evalScore > 0 ? T.text : T.muted }}>
                    {sc.evalScore}
                  </span>
                  <span style={{ fontSize: 11, color: T.muted }}> pt</span>
                  {sc.monthsUsed > 0 && (
                    <div style={{ fontSize: 10, color: T.muted }}>{sc.monthsUsed}ヶ月分</div>
                  )}
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Shield size={12} style={{ color: "#3B82F6" }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: sc.licenseFloor > 0 ? "#3B82F6" : T.muted }}>
                      {sc.licenseFloor}
                    </span>
                    <span style={{ fontSize: 11, color: T.muted }}>pt</span>
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: sc.gradeColor }}>
                    {sc.totalScore}
                  </span>
                  <span style={{ fontSize: 11, color: T.muted }}> pt</span>
                </div>

                <div style={{ textAlign: "center" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 36, height: 36, borderRadius: 10, fontSize: 16, fontWeight: 800,
                    background: `${sc.gradeColor}15`, color: sc.gradeColor,
                    border: `2px solid ${sc.gradeColor}30`,
                  }}>{sc.grade}</span>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>計算式：</span>
            <span style={{ fontSize: 11, color: T.muted }}>
              合計 = 評価スコア（当月×0.5 + 先月×0.3 + 先々月×0.2 → 0〜500pt） + 資格ベース（{LICENSE_POINTS}pt × 保有数）
            </span>
            <span style={{ fontSize: 11, color: T.muted }}>|</span>
            <span style={{ fontSize: 11, color: T.muted }}>
              資格保有者はスコア下限200pt保護
            </span>
          </div>
        </div>
      )}

      {/* ── Bottom save bar ── */}
      <div style={{
        position: "sticky", bottom: 0, marginTop: 20, padding: "16px 20px",
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 -4px 12px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Star size={18} style={{ color: ACCENT }} />
          <span style={{ fontSize: 14, color: T.sub }}>
            {completed}/{total}名 評価完了
            {pending > 0 && <span style={{ color: "#EF4444", fontWeight: 700, marginLeft: 8 }}>（未入力 {pending}名）</span>}
          </span>
          {saved && <span style={{ fontSize: 13, fontWeight: 600, color: "#10B981", marginLeft: 12 }}>✓ 保存済み</span>}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 28px", borderRadius: 12, fontSize: 15, fontWeight: 700,
            background: saving ? T.muted : ACCENT, color: "#fff",
            border: "none", cursor: saving ? "default" : "pointer",
          }}
        >
          <Save size={16} />
          {saving ? "保存中..." : "評価を確定して保存"}
        </button>
      </div>
    </div>
  );
}
