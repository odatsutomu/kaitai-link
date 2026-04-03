"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search, Star, Award, Zap, Lock, Eye,
} from "lucide-react";
import {
  MEMBERS, MEMBER_STATS, LICENSE_LABELS,
  experienceYears, experienceLevel,
  type License,
} from "../lib/members";
import { useAppContext } from "../lib/app-context";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: "#1E293B", sub: "#4B5563", muted: "#6B7280",
  border: "#E5E7EB", card: "#FFFFFF",
  amber: "#F59E0B", amberDk: "#D97706",
  green: "#10B981", red: "#EF4444",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ n, color }: { n: number; color: string }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} fill={i < n ? color : "transparent"} style={{ color: i < n ? color : "#E5E7EB" }} />
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
  return TAG_COLORS[tag] ?? { bg: "#F1F5F9", color: "#4B5563" };
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortOrder = "名前" | "経験" | "スコア";

function activityScore(m: (typeof MEMBERS)[0]): number {
  const s = MEMBER_STATS.find(x => x.memberId === m.id)!;
  const att = s.attendancePct * 0.5;
  const eff = (50 + Math.max(-50, Math.min(50, s.efficiencyDelta))) * 0.3;
  const lic = Math.min(15, m.licenses.length * 3);
  const pen = s.ruleViolations * 5 + s.lateDays * 2;
  return Math.max(0, Math.min(100, Math.round(att + eff + lic - pen)));
}

// ─── Alert section (unused — admin version is at /kaitai/admin/members) ──────

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
        <div className="rounded-2xl p-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 16 }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} style={{ color: "#DC2626" }} />
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#DC2626" }}>
              要注意メンバー
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FEE2E2", color: "#DC2626", marginLeft: "auto" }}>
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
                    <div className="flex-shrink-0 flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: "#FEE2E2", color: "#DC2626", fontSize: 14, fontWeight: 700 }}>
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{m.name}</p>
                      <p style={{ fontSize: 14, color: "#DC2626" }}>{reasons}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {rising.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 16 }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} style={{ color: "#7C3AED" }} />
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#7C3AED" }}>
              パフォーマンス急上昇
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#EDE9FE", color: "#7C3AED", marginLeft: "auto" }}>
              {rising.length}名
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {rising.map(m => {
              const s = MEMBER_STATS.find(x => x.memberId === m.id)!;
              return (
                <Link key={m.id} href={`/kaitai/members/${m.id}`}>
                  <div className="flex items-center gap-3 py-1.5">
                    <div className="flex-shrink-0 flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: "#EDE9FE", color: "#7C3AED", fontSize: 14, fontWeight: 700 }}>
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{m.name}</p>
                      <p style={{ fontSize: 14, color: "#7C3AED" }}>
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
    <div className="p-5" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 2px 4px rgba(0,0,0,0.06)", borderRadius: 16 }}>
      <div className="flex items-center gap-2 mb-4">
        <Shield size={16} style={{ color: C.amber }} />
        <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: C.amber }}>
          資格スキルマップ（{MEMBERS.length}名）
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {stats.map(({ key, label, count }) => {
          const pct = Math.round((count / MEMBERS.length) * 100);
          return (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span style={{ fontSize: 14, color: C.sub }}>{label}</span>
                <span style={{ fontSize: 14, color: C.muted }}>{count}/{MEMBERS.length}名</span>
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

// ─── Member card (admin) ───────────────────────────────────────────────────────

function MemberCardAdmin({ m, rank }: { m: (typeof MEMBERS)[0]; rank: number }) {
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
        className="p-4 hover:shadow-md active:scale-[0.99] transition-all"
        style={{
          background: C.card,
          border: hasWarning ? "1.5px solid #FECACA" : `1px solid ${C.border}`,
          boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
          borderRadius: 16,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-md"
            style={{
              width: 28, height: 28, fontSize: 14, fontWeight: 700,
              ...(rank === 0 ? { background: "#FFFBEB", color: "#D97706" }
              : rank === 1 ? { background: "#F8FAFC", color: "#64748B" }
              : rank === 2 ? { background: "#FFF7ED", color: "#92400E" }
              : { background: "#F8FAFC", color: "#94A3B8" })
            }}
          >
            {rank + 1}
          </div>
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold"
            style={{ width: 44, height: 44, background: lvl.bg, color: lvl.color, fontSize: 16 }}
          >
            {m.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{m.name}</span>
              <span style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: lvl.bg, color: lvl.color }}>
                {lvl.label}
              </span>
              {m.type === "外注" && (
                <span style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#EFF6FF", color: "#2563EB" }}>外注</span>
              )}
              {hasWarning && (
                <span style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FEF2F2", color: "#DC2626" }}>⚠ 要注意</span>
              )}
              {isRising && (
                <span style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#F5F3FF", color: "#7C3AED" }}>⚡ 急成長</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Stars n={lvl.stars} color={lvl.color} />
              <span style={{ fontSize: 14, color: C.muted }}>
                {yrs}年・{m.siteCount}現場
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <MiniRadar radar={s.radar} />
          </div>
        </div>

        <div
          className="flex items-center gap-3 mt-3 pt-3 px-1"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-1">
            <Clock size={12} style={{ color: attendColor }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: attendColor }}>
              出勤率 {s.attendancePct}%
            </span>
          </div>
          <div style={{ width: 1, height: 12, background: C.border }} />
          <div className="flex items-center gap-1">
            {s.efficiencyDelta >= 0
              ? <TrendingUp size={12} style={{ color: effColor }} />
              : <TrendingDown size={12} style={{ color: effColor }} />
            }
            <span style={{ fontSize: 14, fontWeight: 600, color: effColor }}>
              効率 {s.efficiencyDelta > 0 ? "+" : ""}{s.efficiencyDelta}%
            </span>
          </div>
          <div style={{ width: 1, height: 12, background: C.border }} />
          <div className="flex items-center gap-1">
            <Award size={12} style={{ color: "#D97706" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#D97706" }}>
              資格 {m.licenses.length}
            </span>
          </div>
          {s.troubles.length > 0 && (
            <>
              <div style={{ width: 1, height: 12, background: C.border }} />
              <div className="flex items-center gap-1">
                <AlertTriangle size={12} style={{ color: C.red }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: C.red }}>
                  {s.troubles.length}件
                </span>
              </div>
            </>
          )}
          {s.siteEvals[0]?.tags.slice(0, 1).map(tag => {
            const ts = tagStyle(tag);
            return (
              <span key={tag} style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: ts.bg, color: ts.color }}>
                {tag}
              </span>
            );
          })}
        </div>
      </div>
    </Link>
  );
}

// ─── Member card (general worker) ─────────────────────────────────────────────

function MemberCardGeneral({ m, rank }: { m: (typeof MEMBERS)[0]; rank: number }) {
  const yrs   = experienceYears(m);
  const lvl   = experienceLevel(yrs);
  const score = activityScore(m);
  const scoreColor = score >= 70 ? C.green : score >= 50 ? C.amberDk : "#64748B";

  return (
    <Link href={`/kaitai/members/${m.id}`}>
      <div
        className="p-4 hover:shadow-md active:scale-[0.99] transition-all"
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
          borderRadius: 16,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-md"
            style={{
              width: 28, height: 28, fontSize: 14, fontWeight: 700,
              ...(rank === 0 ? { background: "#FFFBEB", color: "#D97706" }
              : rank === 1 ? { background: "#F8FAFC", color: "#64748B" }
              : rank === 2 ? { background: "#FFF7ED", color: "#92400E" }
              : { background: "#F8FAFC", color: "#94A3B8" })
            }}
          >
            {rank + 1}
          </div>
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold"
            style={{ width: 44, height: 44, background: lvl.bg, color: lvl.color, fontSize: 16 }}
          >
            {m.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{m.name}</span>
              <span style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: lvl.bg, color: lvl.color }}>
                {lvl.label}
              </span>
              {m.type === "外注" && (
                <span style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#EFF6FF", color: "#2563EB" }}>外注</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Stars n={lvl.stars} color={lvl.color} />
              <span style={{ fontSize: 14, color: C.muted }}>
                {yrs}年・{m.siteCount}現場
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1">
              <Award size={13} style={{ color: "#D97706" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#D97706" }}>{m.licenses.length}資格</span>
            </div>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: `${scoreColor}18`, border: `1px solid ${scoreColor}40` }}
            >
              <Zap size={11} style={{ color: scoreColor }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor }}>{score}pt</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Foreman identity banner ───────────────────────────────────────────────────

function ForemanBanner({
  viewerMemberId,
  setViewerMemberId,
}: {
  viewerMemberId: string | null;
  setViewerMemberId: (id: string | null) => void;
}) {
  const foremen = MEMBERS.filter(m => m.role === "職長");
  const current = foremen.find(m => m.id === viewerMemberId);

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Eye size={15} style={{ color: "#D97706" }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#D97706" }}>
          {current ? `職長モード：${current.name}` : "一般閲覧モード"}
        </span>
        {current && (
          <button
            onClick={() => setViewerMemberId(null)}
            className="ml-auto rounded-lg px-2 py-0.5"
            style={{ fontSize: 13, color: "#92400E", background: "rgba(0,0,0,0.06)" }}
          >
            解除
          </button>
        )}
      </div>
      {!current && (
        <p style={{ fontSize: 13, color: "#92400E", marginBottom: 8 }}>
          職長の方は選択すると、担当現場のメンバー緊急連絡先を確認できます
        </p>
      )}
      {!current && (
        <div className="flex flex-wrap gap-2">
          {foremen.map(m => (
            <button
              key={m.id}
              onClick={() => setViewerMemberId(m.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-95"
              style={{ background: "#FEF3C7", border: "1px solid #FDE68A", fontSize: 14, fontWeight: 600, color: "#92400E" }}
            >
              <span>{m.avatar}</span>
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Tab = "一覧" | "勤怠" | "資格";

export default function MembersPage() {
  const { viewerMemberId, setViewerMemberId } = useAppContext();

  const [tab, setTab]         = useState<Tab>("一覧");
  const [query, setQuery]     = useState("");
  const [typeFilter, setTypeFilter] = useState<"全員" | "直用" | "外注">("全員");
  const [sortOrder, setSortOrder]   = useState<SortOrder>("名前");

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

  const direct  = MEMBERS.filter(m => m.type === "直用").length;
  const outside = MEMBERS.filter(m => m.type === "外注").length;

  const kpiTiles = [
    { label: "総メンバー数",   value: `${MEMBERS.length}`,  unit: "名", color: "#3B82F6", note: `直用${direct}・外注${outside}` },
    { label: "保有資格合計",   value: `${MEMBERS.reduce((s, m) => s + m.licenses.length, 0)}`, unit: "件", color: "#D97706", note: "全資格数" },
  ];

  return (
    <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>メンバー一覧</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>
            登録 {MEMBERS.length}名（直用 {direct}名・外注 {outside}社）
          </p>
        </div>
      </div>

      {/* ── Access mode banner ── */}
      <ForemanBanner
        viewerMemberId={viewerMemberId}
        setViewerMemberId={setViewerMemberId}
      />

      {/* ── KPI strip ── */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {kpiTiles.map(({ label, value, unit, color, note }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 2px 4px rgba(0,0,0,0.06)", borderRadius: 16, padding: "20px" }}>
            <p style={{ fontSize: 14, color: C.sub, marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}<span style={{ fontSize: 16, fontWeight: 600 }}>{unit}</span></p>
            <p style={{ fontSize: 14, marginTop: 4, color: C.muted }}>{note}</p>
          </div>
        ))}
        {/* Locked KPI chips */}
        <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 16, padding: "20px", opacity: 0.7 }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Lock size={13} style={{ color: "#94A3B8" }} />
            <p style={{ fontSize: 14, color: "#94A3B8" }}>当月出勤率</p>
          </div>
          <p style={{ fontSize: 14, color: "#94A3B8" }}>管理者のみ閲覧可</p>
        </div>
        <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 16, padding: "20px", opacity: 0.7 }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Lock size={13} style={{ color: "#94A3B8" }} />
            <p style={{ fontSize: 14, color: "#94A3B8" }}>トラブル件数</p>
          </div>
          <p style={{ fontSize: 14, color: "#94A3B8" }}>管理者のみ閲覧可</p>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-col gap-6">

        {/* ── Search + list ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Search + type filter + sort */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <Search size={16} style={{ color: C.muted }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="氏名・資格で検索…"
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 15, color: C.text }}
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                {(["全員", "直用", "外注"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className="px-4 py-2 rounded-xl transition-all"
                    style={{
                      fontSize: 14, fontWeight: 700, borderRadius: 10,
                      ...(typeFilter === t
                        ? { background: "rgba(245,158,11,0.1)", color: C.amberDk, border: "1px solid rgba(245,158,11,0.3)" }
                        : { background: C.card, color: C.sub, border: `1px solid ${C.border}` })
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>並び替え：</span>
                <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "#F1F5F9" }}>
                  {(["名前", "経験", "スコア"] as SortOrder[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setSortOrder(s)}
                      className="px-3 py-1.5 rounded-md transition-all"
                      style={{
                        fontSize: 13, fontWeight: 700,
                        ...(sortOrder === s
                          ? { background: C.card, color: C.amberDk, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                          : { color: C.muted })
                      }}
                    >
                      {s}順
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F1F5F9" }}>
            {(["一覧", "勤怠", "資格"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg transition-all"
                style={{
                  fontSize: 14, fontWeight: 700,
                  ...(tab === t
                    ? { background: C.card, color: C.amber, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderBottom: `2px solid ${C.amber}` }
                    : { color: "#4B5563" })
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Tab: 一覧 ── */}
          {tab === "一覧" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {filtered.map((m, i) => <MemberCardGeneral key={m.id} m={m} rank={i} />)}
            </div>
          )}

          {/* ── Tab: 勤怠 ── */}
          {tab === "勤怠" && (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl gap-3" style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1" }}>
              <Lock size={28} style={{ color: "#94A3B8" }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: "#64748B" }}>勤怠情報は管理者のみ閲覧できます</p>
              <p style={{ fontSize: 14, color: "#94A3B8" }}>管理者ダッシュボードからご確認ください</p>
            </div>
          )}

          {/* ── Tab: 資格 ── */}
          {tab === "資格" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map(m => {
                const lvl = experienceLevel(experienceYears(m));
                return (
                  <Link key={m.id} href={`/kaitai/members/${m.id}`}>
                    <div className="p-4 hover:shadow-md transition-all" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 2px 4px rgba(0,0,0,0.06)", borderRadius: 16 }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold" style={{ width: 36, height: 36, background: lvl.bg, color: lvl.color, fontSize: 14 }}>
                          {m.avatar}
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{m.name}</p>
                        <span style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: lvl.bg, color: lvl.color }}>{lvl.label}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <Award size={14} style={{ color: "#D97706" }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#D97706" }}>{m.licenses.length}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.licenses.map(lic => (
                          <span key={lic} style={{ fontSize: 14, padding: "4px 12px", borderRadius: 8, fontWeight: 500, background: "#FFFBEB", color: C.sub, border: "1px solid #FEF3C7" }}>
                            {LICENSE_LABELS[lic] ?? lic}
                          </span>
                        ))}
                        {m.licenses.length === 0 && (
                          <span style={{ fontSize: 14, color: C.muted }}>資格なし</span>
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
