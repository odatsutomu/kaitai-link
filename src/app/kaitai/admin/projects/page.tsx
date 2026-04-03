"use client";

import { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { T } from "../../lib/design-tokens";

type SiteRow = {
  id: string; name: string; status: string; contract: number; cost: number;
  progressPct: number; endDate: string; startDate: string; type: string; address: string;
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
  green: "#10B981", red: "#EF4444", blue: "#3B82F6",
};

const fmt = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;

function marginColor(pct: number) {
  if (pct >= 30) return { text: C.green,   bg: "#F0FDF4", border: "#BBF7D0" };
  if (pct >= 15) return { text: C.amberDk, bg: T.primaryLt, border: T.primaryMd };
  return              { text: C.red,      bg: "#FEF2F2", border: "#FECACA" };
}

type SortKey = "name" | "contract" | "margin" | "status";
type ViewMode = "all" | "month" | "year";

// ─── Period Picker ──────────────────────────────────────────────────────────

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
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: T.bg }}>
        {([["all", "全期間"], ["month", "月別"], ["year", "年間"]] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className="px-3 py-1.5 rounded-md text-sm font-bold transition-all"
            style={mode === m
              ? { background: C.amber, color: T.surface }
              : { color: C.sub }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Year selector (month/year mode only) */}
      {mode !== "all" && (
        <div className="flex items-center gap-2">
          <button onClick={() => onYearChange(year - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ border: `1px solid ${C.border}`, color: C.sub }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.text, minWidth: 60, textAlign: "center" }}>
            {year}年
          </span>
          <button onClick={() => onYearChange(Math.min(year + 1, currentYear))}
            disabled={year >= currentYear}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ border: `1px solid ${C.border}`, color: year >= currentYear ? C.muted : C.sub, opacity: year >= currentYear ? 0.4 : 1 }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Month grid (only in month mode) */}
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
                  ? { background: C.amber, color: "#FFF" }
                  : isFuture
                  ? { color: C.muted, opacity: 0.3 }
                  : { color: C.sub, background: T.bg }
                }
              >
                {m}月
              </button>
            );
          })}
        </div>
      )}

      {/* Quick links */}
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
            style={{ background: T.bg, color: C.sub, border: `1px solid ${C.border}` }}>
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Period filter helper ───────────────────────────────────────────────────

function filterByPeriod(sites: SiteRow[], mode: ViewMode, year: number, month: number): SiteRow[] {
  if (mode === "all") return sites;

  return sites.filter(site => {
    // A site is included if it was active during the selected period
    const periodStart = mode === "month"
      ? `${year}-${String(month).padStart(2, "0")}-01`
      : `${year}-01-01`;
    const periodEnd = mode === "month"
      ? `${year}-${String(month).padStart(2, "0")}-31`
      : `${year}-12-31`;

    const siteStart = site.startDate || "2000-01-01";
    const siteEnd = site.endDate || "2099-12-31";

    // Site overlaps with period if siteStart <= periodEnd AND siteEnd >= periodStart
    return siteStart <= periodEnd && siteEnd >= periodStart;
  });
}

// ─── Period label ───────────────────────────────────────────────────────────

function periodLabel(mode: ViewMode, year: number, month: number): string {
  if (mode === "all") return "全期間";
  if (mode === "year") return `${year}年`;
  return `${year}年${month}月`;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const now = new Date();
  const [sort, setSort] = useState<SortKey>("status");
  const [dir, setDir]   = useState<1 | -1>(1);
  const [rawSites, setRawSites] = useState<SiteRow[]>([]);

  // Period state
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
        setRawSites(data.sites.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          name: s.name as string,
          status: (s.status === "施工中" ? "解体中" : s.status) as string,
          contract: (s.contractAmount as number) ?? 0,
          cost: (s.costAmount as number) ?? 0,
          progressPct: (s.progressPct as number) ?? 0,
          endDate: (s.endDate as string) ?? "",
          startDate: (s.startDate as string) ?? "",
          type: (s.structureType as string) ?? "",
          address: (s.address as string) ?? "",
        })));
      })
      .catch(() => {});
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

  function toggleSort(key: SortKey) {
    if (sort === key) setDir(d => (d === 1 ? -1 : 1));
    else { setSort(key); setDir(1); }
  }

  // Apply period filter
  const filteredSites = filterByPeriod(rawSites, mode, year, month);

  const sites = [...filteredSites].sort((a: SiteRow, b: SiteRow) => {
    if (sort === "name")     return dir * a.name.localeCompare(b.name);
    if (sort === "contract") return dir * (a.contract - b.contract);
    if (sort === "margin") {
      const ma = a.cost > 0 ? (a.contract - a.cost) / a.contract : 0;
      const mb = b.cost > 0 ? (b.contract - b.cost) / b.contract : 0;
      return dir * (ma - mb);
    }
    // status sort: 解体中 > 着工前 > 完工
    const order: Record<string, number> = { "解体中": 0, "着工前": 1, "完工": 2 };
    return dir * ((order[a.status] ?? 9) - (order[b.status] ?? 9));
  });

  // Totals (from filtered)
  const total     = filteredSites.reduce((s: number, x: SiteRow) => s + x.contract, 0);
  const totalCost = filteredSites.reduce((s: number, x: SiteRow) => s + x.cost, 0);
  const totalProfit = total - totalCost;
  const avgMargin = total > 0 ? Math.round((totalProfit / total) * 100) : 0;
  const activeCount = filteredSites.filter((s: SiteRow) => s.status === "解体中").length;

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 transition-colors"
      style={{ fontSize: 13, fontWeight: 700, color: sort === k ? C.amber : C.sub }}
    >
      {label}
      {sort === k && (dir === 1
        ? <TrendingUp size={11} />
        : <TrendingDown size={11} />
      )}
    </button>
  );

  return (
    <div className="py-6 flex flex-col gap-6">

      {/* ── Header with Period Picker ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>プロジェクト収支一覧</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>受注額・原価・粗利を現場単位で管理</p>
        </div>

        {/* Period picker toggle */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
            style={{
              background: showPicker ? T.primaryLt : T.bg,
              border: `1px solid ${showPicker ? C.amber : C.border}`,
              color: showPicker ? C.amber : C.sub,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <Calendar size={16} />
            {periodLabel(mode, year, month)}
          </button>

          {showPicker && (
            <div
              className="absolute right-0 top-full mt-2 z-50 p-4 rounded-xl"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                minWidth: 280,
              }}
            >
              <PeriodPicker
                mode={mode}
                year={year}
                month={month}
                onModeChange={m => { setMode(m); if (m === "all") setShowPicker(false); }}
                onYearChange={setYear}
                onMonthChange={m => { setMonth(m); setShowPicker(false); }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "受注総額",   value: fmt(total),        color: C.blue,    },
          { label: "原価合計",   value: fmt(totalCost),    color: C.sub,     },
          { label: "粗利合計",   value: fmt(totalProfit),  color: C.green,   },
          { label: "平均粗利率", value: `${avgMargin}%`,   color: avgMargin >= 25 ? C.green : avgMargin >= 15 ? C.amberDk : C.red, },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px",
 }}>
            <p style={{ fontSize: 13, color: C.sub, marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden",
 }}>

        {/* Table header */}
        <div
          className="grid items-center px-5 py-3"
          style={{
            gridTemplateColumns: "1fr 120px 130px 130px 110px 80px 90px",
            background: T.bg,
            borderBottom: `1px solid ${C.border}`,
            gap: 8,
          }}
        >
          <SortBtn k="name"     label="現場名" />
          <SortBtn k="status"   label="ステータス" />
          <SortBtn k="contract" label="受注額" />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>原価（現在）</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>粗利（予測）</span>
          <SortBtn k="margin"   label="粗利率" />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>完工予定</span>
        </div>

        {/* Rows */}
        {sites.length === 0 && (
          <div className="px-5 py-12 text-center" style={{ color: C.muted, fontSize: 14 }}>
            {rawSites.length === 0 ? "データを読み込み中..." : "該当する現場がありません"}
          </div>
        )}
        {sites.map((site, i) => {
          const profit = site.cost > 0 ? site.contract - site.cost : null;
          const pct    = profit && site.contract > 0 ? Math.round((profit / site.contract) * 100) : null;
          const mc     = pct !== null ? marginColor(pct) : null;

          const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
            "解体中": { bg: T.primaryLt, color: "#92400E", dot: C.amber },
            "着工前": { bg: "#EFF6FF", color: "#1D4ED8", dot: C.blue  },
            "完工":   { bg: "#F0FDF4", color: "#166534", dot: C.green },
          };
          const ss = statusStyle[site.status];

          const isAlert = pct !== null && pct < 15;

          return (
            <div
              key={site.id}
              className="grid items-center px-5 py-4 transition-colors hover:bg-amber-50/30"
              style={{
                gridTemplateColumns: "1fr 120px 130px 130px 110px 80px 90px",
                borderTop: i > 0 ? `1px solid ${C.border}` : undefined,
                background: isAlert ? "#FFF9F9" : undefined,
                gap: 8,
              }}
            >
              {/* 現場名 */}
              <div className="flex items-center gap-2 min-w-0">
                {isAlert && <AlertTriangle size={13} style={{ color: C.red, flexShrink: 0 }} />}
                {!isAlert && pct !== null && pct >= 30 && <CheckCircle size={13} style={{ color: C.green, flexShrink: 0 }} />}
                <div className="min-w-0">
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{site.name}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>{site.address}</p>
                </div>
              </div>

              {/* ステータス */}
              <span
                className="flex items-center gap-1 px-2 py-1 rounded-full w-fit text-xs font-bold"
                style={{ background: ss?.bg, color: ss?.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: ss?.dot }} />
                {site.status}
              </span>

              {/* 受注額 */}
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                {fmt(site.contract)}
              </span>

              {/* 原価 */}
              <span style={{ fontSize: 14, color: site.cost > 0 ? C.text : C.muted }}>
                {site.cost > 0 ? fmt(site.cost) : "未入力"}
              </span>

              {/* 粗利 */}
              <span style={{ fontSize: 14, fontWeight: 700, color: profit ? (profit > 0 ? C.green : C.red) : C.muted }}>
                {profit !== null ? fmt(profit) : "—"}
              </span>

              {/* 粗利率 */}
              {pct !== null && mc ? (
                <span
                  className="px-2.5 py-1 rounded text-xs font-bold w-fit"
                  style={{ background: mc.bg, color: mc.text, border: `1px solid ${mc.border}` }}
                >
                  {pct}%
                </span>
              ) : (
                <span style={{ fontSize: 13, color: C.muted }}>—</span>
              )}

              {/* 完工予定 */}
              <span style={{ fontSize: 13, color: C.sub }}>
                {site.endDate.replace(/-/g, "/")}
              </span>
            </div>
          );
        })}

        {/* Footer totals */}
        <div
          className="grid items-center px-5 py-3"
          style={{
            gridTemplateColumns: "1fr 120px 130px 130px 110px 80px 90px",
            background: T.bg,
            borderTop: `2px solid ${C.border}`,
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>合計 {filteredSites.length}件（稼働中 {activeCount}件）</span>
          <span />
          <span style={{ fontSize: 14, fontWeight: 800, color: C.blue }}>{fmt(total)}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.sub }}>{fmt(totalCost)}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.green }}>{fmt(totalProfit)}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: avgMargin >= 25 ? C.green : avgMargin >= 15 ? C.amberDk : C.red }}>
            {avgMargin}%
          </span>
          <span />
        </div>
      </div>

      {/* ── Cost breakdown ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px",
 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.sub, marginBottom: 16 }}>原価内訳（{periodLabel(mode, year, month)}・全現場合計）</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "産廃コスト",   value: Math.round(totalCost * 0.4),  color: C.red   },
            { label: "労務費",       value: Math.round(totalCost * 0.45), color: C.blue  },
            { label: "その他経費",   value: Math.round(totalCost * 0.15), color: C.muted },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: T.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{fmt(value)}</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                {totalCost > 0 ? `原価比 ${Math.round((value / totalCost) * 100)}%` : "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
