"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search, Star, Award, Shield, TrendingUp, TrendingDown,
  AlertTriangle, Zap, Users, BarChart2, Clock,
} from "lucide-react";
import {
  MEMBERS, MEMBER_STATS, LICENSE_LABELS,
  experienceYears, experienceLevel,
  type License,
} from "../lib/members";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ n, color }: { n: number; color: string }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={10} fill={i < n ? color : "transparent"} style={{ color: i < n ? color : "#2D3E54" }} />
      ))}
    </span>
  );
}

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  "#要注意":      { bg: "rgba(239,68,68,0.12)",   color: "#F87171" },
  "#ルール違反":  { bg: "rgba(239,68,68,0.12)",   color: "#F87171" },
  "#リーダーシップ": { bg: "rgba(251,191,36,0.12)", color: "#FBBF24" },
  "#安全模範":    { bg: "rgba(74,222,128,0.1)",   color: "#4ADE80" },
  "#効率的":      { bg: "rgba(96,165,250,0.1)",   color: "#60A5FA" },
  "#成長中":      { bg: "rgba(167,139,250,0.1)",  color: "#A78BFA" },
};
function tagStyle(tag: string) {
  return TAG_COLORS[tag] ?? { bg: "rgba(100,116,139,0.12)", color: "#94A3B8" };
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
      <polygon points={bgPts} fill="none" stroke="#2D3E54" strokeWidth="0.8" />
      <polygon points={pts} fill="rgba(249,115,22,0.25)" stroke="#F97316" strokeWidth="1.2" />
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
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} style={{ color: "#F87171" }} />
            <span className="text-[11px] font-bold tracking-widest" style={{ color: "#F87171" }}>
              要注意メンバー
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto"
              style={{ background: "rgba(239,68,68,0.15)", color: "#F87171" }}
            >
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
                  <div className="flex items-center gap-3 py-1">
                    <div
                      className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#F87171" }}
                    >
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>{m.name}</p>
                      <p className="text-[10px]" style={{ color: "#F87171" }}>{reasons}</p>
                    </div>
                    <span className="text-[10px]" style={{ color: "#475569" }}>→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {rising.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} style={{ color: "#A78BFA" }} />
            <span className="text-[11px] font-bold tracking-widest" style={{ color: "#A78BFA" }}>
              パフォーマンス急上昇
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto"
              style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA" }}
            >
              {rising.length}名
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {rising.map(m => {
              const s = MEMBER_STATS.find(x => x.memberId === m.id)!;
              return (
                <Link key={m.id} href={`/kaitai/members/${m.id}`}>
                  <div className="flex items-center gap-3 py-1">
                    <div
                      className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold"
                      style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA" }}
                    >
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>{m.name}</p>
                      <p className="text-[10px]" style={{ color: "#A78BFA" }}>
                        効率スコア +{s.efficiencyDelta}% ↑
                      </p>
                    </div>
                    <span className="text-[10px]" style={{ color: "#475569" }}>→</span>
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
    <div className="rounded-2xl p-4" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} style={{ color: "#F97316" }} />
        <p className="text-[11px] font-bold tracking-widest" style={{ color: "#F97316" }}>
          資格スキルマップ（全{MEMBERS.length}名）
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {stats.map(({ key, label, count }) => {
          const pct = Math.round((count / MEMBERS.length) * 100);
          return (
            <div key={key}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span style={{ color: "#94A3B8" }}>{label}</span>
                <span style={{ color: "#64748B" }}>{count}名 / {MEMBERS.length}名</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#0F1928" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: pct === 100 ? "#4ADE80" : pct >= 50 ? "#F97316" : "#60A5FA",
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
  const attendColor = s.attendancePct >= 95 ? "#4ADE80" : s.attendancePct >= 80 ? "#FBBF24" : "#F87171";
  const effColor    = s.efficiencyDelta > 0 ? "#4ADE80" : "#F87171";

  return (
    <Link href={`/kaitai/members/${m.id}`}>
      <div
        className="rounded-2xl p-3 active:scale-[0.99] transition-transform"
        style={{
          background: "#1A2535",
          border: hasWarning
            ? "1px solid rgba(239,68,68,0.3)"
            : "1px solid #2D3E54",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Rank */}
          <div
            className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
            style={
              rank === 0 ? { background: "rgba(251,191,36,0.15)", color: "#FBBF24" }
              : rank === 1 ? { background: "rgba(148,163,184,0.1)", color: "#94A3B8" }
              : rank === 2 ? { background: "rgba(180,83,9,0.1)",   color: "#B45309" }
              : { background: "#0F1928", color: "#475569" }
            }
          >
            {rank + 1}
          </div>

          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-base font-bold"
            style={{ background: lvl.bg, color: lvl.color }}
          >
            {m.avatar}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className="text-sm font-bold" style={{ color: "#F1F5F9" }}>{m.name}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: lvl.bg, color: lvl.color }}>
                {lvl.label}
              </span>
              {m.type === "外注" && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.1)", color: "#818CF8" }}>外注</span>
              )}
              {hasWarning && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "#F87171" }}>⚠ 要注意</span>
              )}
              {isRising && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA" }}>⚡ 急成長</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Stars n={lvl.stars} color={lvl.color} />
              <span className="text-[10px]" style={{ color: "#64748B" }}>
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
          className="flex items-center gap-3 mt-2 pt-2 px-1"
          style={{ borderTop: "1px solid #0F1928" }}
        >
          {/* Attendance */}
          <div className="flex items-center gap-1">
            <Clock size={10} style={{ color: attendColor }} />
            <span className="text-[10px] font-bold" style={{ color: attendColor }}>
              出勤率 {s.attendancePct}%
            </span>
          </div>

          <div style={{ width: 1, height: 10, background: "#2D3E54" }} />

          {/* Efficiency */}
          <div className="flex items-center gap-1">
            {s.efficiencyDelta >= 0
              ? <TrendingUp size={10} style={{ color: effColor }} />
              : <TrendingDown size={10} style={{ color: effColor }} />
            }
            <span className="text-[10px] font-bold" style={{ color: effColor }}>
              効率 {s.efficiencyDelta > 0 ? "+" : ""}{s.efficiencyDelta}%
            </span>
          </div>

          <div style={{ width: 1, height: 10, background: "#2D3E54" }} />

          {/* Licenses */}
          <div className="flex items-center gap-1">
            <Award size={10} style={{ color: "#FBBF24" }} />
            <span className="text-[10px] font-bold" style={{ color: "#FBBF24" }}>
              資格 {m.licenses.length}
            </span>
          </div>

          {/* Troubles */}
          {s.troubles.length > 0 && (
            <>
              <div style={{ width: 1, height: 10, background: "#2D3E54" }} />
              <div className="flex items-center gap-1">
                <AlertTriangle size={10} style={{ color: "#F87171" }} />
                <span className="text-[10px] font-bold" style={{ color: "#F87171" }}>
                  {s.troubles.length}件
                </span>
              </div>
            </>
          )}

          {/* Tags from latest eval */}
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

  // Attendance ranking (for 勤怠 tab)
  const attRanked = [...MEMBERS].sort((a, b) => {
    const sa = MEMBER_STATS.find(x => x.memberId === a.id)!;
    const sb = MEMBER_STATS.find(x => x.memberId === b.id)!;
    return sb.attendancePct - sa.attendancePct;
  });

  return (
    <div className="max-w-md mx-auto flex flex-col gap-4 pb-4">

      {/* ── Header ── */}
      <section className="px-5 pt-12 pb-5" style={{ borderBottom: "1px solid #2D3E54" }}>
        <h1 className="text-xl font-bold mb-1" style={{ color: "#F1F5F9" }}>メンバー管理・分析</h1>
        <p className="text-sm mb-4" style={{ color: "#64748B" }}>
          登録 {MEMBERS.length}名（直用 {direct}名・外注 {outside}社）
        </p>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "当月出勤率", value: `${avgAtt}%`, icon: Users,    color: avgAtt >= 90 ? "#4ADE80" : "#FBBF24" },
            { label: "トラブル件数", value: `${totalTrouble}件`, icon: AlertTriangle, color: totalTrouble > 0 ? "#F87171" : "#4ADE80" },
            { label: "資格保有数合計", value: `${MEMBERS.reduce((s, m) => s + m.licenses.length, 0)}件`, icon: Award, color: "#FBBF24" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-3 text-center" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
              <Icon size={14} style={{ color }} className="mx-auto mb-1" />
              <p className="text-base font-bold" style={{ color, fontFeatureSettings: "'tnum'" }}>{value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "#64748B" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="px-4 flex flex-col gap-4">

        {/* ── Alerts ── */}
        <AlertSection />

        {/* ── Search + filter ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-3 py-3 rounded-2xl" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
            <Search size={15} style={{ color: "#475569" }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="氏名・資格で検索…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#F1F5F9" }}
            />
          </div>

          {/* Type filter */}
          <div className="flex gap-2">
            {(["全員", "直用", "外注"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={typeFilter === t
                  ? { background: "rgba(249,115,22,0.15)", color: "#F97316", border: "1px solid rgba(249,115,22,0.3)" }
                  : { background: "#1A2535", color: "#64748B", border: "1px solid #2D3E54" }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#1A2535" }}>
          {(["一覧", "勤怠", "資格"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={tab === t
                ? { background: "rgba(249,115,22,0.15)", color: "#F97316" }
                : { color: "#64748B" }
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Tab: 一覧 ── */}
        {tab === "一覧" && (
          <div className="flex flex-col gap-2">
            {filtered.map((m, i) => (
              <MemberCard key={m.id} m={m} rank={sorted.indexOf(m)} />
            ))}
          </div>
        )}

        {/* ── Tab: 勤怠 ── */}
        {tab === "勤怠" && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold tracking-widest px-1" style={{ color: "#F97316" }}>
              4月 出勤率ランキング
            </p>
            {attRanked.map((m, i) => {
              const s = MEMBER_STATS.find(x => x.memberId === m.id)!;
              const lvl = experienceLevel(experienceYears(m));
              const attColor = s.attendancePct >= 95 ? "#4ADE80" : s.attendancePct >= 80 ? "#FBBF24" : "#F87171";
              return (
                <Link key={m.id} href={`/kaitai/members/${m.id}?tab=勤怠`}>
                  <div className="rounded-2xl px-4 py-3" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: lvl.bg, color: lvl.color }}>
                        {m.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: "#F1F5F9" }}>{m.name}</p>
                        <p className="text-[10px]" style={{ color: "#64748B" }}>
                          出勤 {s.workDays}日・遅刻 {s.lateDays}・欠勤 {s.absentDays}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: attColor, fontFeatureSettings: "'tnum'" }}>{s.attendancePct}%</p>
                        <p className="text-[9px]" style={{ color: "#64748B" }}>{s.totalHours}h</p>
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#0F1928" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${s.attendancePct}%`, background: attColor }} />
                    </div>
                    {/* Mini calendar dots */}
                    <div className="flex gap-0.5 mt-2 flex-wrap">
                      {s.calendar.slice(0, 20).map((status, di) => (
                        <div
                          key={di}
                          className="w-3 h-3 rounded-sm"
                          style={{
                            background:
                              status === "出勤" ? "#2D4A2D" :
                              status === "遅刻" ? "rgba(251,191,36,0.3)" :
                              status === "欠勤" ? "rgba(239,68,68,0.3)" :
                              status === "休日" ? "#1A2535" : "#0F1928",
                            border: status === "出勤" ? "1px solid #4ADE80" :
                                    status === "遅刻" ? "1px solid #FBBF24" :
                                    status === "欠勤" ? "1px solid #EF4444" : "none",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
            {/* Legend */}
            <div className="flex items-center gap-3 px-2 pt-1">
              {[
                { status: "出勤", color: "#4ADE80" },
                { status: "遅刻", color: "#FBBF24" },
                { status: "欠勤", color: "#EF4444" },
                { status: "休日", color: "#475569" },
              ].map(({ status, color }) => (
                <div key={status} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color, opacity: 0.5 }} />
                  <span className="text-[9px]" style={{ color: "#64748B" }}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: 資格 ── */}
        {tab === "資格" && (
          <div className="flex flex-col gap-4">
            <SkillMap />

            {/* Per-member license list */}
            {sorted.map(m => {
              const lvl = experienceLevel(experienceYears(m));
              return (
                <Link key={m.id} href={`/kaitai/members/${m.id}`}>
                  <div className="rounded-2xl p-3" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: lvl.bg, color: lvl.color }}>
                        {m.avatar}
                      </div>
                      <p className="text-sm font-bold" style={{ color: "#F1F5F9" }}>{m.name}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: lvl.bg, color: lvl.color }}>{lvl.label}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <Award size={11} style={{ color: "#FBBF24" }} />
                        <span className="text-xs font-bold" style={{ color: "#FBBF24" }}>{m.licenses.length}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.licenses.map(lic => (
                        <span key={lic} className="text-[10px] px-2 py-1 rounded-lg font-medium" style={{ background: "rgba(251,191,36,0.08)", color: "#94A3B8", border: "1px solid rgba(251,191,36,0.15)" }}>
                          {LICENSE_LABELS[lic] ?? lic}
                        </span>
                      ))}
                      {m.licenses.length === 0 && (
                        <span className="text-[10px]" style={{ color: "#475569" }}>資格なし</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Add member ── */}
        <button
          className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 font-bold active:scale-[0.98] transition-transform"
          style={{
            background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
            boxShadow: "0 4px 20px rgba(249,115,22,0.25)",
            color: "#fff",
          }}
        >
          <BarChart2 size={16} />
          + メンバーを追加登録
        </button>

      </div>
    </div>
  );
}
