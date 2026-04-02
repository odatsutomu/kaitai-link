"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, AlertTriangle, ChevronRight, ArrowUpDown } from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: "#1E293B", sub: "#64748B", muted: "#94A3B8",
  border: "#E2E8F0", card: "#FFFFFF",
  amber: "#F59E0B", amberDk: "#D97706",
  green: "#10B981", red: "#EF4444",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "thisMonth" | "lastMonth" | "thisYear" | "lastYear";

type PeriodStats = {
  revenue: number;
  wasteCost: number;
  laborCost: number;
  vehicleCost: number;
  otherCost: number;
  yoyRevenue: number;
  yoyProfit: number;
  forecast?: number;
};

type MonthBar = {
  label: string;
  revenue: number;
  cost: number;
  prevRevenue?: number;
  prevCost?: number;
};

type SiteRank = {
  id: string;
  name: string;
  contract: number;
  cost: number;
  status: "解体中" | "完工" | "着工前";
  alert?: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS: Record<Period, PeriodStats> = {
  thisMonth: {
    revenue:     8_800_000,
    wasteCost:   2_040_000,
    laborCost:   1_440_000,
    vehicleCost:   380_000,
    otherCost:     460_000,
    yoyRevenue:  7_200_000,
    yoyProfit:   1_900_000,
    forecast:    5_200_000,
  },
  lastMonth: {
    revenue:     8_400_000,
    wasteCost:   2_100_000,
    laborCost:   2_800_000,
    vehicleCost:   480_000,
    otherCost:     720_000,
    yoyRevenue:  6_800_000,
    yoyProfit:   1_620_000,
  },
  thisYear: {
    revenue:    26_400_000,
    wasteCost:   6_240_000,
    laborCost:   5_840_000,
    vehicleCost: 1_280_000,
    otherCost:   2_200_000,
    yoyRevenue: 22_100_000,
    yoyProfit:   4_800_000,
  },
  lastYear: {
    revenue:    48_600_000,
    wasteCost:  12_400_000,
    laborCost:  10_200_000,
    vehicleCost: 2_800_000,
    otherCost:   3_600_000,
    yoyRevenue: 41_200_000,
    yoyProfit:   9_200_000,
  },
};

const MONTHLY_BARS: Record<Period, MonthBar[]> = {
  thisMonth: [
    { label: "W1", revenue: 1_800_000, cost: 1_200_000 },
    { label: "W2", revenue: 2_400_000, cost: 1_580_000 },
    { label: "W3", revenue: 2_600_000, cost: 1_680_000 },
    { label: "W4", revenue: 2_000_000, cost: 1_320_000 },
  ],
  lastMonth: [
    { label: "W1", revenue: 2_000_000, cost: 1_560_000 },
    { label: "W2", revenue: 2_400_000, cost: 1_920_000 },
    { label: "W3", revenue: 2_200_000, cost: 1_840_000 },
    { label: "W4", revenue: 1_800_000, cost: 1_500_000 },
  ],
  thisYear: [
    { label: "1月", revenue: 4_200_000, cost: 3_200_000, prevRevenue: 3_800_000, prevCost: 2_900_000 },
    { label: "2月", revenue: 6_800_000, cost: 5_100_000, prevRevenue: 5_200_000, prevCost: 4_100_000 },
    { label: "3月", revenue: 8_400_000, cost: 6_100_000, prevRevenue: 7_100_000, prevCost: 5_400_000 },
    { label: "4月", revenue: 7_000_000, cost: 4_780_000, prevRevenue: 6_000_000, prevCost: 4_200_000 },
  ],
  lastYear: [
    { label: "1月",  revenue: 3_800_000, cost: 2_900_000 },
    { label: "2月",  revenue: 5_200_000, cost: 4_100_000 },
    { label: "3月",  revenue: 7_100_000, cost: 5_400_000 },
    { label: "4月",  revenue: 6_000_000, cost: 4_200_000 },
    { label: "5月",  revenue: 4_200_000, cost: 3_100_000 },
    { label: "6月",  revenue: 3_800_000, cost: 2_800_000 },
    { label: "7月",  revenue: 3_600_000, cost: 2_700_000 },
    { label: "8月",  revenue: 2_800_000, cost: 2_100_000 },
    { label: "9月",  revenue: 3_900_000, cost: 2_900_000 },
    { label: "10月", revenue: 5_400_000, cost: 4_000_000 },
    { label: "11月", revenue: 6_300_000, cost: 4_700_000 },
    { label: "12月", revenue: 6_500_000, cost: 5_100_000 },
  ],
};

const SITE_RANKS: SiteRank[] = [
  { id: "s4", name: "旧工場棟解体（第1期）", contract: 8_400_000, cost: 6_100_000, status: "完工",  alert: "原価超過リスク" },
  { id: "s1", name: "山田邸解体工事",        contract: 3_200_000, cost: 1_840_000, status: "解体中" },
  { id: "s2", name: "旧田中倉庫解体",        contract: 5_600_000, cost: 2_100_000, status: "解体中" },
  { id: "s3", name: "松本アパート解体",      contract: 2_800_000, cost:         0, status: "着工前" },
];

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

// ─── SVG Bar chart ────────────────────────────────────────────────────────────

function BarChart({ bars, compare = false }: { bars: MonthBar[]; compare?: boolean }) {
  const H = 100;
  const maxVal = Math.max(...bars.flatMap(b => [b.revenue, compare ? (b.prevRevenue ?? 0) : 0]), 1);
  const n = bars.length;
  const VW = 340;
  const groupW = VW / n;
  const bw = compare ? Math.max(Math.floor(groupW / 4) - 1, 4) : Math.max(Math.floor(groupW / 2) - 2, 6);

  return (
    <svg viewBox={`0 0 ${VW} ${H + 20}`} width="100%" style={{ display: "block" }}>
      <line x1={0} y1={H} x2={VW} y2={H} stroke="#E2E8F0" strokeWidth={1} />
      {bars.map((b, i) => {
        const cx = i * groupW + groupW / 2;
        const revH = Math.max((b.revenue / maxVal) * H, 2);
        const costH = Math.max((b.cost / maxVal) * H, 2);

        return (
          <g key={i}>
            {compare && b.prevRevenue && (
              <>
                <rect
                  x={cx - bw * 2 - 1} y={H - Math.max((b.prevRevenue / maxVal) * H, 2)}
                  width={bw} height={Math.max((b.prevRevenue / maxVal) * H, 2)}
                  rx={2} fill="rgba(16,185,129,0.2)"
                />
                <rect
                  x={cx - bw} y={H - Math.max(((b.prevCost ?? 0) / maxVal) * H, 2)}
                  width={bw} height={Math.max(((b.prevCost ?? 0) / maxVal) * H, 2)}
                  rx={2} fill="rgba(239,68,68,0.2)"
                />
                <rect x={cx + 1} y={H - revH} width={bw} height={revH} rx={2} fill="rgba(16,185,129,0.8)" />
                <rect x={cx + bw + 2} y={H - costH} width={bw} height={costH} rx={2} fill="rgba(239,68,68,0.8)" />
              </>
            )}
            {!compare && (
              <>
                <rect x={cx - bw - 1} y={H - revH} width={bw} height={revH} rx={2} fill="rgba(16,185,129,0.75)" />
                <rect x={cx + 1} y={H - costH} width={bw} height={costH} rx={2} fill="rgba(239,68,68,0.75)" />
              </>
            )}
            <text x={cx} y={H + 14} textAnchor="middle" fontSize={8} fill="#94A3B8">
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: C.amber }}>
      {children}
    </p>
  );
}

function fmt(n: number, unit = "万") {
  return `¥${(n / 10_000).toFixed(n >= 1_000_000 ? 0 : 1)}${unit}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: "thisMonth", label: "今月" },
  { key: "lastMonth", label: "先月" },
  { key: "thisYear",  label: "今年" },
  { key: "lastYear",  label: "昨年" },
];

export default function AdminPage() {
  const [period, setPeriod] = useState<Period>("thisMonth");
  const [compare, setCompare] = useState(false);
  const [sortBy, setSortBy] = useState<"profitRate" | "profitAmt">("profitRate");

  const s = STATS[period];
  const totalCost = s.wasteCost + s.laborCost + s.vehicleCost + s.otherCost;
  const profit = s.revenue - totalCost;
  const profitRate = s.revenue > 0 ? Math.round((profit / s.revenue) * 1000) / 10 : 0;
  const yoyChange = s.yoyProfit > 0 ? Math.round(((profit - s.yoyProfit) / s.yoyProfit) * 1000) / 10 : 0;
  const isYoyUp = yoyChange >= 0;

  const canCompare = period === "thisYear";

  const alertSites = SITE_RANKS.filter(r => {
    if (r.cost === 0) return false;
    return Math.round(((r.contract - r.cost) / r.contract) * 100) < ALERT_THRESHOLD;
  });

  const ranked = [...SITE_RANKS].sort((a, b) => {
    if (sortBy === "profitRate") {
      const ra = a.cost > 0 ? (a.contract - a.cost) / a.contract : 1;
      const rb = b.cost > 0 ? (b.contract - b.cost) / b.contract : 1;
      return rb - ra;
    }
    return (b.contract - b.cost) - (a.contract - a.cost);
  });

  const bars = MONTHLY_BARS[period];
  const pieSlices = [
    { value: s.wasteCost,   color: "#F87171", label: "産廃費" },
    { value: s.laborCost,   color: "#FB923C", label: "労務費" },
    { value: s.vehicleCost, color: "#FBBF24", label: "車両・燃料" },
    { value: s.otherCost,   color: "#94A3B8", label: "その他" },
  ];

  return (
    <div className="px-4 md:px-8 py-6 flex flex-col gap-6 pb-24 md:pb-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>経営分析</h1>
          <p className="text-sm mt-1" style={{ color: C.sub }}>収支・利益をリアルタイム集計</p>
        </div>
        {/* Period tabs */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#F1F5F9" }}>
          {PERIOD_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setPeriod(t.key); if (t.key !== "thisYear") setCompare(false); }}
              className="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
              style={period === t.key
                ? { background: C.amber, color: "#FFFFFF" }
                : { color: C.sub }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Alert banner ── */}
      {alertSites.length > 0 && (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-xl"
          style={{ background: "#FFFBEB", border: "1.5px solid #FEF3C7" }}
        >
          <AlertTriangle size={18} style={{ color: C.amberDk, flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: C.amberDk }}>
              粗利率{ALERT_THRESHOLD}%以下の現場があります
            </p>
            <p className="text-xs mt-0.5" style={{ color: C.sub }}>
              {alertSites.map(s => s.name).join("・")}
            </p>
          </div>
        </div>
      )}

      {/* ── Main grid: left 2/3 + right 1/3 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column (2/3) ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* 収支推移グラフ */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>収支推移グラフ</SectionLabel>
              {canCompare && (
                <button
                  onClick={() => setCompare(c => !c)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                  style={compare
                    ? { background: C.amber, color: "#FFF" }
                    : { background: "#F1F5F9", color: C.sub, border: `1px solid ${C.border}` }}
                >
                  昨年比較
                </button>
              )}
            </div>
            <Card className="p-5">
              <BarChart bars={bars} compare={compare && canCompare} />
              <div className="flex items-center gap-4 mt-3 justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm" style={{ background: "rgba(16,185,129,0.75)" }} />
                  <span className="text-[10px]" style={{ color: C.muted }}>{compare ? "今年 売上" : "売上"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm" style={{ background: "rgba(239,68,68,0.75)" }} />
                  <span className="text-[10px]" style={{ color: C.muted }}>{compare ? "今年 原価" : "原価"}</span>
                </div>
                {compare && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-2 rounded-sm" style={{ background: "rgba(16,185,129,0.2)" }} />
                      <span className="text-[10px]" style={{ color: C.muted }}>昨年 売上</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-2 rounded-sm" style={{ background: "rgba(239,68,68,0.2)" }} />
                      <span className="text-[10px]" style={{ color: C.muted }}>昨年 原価</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </section>

          {/* 現場別利益ランキング */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>現場別利益ランキング</SectionLabel>
              <button
                onClick={() => setSortBy(s => s === "profitRate" ? "profitAmt" : "profitRate")}
                className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg"
                style={{ background: "#F1F5F9", color: C.sub, border: `1px solid ${C.border}` }}
              >
                <ArrowUpDown size={10} />
                {sortBy === "profitRate" ? "利益率順" : "利益額順"}
              </button>
            </div>
            <Card>
              <div
                className="grid px-5 py-3"
                style={{ gridTemplateColumns: "1fr 80px 68px", borderBottom: `1px solid ${C.border}`, background: "#F8FAFC" }}
              >
                <span className="text-[10px] font-bold" style={{ color: C.muted }}>現場名</span>
                <span className="text-[10px] font-bold text-right" style={{ color: C.muted }}>粗利</span>
                <span className="text-[10px] font-bold text-right" style={{ color: C.muted }}>粗利率</span>
              </div>
              {ranked.map((site, rank) => {
                const siteProfit = site.contract - site.cost;
                const siteProfitRate = site.cost > 0
                  ? Math.round((siteProfit / site.contract) * 100)
                  : null;
                const rColor = siteProfitRate == null
                  ? C.muted
                  : siteProfitRate >= 25 ? C.green
                  : siteProfitRate >= 15 ? C.amber
                  : C.red;
                const isAlert = siteProfitRate != null && siteProfitRate < ALERT_THRESHOLD;
                return (
                  <Link key={site.id} href={`/kaitai/sites/${site.id}`}>
                    <div
                      className="grid px-5 py-4 hover:bg-gray-50 transition-colors"
                      style={{ gridTemplateColumns: "1fr 80px 68px", borderBottom: `1px solid #F1F5F9` }}
                    >
                      <div className="flex flex-col gap-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{
                              background: rank === 0 ? "#FFFBEB" : "#F8FAFC",
                              color: rank === 0 ? "#D97706" : C.muted,
                            }}
                          >
                            {rank + 1}
                          </span>
                          {isAlert && <AlertTriangle size={9} style={{ color: C.amber, flexShrink: 0 }} />}
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={site.status === "完工"
                              ? { background: "#F0FDF4", color: "#16A34A" }
                              : site.status === "解体中"
                              ? { background: "#FFF7ED", color: C.amberDk }
                              : { background: "#F8FAFC", color: C.muted }}
                          >
                            {site.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{site.name}</p>
                        {siteProfitRate != null && (
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(Math.max(siteProfitRate, 0), 100)}%`, background: rColor }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="text-right self-center">
                        <p className="text-sm font-bold font-numeric" style={{ color: rColor }}>
                          {site.cost > 0 ? fmt(siteProfit) : "—"}
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-1 self-center">
                        <p className="text-base font-bold font-numeric" style={{ color: rColor }}>
                          {siteProfitRate != null ? `${siteProfitRate}%` : "—"}
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

          {/* Hero KPI card */}
          <Card className="p-6">
            <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: C.muted }}>
              {period === "thisMonth" ? "今月 着地予測粗利" : "期間粗利（実績）"}
            </p>
            <p className="font-bold font-numeric" style={{ fontSize: 40, lineHeight: 1, color: profit >= 0 ? C.green : C.red }}>
              {fmt(period === "thisMonth" && s.forecast ? s.forecast : profit)}
            </p>
            {period === "thisMonth" && s.forecast && (
              <p className="text-xs mt-1" style={{ color: C.muted }}>
                確定粗利 <span style={{ color: C.sub, fontWeight: 700 }}>{fmt(profit)}</span>
              </p>
            )}
            <div className="mt-4 flex items-center justify-between">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{
                  background: isYoyUp ? "#F0FDF4" : "#FEF2F2",
                  border: `1px solid ${isYoyUp ? "#BBF7D0" : "#FECACA"}`,
                }}
              >
                {isYoyUp
                  ? <TrendingUp size={12} style={{ color: C.green }} />
                  : <TrendingDown size={12} style={{ color: C.red }} />}
                <span className="text-xs font-bold" style={{ color: isYoyUp ? C.green : C.red }}>
                  昨対 {isYoyUp ? "+" : ""}{yoyChange}%
                </span>
              </div>
              <p className="text-sm" style={{ color: C.muted }}>
                粗利率 <span className="font-bold" style={{ color: profitRate >= 25 ? C.green : profitRate >= 15 ? C.amber : C.red }}>
                  {profitRate}%
                </span>
              </p>
            </div>

            {/* KPI 4-grid */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: "売上高",   value: s.revenue,   color: C.green },
                { label: "売上原価", value: totalCost,   color: C.red },
                { label: "粗利益",   value: profit,      color: profit >= 0 ? C.green : C.red },
                { label: "粗利率",   value: null,        color: profitRate >= 25 ? C.green : profitRate >= 15 ? C.amber : C.red, strVal: `${profitRate}%` },
              ].map(({ label, value, color, strVal }) => (
                <div key={label} className="rounded-lg p-3" style={{ background: "#F8FAFC", border: `1px solid ${C.border}` }}>
                  <p className="text-[10px] mb-1" style={{ color: C.muted }}>{label}</p>
                  <p className="text-base font-bold font-numeric" style={{ color }}>
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
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <DonutChart slices={pieSlices} size={160} outerR={70} innerR={44} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px]" style={{ color: C.muted }}>原価合計</p>
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
                            <span className="text-xs font-medium" style={{ color: C.sub }}>{label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-numeric" style={{ color: C.muted }}>{fmt(value)}</span>
                            <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </section>

        </div>
      </div>
    </div>
  );
}
