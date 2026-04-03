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
import { T } from "../lib/design-tokens";

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

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  "#要注意":         { bg: "#FEF2F2", color: "#DC2626" },
  "#ルール違反":     { bg: "#FEF2F2", color: "#DC2626" },
  "#リーダーシップ": { bg: T.primaryLt, color: T.primaryDk },
  "#安全模範":       { bg: "#F0FDF4", color: "#16A34A" },
  "#効率的":         { bg: "#EFF6FF", color: "#2563EB" },
  "#成長中":         { bg: "#F5F3FF", color: "#7C3AED" },
};
function tagStyle(tag: string) {
  return TAG_COLORS[tag] ?? { bg: T.bg, color: T.sub };
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

// ─── Member card (general worker) ─────────────────────────────────────────────

function MemberCardGeneral({ m, rank }: { m: (typeof MEMBERS)[0]; rank: number }) {
  const yrs   = experienceYears(m);
  const lvl   = experienceLevel(yrs);
  const score = activityScore(m);
  const scoreColor = score >= 70 ? C.green : score >= 50 ? C.amberDk : T.sub;

  return (
    <Link href={`/kaitai/members/${m.id}`}>
      <div
        className="p-4 hover:shadow-md active:scale-[0.99] transition-all"
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-md"
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
              <Award size={13} style={{ color: T.primaryDk }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: T.primaryDk }}>{m.licenses.length}資格</span>
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
      style={{ background: T.primaryLt, border: "1px solid #E5E7EB" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Eye size={15} style={{ color: T.primaryDk }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.primaryDk }}>
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
              style={{ background: T.primaryMd, border: "1px solid #E5E7EB", fontSize: 14, fontWeight: 600, color: "#92400E" }}
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
    { label: "保有資格合計",   value: `${MEMBERS.reduce((s, m) => s + m.licenses.length, 0)}`, unit: "件", color: T.primaryDk, note: "全資格数" },
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
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`,
 borderRadius: 16, padding: "20px" }}>
            <p style={{ fontSize: 14, color: C.sub, marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}<span style={{ fontSize: 16, fontWeight: 600 }}>{unit}</span></p>
            <p style={{ fontSize: 14, marginTop: 4, color: C.muted }}>{note}</p>
          </div>
        ))}
        {/* Locked KPI chips */}
        <div style={{ background: T.bg, border: "1px dashed #CBD5E1", borderRadius: 16, padding: "20px", opacity: 0.7 }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Lock size={13} style={{ color: T.muted }} />
            <p style={{ fontSize: 14, color: T.muted }}>当月出勤率</p>
          </div>
          <p style={{ fontSize: 14, color: T.muted }}>管理者のみ閲覧可</p>
        </div>
        <div style={{ background: T.bg, border: "1px dashed #CBD5E1", borderRadius: 16, padding: "20px", opacity: 0.7 }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Lock size={13} style={{ color: T.muted }} />
            <p style={{ fontSize: 14, color: T.muted }}>トラブル件数</p>
          </div>
          <p style={{ fontSize: 14, color: T.muted }}>管理者のみ閲覧可</p>
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
                        ? { background: T.primaryLt, color: C.amberDk, border: `1px solid ${T.primaryMd}` }
                        : { background: C.card, color: C.sub, border: `1px solid ${C.border}` })
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>並び替え：</span>
                <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: T.bg }}>
                  {(["名前", "経験", "スコア"] as SortOrder[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setSortOrder(s)}
                      className="px-3 py-1.5 rounded-md transition-all"
                      style={{
                        fontSize: 13, fontWeight: 700,
                        ...(sortOrder === s
                          ? { background: C.card, color: C.amberDk,
 }
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
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: T.bg }}>
            {(["一覧", "勤怠", "資格"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg transition-all"
                style={{
                  fontSize: 14, fontWeight: 700,
                  ...(tab === t
                    ? { background: C.card, color: C.amber,
 borderBottom: `2px solid ${C.amber}` }
                    : { color: T.sub })
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
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl gap-3" style={{ background: T.bg, border: "1px dashed #CBD5E1" }}>
              <Lock size={28} style={{ color: T.muted }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: T.sub }}>勤怠情報は管理者のみ閲覧できます</p>
              <p style={{ fontSize: 14, color: T.muted }}>管理者ダッシュボードからご確認ください</p>
            </div>
          )}

          {/* ── Tab: 資格 ── */}
          {tab === "資格" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map(m => {
                const lvl = experienceLevel(experienceYears(m));
                return (
                  <Link key={m.id} href={`/kaitai/members/${m.id}`}>
                    <div className="p-4 hover:shadow-md transition-all" style={{ background: C.card, border: `1px solid ${C.border}`,
 borderRadius: 16 }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold" style={{ width: 36, height: 36, background: lvl.bg, color: lvl.color, fontSize: 14 }}>
                          {m.avatar}
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{m.name}</p>
                        <span style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: lvl.bg, color: lvl.color }}>{lvl.label}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <Award size={14} style={{ color: T.primaryDk }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: T.primaryDk }}>{m.licenses.length}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.licenses.map(lic => (
                          <span key={lic} style={{ fontSize: 14, padding: "4px 12px", borderRadius: 8, fontWeight: 500, background: T.primaryLt, color: C.sub, border: "1px solid #F3F4F6" }}>
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
