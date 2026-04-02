"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search, Star, Award, Shield, TrendingUp, TrendingDown,
  AlertTriangle, Zap, Users, Clock, Plus,
} from "lucide-react";
import {
  MEMBERS, MEMBER_STATS, LICENSE_LABELS,
  experienceYears, experienceLevel,
  type License,
} from "../lib/members";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: "#1E293B", sub: "#64748B", muted: "#94A3B8",
  border: "#E2E8F0", card: "#FFFFFF",
  amber: "#F59E0B", amberDk: "#D97706",
  green: "#10B981", red: "#EF4444",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ n, color }: { n: number; color: string }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={10} fill={i < n ? color : "transparent"} style={{ color: i < n ? color : "#E2E8F0" }} />
      ))}
    </span>
  );
}

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  "#要注意":         { bg: "#FEF2F2", color: "#DC2626" },
  "#ルール違反":     { bg: "#FEF2F2", color: "#DC2626" },
  "#リーダーシップ": { bg: "#FFFBEB", color: "#D97706" },
  "#安全模範":       { bg: "#F0FDF4", color: "#16A34A" },
  "#効率的":         { bg: "#EFF6FF", color: "#2563EB" },
  "#成長中":         { bg: "#F5F3FF", color: "#7C3AED" },
};
function tagStyle(tag: string) {
  return TAG_COLORS[tag] ?? { bg: "#F1F5F9", color: "#64748B" };
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
      <polygon points={bgPts} fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
      <polygon points={pts} fill="rgba(245,158,11,0.15)" stroke="#F59E0B" strokeWidth="1.2" />
    </svg>
  );
}

// ─── Alert section ─────────────────────────────────────────────────────────────

function AlertSection() {
  const warnings = MEMBERS.filter(m => {
    const s = MEMBER_STATS.find(x => x.memberId === m.id)!;
    return s.troubles.length > 0 || s.ruleViolations > 1 || s.lateDays >= 3;
  });
  const rising = MEMBERS.filter(m => {
    const s = MEMBER_STATS.find(x => x.memberId === m.id)!;
    return s.efficiencyDelta >= 10;
  });

  if (warnings.length === 0 && rising.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {warnings.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} style={{ color: "#DC2626" }} />
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#DC2626" }}>
              要注意メンバー
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "#FEE2E2", color: "#DC2626" }}>
              {warnings.length}名
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {warnings.map(m => {
              const s = MEMBER_STATS.find(x => x.memberId === m.id)!;
              const reasons = [
                s.ruleViolations > 0 && `ルール違反 ${s.ruleViolations}件`,
                s.troubles.length > 0 && `トラブル ${s.troubles.length}件`,
                s.lateDays >= 3 && `遅刻 ${s.lateDays}回`,
              ].filter(Boolean).join("・");
              return (
                <Link key={m.id} href={`/kaitai/members/${m.id}`}>
                  <div className="flex items-center gap-3 py-1.5">
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: C.text }}>{m.name}</p>
                      <p className="text-[10px]" style={{ color: "#DC2626" }}>{reasons}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {rising.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} style={{ color: "#7C3AED" }} />
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#7C3AED" }}>
              パフォーマンス急上昇
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "#EDE9FE", color: "#7C3AED" }}>
              {rising.length}名
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {rising.map(m => {
              const s = MEMBER_STATS.find(x => x.memberId === m.id)!;
              return (
                <Link key={m.id} href={`/kaitai/members/${m.id}`}>
                  <div className="flex items-center gap-3 py-1.5">
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: "#EDE9FE", color: "#7C3AED" }}>
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: C.text }}>{m.name}</p>
                      <p className="text-[10px]" style={{ color: "#7C3AED" }}>
                        効率スコア +{s.efficiencyDelta}% ↑
                      </p>
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

// ─── Skill map ─────────────────────────────────────────────────────────────────

function SkillMap() {
  const stats = Object.entries(LICENSE_LABELS).map(([key, label]) => ({
    key, label,
    count: MEMBERS.filter(m => m.licenses.includes(key as License)).length,
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Shield size={14} style={{ color: C.amber }} />
        <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: C.amber }}>
          資格スキルマップ（{MEMBERS.length}名）
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {stats.map(({ key, label, count }) => {
          const pct = Math.round((count / MEMBERS.length) * 100);
          return (
            <div key={key}>
              <div className="flex justify-between text-[10px] mb-1">
                <span style={{ color: C.sub }}>{label}</span>
                <span style={{ color: C.muted }}>{count}/{MEMBERS.length}名</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: pct === 100 ? C.green : pct >= 50 ? C.amber : "#3B82F6",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Member card ───────────────────────────────────────────────────────────────

function MemberCard({ m, rank }: { m: (typeof MEMBERS)[0]; rank: number }) {
  const yrs = experienceYears(m);
  const lvl = experienceLevel(yrs);
  const s   = MEMBER_STATS.find(x => x.memberId === m.id)!;

  const hasWarning  = s.troubles.length > 0 || s.ruleViolations > 1 || s.lateDays >= 3;
  const isRising    = s.efficiencyDelta >= 10;
  const attendColor = s.attendancePct >= 95 ? C.green : s.attendancePct >= 80 ? C.amber : C.red;
  const effColor    = s.efficiencyDelta > 0 ? C.green : C.red;

  return (
    <Link href={`/kaitai/members/${m.id}`}>
      <div
        className="rounded-xl p-4 hover:shadow-md active:scale-[0.99] transition-all"
        style={{
          background: C.card,
          border: hasWarning ? "1.5px solid #FECACA" : `1px solid ${C.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Rank */}
          <div
            className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
            style={
              rank === 0 ? { background: "#FFFBEB", color: "#D97706" }
              : rank === 1 ? { background: "#F8FAFC", color: "#64748B" }
              : rank === 2 ? { background: "#FFF7ED", color: "#92400E" }
              : { background: "#F8FAFC", color: "#94A3B8" }
            }
          >
            {rank + 1}
          </div>

          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-base font-bold"
            style={{ background: lvl.bg, color: lvl.color }}
          >
            {m.avatar}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className="text-sm font-bold" style={{ color: C.text }}>{m.name}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: lvl.bg, color: lvl.color }}>
                {lvl.label}
              </span>
              {m.type === "外注" && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#2563EB" }}>外注</span>
              )}
              {hasWarning && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: "#DC2626" }}>⚠ 要注意</span>
              )}
              {isRising && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#F5F3FF", color: "#7C3AED" }}>⚡ 急成長</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Stars n={lvl.stars} color={lvl.color} />
              <span className="text-[10px]" style={{ color: C.muted }}>
                {yrs}年・{m.siteCount}現場
              </span>
            </div>
          </div>

          {/* Mini radar */}
          <div className="flex-shrink-0">
            <MiniRadar radar={s.radar} />
          </div>
        </div>

        {/* Stats row */}
        <div
          className="flex items-center gap-3 mt-3 pt-3 px-1"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-1">
            <Clock size={10} style={{ color: attendColor }} />
            <span className="text-[10px] font-semibold" style={{ color: attendColor }}>
              出勤率 {s.attendancePct}%
            </span>
          </div>

          <div style={{ width: 1, height: 10, background: C.border }} />

          <div className="flex items-center gap-1">
            {s.efficiencyDelta >= 0
              ? <TrendingUp size={10} style={{ color: effColor }} />
              : <TrendingDown size={10} style={{ color: effColor }} />
            }
            <span className="text-[10px] font-semibold" style={{ color: effColor }}>
              効率 {s.efficiencyDelta > 0 ? "+" : ""}{s.efficiencyDelta}%
            </span>
          </div>

          <div style={{ width: 1, height: 10, background: C.border }} />

          <div className="flex items-center gap-1">
            <Award size={10} style={{ color: "#D97706" }} />
            <span className="text-[10px] font-semibold" style={{ color: "#D97706" }}>
              資格 {m.licenses.length}
            </span>
          </div>

          {s.troubles.length > 0 && (
            <>
              <div style={{ width: 1, height: 10, background: C.border }} />
              <div className="flex items-center gap-1">
                <AlertTriangle size={10} style={{ color: C.red }} />
                <span className="text-[10px] font-semibold" style={{ color: C.red }}>
                  {s.troubles.length}件
                </span>
              </div>
            </>
          )}

          {s.siteEvals[0]?.tags.slice(0, 1).map(tag => {
            const ts = tagStyle(tag);
            return (
              <span key={tag} className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: ts.bg, color: ts.color }}>
                {tag}
              </span>
            );
          })}
        </div>
      </div>
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Tab = "一覧" | "勤怠" | "資格";

export default function MembersPage() {
  const [tab, setTab]       = useState<Tab>("一覧");
  const [query, setQuery]   = useState("");
  const [typeFilter, setTypeFilter] = useState<"全員" | "直用" | "外注">("全員");

  const sorted = [...MEMBERS].sort((a, b) => experienceYears(b) - experienceYears(a));

  const filtered = sorted.filter(m => {
    const matchType  = typeFilter === "全員" || m.type === typeFilter;
    const matchQuery = query === "" || m.name.includes(query) || m.kana.includes(query)
      || m.licenses.some(l => (LICENSE_LABELS[l] ?? l).includes(query));
    return matchType && matchQuery;
  });

  const direct  = MEMBERS.filter(m => m.type === "直用").length;
  const outside = MEMBERS.filter(m => m.type === "外注").length;
  const avgAtt  = Math.round(MEMBER_STATS.reduce((s, x) => s + x.attendancePct, 0) / MEMBER_STATS.length);
  const totalTrouble = MEMBER_STATS.reduce((s, x) => s + x.troubles.length, 0);

  const attRanked = [...MEMBERS].sort((a, b) => {
    const sa = MEMBER_STATS.find(x => x.memberId === a.id)!;
    const sb = MEMBER_STATS.find(x => x.memberId === b.id)!;
    return sb.attendancePct - sa.attendancePct;
  });

  return (
    <div className="px-4 md:px-8 py-6 flex flex-col gap-6 pb-24 md:pb-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>メンバー管理</h1>
          <p className="text-sm mt-1" style={{ color: C.sub }}>
            登録 {MEMBERS.length}名（直用 {direct}名・外注 {outside}社）
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white flex-shrink-0"
          style={{ background: C.amber, boxShadow: "0 2px 8px rgba(245,158,11,0.35)" }}
        >
          <Plus size={14} />
          メンバー追加
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "総メンバー数",   value: `${MEMBERS.length}名`,  color: "#3B82F6", note: `直用${direct}・外注${outside}` },
          { label: "当月出勤率",     value: `${avgAtt}%`,           color: avgAtt >= 90 ? C.green : C.amber, note: "月間平均" },
          { label: "トラブル件数",   value: `${totalTrouble}件`,    color: totalTrouble > 0 ? C.red : C.green, note: "今月累計" },
          { label: "保有資格合計",   value: `${MEMBERS.reduce((s, m) => s + m.licenses.length, 0)}件`, color: "#D97706", note: "全資格数" },
        ].map(({ label, value, color, note }) => (
          <div key={label} className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p className="text-xs mb-1" style={{ color: C.sub }}>{label}</p>
            <p className="text-2xl font-bold font-numeric" style={{ color }}>{value}</p>
            <p className="text-[10px] mt-1" style={{ color: C.muted }}>{note}</p>
          </div>
        ))}
      </div>

      {/* ── Main 2-col layout ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Left sidebar (lg+) ── */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4">
          <AlertSection />
          <SkillMap />
        </div>

        {/* ── Right: search + list ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Search + type filter */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <Search size={15} style={{ color: C.muted }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="氏名・資格で検索…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: C.text }}
              />
            </div>
            <div className="flex gap-2">
              {(["全員", "直用", "外注"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={typeFilter === t
                    ? { background: "rgba(245,158,11,0.1)", color: C.amberDk, border: "1px solid rgba(245,158,11,0.3)" }
                    : { background: C.card, color: C.sub, border: `1px solid ${C.border}` }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#F1F5F9" }}>
            {(["一覧", "勤怠", "資格"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-md text-xs font-bold transition-all"
                style={tab === t
                  ? { background: C.card, color: C.text, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                  : { color: C.sub }
                }
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Tab: 一覧 ── */}
          {tab === "一覧" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {filtered.map((m) => (
                <MemberCard key={m.id} m={m} rank={sorted.indexOf(m)} />
              ))}
            </div>
          )}

          {/* ── Tab: 勤怠 ── */}
          {tab === "勤怠" && (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-bold tracking-widest uppercase px-1" style={{ color: C.amber }}>
                4月 出勤率ランキング
              </p>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {attRanked.map((m) => {
                  const s = MEMBER_STATS.find(x => x.memberId === m.id)!;
                  const lvl = experienceLevel(experienceYears(m));
                  const attColor = s.attendancePct >= 95 ? C.green : s.attendancePct >= 80 ? C.amber : C.red;
                  return (
                    <Link key={m.id} href={`/kaitai/members/${m.id}?tab=勤怠`}>
                      <div className="rounded-xl px-5 py-4" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: lvl.bg, color: lvl.color }}>
                            {m.avatar}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold" style={{ color: C.text }}>{m.name}</p>
                            <p className="text-[10px]" style={{ color: C.muted }}>
                              出勤 {s.workDays}日・遅刻 {s.lateDays}・欠勤 {s.absentDays}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold font-numeric" style={{ color: attColor }}>{s.attendancePct}%</p>
                            <p className="text-[9px]" style={{ color: C.muted }}>{s.totalHours}h</p>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${s.attendancePct}%`, background: attColor }} />
                        </div>
                        <div className="flex gap-0.5 mt-2.5 flex-wrap">
                          {s.calendar.slice(0, 20).map((status, di) => (
                            <div
                              key={di}
                              className="w-3 h-3 rounded-sm"
                              style={{
                                background:
                                  status === "出勤" ? "#D1FAE5" :
                                  status === "遅刻" ? "#FEF3C7" :
                                  status === "欠勤" ? "#FEE2E2" :
                                  status === "休日" ? "#F1F5F9" : "#F8FAFC",
                                border: status === "出勤" ? "1px solid #A7F3D0" :
                                        status === "遅刻" ? "1px solid #FDE68A" :
                                        status === "欠勤" ? "1px solid #FECACA" : "none",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 px-2 pt-1">
                {[
                  { status: "出勤", color: "#10B981" },
                  { status: "遅刻", color: "#D97706" },
                  { status: "欠勤", color: "#EF4444" },
                  { status: "休日", color: "#94A3B8" },
                ].map(({ status, color }) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: color, opacity: 0.5 }} />
                    <span className="text-[10px]" style={{ color: C.muted }}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab: 資格 ── */}
          {tab === "資格" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sorted.map(m => {
                const lvl = experienceLevel(experienceYears(m));
                return (
                  <Link key={m.id} href={`/kaitai/members/${m.id}`}>
                    <div className="rounded-xl p-4 hover:shadow-md transition-all" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: lvl.bg, color: lvl.color }}>
                          {m.avatar}
                        </div>
                        <p className="text-sm font-bold" style={{ color: C.text }}>{m.name}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: lvl.bg, color: lvl.color }}>{lvl.label}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <Award size={11} style={{ color: "#D97706" }} />
                          <span className="text-xs font-bold" style={{ color: "#D97706" }}>{m.licenses.length}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.licenses.map(lic => (
                          <span key={lic} className="text-[10px] px-2 py-1 rounded-md font-medium" style={{ background: "#FFFBEB", color: C.sub, border: "1px solid #FEF3C7" }}>
                            {LICENSE_LABELS[lic] ?? lic}
                          </span>
                        ))}
                        {m.licenses.length === 0 && (
                          <span className="text-[10px]" style={{ color: C.muted }}>資格なし</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
