"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, X, Building2, ChevronRight, Search, Loader2,
  MapPin, Calendar, History, Download, Filter,
} from "lucide-react";
import { DOC_META, DocType, yen, calcTotals } from "../lib/doc-types";
import { T } from "../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
};

// ─── Status helpers ──────────────────────────────────────────────────────────

const FINISHED_STATUSES = new Set(["完工", "完工・更地確認", "産廃書類完了", "入金確認"]);

const STATUS_BADGE: Record<string, { bg: string; fg: string }> = {
  "調査・見積":     { bg: "rgba(107,114,128,0.1)", fg: "#6B7280" },
  "契約・申請":     { bg: "rgba(99,102,241,0.1)",  fg: "#6366F1" },
  "近隣挨拶・養生": { bg: "rgba(59,130,246,0.1)",  fg: "#3B82F6" },
  "着工・内装解体": { bg: T.primaryLt,             fg: T.primaryDk },
  "上屋解体・基礎": { bg: "rgba(180,83,9,0.12)",   fg: "#B45309" },
  "完工・更地確認": { bg: "rgba(16,185,129,0.1)",  fg: "#10B981" },
  "産廃書類完了":   { bg: "rgba(13,148,136,0.1)",  fg: "#0D9488" },
  "入金確認":       { bg: "rgba(5,150,105,0.1)",   fg: "#059669" },
  施工中: { bg: T.primaryLt, fg: T.primaryDk },
  着工前: { bg: "#F5F3FF",   fg: "#7C3AED" },
  完工:   { bg: "#F0FDF4",   fg: "#16A34A" },
};

// ─── Types ───────────────────────────────────────────────────────────────────

type SiteItem = {
  id: string;
  name: string;
  address: string;
  status: string;
  startDate: string;
  endDate: string;
  contractAmount: number;
  clientId: string | null;
};

type ClientItem = {
  id: string;
  name: string;
  contactName: string;
};

type IssueRecord = {
  id: string;
  siteId: string;
  docType: string;
  docNo: string;
  issuedAt: string;
};

// ─── All doc types (including photo album) ───────────────────────────────────

const ALL_DOC_TYPES: { key: string; label: string; emoji: string }[] = [
  ...Object.entries(DOC_META).map(([k, v]) => ({ key: k, label: v.label, emoji: v.emoji })),
  { key: "photo_album", label: "写真台帳", emoji: "📸" },
];

// ─── Period filter helpers ───────────────────────────────────────────────────

function dateToYM(dateStr: string): number {
  // "2026-04-12" → 202604
  const [y, m] = dateStr.split("-").map(Number);
  return y * 100 + m;
}

function monthLabel(ym: number): string {
  const y = Math.floor(ym / 100);
  const m = ym % 100;
  return `${y}年${m}月`;
}

/** Check if a site's date range overlaps with [fromYM, toYM] */
function siteInPeriod(site: SiteItem, rangeFrom: number, rangeTo: number): boolean {
  if (!site.startDate && !site.endDate) return true; // no dates → always show
  const sStart = site.startDate ? dateToYM(site.startDate) : 0;
  const sEnd   = site.endDate   ? dateToYM(site.endDate)   : 999999;
  // Overlap: sStart <= rangeTo && sEnd >= rangeFrom
  return sStart <= rangeTo && sEnd >= rangeFrom;
}

/** Generate month options for last 24 months + next 6 months */
function genMonthOptions(): { value: string; label: string }[] {
  const now = new Date();
  const result: { value: string; label: string }[] = [];
  for (let offset = -24; offset <= 6; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const ym = d.getFullYear() * 100 + (d.getMonth() + 1);
    result.push({ value: String(ym), label: monthLabel(ym) });
  }
  return result;
}

const MONTH_OPTIONS = genMonthOptions();

// ─── Doc type selector modal ─────────────────────────────────────────────────

function DocTypeModal({
  site,
  clientName,
  onClose,
}: {
  site: SiteItem;
  clientName?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const docTypes = Object.entries(DOC_META) as [DocType, (typeof DOC_META)[DocType]][];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          maxWidth: 520,
          width: "100%",
          paddingBottom: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>帳票を選択</p>
            <p style={{ fontSize: 14, color: C.sub, marginTop: 2 }}>{site.name}</p>
            {clientName && (
              <p style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>発注者：{clientName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: T.bg,
              border: "none",
              borderRadius: 8,
              width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} color={C.sub} />
          </button>
        </div>

        {/* Doc types */}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {docTypes.map(([type, meta]) => (
            <button
              key={type}
              onClick={() => router.push(`/kaitai/docs/preview?type=${type}&site=${site.id}`)}
              className="hover:bg-gray-50"
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 16px", borderRadius: 12,
                textAlign: "left", background: T.bg,
                border: `1px solid ${C.border}`,
                cursor: "pointer", width: "100%",
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: 24 }}>{meta.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{meta.label}</p>
                <p style={{ fontSize: 14, color: C.sub, margin: "2px 0 0" }}>{meta.desc}</p>
              </div>
              <ChevronRight size={16} color={C.muted} />
            </button>
          ))}

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0" }} />

          {/* Photo album */}
          <button
            onClick={() => router.push(`/kaitai/docs/photo-album?site=${site.id}`)}
            className="hover:bg-gray-50"
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 16px", borderRadius: 12,
              textAlign: "left", background: T.bg,
              border: `1px solid ${T.primaryMd}`,
              cursor: "pointer", width: "100%",
              transition: "background 0.15s",
            }}
          >
            <span style={{ fontSize: 24 }}>📸</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>写真台帳</p>
              <p style={{ fontSize: 14, color: C.sub, margin: "2px 0 0" }}>現場写真を選択してPDF台帳を作成</p>
            </div>
            <ChevronRight size={16} color={C.muted} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const router = useRouter();
  const [sites, setSites]       = useState<SiteItem[]>([]);
  const [clients, setClients]   = useState<ClientItem[]>([]);
  const [issues, setIssues]     = useState<IssueRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selectedSite, setSelectedSite] = useState<SiteItem | null>(null);

  // Filters
  const [searchQuery, setSearchQuery]   = useState("");
  const [statusGroup, setStatusGroup]   = useState<"all" | "active" | "finished">("all");
  const [periodFrom, setPeriodFrom]     = useState("");
  const [periodTo, setPeriodTo]         = useState("");

  // View mode: "sites" = site list, or a docType key = issue list for that type
  const [viewMode, setViewMode] = useState<"sites" | string>("sites");

  // Fetch data
  useEffect(() => {
    Promise.all([
      fetch("/api/kaitai/sites", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/clients", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/docs/issues", { credentials: "include" }).then(r => r.ok ? r.json() : null),
    ]).then(([sitesData, clientsData, issuesData]) => {
      if (sitesData?.sites) {
        setSites(
          (sitesData.sites as SiteItem[]).map(s => ({
            id: s.id, name: s.name ?? "", address: s.address ?? "",
            status: s.status ?? "", startDate: s.startDate ?? "",
            endDate: s.endDate ?? "", contractAmount: s.contractAmount ?? 0,
            clientId: s.clientId ?? null,
          }))
        );
      }
      if (clientsData?.clients) {
        setClients(
          (clientsData.clients as ClientItem[]).map(c => ({
            id: c.id, name: c.name ?? "", contactName: c.contactName ?? "",
          }))
        );
      }
      if (issuesData?.issues) setIssues(issuesData.issues as IssueRecord[]);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Helpers
  const getClientName = (clientId: string | null) => {
    if (!clientId) return undefined;
    return clients.find(c => c.id === clientId)?.name;
  };

  const getSiteName = (siteId: string) => sites.find(s => s.id === siteId)?.name ?? "—";

  const getSiteIssues = (siteId: string) => {
    const siteIssues = issues.filter(i => i.siteId === siteId);
    if (siteIssues.length === 0) return null;

    // Group by docType with latest date
    const byType = new Map<string, { count: number; latestAt: string }>();
    for (const iss of siteIssues) {
      const existing = byType.get(iss.docType);
      if (!existing || new Date(iss.issuedAt) > new Date(existing.latestAt)) {
        byType.set(iss.docType, {
          count: (existing?.count ?? 0) + 1,
          latestAt: iss.issuedAt,
        });
      } else {
        byType.set(iss.docType, { ...existing, count: existing.count + 1 });
      }
    }

    return { total: siteIssues.length, byType };
  };

  // ── Filtered sites ──
  const filteredSites = useMemo(() => {
    return sites.filter(s => {
      // Status group
      if (statusGroup === "active" && FINISHED_STATUSES.has(s.status)) return false;
      if (statusGroup === "finished" && !FINISHED_STATUSES.has(s.status)) return false;

      // Period overlap filter
      if (periodFrom || periodTo) {
        const fromYM = periodFrom ? Number(periodFrom) : 0;
        const toYM   = periodTo   ? Number(periodTo)   : 999999;
        if (!siteInPeriod(s, fromYM, toYM)) return false;
      }

      // Text search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const client = clients.find(c => c.id === s.clientId);
        const match = s.name.toLowerCase().includes(q)
          || s.address.toLowerCase().includes(q)
          || (client?.name ?? "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [sites, clients, statusGroup, periodFrom, periodTo, searchQuery]);

  // ── Filtered issues (for doc type view) ──
  const filteredIssues = useMemo(() => {
    if (viewMode === "sites") return [];
    let list = issues.filter(i => i.docType === viewMode);

    // Period filter on issuedAt
    if (periodFrom || periodTo) {
      const fromYM = periodFrom ? Number(periodFrom) : 0;
      const toYM   = periodTo   ? Number(periodTo)   : 999999;
      list = list.filter(i => {
        const d = new Date(i.issuedAt);
        const ym = d.getFullYear() * 100 + (d.getMonth() + 1);
        return ym >= fromYM && ym <= toYM;
      });
    }

    // Text search on site name
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => {
        const siteName = getSiteName(i.siteId);
        return siteName.toLowerCase().includes(q);
      });
    }

    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, viewMode, periodFrom, periodTo, searchQuery, sites]);

  // Current doc type info
  const activeDocInfo = ALL_DOC_TYPES.find(d => d.key === viewMode);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin" style={{ color: T.muted, marginRight: 8 }} />
        <span style={{ color: T.sub, fontSize: 14 }}>読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 pb-24 md:pb-8">

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>帳票出力</h1>
        <p style={{ fontSize: 14, color: C.sub, margin: "4px 0 0" }}>
          現場を選択して帳票を生成 · 帳票種別で発行履歴を確認
        </p>

        {/* Doc type tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {/* "現場一覧" tab */}
          <button
            onClick={() => setViewMode("sites")}
            style={{
              fontSize: 13, fontWeight: 700,
              color: viewMode === "sites" ? "#fff" : C.sub,
              background: viewMode === "sites" ? C.amber : T.bg,
              border: `1px solid ${viewMode === "sites" ? C.amber : C.border}`,
              borderRadius: 20, padding: "5px 14px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            🏗️ 現場一覧
          </button>

          {ALL_DOC_TYPES.map(dt => {
            const isActive = viewMode === dt.key;
            const issueCount = issues.filter(i => i.docType === dt.key).length;
            return (
              <button
                key={dt.key}
                onClick={() => setViewMode(dt.key)}
                style={{
                  fontSize: 13, fontWeight: 700,
                  color: isActive ? "#fff" : C.amberDk,
                  background: isActive ? C.amber : T.primaryLt,
                  border: `1px solid ${isActive ? C.amber : T.primaryMd}`,
                  borderRadius: 20, padding: "5px 14px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                {dt.emoji} {dt.label}
                {issueCount > 0 && (
                  <span style={{
                    marginLeft: 4,
                    fontSize: 11, fontWeight: 700,
                    color: isActive ? "rgba(255,255,255,0.8)" : C.muted,
                  }}>
                    ({issueCount})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
          <input
            type="text"
            placeholder={viewMode === "sites" ? "現場名・住所・元請で検索..." : "現場名で検索..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl outline-none"
            style={{ height: 44, fontSize: 14, padding: "0 14px 0 36px", border: `1.5px solid ${C.border}`, color: C.text, background: "#fff" }}
          />
        </div>

        {/* Status group (sites view only) */}
        {viewMode === "sites" && (
          <select
            value={statusGroup}
            onChange={e => setStatusGroup(e.target.value as "all" | "active" | "finished")}
            className="rounded-xl outline-none"
            style={{
              height: 44, fontSize: 13, padding: "0 12px",
              border: `1.5px solid ${C.border}`, color: C.text,
              background: "#fff", minWidth: 120,
            }}
          >
            <option value="all">全ステータス</option>
            <option value="active">進行中</option>
            <option value="finished">完了済み</option>
          </select>
        )}

        {/* Period from */}
        <div className="flex items-center gap-1.5">
          <Filter size={14} style={{ color: C.muted, flexShrink: 0 }} />
          <select
            value={periodFrom}
            onChange={e => setPeriodFrom(e.target.value)}
            className="rounded-xl outline-none"
            style={{
              height: 44, fontSize: 13, padding: "0 10px",
              border: `1.5px solid ${C.border}`, color: C.text,
              background: "#fff", minWidth: 110,
            }}
          >
            <option value="">開始月</option>
            {MONTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span style={{ color: C.muted, fontSize: 13 }}>〜</span>
          <select
            value={periodTo}
            onChange={e => setPeriodTo(e.target.value)}
            className="rounded-xl outline-none"
            style={{
              height: 44, fontSize: 13, padding: "0 10px",
              border: `1.5px solid ${C.border}`, color: C.text,
              background: "#fff", minWidth: 110,
            }}
          >
            <option value="">終了月</option>
            {MONTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Clear filters */}
        {(periodFrom || periodTo || searchQuery || statusGroup !== "all") && (
          <button
            onClick={() => { setPeriodFrom(""); setPeriodTo(""); setSearchQuery(""); setStatusGroup("all"); }}
            style={{
              height: 44, fontSize: 12, fontWeight: 600,
              color: C.muted, background: T.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "0 12px",
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SITES VIEW */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {viewMode === "sites" && (
        <>
          {/* Count */}
          <p style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 12 }}>
            {filteredSites.length}件の現場
          </p>

          {filteredSites.length === 0 && (
            <div className="py-16 text-center">
              <Building2 size={40} style={{ color: C.muted, margin: "0 auto 12px" }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: C.sub }}>
                {sites.length === 0 ? "現場が登録されていません" : "条件に一致する現場がありません"}
              </p>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                {sites.length === 0 ? "現場管理から現場を登録してください" : "検索条件を変更してください"}
              </p>
            </div>
          )}

          {/* Site grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: 16 }}>
            {filteredSites.map(site => {
              const { total } = calcTotals(site.contractAmount);
              const badge = STATUS_BADGE[site.status] ?? { bg: T.bg, fg: C.sub };
              const clientName = getClientName(site.clientId);

              return (
                <div
                  key={site.id}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    overflow: "hidden",
                  }}
                >
                  {/* Accent strip */}
                  <div style={{ height: 4, background: C.amber }} />

                  <div style={{ padding: 16 }}>
                    {/* Site info */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                      <div
                        style={{
                          width: 40, height: 40,
                          background: T.primaryLt, borderRadius: 10,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Building2 size={18} color={C.amber} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 15, fontWeight: 700, color: C.text, margin: 0,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {site.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin size={12} style={{ color: C.muted, flexShrink: 0 }} />
                          <p style={{ fontSize: 12, color: C.sub, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {site.address || "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status + amount */}
                    <div className="flex items-center justify-between mb-2">
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        padding: "3px 10px", borderRadius: 20,
                        background: badge.bg, color: badge.fg,
                      }}>
                        {site.status || "未設定"}
                      </span>
                      {site.contractAmount > 0 && (
                        <span style={{ fontSize: 14, fontWeight: 800, color: C.amberDk }}>
                          {yen(total)}
                          <span style={{ fontSize: 10, fontWeight: 500, color: C.muted, marginLeft: 2 }}>税込</span>
                        </span>
                      )}
                    </div>

                    {/* Dates */}
                    {(site.startDate || site.endDate) && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Calendar size={12} style={{ color: C.muted }} />
                        <span style={{ fontSize: 12, color: C.sub }}>
                          {(site.startDate ?? "").replace(/-/g, "/")} ～ {(site.endDate ?? "").replace(/-/g, "/")}
                        </span>
                      </div>
                    )}

                    {/* Client */}
                    {clientName && (
                      <p style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>
                        発注者：{clientName}
                      </p>
                    )}

                    {/* Issued doc type badges */}
                    {(() => {
                      const info = getSiteIssues(site.id);
                      if (!info) return null;
                      return (
                        <div style={{ marginBottom: 10 }}>
                          <div className="flex items-center gap-1.5 mb-1.5" style={{
                            fontSize: 11, color: "#10B981", fontWeight: 600,
                          }}>
                            <History size={11} />
                            <span>{info.total}回発行済み</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {Array.from(info.byType.entries()).map(([docType, typeInfo]) => {
                              const meta = ALL_DOC_TYPES.find(d => d.key === docType);
                              const d = new Date(typeInfo.latestAt);
                              const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
                              return (
                                <span
                                  key={docType}
                                  style={{
                                    fontSize: 11, fontWeight: 600,
                                    background: "#F0FDF4",
                                    color: "#16A34A",
                                    border: "1px solid rgba(22,163,106,0.2)",
                                    borderRadius: 8,
                                    padding: "2px 8px",
                                  }}
                                >
                                  {meta?.emoji ?? "📄"} {meta?.label ?? docType}
                                  {typeInfo.count > 1 && <span style={{ marginLeft: 2 }}>×{typeInfo.count}</span>}
                                  <span style={{ color: "#9CA3AF", marginLeft: 4, fontSize: 10, fontWeight: 500 }}>{dateStr}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Button */}
                    <button
                      onClick={() => setSelectedSite(site)}
                      style={{
                        width: "100%", padding: "10px 0",
                        borderRadius: 12, background: C.amber, color: "#fff",
                        border: "none", fontSize: 14, fontWeight: 700,
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        minHeight: 44,
                      }}
                    >
                      <FileText size={15} />
                      帳票を出力する
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ISSUE LIST VIEW (when a doc type tab is selected) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {viewMode !== "sites" && activeDocInfo && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>
              {activeDocInfo.emoji} {activeDocInfo.label} — 発行履歴 {filteredIssues.length}件
            </p>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={40} style={{ color: C.muted, margin: "0 auto 12px" }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: C.sub }}>
                {activeDocInfo.label}の発行履歴はありません
              </p>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                帳票プレビューからPDF保存すると履歴が記録されます
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredIssues.map(issue => {
                const site = sites.find(s => s.id === issue.siteId);
                const clientName = site?.clientId ? getClientName(site.clientId) : undefined;
                const d = new Date(issue.issuedAt);
                const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
                const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                const badge = site ? (STATUS_BADGE[site.status] ?? { bg: T.bg, fg: C.sub }) : { bg: T.bg, fg: C.sub };

                return (
                  <div
                    key={issue.id}
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 14,
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44,
                      background: T.primaryLt, borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, flexShrink: 0,
                    }}>
                      {activeDocInfo.emoji}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                          {site?.name ?? "—"}
                        </span>
                        {site && (
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            padding: "2px 8px", borderRadius: 12,
                            background: badge.bg, color: badge.fg,
                          }}>
                            {site.status}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>
                        <span style={{ fontWeight: 600 }}>{dateStr} {timeStr}</span>
                        <span style={{ color: C.muted, marginLeft: 8 }}>発行済み</span>
                        <span style={{ color: C.muted, marginLeft: 8 }}>No. {issue.docNo}</span>
                      </div>
                      {clientName && (
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                          発注者：{clientName}
                        </div>
                      )}
                    </div>

                    {/* Re-issue button */}
                    <button
                      onClick={() => {
                        if (viewMode === "photo_album") {
                          router.push(`/kaitai/docs/photo-album?site=${issue.siteId}`);
                        } else {
                          router.push(`/kaitai/docs/preview?type=${viewMode}&site=${issue.siteId}`);
                        }
                      }}
                      className="flex items-center gap-1.5"
                      style={{
                        fontSize: 13, fontWeight: 700,
                        color: "#fff", background: C.amber,
                        border: "none", borderRadius: 10,
                        padding: "8px 16px",
                        cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      <Download size={14} />
                      再発行
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {selectedSite && (
        <DocTypeModal
          site={selectedSite}
          clientName={getClientName(selectedSite.clientId)}
          onClose={() => setSelectedSite(null)}
        />
      )}
    </div>
  );
}
