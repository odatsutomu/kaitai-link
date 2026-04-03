"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MapPin, Calendar, Edit3, ChevronRight, ChevronLeft, Search,
  Building2, CheckCircle, Clock, FileText, Handshake,
  ShieldCheck, Hammer, Truck, CreditCard, ClipboardCheck,
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

// ─── 8-stage status system ──────────────────────────────────────────────────

const STATUSES = [
  { key: "調査・見積",     label: "調査・見積",     group: "pre",    icon: Search,         color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
  { key: "契約・申請",     label: "契約・申請",     group: "pre",    icon: FileText,       color: "#6366F1", bg: "rgba(99,102,241,0.1)" },
  { key: "近隣挨拶・養生", label: "近隣挨拶・養生", group: "pre",    icon: Handshake,      color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  { key: "着工・内装解体", label: "着工・内装解体", group: "active", icon: Hammer,         color: T.primary, bg: "rgba(180,83,9,0.1)" },
  { key: "上屋解体・基礎", label: "上屋解体・基礎", group: "active", icon: Building2,      color: "#B45309", bg: "rgba(180,83,9,0.15)" },
  { key: "完工・更地確認", label: "完工・更地確認", group: "post",   icon: CheckCircle,    color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  { key: "産廃書類完了",   label: "産廃書類完了",   group: "post",   icon: ClipboardCheck, color: "#0D9488", bg: "rgba(13,148,136,0.1)" },
  { key: "入金確認",       label: "入金確認",       group: "done",   icon: CreditCard,     color: "#059669", bg: "rgba(5,150,105,0.1)" },
] as const;

// Legacy status mapping (backward compat with existing DB values)
const LEGACY_MAP: Record<string, string> = {
  "着工前": "調査・見積",
  "施工中": "着工・内装解体",
  "解体中": "着工・内装解体",
  "完工": "完工・更地確認",
};

function resolveStatus(raw: string) {
  const mapped = LEGACY_MAP[raw] ?? raw;
  return STATUSES.find(s => s.key === mapped) ?? STATUSES[0];
}

function statusIndex(raw: string): number {
  const mapped = LEGACY_MAP[raw] ?? raw;
  const idx = STATUSES.findIndex(s => s.key === mapped);
  return idx >= 0 ? idx : 0;
}

// ─── Groups for summary cards ───────────────────────────────────────────────

const GROUPS = [
  { key: "pre",    label: "施工前",   color: "#3B82F6",  statuses: ["調査・見積", "契約・申請", "近隣挨拶・養生"] },
  { key: "active", label: "施工中",   color: T.primary,  statuses: ["着工・内装解体", "上屋解体・基礎"] },
  { key: "post",   label: "完工処理", color: "#10B981",  statuses: ["完工・更地確認", "産廃書類完了"] },
  { key: "done",   label: "入金済",   color: "#059669",  statuses: ["入金確認"] },
];

function siteGroup(raw: string): string {
  const s = resolveStatus(raw);
  return s.group;
}

const fmt = (n: number) => n > 0 ? `¥${Math.round(n).toLocaleString("ja-JP")}` : "—";

// ─── Period filter ─────────────────────────────────────────────────────────

type ViewMode = "all" | "month" | "year";

function periodLabel(mode: ViewMode, year: number, month: number): string {
  if (mode === "all") return "全期間";
  if (mode === "year") return `${year}年`;
  return `${year}年${month}月`;
}

function filterByPeriod(sites: SiteRow[], mode: ViewMode, year: number, month: number): SiteRow[] {
  if (mode === "all") return sites;
  return sites.filter(site => {
    const periodStart = mode === "month"
      ? `${year}-${String(month).padStart(2, "0")}-01`
      : `${year}-01-01`;
    const periodEnd = mode === "month"
      ? `${year}-${String(month).padStart(2, "0")}-31`
      : `${year}-12-31`;
    const siteStart = site.startDate || "2000-01-01";
    const siteEnd = site.endDate || "2099-12-31";
    return siteStart <= periodEnd && siteEnd >= periodStart;
  });
}

function PeriodPicker({
  mode, year, month,
  onModeChange, onYearChange, onMonthChange,
}: {
  mode: ViewMode; year: number; month: number;
  onModeChange: (m: ViewMode) => void;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
}) {
  const now = new Date();
  const currentYear = now.getFullYear();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: T.bg }}>
        {([["all", "全期間"], ["month", "月別"], ["year", "年間"]] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className="px-3 py-1.5 rounded-md text-sm font-bold transition-all"
            style={mode === m
              ? { background: T.primary, color: T.surface }
              : { color: T.sub }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {mode !== "all" && (
        <div className="flex items-center gap-2">
          <button onClick={() => onYearChange(year - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ border: `1px solid ${T.border}`, color: T.sub }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 800, color: T.text, minWidth: 60, textAlign: "center" }}>
            {year}年
          </span>
          <button onClick={() => onYearChange(Math.min(year + 1, currentYear))}
            disabled={year >= currentYear}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ border: `1px solid ${T.border}`, color: year >= currentYear ? T.muted : T.sub, opacity: year >= currentYear ? 0.4 : 1 }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {mode === "month" && (
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
            const isFuture = year === currentYear && m > now.getMonth() + 1;
            return (
              <button
                key={m}
                onClick={() => !isFuture && onMonthChange(m)}
                disabled={isFuture}
                className="py-1.5 rounded-md text-sm font-bold transition-all"
                style={month === m
                  ? { background: T.primary, color: "#FFF" }
                  : isFuture
                  ? { color: T.muted, opacity: 0.3 }
                  : { color: T.sub, background: T.bg }
                }
              >
                {m}月
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-1 flex-wrap">
        {[
          { label: "全期間", action: () => { onModeChange("all"); } },
          { label: "今月", action: () => { onModeChange("month"); onYearChange(currentYear); onMonthChange(now.getMonth() + 1); } },
          { label: "先月", action: () => {
            const pm = now.getMonth() === 0 ? 12 : now.getMonth();
            const py = now.getMonth() === 0 ? currentYear - 1 : currentYear;
            onModeChange("month"); onYearChange(py); onMonthChange(pm);
          }},
          { label: `${currentYear}年`, action: () => { onModeChange("year"); onYearChange(currentYear); } },
          { label: `${currentYear - 1}年`, action: () => { onModeChange("year"); onYearChange(currentYear - 1); } },
        ].map(q => (
          <button key={q.label} onClick={q.action}
            className="px-2.5 py-1 rounded-md text-xs font-bold transition-all"
            style={{ background: T.bg, color: T.sub, border: `1px solid ${T.border}` }}>
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Status Dropdown ────────────────────────────────────────────────────────

function StatusDropdown({
  siteId, currentStatus, onStatusChange,
}: {
  siteId: string;
  currentStatus: string;
  onStatusChange: (siteId: string, newStatus: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const resolved = resolveStatus(currentStatus);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === resolved.key) return;
    setSaving(true);
    try {
      const res = await fetch("/api/kaitai/sites", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: siteId, status: newStatus }),
      });
      if (res.ok) {
        onStatusChange(siteId, newStatus);
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <select
      value={resolved.key}
      onChange={handleChange}
      disabled={saving}
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: resolved.color,
        background: resolved.bg,
        border: `1px solid ${resolved.color}20`,
        borderRadius: 8,
        padding: "5px 8px",
        cursor: "pointer",
        outline: "none",
        opacity: saving ? 0.5 : 1,
        maxWidth: 160,
      }}
    >
      {STATUSES.map(s => (
        <option key={s.key} value={s.key}>{s.label}</option>
      ))}
    </select>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminSitesPage() {
  const now = new Date();
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Period filter state
  const [mode, setMode] = useState<ViewMode>("all");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

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
            status: (s.status as string) ?? "調査・見積",
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

  // Close picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPicker]);

  function handleStatusChange(siteId: string, newStatus: string) {
    setSites(prev => prev.map(s => s.id === siteId ? { ...s, status: newStatus } : s));
  }

  // Apply period filter then text search
  const periodFiltered = filterByPeriod(sites, mode, year, month);

  const filtered = periodFiltered
    .filter(s => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
    })
    .sort((a, b) => statusIndex(a.status) - statusIndex(b.status));

  // Group sites
  const grouped = GROUPS.map(g => ({
    ...g,
    sites: filtered.filter(s => siteGroup(s.status) === g.key),
  }));

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
            登録現場の確認・ステータス管理（{filtered.length}/{sites.length}件表示）
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period picker */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: showPicker ? "rgba(180,83,9,0.08)" : T.bg,
                border: `1px solid ${showPicker ? T.primary : T.border}`,
                color: showPicker ? T.primary : T.sub,
              }}
            >
              <Calendar size={15} />
              {periodLabel(mode, year, month)}
            </button>
            {showPicker && (
              <div
                className="absolute right-0 top-full mt-2 z-50 p-4 rounded-xl"
                style={{ background: "#fff", border: `1px solid ${T.border}`, minWidth: 280 }}
              >
                <PeriodPicker
                  mode={mode} year={year} month={month}
                  onModeChange={m => { setMode(m); if (m === "all") setShowPicker(false); }}
                  onYearChange={setYear}
                  onMonthChange={m => { setMonth(m); setShowPicker(false); }}
                />
              </div>
            )}
          </div>
          <Link
            href="/kaitai/sites/new"
            className="px-5 py-2.5 rounded-lg text-sm font-bold"
            style={{ background: T.primary, color: "#fff", textDecoration: "none" }}
          >
            + 新規現場登録
          </Link>
        </div>
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
      <div className="grid grid-cols-4 gap-3">
        {grouped.map(g => (
          <div
            key={g.key}
            className="px-4 py-3 rounded-xl"
            style={{ background: "#fff", border: `1px solid ${T.border}` }}
          >
            <p style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{g.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: g.color, lineHeight: 1 }}>
              {g.sites.length}<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 2, color: T.sub }}>件</span>
            </p>
          </div>
        ))}
      </div>

      {/* ── 8-stage progress indicator ── */}
      <div
        className="flex items-center gap-0 rounded-xl overflow-hidden"
        style={{ background: "#fff", border: `1px solid ${T.border}`, padding: "12px 16px" }}
      >
        {STATUSES.map((s, i) => {
          const count = filtered.filter(site => resolveStatus(site.status).key === s.key).length;
          return (
            <div key={s.key} className="flex items-center" style={{ flex: 1 }}>
              <div className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: count > 0 ? s.bg : T.bg,
                    border: `2px solid ${count > 0 ? s.color : T.border}`,
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 800, color: count > 0 ? s.color : T.muted }}>
                    {count}
                  </span>
                </div>
                <span style={{ fontSize: 9, color: count > 0 ? s.color : T.muted, fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>
                  {s.label.length > 5 ? s.label.replace("・", "\n") : s.label}
                </span>
              </div>
              {i < STATUSES.length - 1 && (
                <div style={{ width: 12, height: 2, background: T.border, flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Site groups ── */}
      {grouped.map(group => {
        if (group.sites.length === 0) return null;
        return (
          <section key={group.key}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full" style={{ background: group.color }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                {group.label}
                <span style={{ fontSize: 13, fontWeight: 500, color: T.sub, marginLeft: 8 }}>
                  {group.sites.length}件
                </span>
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              {group.sites.map(site => {
                const ss = resolveStatus(site.status);
                const profit = site.contractAmount > 0 && site.costAmount > 0
                  ? site.contractAmount - site.costAmount
                  : null;
                const profitPct = profit !== null && site.contractAmount > 0
                  ? Math.round((profit / site.contractAmount) * 100)
                  : null;
                const isActive = ss.group === "active";

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
                      {/* Row 1: status dropdown + name + edit */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <StatusDropdown
                              siteId={site.id}
                              currentStatus={site.status}
                              onStatusChange={handleStatusChange}
                            />
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
                        {isActive && site.progressPct > 0 && (
                          <span style={{ fontSize: 12, color: T.sub }}>
                            進捗 {site.progressPct}%
                          </span>
                        )}

                        {/* 入金ステータス badge (for post/done) */}
                        {ss.key === "入金確認" && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "#059669", color: "#fff" }}
                          >
                            入金済
                          </span>
                        )}
                        {ss.key === "産廃書類完了" && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(13,148,136,0.15)", color: "#0D9488" }}
                          >
                            請求可
                          </span>
                        )}
                      </div>

                      {/* Progress bar for active sites */}
                      {isActive && site.progressPct > 0 && (
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
