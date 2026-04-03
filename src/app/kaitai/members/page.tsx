"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search, Star, Award, Shield, TrendingUp, TrendingDown,
  AlertTriangle, Zap, Users, Clock, Plus, Lock, Eye,
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
      <polygon points={bgPts} fill="none" stroke="#E5E7EB" strokeWidth="0.8" />
      <polygon points={pts} fill="rgba(245,158,11,0.15)" stroke="#F59E0B" strokeWidth="1.2" />
    </svg>
  );
}

// ─── Alert section (admin only) ───────────────────────────────────────────────

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
  const yrs = experienceYears(m);
  const lvl = experienceLevel(yrs);

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
          <div className="flex items-center gap-1">
            <Award size={14} style={{ color: "#D97706" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#D97706" }}>{m.licenses.length}</span>
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
  const { adminMode, viewerMemberId, setViewerMemberId } = useAppContext();

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

  // KPI tiles differ by role
  const kpiTiles = adminMode
    ? [
        { label: "総メンバー数",   value: `${MEMBERS.length}`,  unit: "名", color: "#3B82F6", note: `直用${direct}・外注${outside}` },
        { label: "当月出勤率",     value: `${avgAtt}`,           unit: "%", color: avgAtt >= 90 ? C.green : C.amber, note: "月間平均" },
        { label: "トラブル件数",   value: `${totalTrouble}`,    unit: "件", color: totalTrouble > 0 ? C.red : C.green, note: "今月累計" },
        { label: "保有資格合計",   value: `${MEMBERS.reduce((s, m) => s + m.licenses.length, 0)}`, unit: "件", color: "#D97706", note: "全資格数" },
      ]
    : [
        { label: "総メンバー数",   value: `${MEMBERS.length}`,  unit: "名", color: "#3B82F6", note: `直用${direct}・外注${outside}` },
        { label: "保有資格合計",   value: `${MEMBERS.reduce((s, m) => s + m.licenses.length, 0)}`, unit: "件", color: "#D97706", note: "全資格数" },
      ];

  return (
    <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>メンバー管理</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>
            登録 {MEMBERS.length}名（直用 {direct}名・外注 {outside}社）
          </p>
        </div>
        {adminMode && (
          <button
            className="inline-flex items-center gap-2 flex-shrink-0 transition-all active:scale-95 hover:opacity-90"
            style={{ background: "#F59E0B", color: "#FFFFFF", fontSize: 15, fontWeight: 600, padding: "12px 20px", borderRadius: 12, boxShadow: "0 2px 8px rgba(245,158,11,0.35)" }}
          >
            <Plus size={16} />
            メンバー追加
          </button>
        )}
      </div>

      {/* ── Access mode banner ── */}
      {!adminMode && (
        <ForemanBanner
          viewerMemberId={viewerMemberId}
          setViewerMemberId={setViewerMemberId}
        />
      )}

      {/* ── KPI strip ── */}
      <div className={`grid gap-3 ${adminMode ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"}`}>
        {kpiTiles.map(({ label, value, unit, color, note }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 2px 4px rgba(0,0,0,0.06)", borderRadius: 16, padding: "20px" }}>
            <p style={{ fontSize: 14, color: C.sub, marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}<span style={{ fontSize: 16, fontWeight: 600 }}>{unit}</span></p>
            <p style={{ fontSize: 14, marginTop: 4, color: C.muted }}>{note}</p>
          </div>
        ))}
        {/* Locked KPI chips for non-admin */}
        {!adminMode && (
          <>
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
          </>
        )}
      </div>

      {/* ── Main 2-col layout ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Left sidebar (lg+) ── */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4">
          {adminMode && <AlertSection />}
          <SkillMap />
        </div>

        {/* ── Right: search + list ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Search + type filter */}
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
              {filtered.map((m) => adminMode
                ? <MemberCardAdmin key={m.id} m={m} rank={sorted.indexOf(m)} />
                : <MemberCardGeneral key={m.id} m={m} rank={sorted.indexOf(m)} />
              )}
            </div>
          )}

          {/* ── Tab: 勤怠 ── */}
          {tab === "勤怠" && (
            adminMode ? (
              <div className="flex flex-col gap-3">
                <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 4px", color: C.amber }}>
                  4月 出勤率ランキング
                </p>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {attRanked.map((m) => {
                    const s = MEMBER_STATS.find(x => x.memberId === m.id)!;
                    const lvl = experienceLevel(experienceYears(m));
                    const attColor = s.attendancePct >= 95 ? C.green : s.attendancePct >= 80 ? C.amber : C.red;
                    return (
                      <Link key={m.id} href={`/kaitai/members/${m.id}?tab=勤怠`}>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 2px 4px rgba(0,0,0,0.06)", borderRadius: 16, padding: "20px 20px 16px" }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold" style={{ width: 40, height: 40, background: lvl.bg, color: lvl.color, fontSize: 15 }}>
                              {m.avatar}
                            </div>
                            <div className="flex-1">
                              <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{m.name}</p>
                              <p style={{ fontSize: 14, color: C.muted }}>
                                出勤 {s.workDays}日・遅刻 {s.lateDays}・欠勤 {s.absentDays}
                              </p>
                            </div>
                            <div className="text-right">
                              <p style={{ fontSize: 28, fontWeight: 800, color: attColor, lineHeight: 1 }}>{s.attendancePct}%</p>
                              <p style={{ fontSize: 14, color: C.muted }}>{s.totalHours}h</p>
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
                      <span style={{ fontSize: 14, color: C.muted }}>{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 rounded-2xl gap-3" style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1" }}>
                <Lock size={28} style={{ color: "#94A3B8" }} />
                <p style={{ fontSize: 16, fontWeight: 700, color: "#64748B" }}>勤怠情報は管理者のみ閲覧できます</p>
                <p style={{ fontSize: 14, color: "#94A3B8" }}>管理者ダッシュボードからご確認ください</p>
              </div>
            )
          )}

          {/* ── Tab: 資格 ── */}
          {tab === "資格" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sorted.map(m => {
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
