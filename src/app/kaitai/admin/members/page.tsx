"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Search, Star, Award, Shield, TrendingUp, TrendingDown,
  AlertTriangle, Zap, Users, Clock, Plus, BarChart2, X, ClipboardList,
} from "lucide-react";
import {
  MEMBER_STATS, LICENSE_LABELS,
  experienceYears, experienceLevel,
  type Member, type License,
} from "../../lib/members";
import { T } from "../../lib/design-tokens";

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

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: T.sub,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
  green: "#10B981", red: "#EF4444",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Stars({ n, color }: { n: number; color: string }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} fill={i < n ? color : "transparent"} style={{ color: i < n ? color : T.border }} />
      ))}
    </span>
  );
}

type SortOrder = "名前" | "経験" | "スコア";

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

function activityScore(m: Member): number {
  const s = getStats(m.id);
  const att = s.attendancePct * 0.5;
  const eff = (50 + Math.max(-50, Math.min(50, s.efficiencyDelta))) * 0.3;
  const lic = Math.min(15, m.licenses.length * 3);
  const pen = s.ruleViolations * 5 + s.lateDays * 2;
  return Math.max(0, Math.min(100, Math.round(att + eff + lic - pen)));
}

// ─── Mini radar sparkline ──────────────────────────────────────────────────────
function MiniRadar({ radar }: { radar: Record<string, number> }) {
  const vals = Object.values(radar);
  const n = vals.length;
  const cx = 24, cy = 24, r = 18;
  const angles = vals.map((_, i) => (i * 2 * Math.PI) / n - Math.PI / 2);
  const pts = vals.map((v, i) => {
    const x = cx + (r * v / 100) * Math.cos(angles[i]);
    const y = cy + (r * v / 100) * Math.sin(angles[i]);
    return `${x},${y}`;
  }).join(" ");
  const bgPts = angles.map(a => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`).join(" ");
  return (
    <svg viewBox="0 0 48 48" width={40} height={40}>
      <polygon points={bgPts} fill="none" stroke={T.border} strokeWidth="0.8" />
      <polygon points={pts} fill={T.primaryMd} stroke={T.primary} strokeWidth="1.2" />
    </svg>
  );
}

// ─── Alert section ────────────────────────────────────────────────────────────
function AlertSection({ members: MEMBERS }: { members: Member[] }) {
  const warnings = MEMBERS.filter(m => {
    const s = getStats(m.id);
    return s.troubles.length > 0 || s.ruleViolations > 1 || s.lateDays >= 3;
  });
  const rising = MEMBERS.filter(m => {
    const s = getStats(m.id);
    return s.efficiencyDelta >= 10;
  });
  if (warnings.length === 0 && rising.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {warnings.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} style={{ color: "#DC2626" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#DC2626" }}>要注意メンバー</span>
            <span style={{ fontSize: 14, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: "#FEE2E2", color: "#DC2626", marginLeft: "auto" }}>
              {warnings.length}名
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {warnings.map(m => {
              const s = getStats(m.id);
              const reasons = [
                s.ruleViolations > 0 && `ルール違反 ${s.ruleViolations}件`,
                s.troubles.length > 0 && `トラブル ${s.troubles.length}件`,
                s.lateDays >= 3 && `遅刻 ${s.lateDays}回`,
              ].filter(Boolean).join("・");
              return (
                <Link key={m.id} href={`/kaitai/admin/members/${m.id}`}>
                  <div className="flex items-center gap-3 py-1.5 hover:opacity-80 transition-opacity">
                    <div className="flex-shrink-0 flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: "#FEE2E2", color: "#DC2626", fontSize: 14, fontWeight: 700 }}>
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{m.name}</p>
                      <p style={{ fontSize: 13, color: "#DC2626" }}>{reasons}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      {rising.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} style={{ color: "#7C3AED" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#7C3AED" }}>パフォーマンス急上昇</span>
            <span style={{ fontSize: 14, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: "#EDE9FE", color: "#7C3AED", marginLeft: "auto" }}>
              {rising.length}名
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {rising.map(m => {
              const s = getStats(m.id);
              return (
                <Link key={m.id} href={`/kaitai/admin/members/${m.id}`}>
                  <div className="flex items-center gap-3 py-1.5 hover:opacity-80 transition-opacity">
                    <div className="flex-shrink-0 flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: "#EDE9FE", color: "#7C3AED", fontSize: 14, fontWeight: 700 }}>
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{m.name}</p>
                      <p style={{ fontSize: 13, color: "#7C3AED" }}>効率スコア +{s.efficiencyDelta}% ↑</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skill map ────────────────────────────────────────────────────────────────
function SkillMap({ members: MEMBERS }: { members: Member[] }) {
  const stats = Object.entries(LICENSE_LABELS).map(([key, label]) => ({
    key, label,
    count: MEMBERS.filter(m => m.licenses.includes(key as License)).length,
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  return (
    <div className="p-5" style={{ background: C.card, border: `1px solid ${C.border}`,
 borderRadius: 16 }}>
      <div className="flex items-center gap-2 mb-4">
        <Shield size={16} style={{ color: C.amber }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: C.amber }}>資格スキルマップ（{MEMBERS.length}名）</p>
      </div>
      <div className="flex flex-col gap-3">
        {stats.map(({ key, label, count }) => {
          const pct = Math.round((count / MEMBERS.length) * 100);
          return (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span style={{ fontSize: 13, color: C.sub }}>{label}</span>
                <span style={{ fontSize: 13, color: C.muted }}>{count}/{MEMBERS.length}名</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.bg }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? C.green : pct >= 50 ? C.amber : "#3B82F6" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Member card (admin) ──────────────────────────────────────────────────────
function MemberCard({ m, rank }: { m: Member; rank: number }) {
  const yrs = experienceYears(m);
  const lvl = experienceLevel(yrs);
  const s   = getStats(m.id);

  const hasWarning  = s.troubles.length > 0 || s.ruleViolations > 1 || s.lateDays >= 3;
  const isRising    = s.efficiencyDelta >= 10;
  const attendColor = s.attendancePct >= 95 ? C.green : s.attendancePct >= 80 ? C.amber : C.red;
  const effColor    = s.efficiencyDelta > 0 ? C.green : C.red;

  return (
    <Link href={`/kaitai/admin/members/${m.id}`}>
      <div
        className="p-5 hover:shadow-md active:scale-[0.99] transition-all"
        style={{
          background: C.card,
          border: hasWarning ? "1.5px solid #FECACA" : `1px solid ${C.border}`,
          borderRadius: 16,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 flex items-center justify-center rounded-md"
            style={{
              width: 28, height: 28, fontSize: 14, fontWeight: 700,
              ...(rank === 0 ? { background: T.primaryLt, color: T.primaryDk }
              : rank === 1 ? { background: T.bg, color: T.sub }
              : rank === 2 ? { background: "${T.primaryLt}", color: "#92400E" }
              : { background: T.bg, color: T.muted })
            }}
          >
            {rank + 1}
          </div>
          <div className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold"
            style={{ width: 44, height: 44, background: lvl.bg, color: lvl.color, fontSize: 16 }}>
            {m.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{m.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: lvl.bg, color: lvl.color }}>{lvl.label}</span>
              {m.type === "外注" && <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: "#EFF6FF", color: "#2563EB" }}>外注</span>}
              {hasWarning && <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: "#FEF2F2", color: "#DC2626" }}>⚠ 要注意</span>}
              {isRising && <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: "#F5F3FF", color: "#7C3AED" }}>⚡ 急成長</span>}
            </div>
            <div className="flex items-center gap-2">
              <Stars n={lvl.stars} color={lvl.color} />
              <span style={{ fontSize: 13, color: C.muted }}>{yrs}年・{m.siteCount}現場</span>
            </div>
          </div>
          <MiniRadar radar={s.radar} />
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 px-1" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-1">
            <Clock size={12} style={{ color: attendColor }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: attendColor }}>出勤率 {s.attendancePct}%</span>
          </div>
          <div style={{ width: 1, height: 12, background: C.border }} />
          <div className="flex items-center gap-1">
            {s.efficiencyDelta >= 0 ? <TrendingUp size={12} style={{ color: effColor }} /> : <TrendingDown size={12} style={{ color: effColor }} />}
            <span style={{ fontSize: 13, fontWeight: 600, color: effColor }}>効率 {s.efficiencyDelta > 0 ? "+" : ""}{s.efficiencyDelta}%</span>
          </div>
          <div style={{ width: 1, height: 12, background: C.border }} />
          <div className="flex items-center gap-1">
            <Award size={12} style={{ color: T.primaryDk }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: T.primaryDk }}>資格 {m.licenses.length}</span>
          </div>
          {s.troubles.length > 0 && (
            <>
              <div style={{ width: 1, height: 12, background: C.border }} />
              <div className="flex items-center gap-1">
                <AlertTriangle size={12} style={{ color: C.red }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.red }}>トラブル {s.troubles.length}件</span>
              </div>
            </>
          )}
          <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: C.muted }}>
            日当 ¥{m.dayRate?.toLocaleString("ja-JP") ?? "—"}
          </span>
        </div>
        {/* Skill sheet link */}
        <Link
          href={`/kaitai/admin/skills/member?id=${m.id}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center justify-center gap-2 mt-3 pt-3 active:scale-[0.98] transition-all"
          style={{
            borderTop: `1px solid ${C.border}`, padding: "10px 0",
            fontSize: 13, fontWeight: 700, color: C.amber, textDecoration: "none",
          }}
        >
          <ClipboardList size={14} />
          スキルチェックシート
        </Link>
      </div>
    </Link>
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
    border: `1px solid ${T.border}`, background: T.bg, color: T.text,
    outline: "none",
  } as const;
  const labelStyle = { fontSize: 13, fontWeight: 600, color: T.sub, marginBottom: 4, display: "block" } as const;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div style={{
        position: "relative", background: T.surface, borderRadius: 16, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflow: "auto", padding: 0,
      }}>
        {/* Header */}
        <div style={{ position: "sticky", top: 0, background: T.surface, padding: "20px 24px 16px",
          borderBottom: `1px solid ${T.border}`, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>メンバー追加</h2>
          <button onClick={onClose} style={{ padding: 8, borderRadius: 8, color: T.sub, background: "transparent", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* Avatar */}
          <div>
            <label style={labelStyle}>アバター</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {AVATAR_OPTIONS.map(a => (
                <button key={a} onClick={() => set("avatar", a)} style={{
                  width: 44, height: 44, borderRadius: 12, fontSize: 20, border: form.avatar === a ? `2px solid ${T.primary}` : `1px solid ${T.border}`,
                  background: form.avatar === a ? T.primaryLt : T.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>{a}</button>
              ))}
            </div>
          </div>

          {/* Name row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>名前 <span style={{ color: "#DC2626" }}>*</span></label>
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
                    border: form.type === t ? `2px solid ${T.primary}` : `1px solid ${T.border}`,
                    background: form.type === t ? T.primaryLt : T.bg,
                    color: form.type === t ? T.primaryDk : T.sub,
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
                    border: selected ? `2px solid ${T.primary}` : `1px solid ${T.border}`,
                    background: selected ? T.primaryLt : T.bg,
                    color: selected ? T.primaryDk : T.sub,
                  }}>{label}</button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={saving} style={{
            width: "100%", padding: "14px 0", borderRadius: 12, fontSize: 16, fontWeight: 700,
            background: saving ? T.muted : T.primary, color: T.surface, border: "none", cursor: saving ? "default" : "pointer",
            marginTop: 4,
          }}>
            {saving ? "保存中..." : "追加する"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type Tab = "一覧" | "勤怠" | "資格";

export default function AdminMembersPage() {
  const [tab, setTab]             = useState<Tab>("一覧");
  const [query, setQuery]         = useState("");
  const [typeFilter, setTypeFilter] = useState<"全員" | "直用" | "外注">("全員");
  const [sortOrder, setSortOrder]   = useState<SortOrder>("名前");
  const [showAddModal, setShowAddModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/kaitai/members");
      const data = await res.json();
      if (data.ok && Array.isArray(data.members)) {
        setMembers(data.members.map(toMember));
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const MEMBERS = members; // alias for compatibility with existing code

  const sorted = [...MEMBERS].sort((a, b) => {
    if (sortOrder === "経験") {
      const diff = b.siteCount - a.siteCount;
      return diff !== 0 ? diff : experienceYears(b) - experienceYears(a);
    }
    if (sortOrder === "スコア") return activityScore(b) - activityScore(a);
    return a.kana.localeCompare(b.kana, "ja");
  });

  const filtered = sorted.filter(m => {
    const matchType  = typeFilter === "全員" || m.type === typeFilter;
    const matchQuery = query === "" || m.name.includes(query) || m.kana.includes(query)
      || m.licenses.some(l => (LICENSE_LABELS[l] ?? l).includes(query));
    return matchType && matchQuery;
  });

  const direct   = MEMBERS.filter(m => m.type === "直用").length;
  const outside  = MEMBERS.filter(m => m.type === "外注").length;
  const memberStats = MEMBERS.map(m => getStats(m.id));
  const avgAtt   = memberStats.length > 0 ? Math.round(memberStats.reduce((s, x) => s + x.attendancePct, 0) / memberStats.length) : 0;
  const totalTrouble = memberStats.reduce((s, x) => s + x.troubles.length, 0);

  const attRanked = [...MEMBERS].sort((a, b) => {
    const sa = getStats(a.id);
    const sb = getStats(b.id);
    return sb.attendancePct - sa.attendancePct;
  });

  if (loading) {
    return (
      <div className="py-6 flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
        <p style={{ fontSize: 15, color: T.sub }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-6 pb-8">

      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); fetchMembers(); }}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>従業員管理</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>
            登録 {MEMBERS.length}名（直用 {direct}名・外注 {outside}社）
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 flex-shrink-0 transition-all active:scale-95 hover:opacity-90"
          style={{ background: T.primary, color: T.surface, fontSize: 15, fontWeight: 600, padding: "12px 20px", borderRadius: 12 }}
        >
          <Plus size={16} />
          メンバー追加
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "総メンバー数",   value: `${MEMBERS.length}名`,   color: "#3B82F6", note: `直用${direct}・外注${outside}` },
          { label: "当月出勤率",     value: `${avgAtt}%`,            color: avgAtt >= 90 ? C.green : C.amber, note: "月間平均" },
          { label: "トラブル件数",   value: `${totalTrouble}件`,     color: totalTrouble > 0 ? C.red : C.green, note: "今月累計" },
          { label: "保有資格合計",   value: `${MEMBERS.reduce((s, m) => s + m.licenses.length, 0)}件`, color: T.primaryDk, note: "全資格数" },
        ].map(({ label, value, color, note }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`,
 borderRadius: 16, padding: "20px" }}>
            <p style={{ fontSize: 13, color: C.sub, marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 12, marginTop: 4, color: C.muted }}>{note}</p>
          </div>
        ))}
      </div>

      {/* ── 2-col layout ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left sidebar */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4">
          <AlertSection members={MEMBERS} />
          <SkillMap members={MEMBERS} />
        </div>

        {/* Right: list */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Search + filter + sort */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <Search size={16} style={{ color: C.muted }} />
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="氏名・資格で検索…"
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 15, color: C.text }}
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                {(["全員", "直用", "外注"] as const).map(t => (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    className="px-4 py-2 rounded-xl transition-all"
                    style={{
                      fontSize: 14, fontWeight: 700, borderRadius: 10,
                      ...(typeFilter === t
                        ? { background: T.primaryLt, color: C.amberDk, border: `1px solid ${T.primaryMd}` }
                        : { background: C.card, color: C.sub, border: `1px solid ${C.border}` })
                    }}
                  >{t}</button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 13, color: C.muted }}>並び替え：</span>
                <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: T.bg }}>
                  {(["名前", "経験", "スコア"] as SortOrder[]).map(s => (
                    <button key={s} onClick={() => setSortOrder(s)}
                      className="px-3 py-1.5 rounded-md transition-all"
                      style={{
                        fontSize: 13, fontWeight: 700,
                        ...(sortOrder === s
                          ? { background: C.card, color: C.amberDk,
 }
                          : { color: C.muted })
                      }}
                    >{s}順</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: T.bg }}>
            {(["一覧", "勤怠", "資格"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg transition-all"
                style={{
                  fontSize: 14, fontWeight: 700,
                  ...(tab === t
                    ? { background: C.card, color: C.amber,
 borderBottom: `2px solid ${C.amber}` }
                    : { color: T.sub })
                }}
              >{t}</button>
            ))}
          </div>

          {/* Tab: 一覧 */}
          {tab === "一覧" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {filtered.map((m, i) => <MemberCard key={m.id} m={m} rank={i} />)}
            </div>
          )}

          {/* Tab: 勤怠 */}
          {tab === "勤怠" && (
            <div className="flex flex-col gap-3">
              <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 4px", color: C.amber }}>
                4月 出勤率ランキング
              </p>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {attRanked.map(m => {
                  const s = getStats(m.id);
                  const lvl = experienceLevel(experienceYears(m));
                  const attColor = s.attendancePct >= 95 ? C.green : s.attendancePct >= 80 ? C.amber : C.red;
                  return (
                    <Link key={m.id} href={`/kaitai/admin/members/${m.id}?tab=勤怠`}>
                      <div style={{ background: C.card, border: `1px solid ${C.border}`,
 borderRadius: 16, padding: "20px 20px 16px" }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold" style={{ width: 40, height: 40, background: lvl.bg, color: lvl.color, fontSize: 15 }}>
                            {m.avatar}
                          </div>
                          <div className="flex-1">
                            <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{m.name}</p>
                            <p style={{ fontSize: 13, color: C.muted }}>出勤 {s.workDays}日・遅刻 {s.lateDays}・欠勤 {s.absentDays}</p>
                          </div>
                          <div className="text-right">
                            <p style={{ fontSize: 28, fontWeight: 800, color: attColor, lineHeight: 1 }}>{s.attendancePct}%</p>
                            <p style={{ fontSize: 13, color: C.muted }}>{s.totalHours}h</p>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.bg }}>
                          <div className="h-full rounded-full" style={{ width: `${s.attendancePct}%`, background: attColor }} />
                        </div>
                        <div className="flex gap-0.5 mt-2.5 flex-wrap">
                          {s.calendar.slice(0, 20).map((status, di) => (
                            <div key={di} className="w-3 h-3 rounded-sm" style={{
                              background: status === "出勤" ? "#D1FAE5" : status === "遅刻" ? T.primaryMd : status === "欠勤" ? "#FEE2E2" : T.bg,
                              border: status === "出勤" ? "1px solid #A7F3D0" : status === "遅刻" ? "1px solid #E5E7EB" : status === "欠勤" ? "1px solid #FECACA" : "none",
                            }} />
                          ))}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: 資格 */}
          {tab === "資格" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map(m => {
                const lvl = experienceLevel(experienceYears(m));
                return (
                  <Link key={m.id} href={`/kaitai/admin/members/${m.id}`}>
                    <div className="p-5 hover:shadow-md transition-all" style={{ background: C.card, border: `1px solid ${C.border}`,
 borderRadius: 16 }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold" style={{ width: 36, height: 36, background: lvl.bg, color: lvl.color, fontSize: 14 }}>
                          {m.avatar}
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{m.name}</p>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: lvl.bg, color: lvl.color }}>{lvl.label}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <Award size={14} style={{ color: T.primaryDk }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: T.primaryDk }}>{m.licenses.length}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.licenses.map(lic => (
                          <span key={lic} style={{ fontSize: 13, padding: "4px 12px", borderRadius: 8, fontWeight: 500, background: T.primaryLt, color: C.sub, border: "1px solid #F3F4F6" }}>
                            {LICENSE_LABELS[lic] ?? lic}
                          </span>
                        ))}
                        {m.licenses.length === 0 && <span style={{ fontSize: 13, color: C.muted }}>資格なし</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Tab: パフォーマンス */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Users size={32} style={{ color: C.muted }} />
              <p style={{ fontSize: 15, color: C.muted }}>該当するメンバーがいません</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Performance overview ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px",
 }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={16} style={{ color: C.amber }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: C.sub }}>パフォーマンス概要（全員）</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MEMBERS.map(m => {
            const s = getStats(m.id);
            const score = activityScore(m);
            const scoreColor = score >= 70 ? C.green : score >= 50 ? C.amberDk : T.sub;
            const lvl = experienceLevel(experienceYears(m));
            return (
              <Link key={m.id} href={`/kaitai/admin/members/${m.id}`}>
                <div className="p-3 rounded-xl hover:shadow-md transition-all" style={{ background: T.bg, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center rounded-lg font-bold" style={{ width: 32, height: 32, background: lvl.bg, color: lvl.color, fontSize: 13 }}>
                      {m.avatar}
                    </div>
                    <div className="min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                      <p style={{ fontSize: 11, color: C.muted }}>{m.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 11, color: C.muted }}>出勤率</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.attendancePct >= 90 ? C.green : C.amber }}>{s.attendancePct}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span style={{ fontSize: 11, color: C.muted }}>スコア</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor }}>{score}pt</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
