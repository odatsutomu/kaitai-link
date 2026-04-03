"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin, Calendar, Edit3, ChevronRight, Search,
  Building2, CheckCircle, Clock,
} from "lucide-react";
import { T } from "../../lib/design-tokens";

type SiteRow = {
  id: string;
  name: string;
  address: string;
  status: string;
  startDate: string;
  endDate: string;
  contractAmount: number;
  costAmount: number;
  progressPct: number;
  structureType: string;
};

const STATUS_ORDER: Record<string, number> = { "施工中": 0, "着工前": 1, "完工": 2 };
const STATUS_DISPLAY: Record<string, string> = { "施工中": "解体中", "着工前": "着工前", "完工": "完工" };

const STATUS_STYLE: Record<string, { bg: string; fg: string; icon: typeof Building2 }> = {
  "施工中": { bg: "rgba(180,83,9,0.1)", fg: T.primary, icon: Building2 },
  "着工前": { bg: "rgba(59,130,246,0.1)", fg: "#3B82F6", icon: Clock },
  "完工":   { bg: "rgba(16,185,129,0.1)", fg: "#10B981", icon: CheckCircle },
};

const fmt = (n: number) => n > 0 ? `¥${Math.round(n).toLocaleString("ja-JP")}` : "—";

export default function AdminSitesPage() {
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kaitai/sites", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.sites) return;
        setSites(
          data.sites.map((s: Record<string, unknown>) => ({
            id: s.id as string,
            name: s.name as string,
            address: (s.address as string) ?? "",
            status: (s.status as string) ?? "着工前",
            startDate: (s.startDate as string) ?? "",
            endDate: (s.endDate as string) ?? "",
            contractAmount: (s.contractAmount as number) ?? 0,
            costAmount: (s.costAmount as number) ?? 0,
            progressPct: (s.progressPct as number) ?? 0,
            structureType: (s.structureType as string) ?? "",
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = sites
    .filter(s => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
    })
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

  const active   = filtered.filter(s => s.status === "施工中");
  const upcoming = filtered.filter(s => s.status === "着工前");
  const done     = filtered.filter(s => s.status === "完工");

  const groups = [
    { label: "解体中", sites: active,   color: T.primary, count: active.length },
    { label: "着工前", sites: upcoming, color: "#3B82F6", count: upcoming.length },
    { label: "完工",   sites: done,     color: "#10B981", count: done.length },
  ];

  if (loading) {
    return (
      <div className="py-20 text-center" style={{ color: T.sub }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>現場管理</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: T.sub }}>
            登録現場の確認・編集（{sites.length}件）
          </p>
        </div>
        <Link
          href="/kaitai/sites/new"
          className="px-5 py-2.5 rounded-lg text-sm font-bold"
          style={{ background: T.primary, color: "#fff", textDecoration: "none" }}
        >
          + 新規現場登録
        </Link>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search
          size={16}
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.muted }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="現場名・住所で検索..."
          className="w-full rounded-xl outline-none"
          style={{
            background: "#fff",
            border: `1px solid ${T.border}`,
            color: T.text,
            padding: "12px 14px 12px 40px",
            fontSize: 14,
          }}
        />
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {groups.map(g => (
          <div
            key={g.label}
            className="px-4 py-3 rounded-xl"
            style={{ background: "#fff", border: `1px solid ${T.border}` }}
          >
            <p style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{g.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: g.color, lineHeight: 1 }}>
              {g.count}<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 2, color: T.sub }}>件</span>
            </p>
          </div>
        ))}
      </div>

      {/* ── Site groups ── */}
      {groups.map(group => {
        if (group.sites.length === 0) return null;
        return (
          <section key={group.label}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full" style={{ background: group.color }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                {group.label}
                <span style={{ fontSize: 13, fontWeight: 500, color: T.sub, marginLeft: 8 }}>
                  {group.count}件
                </span>
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              {group.sites.map(site => {
                const ss = STATUS_STYLE[site.status] ?? STATUS_STYLE["着工前"];
                const profit = site.contractAmount > 0 && site.costAmount > 0
                  ? site.contractAmount - site.costAmount
                  : null;
                const profitPct = profit !== null && site.contractAmount > 0
                  ? Math.round((profit / site.contractAmount) * 100)
                  : null;

                return (
                  <div
                    key={site.id}
                    className="rounded-xl transition-colors"
                    style={{
                      background: "#fff",
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <div className="px-5 py-4">
                      {/* Row 1: name + status + edit */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className="text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{ background: ss.bg, color: ss.fg }}
                            >
                              {STATUS_DISPLAY[site.status] ?? site.status}
                            </span>
                            {site.structureType && (
                              <span style={{ fontSize: 12, color: T.muted }}>
                                {site.structureType}
                              </span>
                            )}
                          </div>
                          <p style={{
                            fontSize: 15, fontWeight: 700, color: T.text,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {site.name}
                          </p>
                        </div>

                        <Link
                          href={`/kaitai/sites/${site.id}/edit`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold flex-shrink-0"
                          style={{
                            background: T.primaryLt,
                            color: T.primary,
                            textDecoration: "none",
                            border: `1px solid ${T.primaryMd}`,
                          }}
                        >
                          <Edit3 size={12} />
                          編集
                        </Link>
                      </div>

                      {/* Row 2: address */}
                      {site.address && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <MapPin size={12} style={{ color: T.muted, flexShrink: 0 }} />
                          <p style={{ fontSize: 13, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {site.address}
                          </p>
                        </div>
                      )}

                      {/* Row 3: meta */}
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* 工期 */}
                        {(site.startDate || site.endDate) && (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} style={{ color: T.muted }} />
                            <span style={{ fontSize: 12, color: T.sub }}>
                              {site.startDate.replace(/-/g, "/")} 〜 {site.endDate.replace(/-/g, "/")}
                            </span>
                          </div>
                        )}

                        {/* 受注金額 */}
                        {site.contractAmount > 0 && (
                          <span style={{ fontSize: 12, color: T.sub }}>
                            受注 {fmt(site.contractAmount)}
                          </span>
                        )}

                        {/* 粗利 */}
                        {profitPct !== null && (
                          <span style={{
                            fontSize: 12, fontWeight: 700,
                            color: profitPct >= 20 ? "#10B981" : profitPct >= 10 ? "#D97706" : "#EF4444",
                          }}>
                            粗利 {profitPct}%
                          </span>
                        )}

                        {/* 進捗 */}
                        {site.status === "施工中" && site.progressPct > 0 && (
                          <span style={{ fontSize: 12, color: T.sub }}>
                            進捗 {site.progressPct}%
                          </span>
                        )}
                      </div>

                      {/* Progress bar for active sites */}
                      {site.status === "施工中" && site.progressPct > 0 && (
                        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${site.progressPct}%`,
                              background: `linear-gradient(90deg, ${T.primary}, ${T.primaryDk})`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Footer: detail link */}
                    <Link
                      href={`/kaitai/site/${site.id}`}
                      className="flex items-center justify-between px-5 py-3 rounded-b-xl"
                      style={{
                        borderTop: `1px solid ${T.border}`,
                        textDecoration: "none",
                        background: "#F8FAFC",
                      }}
                    >
                      <span style={{ fontSize: 13, color: T.sub }}>現場詳細を見る</span>
                      <ChevronRight size={14} style={{ color: T.muted }} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 && !loading && (
        <div className="py-16 text-center">
          <Building2 size={36} style={{ color: T.muted, margin: "0 auto 12px" }} />
          <p style={{ fontSize: 15, color: T.sub }}>
            {search ? "検索条件に一致する現場がありません" : "登録されている現場がありません"}
          </p>
        </div>
      )}
    </div>
  );
}
