"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, AlertTriangle, ChevronRight, ArrowUpDown, Target, ChevronLeft, Calendar } from "lucide-react";
import { T } from "../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
  brand: T.primary,
  slate: "#475569",
  green: "#10B981", red: "#EF4444",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "month" | "year";

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

type SiteRevenue = { name: string; amount: number; color: string };
type CostBreakdown = { waste: number; labor: number; vehicle: number; other: number };

type MonthBar = {
  label: string;
  revenue: number;
  cost: number;
  siteRevenues: SiteRevenue[];
  costBreakdown: CostBreakdown;
  prevRevenue?: number;
  prevCost?: number;
};

// Site color palette for stacked revenue bars
const SITE_COLORS = [
  "#B45309", "#D97706", "#F59E0B", "#FBBF24", "#92400E",
  "#78350F", "#CA8A04", "#EAB308", "#A16207", "#854D0E",
];

type SiteRank = {
  id: string;
  name: string;
  contract: number;
  cost: number;
  status: "解体中" | "完工" | "着工前";
  alert?: string;
};

// ─── Mock data generator ─────────────────────────────────────────────────────

function generateMonthStats(year: number, month: number): PeriodStats {
  const seed = year * 100 + month;
  const base = 6_000_000 + (seed % 17) * 400_000;
  const seasonFactor = [0.8, 0.85, 1.1, 1.05, 0.95, 0.9, 0.85, 0.75, 0.9, 1.05, 1.15, 1.2][month - 1] ?? 1;
  const yearFactor = 1 + (year - 2023) * 0.12;
  const revenue = Math.round(base * seasonFactor * yearFactor);
  const wastePct = 0.22 + (seed % 7) * 0.01;
  const laborPct = 0.28 + (seed % 5) * 0.01;
  const vehiclePct = 0.06 + (seed % 3) * 0.005;
  const otherPct = 0.08 + (seed % 4) * 0.005;
  return {
    revenue,
    wasteCost: Math.round(revenue * wastePct),
    laborCost: Math.round(revenue * laborPct),
    vehicleCost: Math.round(revenue * vehiclePct),
    otherCost: Math.round(revenue * otherPct),
    yoyRevenue: Math.round(revenue * 0.88),
    yoyProfit: Math.round(revenue * 0.3 * 0.85),
    forecast: month === new Date().getMonth() + 1 && year === new Date().getFullYear()
      ? Math.round(revenue * 0.62) : undefined,
    target: Math.round(revenue * 1.1),
  };
}

function generateYearStats(year: number): PeriodStats {
  const months = Array.from({ length: 12 }, (_, i) => generateMonthStats(year, i + 1));
  const sum = (fn: (s: PeriodStats) => number) => months.reduce((a, m) => a + fn(m), 0);
  return {
    revenue: sum(m => m.revenue),
    wasteCost: sum(m => m.wasteCost),
    laborCost: sum(m => m.laborCost),
    vehicleCost: sum(m => m.vehicleCost),
    otherCost: sum(m => m.otherCost),
    yoyRevenue: sum(m => m.yoyRevenue),
    yoyProfit: sum(m => m.yoyProfit),
    target: sum(m => m.target ?? 0),
  };
}

// Site names for revenue breakdown
const DEMO_SITES = ["山田邸解体", "旧田中倉庫", "旧工場棟(1期)", "松本AP解体"];

function splitRevenueBySite(total: number, seed: number): SiteRevenue[] {
  const n = 2 + (seed % 3); // 2-4 sites
  const sites = DEMO_SITES.slice(0, n);
  const weights = sites.map((_, i) => 1 + ((seed * (i + 3)) % 5));
  const wSum = weights.reduce((a, b) => a + b, 0);
  return sites.map((name, i) => ({
    name,
    amount: Math.round(total * weights[i] / wSum),
    color: SITE_COLORS[i % SITE_COLORS.length],
  }));
}

function splitCost(total: number, seed: number): CostBreakdown {
  const wp = 0.32 + (seed % 7) * 0.01;
  const lp = 0.38 + (seed % 5) * 0.01;
  const vp = 0.12 + (seed % 3) * 0.005;
  const sum = wp + lp + vp;
  return {
    waste:   Math.round(total * wp / (sum + 0.18)),
    labor:   Math.round(total * lp / (sum + 0.18)),
    vehicle: Math.round(total * vp / (sum + 0.18)),
    other:   Math.round(total * 0.18 / (sum + 0.18)),
  };
}

function generateMonthBars(year: number, month: number): MonthBar[] {
  const s = generateMonthStats(year, month);
  const weeks = 4;
  return Array.from({ length: weeks }, (_, i) => {
    const pct = [0.22, 0.28, 0.3, 0.2][i];
    const rev = Math.round(s.revenue * pct);
    const cost = Math.round((s.wasteCost + s.laborCost + s.vehicleCost + s.otherCost) * pct);
    const seed = year * 1000 + month * 10 + i;
    return {
      label: `W${i + 1}`,
      revenue: rev,
      cost,
      siteRevenues: splitRevenueBySite(rev, seed),
      costBreakdown: splitCost(cost, seed),
    };
  });
}

function generateYearBars(year: number): MonthBar[] {
  const prevYear = year - 1;
  return Array.from({ length: 12 }, (_, i) => {
    const m = generateMonthStats(year, i + 1);
    const pm = generateMonthStats(prevYear, i + 1);
    const cost = m.wasteCost + m.laborCost + m.vehicleCost + m.otherCost;
    const prevCost = pm.wasteCost + pm.laborCost + pm.vehicleCost + pm.otherCost;
    const seed = year * 100 + i;
    return {
      label: `${i + 1}月`,
      revenue: m.revenue,
      cost,
      siteRevenues: splitRevenueBySite(m.revenue, seed),
      costBreakdown: splitCost(cost, seed),
      prevRevenue: pm.revenue,
      prevCost,
    };
  });
}

const SITE_RANKS: SiteRank[] = [
  { id: "s4", name: "旧工場棟解体（第1期）", contract: 8_400_000, cost: 6_100_000, status: "完工", alert: "原価超過リスク" },
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

// ─── SVG Bar chart ───────────────────────────────────────────────────────────

function fmtAxis(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(n % 10_000_000 === 0 ? 0 : 1)}千万`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}百万`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}万`;
  return `${n}`;
}

function niceStep(maxVal: number): number {
  const raw = maxVal / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  if (norm <= 1) return mag;
  if (norm <= 2) return 2 * mag;
  if (norm <= 5) return 5 * mag;
  return 10 * mag;
}

const COST_COLORS = {
  waste: "#F87171", labor: "#FB923C", vehicle: "#92400E", other: "#9CA3AF",
};
const COST_LABELS: Record<string, string> = {
  waste: "産廃費", labor: "労務費", vehicle: "車両・燃料", other: "その他",
};

function BarChart({ bars, compare = false, selectedIdx, onSelect }: {
  bars: MonthBar[]; compare?: boolean;
  selectedIdx: number | null; onSelect: (i: number | null) => void;
}) {
  const H = 120;
  const LPAD = 52;
  const maxVal = Math.max(...bars.flatMap(b => [b.revenue, compare ? (b.prevRevenue ?? 0) : 0]), 1);
  const n = bars.length;
  const VW = 400;
  const chartW = VW - LPAD;
  const groupW = chartW / n;
  const bw = compare ? 7 : 10;

  const step = niceStep(maxVal);
  const ticks: number[] = [];
  for (let v = 0; v <= maxVal; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < maxVal) ticks.push(ticks[ticks.length - 1] + step);
  const yMax = ticks[ticks.length - 1] || 1;
  const toY = (v: number) => H - (v / yMax) * H;

  return (
    <svg viewBox={`0 0 ${VW} ${H + 24}`} width="100%" style={{ display: "block" }}>
      {/* Y-axis */}
      {ticks.map(v => (
        <g key={v}>
          <line x1={LPAD} y1={toY(v)} x2={VW} y2={toY(v)} stroke={T.border} strokeWidth={0.5} strokeDasharray={v === 0 ? undefined : "3,3"} />
          <text x={LPAD - 6} y={toY(v) + 3.5} textAnchor="end" fontSize={8} fill={T.muted} fontWeight={500}>
            ¥{fmtAxis(v)}
          </text>
        </g>
      ))}

      {bars.map((b, i) => {
        const cx = LPAD + i * groupW + groupW / 2;
        const isSelected = selectedIdx === i;
        const opacity = selectedIdx !== null && !isSelected ? 0.35 : 1;

        // ── Revenue: stacked by site ──
        const revX = cx - bw - 2;
        let revY = H;
        const revSegments = b.siteRevenues.map(sr => {
          const segH = Math.max((sr.amount / yMax) * H, 0.5);
          revY -= segH;
          return { ...sr, y: revY, h: segH };
        });

        // ── Cost: stacked by category ──
        const costX = cx + 2;
        let costY = H;
        const cb = b.costBreakdown;
        const costSegments = [
          { key: "waste",   amount: cb.waste,   color: COST_COLORS.waste },
          { key: "labor",   amount: cb.labor,   color: COST_COLORS.labor },
          { key: "vehicle", amount: cb.vehicle, color: COST_COLORS.vehicle },
          { key: "other",   amount: cb.other,   color: COST_COLORS.other },
        ].map(seg => {
          const segH = Math.max((seg.amount / yMax) * H, 0.5);
          costY -= segH;
          return { ...seg, y: costY, h: segH };
        });

        return (
          <g key={i} opacity={opacity} style={{ cursor: "pointer" }} onClick={() => onSelect(isSelected ? null : i)}>
            {/* Click area */}
            <rect x={cx - groupW / 2} y={0} width={groupW} height={H + 20} fill="transparent" />

            {/* Selected highlight */}
            {isSelected && (
              <rect x={cx - groupW / 2 + 2} y={0} width={groupW - 4} height={H} rx={4} fill={T.primaryLt} />
            )}

            {compare && b.prevRevenue ? (
              <>
                <rect
                  x={cx - bw * 2 - 2} y={H - Math.max((b.prevRevenue / yMax) * H, 2)}
                  width={bw} height={Math.max((b.prevRevenue / yMax) * H, 2)}
                  rx={2} fill={T.primaryMd}
                />
                <rect
                  x={cx - bw + 1} y={H - Math.max(((b.prevCost ?? 0) / yMax) * H, 2)}
                  width={bw} height={Math.max(((b.prevCost ?? 0) / yMax) * H, 2)}
                  rx={2} fill="rgba(71,85,105,0.2)"
                />
                {/* Stacked revenue */}
                {revSegments.map((seg, si) => (
                  <rect key={`r${si}`} x={cx + 2} y={seg.y} width={bw} height={seg.h} fill={seg.color}
                    rx={si === 0 ? 2 : 0} />
                ))}
                {/* Stacked cost */}
                {costSegments.map((seg, si) => (
                  <rect key={`c${si}`} x={cx + bw + 4} y={seg.y} width={bw} height={seg.h} fill={seg.color}
                    rx={si === 0 ? 2 : 0} />
                ))}
              </>
            ) : (
              <>
                {/* Stacked revenue bar */}
                {revSegments.map((seg, si) => (
                  <rect key={`r${si}`} x={revX} y={seg.y} width={bw} height={seg.h} fill={seg.color}
                    rx={si === 0 ? 2 : 0} />
                ))}
                {/* Stacked cost bar */}
                {costSegments.map((seg, si) => (
                  <rect key={`c${si}`} x={costX} y={seg.y} width={bw} height={seg.h} fill={seg.color}
                    rx={si === 0 ? 2 : 0} />
                ))}
              </>
            )}

            <text x={cx} y={H + 14} textAnchor="middle" fontSize={9} fill={isSelected ? C.brand : T.muted} fontWeight={isSelected ? 700 : 400}>
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Detail panel for selected bar ──────────────────────────────────────────

function BarDetail({ bar }: { bar: MonthBar }) {
  const cb = bar.costBreakdown;
  const totalCost = cb.waste + cb.labor + cb.vehicle + cb.other;
  const profit = bar.revenue - totalCost;
  const profitRate = bar.revenue > 0 ? Math.round((profit / bar.revenue) * 100) : 0;

  return (
    <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
      <div className="grid grid-cols-2 gap-4">
        {/* Revenue breakdown */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.brand, marginBottom: 8 }}>
            売上内訳 ¥{Math.round(bar.revenue).toLocaleString("ja-JP")}
          </p>
          <div className="flex flex-col gap-1.5">
            {bar.siteRevenues.map((sr, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: sr.color }} />
                <span style={{ fontSize: 12, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {sr.name}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>
                  ¥{Math.round(sr.amount).toLocaleString("ja-JP")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost breakdown */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.slate, marginBottom: 8 }}>
            原価内訳 ¥{Math.round(totalCost).toLocaleString("ja-JP")}
          </p>
          <div className="flex flex-col gap-1.5">
            {([
              { key: "waste", amount: cb.waste, color: COST_COLORS.waste },
              { key: "labor", amount: cb.labor, color: COST_COLORS.labor },
              { key: "vehicle", amount: cb.vehicle, color: COST_COLORS.vehicle },
              { key: "other", amount: cb.other, color: COST_COLORS.other },
            ] as const).map(seg => (
              <div key={seg.key} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
                <span style={{ fontSize: 12, color: C.text, flex: 1 }}>
                  {COST_LABELS[seg.key]}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>
                  ¥{Math.round(seg.amount).toLocaleString("ja-JP")}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2" style={{ borderTop: `1px dashed ${T.border}` }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>粗利</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: profit >= 0 ? C.green : C.red }}>
                ¥{Math.round(profit).toLocaleString("ja-JP")} ({profitRate}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel A: Gap chart ─────────────────────────────────────────────────────

function GapChart() {
  const H = 90;
  const LPAD = 48;
  const VW = 340;
  const n = GAP_DATA.length;
  const chartW = VW - LPAD;
  const groupW = chartW / n;
  const bw = 10;
  const maxVal = Math.max(...GAP_DATA.flatMap(d => [d.estimate, d.actual ?? 0]), 1);

  const step = niceStep(maxVal);
  const ticks: number[] = [];
  for (let v = 0; v <= maxVal; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < maxVal) ticks.push(ticks[ticks.length - 1] + step);
  const yMax = ticks[ticks.length - 1] || 1;
  const toY = (v: number) => H - (v / yMax) * H;

  return (
    <svg viewBox={`0 0 ${VW} ${H + 20}`} width="100%" style={{ display: "block" }}>
      {ticks.map(v => (
        <g key={v}>
          <line x1={LPAD} y1={toY(v)} x2={VW} y2={toY(v)} stroke={T.border} strokeWidth={0.5} strokeDasharray={v === 0 ? undefined : "3,3"} />
          <text x={LPAD - 5} y={toY(v) + 3} textAnchor="end" fontSize={7} fill={T.muted}>
            ¥{fmtAxis(v)}
          </text>
        </g>
      ))}
      {GAP_DATA.map((d, i) => {
        const cx = LPAD + i * groupW + groupW / 2;
        const estH = Math.max((d.estimate / yMax) * H, 2);
        const actH = d.actual ? Math.max((d.actual / yMax) * H, 2) : 0;
        const over = d.actual != null && d.actual > d.estimate;
        return (
          <g key={i}>
            <rect x={cx - bw - 1} y={H - estH} width={bw} height={estH} rx={3} fill={T.primaryMd} />
            {d.actual != null && d.actual > 0 && (
              <rect x={cx + 1} y={H - actH} width={bw} height={actH} rx={3}
                fill={over ? "#EF4444" : "#10B981"} fillOpacity={0.8} />
            )}
            {over && (
              <circle cx={cx + 1 + bw / 2} cy={H - actH - 5} r={3} fill="#EF4444" />
            )}
            <text x={cx} y={H + 14} textAnchor="middle" fontSize={8} fill={T.muted}>
              {d.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Panel B: Client profit horizontal bars ─────────────────────────────────

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
            <div className="h-2 rounded-full overflow-hidden" style={{ background: T.bg }}>
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

// ─── Panel C: Waste trend line chart ────────────────────────────────────────

function WasteTrendChart() {
  const LPAD = 48;
  const W = 340, H = 90, PAD = 8;
  const n = WASTE_TREND.length;
  const costs = WASTE_TREND.map(d => d.cost);
  const rawMin = Math.min(...costs);
  const rawMax = Math.max(...costs);

  // Y-axis with nice ticks covering data range
  const step = niceStep(rawMax);
  const ticks: number[] = [];
  const yFloor = Math.floor(rawMin / step) * step;
  for (let v = yFloor; v <= rawMax + step * 0.5; v += step) ticks.push(v);
  const minC = ticks[0];
  const maxC = ticks[ticks.length - 1];

  const toY = (v: number) => PAD + ((maxC - v) / (maxC - minC)) * (H - PAD);
  const toX = (i: number) => LPAD + (i / (n - 1)) * (W - LPAD - 16) + 8;

  const points = WASTE_TREND.map((d, i) => ({ x: toX(i), y: toY(d.cost) }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[n-1].x} ${H} L ${points[0].x} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" style={{ display: "block" }}>
      {/* Y-axis grid lines and labels */}
      {ticks.map(v => (
        <g key={v}>
          <line x1={LPAD} y1={toY(v)} x2={W} y2={toY(v)} stroke={T.border} strokeWidth={0.5} strokeDasharray="3,3" />
          <text x={LPAD - 5} y={toY(v) + 3} textAnchor="end" fontSize={7} fill={T.muted}>
            ¥{fmtAxis(v)}
          </text>
        </g>
      ))}
      <path d={areaD} fill="url(#wasteGrad)" fillOpacity={0.3} />
      <path d={pathD} fill="none" stroke={C.brand} strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={C.brand} stroke="#fff" strokeWidth={1.5} />
      ))}
      {WASTE_TREND.map((d, i) => (
        <text key={i} x={toX(i)} y={H + 14} textAnchor="middle" fontSize={8} fill={T.muted}>
          {d.month}
        </text>
      ))}
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
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: T.bg }}>
        {(["month", "year"] as const).map(m => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className="px-3 py-1.5 rounded-md text-sm font-bold transition-all"
            style={mode === m
              ? { background: C.amber, color: T.surface }
              : { color: C.sub }
            }
          >
            {m === "month" ? "月別" : "年間"}
          </button>
        ))}
      </div>

      {/* Year selector */}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const now = new Date();
  const [mode, setMode] = useState<ViewMode>("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [compare, setCompare] = useState(false);
  const [sortBy, setSortBy] = useState<"profitRate" | "profitAmt">("profitRate");
  const [showPicker, setShowPicker] = useState(false);
  const [selectedBarIdx, setSelectedBarIdx] = useState<number | null>(null);

  const s = mode === "year" ? generateYearStats(year) : generateMonthStats(year, month);
  const totalCost = s.wasteCost + s.laborCost + s.vehicleCost + s.otherCost;
  const profit = s.revenue - totalCost;
  const profitRate = s.revenue > 0 ? Math.round((profit / s.revenue) * 1000) / 10 : 0;
  const yoyChange = s.yoyProfit > 0 ? Math.round(((profit - s.yoyProfit) / s.yoyProfit) * 1000) / 10 : 0;
  const isYoyUp = yoyChange >= 0;

  const kpiValue = mode === "month" && s.forecast ? s.forecast : profit;
  const kpiTarget = s.target;
  const kpiProgress = kpiTarget ? Math.min(Math.round((kpiValue / kpiTarget) * 100), 100) : null;

  const canCompare = mode === "year";

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

  const bars = mode === "year" ? generateYearBars(year) : generateMonthBars(year, month);
  const pieSlices = [
    { value: s.wasteCost,   color: "#F87171", label: "産廃費" },
    { value: s.laborCost,   color: "#FB923C", label: "労務費" },
    { value: s.vehicleCost, color: "#92400E", label: "車両・燃料" },
    { value: s.otherCost,   color: T.muted, label: "その他" },
  ];

  const periodLabel = mode === "year" ? `${year}年 年間` : `${year}年${month}月`;

  return (
    <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>経営分析</h1>
          <p className="text-sm mt-1" style={{ color: C.sub }}>収支・利益をリアルタイム集計</p>
        </div>

        {/* Period display + picker toggle */}
        <div className="relative">
          <button
            onClick={() => setShowPicker(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{ background: T.bg, border: `1.5px solid ${C.border}`, color: C.text }}
          >
            <Calendar size={15} style={{ color: C.amber }} />
            {periodLabel}
          </button>

          {/* Dropdown picker */}
          {showPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
              <div
                className="absolute right-0 top-full mt-2 z-50 p-4 rounded-xl"
                style={{ background: C.card, border: `1.5px solid ${C.border}`, width: 320, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
              >
                <PeriodPicker
                  mode={mode} year={year} month={month}
                  onModeChange={m => { setMode(m); if (m === "year") setCompare(false); }}
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

      {/* ── Top: main grid ── */}
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
                    : { background: T.bg, color: C.sub, border: `1px solid ${C.border}` }}
                >
                  昨年比較
                </button>
              )}
            </div>
            <Card className="p-5">
              <BarChart bars={bars} compare={compare && canCompare} selectedIdx={selectedBarIdx} onSelect={setSelectedBarIdx} />

              {/* Legend */}
              <div className="flex items-center gap-3 mt-3 justify-center flex-wrap">
                {/* Revenue legend - site colors */}
                {bars[0]?.siteRevenues.map((sr, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: sr.color }} />
                    <span style={{ fontSize: 11, color: C.muted }}>{sr.name}</span>
                  </div>
                ))}
                <div style={{ width: 1, height: 14, background: T.border }} />
                {/* Cost legend - category colors */}
                {Object.entries(COST_COLORS).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                    <span style={{ fontSize: 11, color: C.muted }}>{COST_LABELS[key]}</span>
                  </div>
                ))}
                {compare && (
                  <>
                    <div style={{ width: 1, height: 14, background: T.border }} />
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: T.primaryMd }} />
                      <span style={{ fontSize: 11, color: C.muted }}>昨年 売上</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(71,85,105,0.2)" }} />
                      <span style={{ fontSize: 11, color: C.muted }}>昨年 原価</span>
                    </div>
                  </>
                )}
              </div>

              {/* Click hint */}
              {selectedBarIdx === null && (
                <p style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 6 }}>
                  棒グラフをクリックすると内訳を表示
                </p>
              )}

              {/* Detail panel */}
              {selectedBarIdx !== null && bars[selectedBarIdx] && (
                <BarDetail bar={bars[selectedBarIdx]} />
              )}
            </Card>
          </section>

          {/* 現場別利益ランキング */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>現場別利益ランキング</SectionLabel>
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
              <div
                className="grid px-5 py-3"
                style={{ gridTemplateColumns: "1fr 80px 68px", borderBottom: `1px solid ${C.border}`, background: T.bg }}
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
                              background: rank === 0 ? T.primaryLt : T.bg,
                              color: rank === 0 ? T.primaryDk : C.muted,
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
                              ? { background: T.primaryLt, color: C.amberDk }
                              : { background: T.bg, color: C.muted }}
                          >
                            {site.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold truncate" style={{ color: isAlert ? C.red : C.text }}>
                          {site.name}
                        </p>
                        {siteProfitRate != null && (
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: T.bg }}>
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
            <p className="text-sm uppercase tracking-widest font-bold mb-1" style={{ color: C.muted }}>
              {mode === "month" && s.forecast ? "今月 着地予測粗利" : `${periodLabel} 粗利（実績）`}
            </p>
            <p className="font-bold font-numeric" style={{ fontSize: 40, lineHeight: 1, color: kpiValue >= 0 ? C.green : C.red }}>
              {fmt(kpiValue)}
            </p>
            {mode === "month" && s.forecast && (
              <p className="text-sm mt-1" style={{ color: C.muted }}>
                確定粗利 <span style={{ color: C.sub, fontWeight: 700 }}>{fmt(profit)}</span>
              </p>
            )}

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
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: T.bg }}>
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
                <div key={label} className="rounded-lg p-3" style={{ background: T.bg, border: `1px solid ${C.border}` }}>
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
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.bg }}>
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
                <div className="w-3 h-2 rounded-sm" style={{ background: `${T.primaryMd}` }} />
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
            <div className="mt-4 p-3 rounded-xl" style={{ background: T.bg, border: `1px solid ${C.border}` }}>
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
            <div className="grid grid-cols-2 gap-2 mt-4">
              {(() => {
                const latest = WASTE_TREND[WASTE_TREND.length - 1];
                const prev = WASTE_TREND[WASTE_TREND.length - 2];
                const costChg = Math.round(((latest.cost - prev.cost) / prev.cost) * 100);
                const unitChg = Math.round(((latest.unit - prev.unit) / prev.unit) * 100);
                return (
                  <>
                    <div className="rounded-lg p-3" style={{ background: T.bg, border: `1px solid ${C.border}` }}>
                      <p className="text-sm" style={{ color: C.muted }}>最新月コスト</p>
                      <p className="text-base font-bold font-numeric mt-0.5" style={{ color: C.text }}>
                        {fmt(latest.cost)}
                      </p>
                      <p className="text-sm font-bold" style={{ color: costChg >= 0 ? C.red : C.green }}>
                        {costChg >= 0 ? "+" : ""}{costChg}% 前月比
                      </p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: T.bg, border: `1px solid ${C.border}` }}>
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
