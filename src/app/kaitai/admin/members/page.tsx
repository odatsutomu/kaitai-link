"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Search, Award, Shield, Plus, X, Users, Clock, AlertTriangle,
  ChevronRight, Star, Briefcase, TrendingUp,
} from "lucide-react";
import {
  MEMBER_STATS, LICENSE_LABELS,
  experienceYears, experienceLevel,
  type Member, type License,
} from "../../lib/members";

// ─── API member → local Member adapter ───────────────────────────────────────
type ApiMember = {
  id: string; name: string; kana?: string | null;
  type?: string | null; company2?: string | null;
  role?: string | null; birthDate?: string | null;
  hireDate?: string | null; address?: string | null;
  emergency?: string | null; licenses?: string[] | null;
  preYears?: number | null; siteCount?: number | null;
  dayRate?: number | null; avatar?: string | null;
};

function toMember(a: ApiMember): Member {
  return {
    id: a.id, name: a.name,
    kana: a.kana ?? "", type: (a.type as "直用" | "外注") ?? "直用",
    company: a.company2 ?? undefined,
    birthDate: a.birthDate ?? "", hireDate: a.hireDate ?? "",
    address: a.address ?? "", emergency: a.emergency ?? "",
    licenses: (a.licenses ?? []) as License[],
    preYears: a.preYears ?? 0, siteCount: a.siteCount ?? 0,
    dayRate: a.dayRate ?? 0, role: a.role ?? "作業員",
    avatar: a.avatar ?? "👤",
  };
}

// ─── Design palette ──────────────────────────────────────────────────────────
const P = {
  white: "#FFFFFF",
  bg: "#F8FAFC",
  text: "#333333",
  sub: "#555555",
  muted: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  orange: "#F97316",
  orangeDk: "#EA580C",
  orangeLt: "rgba(249,115,22,0.08)",
  orangeMd: "rgba(249,115,22,0.12)",

  blue: "#3B82F6",
  blueLt: "rgba(59,130,246,0.08)",
  blueMd: "rgba(59,130,246,0.12)",

  green: "#22C55E",
  greenLt: "rgba(34,197,94,0.08)",

  red: "#EF4444",
  redLt: "rgba(239,68,68,0.08)",

  purple: "#8B5CF6",
  purpleLt: "rgba(139,92,246,0.08)",
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
type ScoreData = { memberId: string; totalScore: number; grade: string; gradeColor: string };

function scoreColor(total: number): string {
  if (total >= 900) return P.purple;
  if (total >= 750) return P.orangeDk;
  if (total >= 600) return P.green;
  if (total >= 450) return P.blue;
  return P.red;
}

function scoreBg(total: number): string {
  if (total >= 900) return P.purpleLt;
  if (total >= 750) return P.orangeLt;
  if (total >= 600) return P.greenLt;
  if (total >= 450) return P.blueLt;
  return P.redLt;
}

type SortOrder = "スコア" | "経験" | "日当";

const EMPTY_STATS = {
  memberId: "", workDays: 0, lateDays: 0, absentDays: 0, totalHours: 0,
  avgOvertime: 0, attendancePct: 0, calendar: [] as ("出勤" | "遅刻" | "欠勤" | "休日" | "未来")[],
  radar: { attendance: 50, safety: 50, skill: 50, communication: 50, efficiency: 50 },
  efficiencyDelta: 0, ruleViolations: 0, positiveFeedback: [] as string[],
  troubles: [] as { id: string; date: string; site: string; type: string; detail: string; adminScore: number | null; adminMemo?: string }[],
  siteEvals: [] as { date: string; site: string; role: string; tags: string[]; memo?: string }[],
};

function getStats(memberId: string) {
  return MEMBER_STATS.find(x => x.memberId === memberId) ?? { ...EMPTY_STATS, memberId };
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, color, iconBg }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; iconBg: string;
}) {
  return (
    <div style={{
      background: P.white, borderRadius: 12, padding: "18px 20px",
      border: `1px solid ${P.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center" style={{
          width: 40, height: 40, borderRadius: 10, background: iconBg,
        }}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 12, fontWeight: 600, color: P.muted, letterSpacing: "0.02em" }}>{label}</p>
          <p style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1, marginTop: 2 }}>{value}</p>
        </div>
      </div>
      <p style={{ fontSize: 12, color: P.muted, marginTop: 8 }}>{sub}</p>
    </div>
  );
}

// ─── Compact Member Grid Card ────────────────────────────────────────────────
function CompactMemberCard({ m, score }: { m: Member; score?: ScoreData }) {
  const yrs = experienceYears(m);
  const lvl = experienceLevel(yrs);
  const stats = getStats(m.id);
  const sc = score?.totalScore ?? 0;
  const scCol = scoreColor(sc);
  const scBg = scoreBg(sc);
  const hasWarning = stats.troubles.length > 0 || stats.ruleViolations > 1 || stats.lateDays >= 3;
  const attPct = stats.attendancePct;
  const attColor = attPct >= 95 ? P.green : attPct >= 80 ? P.orange : P.red;

  return (
    <Link href={`/kaitai/admin/members/${m.id}`}>
      <div style={{
        background: P.white,
        border: hasWarning ? `1.5px solid rgba(239,68,68,0.3)` : `1px solid ${P.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
        className="hover:shadow-md active:scale-[0.995]"
      >
        {/* Top row: avatar + name + score */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 flex items-center justify-center" style={{
            width: 42, height: 42, borderRadius: 10,
            background: lvl.bg, fontSize: 18,
          }}>
            {m.avatar}
          </div>

          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span style={{ fontSize: 15, fontWeight: 700, color: P.text }}>{m.name}</span>
              {m.type === "外注" && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                  background: P.blueLt, color: P.blue,
                }}>外注</span>
              )}
              {hasWarning && (
                <AlertTriangle size={13} style={{ color: P.red }} />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                background: lvl.bg, color: lvl.color,
              }}>{lvl.label}</span>
              <span style={{ fontSize: 11, color: P.muted }}>{yrs}年</span>
              <span style={{ fontSize: 11, color: P.muted }}>·</span>
              <span style={{ fontSize: 11, color: P.muted }}>{m.siteCount}現場</span>
            </div>
          </div>

          {/* Score badge */}
          <div className="flex-shrink-0 flex flex-col items-center" style={{ minWidth: 48 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: scBg,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: scCol, lineHeight: 1 }}>{sc}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: scCol, opacity: 0.7 }}>pt</span>
            </div>
          </div>
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${P.borderLight}` }}>
          {/* Attendance mini bar */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: 10, color: P.muted }}>出勤率</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: attColor }}>{attPct}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: P.borderLight, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${attPct}%`, borderRadius: 2, background: attColor, transition: "width 0.3s ease" }} />
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: P.borderLight }} />

          {/* Licenses */}
          <div className="flex items-center gap-1">
            <Shield size={12} style={{ color: P.orange }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: P.sub }}>{m.licenses.length}</span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: P.borderLight }} />

          {/* Day rate */}
          <span style={{ fontSize: 12, fontWeight: 600, color: P.muted }}>
            ¥{m.dayRate?.toLocaleString("ja-JP") ?? "—"}
          </span>

          {/* Arrow */}
          <ChevronRight size={14} style={{ color: P.muted, marginLeft: "auto" }} />
        </div>
      </div>
    </Link>
  );
}

// ─── Skill Summary Bar ───────────────────────────────────────────────────────
function SkillSummary({ members }: { members: Member[] }) {
  const stats = Object.entries(LICENSE_LABELS).map(([key, label]) => ({
    key, label,
    count: members.filter(m => m.licenses.includes(key as License)).length,
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  if (stats.length === 0) return null;

  return (
    <div style={{
      background: P.white, borderRadius: 12, padding: "16px 20px",
      border: `1px solid ${P.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} style={{ color: P.orange }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: P.text }}>資格分布</span>
        <span style={{ fontSize: 12, color: P.muted, marginLeft: "auto" }}>{members.length}名中</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {stats.map(({ key, label, count }) => {
          const pct = Math.round((count / members.length) * 100);
          return (
            <div key={key} className="flex items-center gap-2" style={{ minWidth: 140 }}>
              <span style={{ fontSize: 12, color: P.sub, width: 90, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: P.borderLight, minWidth: 40 }}>
                <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: pct >= 80 ? P.green : pct >= 40 ? P.orange : P.blue }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: P.muted, width: 28, textAlign: "right" }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────
const AVATAR_OPTIONS = ["👤", "👷", "🔧", "🏗", "🚜", "🦺", "💪", "⛑", "🔨", "🪖"];

function AddMemberModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", kana: "", type: "直用" as "直用" | "外注",
    company2: "", role: "作業員", birthDate: "", hireDate: "",
    address: "", emergency: "", preYears: "0", dayRate: "0",
    avatar: "👷", licenses: [] as string[],
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const toggleLicense = (lic: string) =>
    setForm(f => ({
      ...f,
      licenses: f.licenses.includes(lic)
        ? f.licenses.filter(l => l !== lic)
        : [...f.licenses, lic],
    }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("名前を入力してください"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/kaitai/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          kana: form.kana.trim() || null,
          type: form.type,
          company2: form.type === "外注" ? form.company2.trim() || null : null,
          role: form.role.trim() || "作業員",
          birthDate: form.birthDate || null,
          hireDate: form.hireDate || null,
          address: form.address.trim() || null,
          emergency: form.emergency.trim() || null,
          licenses: form.licenses,
          preYears: parseInt(form.preYears) || 0,
          dayRate: parseInt(form.dayRate) || 0,
          avatar: form.avatar,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "保存に失敗しました");
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", fontSize: 15, borderRadius: 10,
    border: `1px solid ${P.border}`, background: P.bg, color: P.text,
    outline: "none",
  } as const;
  const labelStyle = { fontSize: 13, fontWeight: 600, color: P.sub, marginBottom: 4, display: "block" } as const;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={onClose} />
      <div style={{
        position: "relative", background: P.white, borderRadius: 16, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflow: "auto", padding: 0,
      }}>
        {/* Header */}
        <div style={{
          position: "sticky", top: 0, background: P.white, padding: "20px 24px 16px",
          borderBottom: `1px solid ${P.border}`, zIndex: 1,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: P.text }}>メンバー追加</h2>
          <button onClick={onClose} style={{ padding: 8, borderRadius: 8, color: P.sub, background: "transparent", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: P.redLt, border: "1px solid rgba(239,68,68,0.2)", color: P.red, fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* Avatar */}
          <div>
            <label style={labelStyle}>アバター</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {AVATAR_OPTIONS.map(a => (
                <button key={a} onClick={() => set("avatar", a)} style={{
                  width: 44, height: 44, borderRadius: 12, fontSize: 20,
                  border: form.avatar === a ? `2px solid ${P.orange}` : `1px solid ${P.border}`,
                  background: form.avatar === a ? P.orangeLt : P.bg,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>{a}</button>
              ))}
            </div>
          </div>

          {/* Name row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>名前 <span style={{ color: P.red }}>*</span></label>
              <input style={inputStyle} placeholder="山田 太郎" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>フリガナ</label>
              <input style={inputStyle} placeholder="ヤマダ タロウ" value={form.kana} onChange={e => set("kana", e.target.value)} />
            </div>
          </div>

          {/* Type + Role */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>雇用区分</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["直用", "外注"] as const).map(t => (
                  <button key={t} onClick={() => set("type", t)} style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                    border: form.type === t ? `2px solid ${P.orange}` : `1px solid ${P.border}`,
                    background: form.type === t ? P.orangeLt : P.bg,
                    color: form.type === t ? P.orangeDk : P.sub,
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>役職</label>
              <input style={inputStyle} placeholder="作業員" value={form.role} onChange={e => set("role", e.target.value)} />
            </div>
          </div>

          {form.type === "外注" && (
            <div>
              <label style={labelStyle}>外注先会社名</label>
              <input style={inputStyle} placeholder="株式会社○○" value={form.company2} onChange={e => set("company2", e.target.value)} />
            </div>
          )}

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>生年月日</label>
              <input type="date" style={inputStyle} value={form.birthDate} onChange={e => set("birthDate", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>入社日</label>
              <input type="date" style={inputStyle} value={form.hireDate} onChange={e => set("hireDate", e.target.value)} />
            </div>
          </div>

          {/* Experience + Day rate */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>前職経験年数</label>
              <input type="number" style={inputStyle} min="0" value={form.preYears} onChange={e => set("preYears", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>日当（円）</label>
              <input type="number" style={inputStyle} min="0" step="1000" value={form.dayRate} onChange={e => set("dayRate", e.target.value)} />
            </div>
          </div>

          {/* Address + Emergency */}
          <div>
            <label style={labelStyle}>住所</label>
            <input style={inputStyle} placeholder="岡山県岡山市..." value={form.address} onChange={e => set("address", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>緊急連絡先</label>
            <input style={inputStyle} placeholder="090-XXXX-XXXX（妻）" value={form.emergency} onChange={e => set("emergency", e.target.value)} />
          </div>

          {/* Licenses */}
          <div>
            <label style={labelStyle}>保有資格</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(LICENSE_LABELS).map(([key, label]) => {
                const selected = form.licenses.includes(key);
                return (
                  <button key={key} onClick={() => toggleLicense(key)} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: selected ? `2px solid ${P.orange}` : `1px solid ${P.border}`,
                    background: selected ? P.orangeLt : P.bg,
                    color: selected ? P.orangeDk : P.sub,
                  }}>{label}</button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={saving} style={{
            width: "100%", padding: "14px 0", borderRadius: 12, fontSize: 16, fontWeight: 700,
            background: saving ? P.muted : P.orange, color: P.white, border: "none",
            cursor: saving ? "default" : "pointer", marginTop: 4,
          }}>
            {saving ? "保存中..." : "追加する"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminMembersPage() {
  const [query, setQuery]         = useState("");
  const [typeFilter, setTypeFilter] = useState<"全員" | "直用" | "外注">("全員");
  const [sortOrder, setSortOrder]   = useState<SortOrder>("スコア");
  const [showAddModal, setShowAddModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [scores, setScores] = useState<Map<string, ScoreData>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    try {
      const memRes = await fetch("/api/kaitai/members");
      const memData = await memRes.json();
      if (memData.ok && Array.isArray(memData.members)) {
        setMembers(memData.members.map(toMember));
      }
      try {
        const scoreRes = await fetch(`/api/kaitai/scores?month=${new Date().toISOString().slice(0, 7)}`);
        const scoreData = await scoreRes.json();
        if (scoreData.ok && Array.isArray(scoreData.scores)) {
          const map = new Map<string, ScoreData>();
          for (const s of scoreData.scores) {
            map.set(s.memberId, s);
          }
          setScores(map);
        }
      } catch { /* scores unavailable */ }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // ── Derived data ──
  const sorted = [...members].sort((a, b) => {
    if (sortOrder === "経験") return experienceYears(b) - experienceYears(a);
    if (sortOrder === "日当") return (b.dayRate ?? 0) - (a.dayRate ?? 0);
    return (scores.get(b.id)?.totalScore ?? 0) - (scores.get(a.id)?.totalScore ?? 0);
  });

  const filtered = sorted.filter(m => {
    const matchType  = typeFilter === "全員" || m.type === typeFilter;
    const matchQuery = query === "" || m.name.includes(query) || m.kana.includes(query)
      || m.licenses.some(l => (LICENSE_LABELS[l] ?? l).includes(query));
    return matchType && matchQuery;
  });

  const direct  = members.filter(m => m.type === "直用").length;
  const outside = members.filter(m => m.type === "外注").length;
  const memberStatsAll = members.map(m => getStats(m.id));
  const avgAtt  = memberStatsAll.length > 0 ? Math.round(memberStatsAll.reduce((s, x) => s + x.attendancePct, 0) / memberStatsAll.length) : 0;
  const totalTrouble = memberStatsAll.reduce((s, x) => s + x.troubles.length, 0);
  const totalLicenses = members.reduce((s, m) => s + m.licenses.length, 0);

  if (loading) {
    return (
      <div className="py-6 flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: `3px solid ${P.border}`, borderTopColor: P.orange,
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 14, color: P.muted, marginTop: 12 }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="py-5 flex flex-col gap-5 pb-8">

      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); fetchMembers(); }}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: P.text, letterSpacing: "-0.02em" }}>従業員管理</h1>
          <p style={{ fontSize: 13, marginTop: 2, color: P.muted }}>
            {members.length}名登録（直用 {direct} · 外注 {outside}）
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 flex-shrink-0 transition-all active:scale-95 hover:opacity-90"
          style={{
            background: P.orange, color: P.white, fontSize: 14, fontWeight: 700,
            padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer",
          }}
        >
          <Plus size={16} />
          追加
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          icon={<Users size={18} style={{ color: P.blue }} />}
          iconBg={P.blueLt}
          label="総メンバー数"
          value={`${members.length}`}
          sub={`直用 ${direct}名 · 外注 ${outside}社`}
          color={P.blue}
        />
        <KPICard
          icon={<Clock size={18} style={{ color: avgAtt >= 90 ? P.green : P.orange }} />}
          iconBg={avgAtt >= 90 ? P.greenLt : P.orangeLt}
          label="当月出勤率"
          value={`${avgAtt}%`}
          sub="月間平均"
          color={avgAtt >= 90 ? P.green : P.orange}
        />
        <KPICard
          icon={<AlertTriangle size={18} style={{ color: totalTrouble > 0 ? P.red : P.green }} />}
          iconBg={totalTrouble > 0 ? P.redLt : P.greenLt}
          label="トラブル"
          value={`${totalTrouble}`}
          sub="今月累計"
          color={totalTrouble > 0 ? P.red : P.green}
        />
        <KPICard
          icon={<Award size={18} style={{ color: P.orange }} />}
          iconBg={P.orangeLt}
          label="保有資格合計"
          value={`${totalLicenses}`}
          sub={`${Object.keys(LICENSE_LABELS).length}種類中`}
          color={P.orangeDk}
        />
      </div>

      {/* ── Control bar: Search + Filter + Sort ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 flex-1" style={{
          background: P.white, border: `1px solid ${P.border}`, borderRadius: 10,
        }}>
          <Search size={16} style={{ color: P.muted }} />
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="氏名・資格で検索…"
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 14, color: P.text, border: "none" }}
          />
        </div>

        {/* Type filter pills */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: P.bg }}>
          {(["全員", "直用", "外注"] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                ...(typeFilter === t
                  ? { background: P.white, color: P.orange, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                  : { background: "transparent", color: P.muted })
              }}
            >{t}</button>
          ))}
        </div>

        {/* Sort pills */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: P.bg }}>
          {(["スコア", "経験", "日当"] as SortOrder[]).map(s => (
            <button key={s} onClick={() => setSortOrder(s)}
              style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                ...(sortOrder === s
                  ? { background: P.white, color: P.orange, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                  : { background: "transparent", color: P.muted })
              }}
            >{s}順</button>
          ))}
        </div>
      </div>

      {/* ── Member Grid ── */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(m => (
            <CompactMemberCard key={m.id} m={m} score={scores.get(m.id)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Users size={32} style={{ color: P.muted }} />
          <p style={{ fontSize: 15, color: P.muted }}>該当するメンバーがいません</p>
        </div>
      )}

      {/* ── Skill Distribution ── */}
      {members.length > 0 && <SkillSummary members={members} />}

    </div>
  );
}
