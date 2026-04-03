"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, AlertTriangle, ChevronRight, ArrowUpDown, Target } from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: "#1E293B", sub: "#64748B", muted: "#94A3B8",
  border: "#E5E7EB", card: "#FFFFFF",
  amber: "#F59E0B", amberDk: "#D97706",
  brand: "#F59E0B",   // revenue bar
  slate: "#475569",   // cost bar
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
  target?: number;
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
    target:      6_000_000,
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
    target:     18_000_000,
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

// ─── New panel data ───────────────────────────────────────────────────────────

const GAP_DATA = [
  { name: "山田邸", estimate: 1_600_000, actual: 1_840_000 },
  { name: "旧田中", estimate: 2_400_000, actual: 2_100_000 },
  { name: "旧工場", estimate: 5_200_000, actual: 6_100_000 },
  { name: "松本AP", estimate: 2_200_000, actual: null },
];

const CLIENT_RANKS = [
  { name: "ABC解体㈱",  revenue: 12_400_000, profit: 3_720_000 },
  { name: "田中建設",   revenue:  8_800_000, profit: 2_288_000 },
  { name: "個人（山田）",revenue:  3_200_000, profit: 1_360_000 },
  { name: "関東工務店", revenue:  5_600_000, profit:   840_000 },
];

const WASTE_TREND = [
  { month: "10月", cost: 1_840_000, unit: 38_000 },
  { month: "11月", cost: 2_100_000, unit: 41_000 },
  { month: "12月", cost: 1_980_000, unit: 39_500 },
  { month: "1月",  cost: 1_720_000, unit: 37_000 },
  { month: "2月",  cost: 2_040_000, unit: 42_000 },
  { month: "3月",  cost: 2_040_000, unit: 40_800 },
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

// ─── SVG Bar chart (revenue=brand orange, cost=dark slate, thinner bars) ─────

function BarChart({ bars, compare = false }: { bars: MonthBar[]; compare?: boolean }) {
  const H = 100;
  const maxVal = Math.max(...bars.flatMap(b => [b.revenue, compare ? (b.prevRevenue ?? 0) : 0]), 1);
  const n = bars.length;
  const VW = 340;
  const groupW = VW / n;
  // Thinner bars: compare=6px, single=8px
  const bw = compare ? 6 : 8;

  return (
    <svg viewBox={`0 0 ${VW} ${H + 20}`} width="100%" style={{ display: "block" }}>
      <line x1={0} y1={H} x2={VW} y2={H} stroke="#E5E7EB" strokeWidth={1} />
      {bars.map((b, i) => {
        const cx = i * groupW + groupW / 2;
        const revH = Math.max((b.revenue / maxVal) * H, 2);
        const costH = Math.max((b.cost / maxVal) * H, 2);

        return (
          <g key={i}>
            {compare && b.prevRevenue && (
              <>
                {/* prev year: ghost bars */}
                <rect
                  x={cx - bw * 2 - 2} y={H - Math.max((b.prevRevenue / maxVal) * H, 2)}
                  width={bw} height={Math.max((b.prevRevenue / maxVal) * H, 2)}
                  rx={3} fill="rgba(245,158,11,0.25)"
                />
                <rect
                  x={cx - bw + 1} y={H - Math.max(((b.prevCost ?? 0) / maxVal) * H, 2)}
                  width={bw} height={Math.max(((b.prevCost ?? 0) / maxVal) * H, 2)}
                  rx={3} fill="rgba(71,85,105,0.2)"
                />
                {/* current year: solid bars */}
                <rect x={cx + 2} y={H - revH} width={bw} height={revH} rx={3} fill={C.brand} />
                <rect x={cx + bw + 4} y={H - costH} width={bw} height={costH} rx={3} fill={C.slate} />
              </>
            )}
            {!compare && (
              <>
                <rect x={cx - bw - 2} y={H - revH} width={bw} height={revH} rx={3} fill={C.brand} />
                <rect x={cx + 2} y={H - costH} width={bw} height={costH} rx={3} fill={C.slate} />
              </>
            )}
            <text x={cx} y={H + 14} textAnchor="middle" fontSize={9} fill="#94A3B8">
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Panel A: Gap chart (estimate vs actual) ──────────────────────────────────

function GapChart() {
  const H = 90;
  const VW = 300;
  const n = GAP_DATA.length;
  const groupW = VW / n;
  const bw = 10;
  const maxVal = Math.max(...GAP_DATA.flatMap(d => [d.estimate, d.actual ?? 0]), 1);

  return (
    <svg viewBox={`0 0 ${VW} ${H + 20}`} width="100%" style={{ display: "block" }}>
      <line x1={0} y1={H} x2={VW} y2={H} stroke="#E5E7EB" strokeWidth={1} />
      {GAP_DATA.map((d, i) => {
        const cx = i * groupW + groupW / 2;
        const estH = Math.max((d.estimate / maxVal) * H, 2);
        const actH = d.actual ? Math.max((d.actual / maxVal) * H, 2) : 0;
        const over = d.actual != null && d.actual > d.estimate;
        return (
          <g key={i}>
            {/* estimate bar */}
            <rect x={cx - bw - 1} y={H - estH} width={bw} height={estH} rx={3} fill="rgba(245,158,11,0.6)" />
            {/* actual bar */}
            {d.actual != null && d.actual > 0 && (
              <rect x={cx + 1} y={H - actH} width={bw} height={actH} rx={3}
                fill={over ? "#EF4444" : "#10B981"} fillOpacity={0.8} />
            )}
            {/* gap indicator: red dot if over */}
            {over && (
              <circle cx={cx + 1 + bw / 2} cy={H - actH - 5} r={3} fill="#EF4444" />
            )}
            <text x={cx} y={H + 14} textAnchor="middle" fontSize={8} fill="#94A3B8">
              {d.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Panel B: Client profit horizontal bars ───────────────────────────────────

function ClientBars() {
  const sorted = [...CLIENT_RANKS].sort((a, b) => (b.profit / b.revenue) - (a.profit / a.revenue));
  const maxRev = Math.max(...sorted.map(c => c.revenue), 1);
  return (
    <div className="flex flex-col gap-3">
      {sorted.map((c, i) => {
        const rate = Math.round((c.profit / c.revenue) * 100);
        const barPct = (c.revenue / maxRev) * 100;
        const rateColor = rate >= 30 ? C.green : rate >= 20 ? C.amber : C.red;
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold" style={{ color: C.text }}>{c.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-numeric" style={{ color: C.sub }}>
                  ¥{Math.round(c.revenue).toLocaleString("ja-JP")}
                </span>
                <span
                  className="text-sm font-bold font-numeric px-1.5 py-0.5 rounded-md"
                  style={{ background: `${rateColor}18`, color: rateColor, minWidth: 40, textAlign: "right" }}
                >
                  {rate}%
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${barPct}%`, background: `linear-gradient(90deg, ${C.brand} 0%, ${C.amberDk} 100%)` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Panel C: Waste trend line chart ─────────────────────────────────────────

function WasteTrendChart() {
  const W = 300, H = 90, PAD = 24;
  const n = WASTE_TREND.length;
  const costs = WASTE_TREND.map(d => d.cost);
  const minC = Math.min(...costs) * 0.9;
  const maxC = Math.max(...costs) * 1.05;
  const toY = (v: number) => PAD + ((maxC - v) / (maxC - minC)) * (H - PAD);
  const toX = (i: number) => (i / (n - 1)) * (W - 32) + 16;

  const points = WASTE_TREND.map((d, i) => ({ x: toX(i), y: toY(d.cost) }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[n-1].x} ${H} L ${points[0].x} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" style={{ display: "block" }}>
      {/* area fill */}
      <path d={areaD} fill="url(#wasteGrad)" fillOpacity={0.3} />
      {/* line */}
      <path d={pathD} fill="none" stroke={C.brand} strokeWidth={2} strokeLinejoin="round" />
      {/* dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={C.brand} stroke="#fff" strokeWidth={1.5} />
      ))}
      {/* labels */}
      {WASTE_TREND.map((d, i) => (
        <text key={i} x={toX(i)} y={H + 14} textAnchor="middle" fontSize={8} fill="#94A3B8">
          {d.month}
        </text>
      ))}
      {/* unit prices as small text above dots */}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={p.y - 6} textAnchor="middle" fontSize={7} fill={C.amberDk} fontWeight={700}>
          ¥{WASTE_TREND[i].unit.toLocaleString("ja-JP")}
        </text>
      ))}
      <defs>
        <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.brand} />
          <stop offset="100%" stopColor={C.brand} stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${className}`} style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 2px 4px rgba(0,0,0,0.06)", borderRadius: 16 }}>
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

  // KPI progress bar: forecast vs target
  const kpiValue = period === "thisMonth" && s.forecast ? s.forecast : profit;
  const kpiTarget = s.target;
  const kpiProgress = kpiTarget ? Math.min(Math.round((kpiValue / kpiTarget) * 100), 100) : null;

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
    <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

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
              className="px-3 py-1.5 rounded-md text-sm font-bold transition-all"
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

      {/* ── Alert banner (red when sites below threshold) ── */}
      {alertSites.length > 0 && (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-xl"
          style={{ background: "#FEF2F2", border: "1.5px solid #FECACA" }}
        >
          <AlertTriangle size={20} style={{ color: C.red, flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: C.red }}>
              粗利率{ALERT_THRESHOLD}%以下の現場があります
            </p>
            <p className="text-sm mt-0.5" style={{ color: C.sub }}>
              {alertSites.map(s => s.name).join("・")}
            </p>
          </div>
        </div>
      )}

      {/* ── Top: main grid left 2/3 + right 1/3 ── */}
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
                  className="text-sm font-bold px-2.5 py-1 rounded-lg transition-all"
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
              <div className="flex items-center gap-4 mt-3 justify-center flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm" style={{ background: C.brand }} />
                  <span className="text-sm" style={{ color: C.muted }}>{compare ? "今年 売上" : "売上"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm" style={{ background: C.slate }} />
                  <span className="text-sm" style={{ color: C.muted }}>{compare ? "今年 原価" : "原価"}</span>
                </div>
                {compare && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-2 rounded-sm" style={{ background: "rgba(245,158,11,0.25)" }} />
                      <span className="text-sm" style={{ color: C.muted }}>昨年 売上</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-2 rounded-sm" style={{ background: "rgba(71,85,105,0.2)" }} />
                      <span className="text-sm" style={{ color: C.muted }}>昨年 原価</span>
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", color: "#334155", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <ArrowUpDown size={12} />
                {sortBy === "profitRate" ? "利益率順" : "利益額順"}
              </button>
            </div>
            <Card>
              <div
                className="grid px-5 py-3"
                style={{ gridTemplateColumns: "1fr 80px 68px", borderBottom: `1px solid ${C.border}`, background: "#F8FAFC" }}
              >
                <span className="text-sm font-bold" style={{ color: C.muted }}>現場名</span>
                <span className="text-sm font-bold text-right" style={{ color: C.muted }}>粗利</span>
                <span className="text-sm font-bold text-right" style={{ color: C.muted }}>粗利率</span>
              </div>
              {ranked.map((site, rank) => {
                const siteProfit = site.contract - site.cost;
                const siteProfitRate = site.cost > 0
                  ? Math.round((siteProfit / site.contract) * 100)
                  : null;
                const isAlert = siteProfitRate != null && siteProfitRate < ALERT_THRESHOLD;
                const rColor = isAlert ? C.red
                  : siteProfitRate == null ? C.muted
                  : siteProfitRate >= 25 ? C.green
                  : C.amber;
                return (
                  <Link key={site.id} href={`/kaitai/sites/${site.id}`}>
                    <div
                      className="grid px-5 py-4 hover:bg-gray-50 transition-colors"
                      style={{
                        gridTemplateColumns: "1fr 80px 68px",
                        borderBottom: `1px solid #F1F5F9`,
                        background: isAlert ? "#FEF2F2" : "transparent",
                      }}
                    >
                      <div className="flex flex-col gap-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-bold w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{
                              background: rank === 0 ? "#FFFBEB" : "#F8FAFC",
                              color: rank === 0 ? "#D97706" : C.muted,
                            }}
                          >
                            {rank + 1}
                          </span>
                          {isAlert && (
                            <AlertTriangle size={14} style={{ color: C.red, flexShrink: 0 }} />
                          )}
                          <span
                            className="text-sm font-bold px-1.5 py-0.5 rounded-full"
                            style={site.status === "完工"
                              ? { background: "#F0FDF4", color: "#16A34A" }
                              : site.status === "解体中"
                              ? { background: "#FFF7ED", color: C.amberDk }
                              : { background: "#F8FAFC", color: C.muted }}
                          >
                            {site.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold truncate" style={{ color: isAlert ? C.red : C.text }}>
                          {site.name}
                        </p>
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

          {/* Hero KPI card with progress bar */}
          <Card className="p-6">
            <p className="text-sm uppercase tracking-widest font-bold mb-1" style={{ color: C.muted }}>
              {period === "thisMonth" ? "今月 着地予測粗利" : "期間粗利（実績）"}
            </p>
            <p className="font-bold font-numeric" style={{ fontSize: 40, lineHeight: 1, color: kpiValue >= 0 ? C.green : C.red }}>
              {fmt(kpiValue)}
            </p>
            {period === "thisMonth" && s.forecast && (
              <p className="text-sm mt-1" style={{ color: C.muted }}>
                確定粗利 <span style={{ color: C.sub, fontWeight: 700 }}>{fmt(profit)}</span>
              </p>
            )}

            {/* Progress bar vs target */}
            {kpiProgress != null && kpiTarget && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Target size={12} style={{ color: C.muted }} />
                    <span className="text-sm" style={{ color: C.muted }}>目標達成率</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: kpiProgress >= 100 ? C.green : kpiProgress >= 70 ? C.amber : C.red }}>
                    {kpiProgress}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${kpiProgress}%`,
                      background: kpiProgress >= 100 ? C.green : kpiProgress >= 70
                        ? `linear-gradient(90deg, ${C.brand} 0%, ${C.amberDk} 100%)`
                        : C.red,
                    }}
                  />
                </div>
                <p className="text-sm mt-1 text-right" style={{ color: C.muted }}>
                  目標 <span className="font-bold" style={{ color: C.sub }}>{fmt(kpiTarget)}</span>
                </p>
              </div>
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
                <span className="text-sm font-bold" style={{ color: isYoyUp ? C.green : C.red }}>
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
                { label: "売上原価", value: totalCost,   color: C.slate },
                { label: "粗利益",   value: profit,      color: profit >= 0 ? C.green : C.red },
                { label: "粗利率",   value: null,        color: profitRate >= 25 ? C.green : profitRate >= 15 ? C.amber : C.red, strVal: `${profitRate}%` },
              ].map(({ label, value, color, strVal }) => (
                <div key={label} className="rounded-lg p-3" style={{ background: "#F8FAFC", border: `1px solid ${C.border}` }}>
                  <p className="text-sm mb-1" style={{ color: C.muted }}>{label}</p>
                  <p className="font-bold font-numeric" style={{ fontSize: 18, color }}>
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
                    <p className="text-sm" style={{ color: C.muted }}>原価合計</p>
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
                            <span className="text-sm font-bold font-numeric" style={{ color: C.muted }}>{fmt(value)}</span>
                            <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
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

      {/* ── Bottom: 3 analysis panels ── */}
      <div>
        <h2 className="text-base font-bold mb-4" style={{ color: C.text }}>詳細分析</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Panel A: 予実ギャップ分析 */}
          <Card className="p-5">
            <p className="text-sm font-bold mb-1" style={{ color: C.text }}>予実ギャップ分析</p>
            <p className="text-sm mb-4" style={{ color: C.muted }}>見積 vs 実績コスト</p>
            <GapChart />
            <div className="flex items-center gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ background: "rgba(245,158,11,0.6)" }} />
                <span className="text-sm" style={{ color: C.muted }}>見積</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ background: C.green, opacity: 0.8 }} />
                <span className="text-sm" style={{ color: C.muted }}>実績（予算内）</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ background: C.red, opacity: 0.8 }} />
                <span className="text-sm" style={{ color: C.muted }}>実績（超過）</span>
              </div>
            </div>
            {/* gap summary */}
            <div className="mt-4 flex flex-col gap-2">
              {GAP_DATA.filter(d => d.actual != null && d.actual > 0).map(d => {
                const gap = (d.actual ?? 0) - d.estimate;
                const over = gap > 0;
                return (
                  <div key={d.name} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: over ? "#FEF2F2" : "#F0FDF4" }}>
                    <span className="text-sm font-semibold" style={{ color: C.text }}>{d.name}</span>
                    <span className="text-sm font-bold font-numeric" style={{ color: over ? C.red : C.green }}>
                      {over ? "+" : ""}{fmt(gap)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Panel B: 元請け別利益率ランキング */}
          <Card className="p-5">
            <p className="text-sm font-bold mb-1" style={{ color: C.text }}>元請け別 利益率ランキング</p>
            <p className="text-sm mb-4" style={{ color: C.muted }}>売上・利益率の顧客比較</p>
            <ClientBars />
            <div className="mt-4 p-3 rounded-xl" style={{ background: "#F8FAFC", border: `1px solid ${C.border}` }}>
              <p className="text-sm font-semibold mb-1" style={{ color: C.sub }}>最高利益率顧客</p>
              {(() => {
                const top = [...CLIENT_RANKS].sort((a, b) => (b.profit / b.revenue) - (a.profit / a.revenue))[0];
                const rate = Math.round((top.profit / top.revenue) * 100);
                return (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: C.text }}>{top.name}</span>
                    <span className="text-sm font-bold" style={{ color: C.green }}>{rate}%</span>
                  </div>
                );
              })()}
            </div>
          </Card>

          {/* Panel C: 産廃コスト・トレンド */}
          <Card className="p-5">
            <p className="text-sm font-bold mb-1" style={{ color: C.text }}>産廃コスト・トレンド</p>
            <p className="text-sm mb-4" style={{ color: C.muted }}>月次コスト推移と単価</p>
            <WasteTrendChart />
            {/* mini stats */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {(() => {
                const latest = WASTE_TREND[WASTE_TREND.length - 1];
                const prev = WASTE_TREND[WASTE_TREND.length - 2];
                const costChg = Math.round(((latest.cost - prev.cost) / prev.cost) * 100);
                const unitChg = Math.round(((latest.unit - prev.unit) / prev.unit) * 100);
                return (
                  <>
                    <div className="rounded-lg p-3" style={{ background: "#F8FAFC", border: `1px solid ${C.border}` }}>
                      <p className="text-sm" style={{ color: C.muted }}>最新月コスト</p>
                      <p className="text-base font-bold font-numeric mt-0.5" style={{ color: C.text }}>
                        {fmt(latest.cost)}
                      </p>
                      <p className="text-sm font-bold" style={{ color: costChg >= 0 ? C.red : C.green }}>
                        {costChg >= 0 ? "+" : ""}{costChg}% 前月比
                      </p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: "#F8FAFC", border: `1px solid ${C.border}` }}>
                      <p className="text-sm" style={{ color: C.muted }}>単価（/t）</p>
                      <p className="text-base font-bold font-numeric mt-0.5" style={{ color: C.text }}>
                        ¥{latest.unit.toLocaleString("ja-JP")}
                      </p>
                      <p className="text-sm font-bold" style={{ color: unitChg >= 0 ? C.red : C.green }}>
                        {unitChg >= 0 ? "+" : ""}{unitChg}% 前月比
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
