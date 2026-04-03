"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Star, Award } from "lucide-react";
import {
  LICENSE_LABELS,
  experienceYears, experienceLevel,
} from "../lib/members";
import type { Member } from "../lib/members";
import { T } from "../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: T.sub,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
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

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortOrder = "名前" | "経験";

// ─── Member card ──────────────────────────────────────────────────────────────

function MemberCard({ m, rank }: { m: Member; rank: number }) {
  const yrs = experienceYears(m);
  const lvl = experienceLevel(yrs);

  return (
    <Link href={`/kaitai/members/${m.id}`}>
      <div
        className="p-5 hover:shadow-md active:scale-[0.99] transition-all"
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
              : rank === 2 ? { background: T.primaryLt, color: "#92400E" }
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
              <span style={{ fontSize: 14, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: lvl.bg, color: lvl.color }}>
                {lvl.label}
              </span>
              {m.type === "外注" && (
                <span style={{ fontSize: 14, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: "#EFF6FF", color: "#2563EB" }}>外注</span>
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
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Tab = "一覧" | "資格";

export default function MembersPage() {
  const [tab, setTab]         = useState<Tab>("一覧");
  const [query, setQuery]     = useState("");
  const [typeFilter, setTypeFilter] = useState<"全員" | "直用" | "外注">("全員");
  const [sortOrder, setSortOrder]   = useState<SortOrder>("名前");
  const [MEMBERS, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetch("/api/kaitai/members", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.members) return;
        const mapped: Member[] = data.members.map((m: Record<string, unknown>) => ({
          id: m.id as string,
          name: m.name as string,
          kana: (m.kana as string) ?? "",
          type: (m.type as string) ?? "直用",
          company: m.company2 as string | undefined,
          birthDate: (m.birthDate as string) ?? "",
          hireDate: (m.hireDate as string) ?? "",
          address: (m.address as string) ?? "",
          emergency: (m.emergency as string) ?? "",
          licenses: (m.licenses as string[]) ?? [],
          preYears: (m.preYears as number) ?? 0,
          siteCount: (m.siteCount as number) ?? 0,
          dayRate: (m.dayRate as number) ?? 0,
          role: (m.role as string) ?? "作業員",
          avatar: (m.avatar as string) ?? (m.name as string).charAt(0),
        }));
        setMembers(mapped);
      })
      .catch(() => {});
  }, []);

  const sorted = [...MEMBERS].sort((a, b) => {
    if (sortOrder === "経験") {
      const diff = b.siteCount - a.siteCount;
      return diff !== 0 ? diff : experienceYears(b) - experienceYears(a);
    }
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

      {/* ── KPI strip ── */}
      <div className="grid gap-3 grid-cols-2">
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
          <p style={{ fontSize: 14, color: C.sub, marginBottom: 8 }}>総メンバー数</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: "#3B82F6", lineHeight: 1 }}>{MEMBERS.length}<span style={{ fontSize: 16, fontWeight: 600 }}>名</span></p>
          <p style={{ fontSize: 14, marginTop: 4, color: C.muted }}>直用{direct}・外注{outside}</p>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
          <p style={{ fontSize: 14, color: C.sub, marginBottom: 8 }}>保有資格合計</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: T.primaryDk, lineHeight: 1 }}>{MEMBERS.reduce((s, m) => s + m.licenses.length, 0)}<span style={{ fontSize: 16, fontWeight: 600 }}>件</span></p>
          <p style={{ fontSize: 14, marginTop: 4, color: C.muted }}>全資格数</p>
        </div>
      </div>

      {/* ── Search + filters ── */}
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
              {(["名前", "経験"] as SortOrder[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSortOrder(s)}
                  className="px-3 py-1.5 rounded-md transition-all"
                  style={{
                    fontSize: 13, fontWeight: 700,
                    ...(sortOrder === s
                      ? { background: C.card, color: C.amberDk }
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
        {(["一覧", "資格"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg transition-all"
            style={{
              fontSize: 14, fontWeight: 700,
              ...(tab === t
                ? { background: C.card, color: C.amber, borderBottom: `2px solid ${C.amber}` }
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
          {filtered.map((m, i) => <MemberCard key={m.id} m={m} rank={i} />)}
        </div>
      )}

      {/* ── Tab: 資格 ── */}
      {tab === "資格" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(m => {
            const lvl = experienceLevel(experienceYears(m));
            return (
              <Link key={m.id} href={`/kaitai/members/${m.id}`}>
                <div className="p-5 hover:shadow-md transition-all" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold" style={{ width: 36, height: 36, background: lvl.bg, color: lvl.color, fontSize: 14 }}>
                      {m.avatar}
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{m.name}</p>
                    <span style={{ fontSize: 14, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: lvl.bg, color: lvl.color }}>{lvl.label}</span>
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
  );
}
