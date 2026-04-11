"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, X, Building2, ChevronRight, Search, Loader2,
  MapPin, Calendar,
} from "lucide-react";
import { DOC_META, DocType, yen, calcTotals } from "../lib/doc-types";
import { T } from "../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
};

// ─── Status badge config ──────────────────────────────────────────────────────

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

// ─── Site type from API ───────────────────────────────────────────────────────

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

// ─── Doc type selector modal ──────────────────────────────────────────────────

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
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<SiteItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch real sites + clients
  useEffect(() => {
    Promise.all([
      fetch("/api/kaitai/sites", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/clients", { credentials: "include" }).then(r => r.ok ? r.json() : null),
    ]).then(([sitesData, clientsData]) => {
      if (sitesData?.sites) {
        setSites(
          (sitesData.sites as SiteItem[]).map(s => ({
            id: s.id,
            name: s.name ?? "",
            address: s.address ?? "",
            status: s.status ?? "",
            startDate: s.startDate ?? "",
            endDate: s.endDate ?? "",
            contractAmount: s.contractAmount ?? 0,
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
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Get unique statuses for filter
  const statuses = Array.from(new Set(sites.map(s => s.status))).filter(Boolean);

  // Filter sites
  const filteredSites = sites.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const client = clients.find(c => c.id === s.clientId);
      const match = s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        (client?.name ?? "").toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Get client name helper
  const getClientName = (clientId: string | null) => {
    if (!clientId) return undefined;
    return clients.find(c => c.id === clientId)?.name;
  };

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
          現場を選択して帳票を生成 · 印刷 / PDF保存
        </p>

        {/* Available doc types */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {Object.entries(DOC_META).map(([, meta]) => (
            <span
              key={meta.label}
              style={{
                fontSize: 13, fontWeight: 600,
                color: C.amberDk, background: T.primaryLt,
                border: `1px solid ${T.primaryMd}`,
                borderRadius: 20, padding: "4px 12px",
              }}
            >
              {meta.emoji} {meta.label}
            </span>
          ))}
        </div>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
          <input
            type="text"
            placeholder="現場名・住所・元請で検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl outline-none"
            style={{ height: 44, fontSize: 14, padding: "0 14px 0 36px", border: `1.5px solid ${C.border}`, color: C.text, background: "#fff" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl outline-none"
          style={{
            height: 44, fontSize: 13, padding: "0 12px",
            border: `1.5px solid ${C.border}`, color: C.text,
            background: "#fff", minWidth: 120,
          }}
        >
          <option value="all">全ステータス</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Site count */}
      <p style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 12 }}>
        {filteredSites.length}件の現場
      </p>

      {/* Empty state */}
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

                {/* Status + amount row */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    style={{
                      fontSize: 12, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 20,
                      background: badge.bg, color: badge.fg,
                    }}
                  >
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

                {/* 帳票出力 button */}
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
