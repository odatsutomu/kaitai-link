"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, AlertTriangle, ChevronRight, ArrowUpDown, ChevronLeft, Calendar, BarChart2, Banknote, Receipt, Wallet } from "lucide-react";
import { T } from "../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
  brand: T.primary,
  slate: "#475569",
  green: "#10B981", red: "#EF4444", blue: "#3B82F6",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SiteSummary = {
  id: string;
  name: string;
  status: string;
  contractAmount: number;
  paidAmount: number;
  remainingAmount: number;
  costAmount: number;
  expenseTotal: number;
  startDate: string | null;
  endDate: string | null;
  progressPct: number;
};

type FinanceTotals = {
  contractAmount: number;
  paidAmount: number;
  remainingAmount: number;
  totalCost: number;
  profit: number;
  profitRate: number;
  wasteCost: number;
  laborCost: number;
  vehicleCost: number;
  materialCost: number;
  otherCost: number;
};

type FinanceData = {
  totals: FinanceTotals;
  sites: SiteSummary[];
  expenseByCategory: Record<string, number>;
  activeSiteCount: number;
  totalSiteCount: number;
};

type ViewMode = "month" | "year";

const ALERT_THRESHOLD = 20;

// ─── SVG Donut chart ─────────────────────────────────────────────────────────

function DonutChart({
  slices,
  size = 160,
  outerR = 70,
  innerR = 44,
}: {
  slices: { value: number; color: string; label: string }[];
  size?: number;
  outerR?: number;
  innerR?: number;
}) {
  const cx = size / 2, cy = size / 2;
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;

  let angle = -Math.PI / 2;
  const paths = slices.map(s => {
    const sweep = (s.value / total) * 2 * Math.PI;
    const a1 = angle, a2 = angle + sweep - 0.02;
    const cos1 = Math.cos(a1), sin1 = Math.sin(a1);
    const cos2 = Math.cos(a2), sin2 = Math.sin(a2);
    const large = sweep > Math.PI ? 1 : 0;
    const d = [
      `M ${cx + outerR * cos1} ${cy + outerR * sin1}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${cx + outerR * cos2} ${cy + outerR * sin2}`,
      `L ${cx + innerR * cos2} ${cy + innerR * sin2}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${cx + innerR * cos1} ${cy + innerR * sin1}`,
      "Z",
    ].join(" ");
    angle += sweep;
    return { ...s, d, pct: Math.round((s.value / total) * 100) };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} />
      ))}
    </svg>
  );
}

// ─── Revenue Flow Bar ─────────────────────────────────────────────────────────

function RevenueFlowBar({ contract, paid, cost }: { contract: number; paid: number; cost: number }) {
  if (contract === 0) return null;
  const paidPct = Math.min(Math.round((paid / contract) * 100), 100);
  const costPct = contract > 0 ? Math.min(Math.round((cost / contract) * 100), 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>受注 → 売上フロー</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.brand }}>{paidPct}% 入金済み</span>
      </div>
      {/* Contract → Paid bar */}
      <div className="relative h-6 rounded-lg overflow-hidden" style={{ background: T.bg, border: `1px solid ${C.border}` }}>
        <div className="absolute inset-y-0 left-0 rounded-lg" style={{ width: `${paidPct}%`, background: `linear-gradient(90deg, ${C.green}, #34D399)` }} />
        <div className="absolute inset-y-0 left-0 flex items-center justify-center w-full">
          <span style={{ fontSize: 11, fontWeight: 700, color: paidPct > 50 ? "#fff" : C.text }}>
            {fmt(paid)} / {fmt(contract)}
          </span>
        </div>
      </div>
      {/* Cost bar overlay */}
      <div className="mt-1.5">
        <div className="flex items-center justify-between mb-0.5">
          <span style={{ fontSize: 11, color: C.muted }}>原価率</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: costPct > 80 ? C.red : C.sub }}>{costPct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: T.bg }}>
          <div className="h-full rounded-full" style={{ width: `${costPct}%`, background: costPct > 80 ? C.red : "#FB923C" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${className}`} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16 }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: C.amber }}>
      {children}
    </p>
  );
}

function fmt(n: number) {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

// ─── Period Picker ───────────────────────────────────────────────────────────

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
        {(["month", "year"] as const).map(m => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className="px-3 py-1.5 rounded-md text-sm font-bold transition-all"
            style={mode === m ? { background: C.amber, color: T.surface } : { color: C.sub }}
          >
            {m === "month" ? "月別" : "年間"}
          </button>
        ))}
      </div>
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
                  : isFuture ? { color: C.muted, opacity: 0.3 } : { color: C.sub, background: T.bg }
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
          { label: "今月", action: () => { onModeChange("month"); onYearChange(currentYear); onMonthChange(now.getMonth() + 1); } },
          { label: "先月", action: () => {
            const pm = now.getMonth() === 0 ? 12 : now.getMonth();
            const py = now.getMonth() === 0 ? currentYear - 1 : currentYear;
            onModeChange("month"); onYearChange(py); onMonthChange(pm);
          }},
          { label: `${currentYear}年`, action: () => { onModeChange("year"); onYearChange(currentYear); } },
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

// ─── Cost Categories ─────────────────────────────────────────────────────────

const COST_COLORS: Record<string, string> = {
  "燃料費": "#F87171",
  "交通費": "#92400E",
  "資材購入": "#FB923C",
  "工具・消耗品": "#FBBF24",
  "食費・雑費": "#9CA3AF",
  "その他": "#CBD5E1",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const now = new Date();
  const [mode, setMode] = useState<ViewMode>("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [sortBy, setSortBy] = useState<"profitRate" | "profitAmt">("profitRate");
  const [showPicker, setShowPicker] = useState(false);
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch finance data
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (mode === "month") {
      params.set("year", String(year));
      params.set("month", String(month));
    } else {
      params.set("year", String(year));
    }
    fetch(`/api/kaitai/finance?${params}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.ok) setFinance(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mode, year, month]);

  const t = finance?.totals;
  const sites = finance?.sites ?? [];

  // Sorted sites for ranking
  const rankedSites = useMemo(() => {
    const withProfit = sites.map(s => {
      const totalCost = s.expenseTotal + s.costAmount;
      const profit = s.paidAmount - totalCost;
      const profitRate = s.paidAmount > 0 ? Math.round((profit / s.paidAmount) * 100) : (s.contractAmount > 0 ? null : 0);
      return { ...s, totalCost, profit, profitRate };
    }).filter(s => s.contractAmount > 0);

    return [...withProfit].sort((a, b) => {
      if (sortBy === "profitRate") {
        const ra = a.profitRate ?? 100;
        const rb = b.profitRate ?? 100;
        return rb - ra;
      }
      return b.profit - a.profit;
    });
  }, [sites, sortBy]);

  // Alert sites (low margin)
  const alertSites = rankedSites.filter(s => {
    if (s.paidAmount === 0) return false;
    return s.profitRate != null && s.profitRate < ALERT_THRESHOLD;
  });

  const periodLabel = mode === "year" ? `${year}年 年間` : `${year}年${month}月`;

  // Cost breakdown for donut
  const expenseCats = finance?.expenseByCategory ?? {};
  const pieSlices = Object.entries(expenseCats)
    .filter(([, v]) => v > 0)
    .map(([cat, amount]) => ({
      value: amount,
      color: COST_COLORS[cat] ?? "#9CA3AF",
      label: cat,
    }));

  if (loading) {
    return (
      <div className="py-20 text-center" style={{ color: C.sub }}>
        読み込み中...
      </div>
    );
  }

  // No data state
  if (!finance || (sites.length === 0 && (t?.contractAmount ?? 0) === 0)) {
    return (
      <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>経営分析</h1>
          <p className="text-sm mt-1" style={{ color: C.sub }}>収支・利益をリアルタイム集計</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-4"
          style={{ background: T.surface, borderRadius: 16, border: `1.5px dashed ${T.border}` }}>
          <BarChart2 size={48} style={{ color: T.muted }} />
          <p style={{ fontSize: 18, fontWeight: 800, color: T.sub }}>まだデータがありません</p>
          <p style={{ fontSize: 14, color: T.muted, textAlign: "center", lineHeight: 1.8 }}>
            現場の契約金額を登録すると見込み受注額として計上され、<br />
            入金登録で売上額に反映されます。
          </p>
          <div className="flex gap-3 mt-4">
            <Link href="/kaitai/admin/sites"
              className="px-5 py-3 rounded-xl font-bold text-sm"
              style={{ background: T.primary, color: "#FFF" }}>
              現場を登録する
            </Link>
            <Link href="/kaitai/admin/members"
              className="px-5 py-3 rounded-xl font-bold text-sm"
              style={{ background: T.bg, color: T.sub, border: `1.5px solid ${T.border}` }}>
              従業員を登録する
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalCost = t?.totalCost ?? 0;
  const profit = (t?.paidAmount ?? 0) - totalCost;
  const profitRate = (t?.paidAmount ?? 0) > 0 ? Math.round((profit / (t?.paidAmount ?? 1)) * 1000) / 10 : 0;

  return (
    <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>経営分析</h1>
          <p className="text-sm mt-1" style={{ color: C.sub }}>収支・利益をリアルタイム集計</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowPicker(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{ background: T.bg, border: `1.5px solid ${C.border}`, color: C.text }}
          >
            <Calendar size={15} style={{ color: C.amber }} />
            {periodLabel}
          </button>
          {showPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
              <div
                className="absolute right-0 top-full mt-2 z-50 p-4 rounded-xl"
                style={{ background: C.card, border: `1.5px solid ${C.border}`, width: 320 }}
              >
                <PeriodPicker
                  mode={mode} year={year} month={month}
                  onModeChange={m => setMode(m)}
                  onYearChange={setYear}
                  onMonthChange={m => { setMonth(m); setShowPicker(false); }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Alert banner ── */}
      {alertSites.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl" style={{ background: "#FEF2F2", border: "1.5px solid #FECACA" }}>
          <AlertTriangle size={20} style={{ color: C.red, flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: C.red }}>粗利率{ALERT_THRESHOLD}%以下の現場があります</p>
            <p className="text-sm mt-0.5" style={{ color: C.sub }}>{alertSites.map(s => s.name).join("・")}</p>
          </div>
        </div>
      )}

      {/* ── Top KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "見込み受注額", value: t?.contractAmount ?? 0, icon: Banknote, color: C.blue, sub: `${finance?.totalSiteCount ?? 0}現場` },
          { label: "売上額（入金済）", value: t?.paidAmount ?? 0, icon: Wallet, color: C.green, sub: `未入金: ${fmt(t?.remainingAmount ?? 0)}` },
          { label: "原価合計", value: totalCost, icon: Receipt, color: "#FB923C", sub: "経費リアルタイム計上" },
          { label: "粗利", value: profit, icon: profit >= 0 ? TrendingUp : TrendingDown, color: profit >= 0 ? C.green : C.red, sub: `粗利率 ${profitRate}%` },
        ].map(kpi => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={16} style={{ color: kpi.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{kpi.label}</span>
            </div>
            <p className="font-bold font-numeric" style={{ fontSize: 22, color: kpi.color, lineHeight: 1.2 }}>
              {fmt(kpi.value)}
            </p>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{kpi.sub}</p>
          </Card>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column (2/3) ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* 受注→売上フロー */}
          <section>
            <SectionLabel>受注 → 売上フロー</SectionLabel>
            <Card className="p-5">
              <RevenueFlowBar
                contract={t?.contractAmount ?? 0}
                paid={t?.paidAmount ?? 0}
                cost={totalCost}
              />
              <p style={{ fontSize: 11, color: C.muted, marginTop: 12, lineHeight: 1.6 }}>
                契約金額の設定 → 見込み受注額として計上 → 入金登録で売上額へ移動 → 経費は報告時にリアルタイム計上
              </p>
            </Card>
          </section>

          {/* 現場別収支一覧 */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>現場別収支一覧</SectionLabel>
              <button
                onClick={() => setSortBy(s => s === "profitRate" ? "profitAmt" : "profitRate")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                style={{ background: T.surface, border: "1.5px solid #E5E7EB", color: T.text }}
              >
                <ArrowUpDown size={12} />
                {sortBy === "profitRate" ? "利益率順" : "利益額順"}
              </button>
            </div>
            <Card>
              {/* Header */}
              <div
                className="grid px-5 py-3"
                style={{ gridTemplateColumns: "1fr 90px 90px 70px", borderBottom: `1px solid ${C.border}`, background: T.bg }}
              >
                <span className="text-xs font-bold" style={{ color: C.muted }}>現場名</span>
                <span className="text-xs font-bold text-right" style={{ color: C.muted }}>契約額</span>
                <span className="text-xs font-bold text-right" style={{ color: C.muted }}>入金額</span>
                <span className="text-xs font-bold text-right" style={{ color: C.muted }}>粗利率</span>
              </div>
              {rankedSites.length === 0 && (
                <div className="py-12 text-center" style={{ color: C.muted, fontSize: 14 }}>
                  契約金額が登録された現場がありません
                </div>
              )}
              {rankedSites.map((site, rank) => {
                const isAlert = site.profitRate != null && site.profitRate < ALERT_THRESHOLD && site.paidAmount > 0;
                const rColor = isAlert ? C.red
                  : site.profitRate == null ? C.muted
                  : site.profitRate >= 25 ? C.green
                  : C.amber;
                const paidPct = site.contractAmount > 0 ? Math.round((site.paidAmount / site.contractAmount) * 100) : 0;

                return (
                  <Link key={site.id} href={`/kaitai/sites/${site.id}`}>
                    <div
                      className="grid px-5 py-4 hover:bg-gray-50 transition-colors"
                      style={{
                        gridTemplateColumns: "1fr 90px 90px 70px",
                        borderBottom: `1px solid #F1F5F9`,
                        background: isAlert ? "#FEF2F2" : "transparent",
                      }}
                    >
                      <div className="flex flex-col gap-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{ background: rank === 0 ? T.primaryLt : T.bg, color: rank === 0 ? T.primaryDk : C.muted }}>
                            {rank + 1}
                          </span>
                          {isAlert && <AlertTriangle size={12} style={{ color: C.red, flexShrink: 0 }} />}
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                            style={["着工・内装解体", "上屋解体・基礎", "施工中", "解体中"].includes(site.status)
                              ? { background: T.primaryLt, color: C.amberDk }
                              : site.status.includes("完工") || site.status === "入金確認"
                              ? { background: "#F0FDF4", color: "#16A34A" }
                              : { background: T.bg, color: C.muted }}>
                            {site.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold truncate" style={{ color: isAlert ? C.red : C.text }}>{site.name}</p>
                        {/* Mini payment progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: T.bg }}>
                            <div className="h-full rounded-full" style={{ width: `${paidPct}%`, background: C.green }} />
                          </div>
                          <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{paidPct}%入金</span>
                        </div>
                      </div>
                      <div className="text-right self-center">
                        <p className="text-sm font-bold font-numeric" style={{ color: C.text }}>{fmt(site.contractAmount)}</p>
                      </div>
                      <div className="text-right self-center">
                        <p className="text-sm font-bold font-numeric" style={{ color: site.paidAmount > 0 ? C.green : C.muted }}>
                          {site.paidAmount > 0 ? fmt(site.paidAmount) : "—"}
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-1 self-center">
                        <p className="text-sm font-bold font-numeric" style={{ color: rColor }}>
                          {site.profitRate != null && site.paidAmount > 0 ? `${site.profitRate}%` : "—"}
                        </p>
                        <ChevronRight size={12} style={{ color: C.muted }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </Card>
          </section>
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="flex flex-col gap-6">

          {/* 収支サマリー */}
          <Card className="p-6">
            <p className="text-sm uppercase tracking-widest font-bold mb-1" style={{ color: C.muted }}>
              {periodLabel} 収支サマリー
            </p>

            {/* Revenue flow visualization */}
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between px-3 py-3 rounded-xl" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <div className="flex items-center gap-2">
                  <Banknote size={16} style={{ color: C.blue }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>見込み受注額</span>
                </div>
                <span className="font-bold font-numeric" style={{ fontSize: 16, color: C.blue }}>{fmt(t?.contractAmount ?? 0)}</span>
              </div>

              <div className="flex items-center justify-center">
                <div style={{ width: 2, height: 20, background: C.border }} />
                <span style={{ fontSize: 10, color: C.muted, position: "absolute" }}>入金</span>
              </div>

              <div className="flex items-center justify-between px-3 py-3 rounded-xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <div className="flex items-center gap-2">
                  <Wallet size={16} style={{ color: C.green }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>売上額</span>
                </div>
                <span className="font-bold font-numeric" style={{ fontSize: 16, color: C.green }}>{fmt(t?.paidAmount ?? 0)}</span>
              </div>

              <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: T.bg }}>
                <span style={{ fontSize: 12, color: C.muted }}>未入金残高</span>
                <span className="font-bold font-numeric" style={{ fontSize: 14, color: (t?.remainingAmount ?? 0) > 0 ? C.amber : C.muted }}>
                  {fmt(t?.remainingAmount ?? 0)}
                </span>
              </div>
            </div>

            {/* KPI 4-grid */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: "売上高", value: t?.paidAmount ?? 0, color: C.green },
                { label: "売上原価", value: totalCost, color: C.slate },
                { label: "粗利益", value: profit, color: profit >= 0 ? C.green : C.red },
                { label: "粗利率", value: null, color: profitRate >= 25 ? C.green : profitRate >= 15 ? C.amber : C.red, strVal: `${profitRate}%` },
              ].map(({ label, value, color, strVal }) => (
                <div key={label} className="rounded-lg p-3" style={{ background: T.bg, border: `1px solid ${C.border}` }}>
                  <p className="text-xs mb-1" style={{ color: C.muted }}>{label}</p>
                  <p className="font-bold font-numeric" style={{ fontSize: 16, color }}>
                    {strVal ?? fmt(value!)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* 原価構造ドーナツ */}
          <section>
            <SectionLabel>原価構造分析</SectionLabel>
            <Card className="p-5">
              {pieSlices.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <DonutChart slices={pieSlices} size={160} outerR={70} innerR={44} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-xs" style={{ color: C.muted }}>原価合計</p>
                      <p className="text-sm font-bold font-numeric" style={{ color: C.text }}>{fmt(totalCost)}</p>
                    </div>
                  </div>
                  <div className="w-full flex flex-col gap-2.5">
                    {pieSlices.map(({ label, value, color }) => {
                      const pct = totalCost > 0 ? Math.round((value / totalCost) * 100) : 0;
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                              <span className="text-sm font-medium" style={{ color: C.sub }}>{label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold font-numeric" style={{ color: C.muted }}>{fmt(value)}</span>
                              <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.bg }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center" style={{ color: C.muted, fontSize: 13 }}>
                  経費データがまだありません<br />
                  <span style={{ fontSize: 12 }}>報告画面から経費を入力すると自動で反映されます</span>
                </div>
              )}
            </Card>
          </section>
        </div>
      </div>

      {/* ── Bottom: Revenue flow explanation ── */}
      <Card className="p-5">
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>💡 収支計上の仕組み</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.blue }}>1</span>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: C.text }}>契約金額の登録</p>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>現場管理で契約金額を入力すると<br />「見込み受注額」として計上されます</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.green }}>2</span>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: C.text }}>入金の登録</p>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>入金があるごとに登録すると<br />見込み受注額 → 売上額へ移動します</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(251,146,60,0.1)" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#FB923C" }}>3</span>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: C.text }}>経費の報告</p>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>報告画面の経費入力は<br />リアルタイムに原価として計上されます</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
