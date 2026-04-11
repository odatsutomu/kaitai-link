"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, AlertTriangle, ChevronRight,
  ChevronLeft, ChevronDown, Calendar, BarChart2, Banknote,
  Receipt, Wallet, HelpCircle, ArrowUpDown, DollarSign,
  AlertCircle, Activity, Building2,
} from "lucide-react";
import { T } from "../lib/design-tokens";

// ─── Palette ─────────────────────────────────────────────────────────────────
const P = {
  white: "#FFFFFF",
  bg: "#F8FAFC",
  text: "#1E293B",
  sub: "#64748B",
  muted: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  blue: "#3B82F6",
  blueLt: "rgba(59,130,246,0.08)",
  green: "#10B981",
  greenLt: "rgba(16,185,129,0.08)",
  orange: "#F97316",
  orangeLt: "rgba(249,115,22,0.08)",
  red: "#EF4444",
  redLt: "rgba(239,68,68,0.08)",
  teal: "#14B8A6",
  purple: "#8B5CF6",
  amber: "#D97706",
  slate: "#475569",
};

// ─── Types ───────────────────────────────────────────────────────────────────
type SiteSummary = {
  id: string; name: string; status: string;
  contractAmount: number; paidAmount: number; remainingAmount: number;
  costAmount: number; expenseTotal: number;
  startDate: string | null; endDate: string | null; progressPct: number;
};

type FinanceTotals = {
  contractAmount: number; paidAmount: number; remainingAmount: number;
  totalCost: number; profit: number; profitRate: number;
  wasteCost: number; laborCost: number; vehicleCost: number;
  materialCost: number; otherCost: number;
};

type PrevTotals = {
  contractAmount: number; paidAmount: number; totalCost: number;
  profit: number; profitRate: number;
} | null;

type MonthlyEntry = { revenue: number; cost: number; paid: number };

type FinanceData = {
  totals: FinanceTotals;
  prevTotals: PrevTotals;
  sites: SiteSummary[];
  expenseByCategory: Record<string, number>;
  monthlyData: Record<string, MonthlyEntry>;
  activeSiteCount: number;
  totalSiteCount: number;
};

type ViewMode = "month" | "year";

const COST_ALERT_RATE = 70; // 原価率超過アラート閾値

// ─── Mock data (fallback for empty DB) ──────────────────────────────────────
function generateMockData(): FinanceData {
  const months: Record<string, MonthlyEntry> = {};
  const base = [
    { m: "2025-11", rev: 8500000, cost: 4200000, paid: 8500000 },
    { m: "2025-12", rev: 12000000, cost: 5800000, paid: 10000000 },
    { m: "2026-01", rev: 9200000, cost: 4900000, paid: 9200000 },
    { m: "2026-02", rev: 15000000, cost: 7200000, paid: 13500000 },
    { m: "2026-03", rev: 11800000, cost: 6100000, paid: 11800000 },
    { m: "2026-04", rev: 13500000, cost: 5400000, paid: 8500000 },
  ];
  for (const b of base) months[b.m] = { revenue: b.rev, cost: b.cost, paid: b.paid };

  const sites: SiteSummary[] = [
    { id: "mock1", name: "山田邸解体工事", status: "施工中", contractAmount: 4500000, paidAmount: 3000000, remainingAmount: 1500000, costAmount: 0, expenseTotal: 2100000, startDate: "2026-03-01", endDate: "2026-05-30", progressPct: 65 },
    { id: "mock2", name: "旧田中倉庫解体", status: "解体中", contractAmount: 8200000, paidAmount: 4100000, remainingAmount: 4100000, costAmount: 0, expenseTotal: 2400000, startDate: "2026-02-15", endDate: "2026-06-15", progressPct: 40 },
    { id: "mock3", name: "松本アパート解体", status: "施工中", contractAmount: 3200000, paidAmount: 3200000, remainingAmount: 0, costAmount: 0, expenseTotal: 2800000, startDate: "2026-01-10", endDate: "2026-04-20", progressPct: 90 },
    { id: "mock4", name: "佐藤ビル内装撤去", status: "着工・内装解体", contractAmount: 6800000, paidAmount: 2000000, remainingAmount: 4800000, costAmount: 0, expenseTotal: 1200000, startDate: "2026-03-20", endDate: "2026-07-31", progressPct: 20 },
    { id: "mock5", name: "鈴木工場解体", status: "入金確認", contractAmount: 12500000, paidAmount: 12500000, remainingAmount: 0, costAmount: 0, expenseTotal: 8200000, startDate: "2025-10-01", endDate: "2026-03-15", progressPct: 100 },
  ];

  const totalContract = sites.reduce((s, x) => s + x.contractAmount, 0);
  const totalPaid = sites.reduce((s, x) => s + x.paidAmount, 0);
  const totalCost = sites.reduce((s, x) => s + x.expenseTotal, 0);

  return {
    totals: {
      contractAmount: totalContract, paidAmount: totalPaid,
      remainingAmount: totalContract - totalPaid, totalCost,
      profit: totalPaid - totalCost, profitRate: Math.round(((totalPaid - totalCost) / totalPaid) * 1000) / 10,
      wasteCost: 3200000, laborCost: 0, vehicleCost: 1800000,
      materialCost: 2900000, otherCost: 1400000,
    },
    prevTotals: { contractAmount: 11800000, paidAmount: 11800000, totalCost: 6100000, profit: 5700000, profitRate: 48.3 },
    sites,
    expenseByCategory: { "産廃処分費": 3800000, "燃料費": 2400000, "交通費": 1200000, "資材購入": 1100000, "工具・消耗品": 600000, "食費・雑費": 500000, "その他": 300000 },
    monthlyData: months,
    activeSiteCount: 4,
    totalSiteCount: 5,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (Math.abs(n) >= 10000000) return `¥${(n / 10000).toFixed(0)}万`;
  if (Math.abs(n) >= 1000000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function fmtFull(n: number) {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function trendPct(current: number, prev: number): { pct: number; up: boolean } | null {
  if (prev === 0) return null;
  const pct = Math.round(((current - prev) / Math.abs(prev)) * 100);
  return { pct, up: pct >= 0 };
}

// ─── SVG Donut chart ─────────────────────────────────────────────────────────
function DonutChart({ slices, size = 180, outerR = 80, innerR = 52 }: {
  slices: { value: number; color: string; label: string }[];
  size?: number; outerR?: number; innerR?: number;
}) {
  const cx = size / 2, cy = size / 2;
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  let angle = -Math.PI / 2;
  const paths = slices.map(s => {
    const sweep = (s.value / total) * 2 * Math.PI;
    const a1 = angle, a2 = angle + sweep - 0.02;
    const d = [
      `M ${cx + outerR * Math.cos(a1)} ${cy + outerR * Math.sin(a1)}`,
      `A ${outerR} ${outerR} 0 ${sweep > Math.PI ? 1 : 0} 1 ${cx + outerR * Math.cos(a2)} ${cy + outerR * Math.sin(a2)}`,
      `L ${cx + innerR * Math.cos(a2)} ${cy + innerR * Math.sin(a2)}`,
      `A ${innerR} ${innerR} 0 ${sweep > Math.PI ? 1 : 0} 0 ${cx + innerR * Math.cos(a1)} ${cy + innerR * Math.sin(a1)}`,
      "Z",
    ].join(" ");
    angle += sweep;
    return { ...s, d, pct: Math.round((s.value / total) * 100) };
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
    </svg>
  );
}

// ─── SVG Monthly Bar + Line Chart ────────────────────────────────────────────
function MonthlyChart({ data }: { data: Record<string, MonthlyEntry> }) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  if (entries.length === 0) return <div className="py-10 text-center" style={{ color: P.muted, fontSize: 13 }}>月次データがありません</div>;

  const maxVal = Math.max(...entries.map(([, e]) => Math.max(e.paid, e.cost)), 1);
  const chartH = 200;
  const chartW = 500;
  const barW = 24;
  const gap = (chartW - entries.length * barW * 2) / (entries.length + 1);

  // Profit rate line points
  const linePoints = entries.map(([, e], i) => {
    const rate = e.paid > 0 ? ((e.paid - e.cost) / e.paid) * 100 : 0;
    const x = gap + i * (barW * 2 + gap) + barW;
    const y = chartH - (rate / 100) * chartH;
    return { x, y: Math.max(10, Math.min(chartH - 10, y)), rate: Math.round(rate) };
  });

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${chartW} ${chartH + 40}`} style={{ width: "100%", maxWidth: chartW, height: "auto" }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(r => (
          <line key={r} x1={0} y1={chartH * (1 - r)} x2={chartW} y2={chartH * (1 - r)} stroke={P.borderLight} strokeWidth={1} />
        ))}

        {entries.map(([monthKey, e], i) => {
          const x = gap + i * (barW * 2 + gap);
          const revenueH = (e.paid / maxVal) * chartH;
          const costH = (e.cost / maxVal) * chartH;
          const label = monthKey.slice(5) + "月";
          return (
            <g key={monthKey}>
              {/* Revenue bar */}
              <rect x={x} y={chartH - revenueH} width={barW} height={revenueH} rx={4} fill={P.blue} opacity={0.8} />
              {/* Cost bar */}
              <rect x={x + barW + 2} y={chartH - costH} width={barW} height={costH} rx={4} fill={P.orange} opacity={0.6} />
              {/* Label */}
              <text x={x + barW} y={chartH + 18} textAnchor="middle" fontSize={11} fill={P.sub} fontWeight={600}>{label}</text>
            </g>
          );
        })}

        {/* Profit rate line */}
        {linePoints.length > 1 && (
          <polyline
            points={linePoints.map(p => `${p.x},${p.y}`).join(" ")}
            fill="none" stroke={P.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          />
        )}
        {linePoints.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill={P.white} stroke={P.green} strokeWidth={2} />
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={10} fill={P.green} fontWeight={700}>{p.rate}%</text>
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-center gap-5 mt-2">
        <div className="flex items-center gap-1.5">
          <div style={{ width: 12, height: 10, borderRadius: 2, background: P.blue, opacity: 0.8 }} />
          <span style={{ fontSize: 11, color: P.sub }}>売上</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 12, height: 10, borderRadius: 2, background: P.orange, opacity: 0.6 }} />
          <span style={{ fontSize: 11, color: P.sub }}>原価</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 12, height: 4, borderRadius: 2, background: P.green }} />
          <span style={{ fontSize: 11, color: P.sub }}>粗利率</span>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, color, iconBg, trend, isAlert }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  color: string; iconBg: string;
  trend?: { pct: number; up: boolean } | null;
  isAlert?: boolean;
}) {
  return (
    <div style={{
      background: P.white, borderRadius: 12, padding: "20px",
      border: isAlert ? `1.5px solid rgba(239,68,68,0.3)` : `1px solid ${P.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 8, background: iconBg }}>
            {icon}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: P.muted }}>{label}</span>
        </div>
        {trend && trend.pct !== 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{
            background: trend.up ? P.greenLt : P.redLt,
            fontSize: 11, fontWeight: 700, color: trend.up ? P.green : P.red,
          }}>
            {trend.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.up ? "+" : ""}{trend.pct}%
          </div>
        )}
      </div>
      <p style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: isAlert ? P.red : P.muted, marginTop: 6 }}>{sub}</p>
    </div>
  );
}

// ─── Site Drill-down Row ─────────────────────────────────────────────────────
function SiteRow({ site, rank }: {
  site: SiteSummary & { totalCost: number; profit: number; profitRate: number | null };
  rank: number;
}) {
  const [open, setOpen] = useState(false);
  const isAlert = site.profitRate != null && site.profitRate < 0;
  const isWarning = site.profitRate != null && site.paidAmount > 0 && site.profitRate < 20;
  const costRate = site.contractAmount > 0 ? Math.round((site.totalCost / site.contractAmount) * 100) : 0;
  const paidPct = site.contractAmount > 0 ? Math.round((site.paidAmount / site.contractAmount) * 100) : 0;
  const rColor = isAlert ? P.red : isWarning ? P.orange : site.profitRate != null && site.profitRate >= 25 ? P.green : P.sub;
  const isActive = ["着工・内装解体", "上屋解体・基礎", "施工中", "解体中"].includes(site.status);

  return (
    <div style={{ borderBottom: `1px solid ${P.borderLight}`, background: (isAlert || isWarning) ? (isAlert ? "rgba(239,68,68,0.03)" : "rgba(249,115,22,0.03)") : "transparent" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left hover:bg-gray-50/50 transition-colors"
        style={{ padding: "14px 20px" }}
      >
        <div className="flex items-center gap-3">
          {/* Rank */}
          <span className="text-xs font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: rank === 0 ? P.blueLt : P.bg, color: rank === 0 ? P.blue : P.muted }}>
            {rank + 1}
          </span>

          {/* Status + Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {(isAlert || isWarning) && <AlertTriangle size={12} style={{ color: isAlert ? P.red : P.orange }} />}
              <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={isActive
                  ? { background: P.blueLt, color: P.blue }
                  : site.status.includes("完工") || site.status === "入金確認"
                  ? { background: P.greenLt, color: P.green }
                  : { background: P.bg, color: P.muted }}>
                {site.status}
              </span>
              <span className="text-sm font-bold truncate" style={{ color: isAlert ? P.red : P.text }}>{site.name}</span>
            </div>
            {/* Progress + Payment bars */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 flex-1">
                <span style={{ fontSize: 10, color: P.muted, width: 28 }}>進捗</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: P.bg }}>
                  <div className="h-full rounded-full" style={{ width: `${site.progressPct}%`, background: P.blue }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: P.sub }}>{site.progressPct}%</span>
              </div>
              <div className="flex items-center gap-1.5 flex-1">
                <span style={{ fontSize: 10, color: P.muted, width: 28 }}>入金</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: P.bg }}>
                  <div className="h-full rounded-full" style={{ width: `${paidPct}%`, background: P.green }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: P.sub }}>{paidPct}%</span>
              </div>
            </div>
          </div>

          {/* Numbers */}
          <div className="flex-shrink-0 text-right flex items-center gap-4">
            <div>
              <p style={{ fontSize: 11, color: P.muted }}>契約額</p>
              <p className="font-bold" style={{ fontSize: 14, color: P.text }}>{fmt(site.contractAmount)}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: P.muted }}>原価</p>
              <p className="font-bold" style={{ fontSize: 14, color: costRate > COST_ALERT_RATE ? P.red : P.orange }}>{fmt(site.totalCost)}</p>
            </div>
            <div style={{ minWidth: 48 }}>
              <p style={{ fontSize: 11, color: P.muted }}>粗利率</p>
              <p className="font-bold" style={{ fontSize: 14, color: rColor }}>
                {site.profitRate != null && site.paidAmount > 0 ? `${site.profitRate}%` : "—"}
              </p>
            </div>
            <ChevronDown size={14} style={{ color: P.muted, transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }} />
          </div>
        </div>
      </button>

      {/* Drill-down */}
      {open && (
        <div className="px-8 pb-4" style={{ paddingLeft: 56 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {[
              { label: "契約金額", value: fmtFull(site.contractAmount), color: P.text },
              { label: "入金済み", value: fmtFull(site.paidAmount), color: P.green },
              { label: "未入金残高", value: fmtFull(site.remainingAmount), color: site.remainingAmount > 0 ? P.orange : P.muted },
              { label: "原価合計", value: fmtFull(site.totalCost), color: costRate > COST_ALERT_RATE ? P.red : P.orange },
            ].map(item => (
              <div key={item.label} className="rounded-lg p-3" style={{ background: P.bg, border: `1px solid ${P.borderLight}` }}>
                <p style={{ fontSize: 11, color: P.muted, marginBottom: 2 }}>{item.label}</p>
                <p className="font-bold" style={{ fontSize: 15, color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "粗利益", value: fmtFull(site.profit), color: site.profit >= 0 ? P.green : P.red },
              { label: "粗利率", value: site.profitRate != null ? `${site.profitRate}%` : "—", color: rColor },
              { label: "原価率", value: `${costRate}%`, color: costRate > COST_ALERT_RATE ? P.red : P.sub },
              { label: "進捗率", value: `${site.progressPct}%`, color: P.blue },
            ].map(item => (
              <div key={item.label} className="rounded-lg p-3" style={{ background: P.bg, border: `1px solid ${P.borderLight}` }}>
                <p style={{ fontSize: 11, color: P.muted, marginBottom: 2 }}>{item.label}</p>
                <p className="font-bold" style={{ fontSize: 15, color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link href={`/kaitai/sites/${site.id}`} className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: P.blue }}>
              現場詳細を開く <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cost category colors ───────────────────────────────────────────────────
const COST_COLORS: Record<string, string> = {
  "産廃処分費": "#EF4444",
  "燃料費": "#F87171",
  "交通費": "#A78BFA",
  "資材購入": "#FB923C",
  "工具・消耗品": "#FBBF24",
  "食費・雑費": "#94A3B8",
  "その他": "#CBD5E1",
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const now = new Date();
  const [mode, setMode] = useState<ViewMode>("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [sortBy, setSortBy] = useState<"profitRate" | "profitAmt">("profitRate");
  const [showPicker, setShowPicker] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);

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
      .then(data => {
        if (data?.ok) {
          setFinance(data);
          // If all zeros use mock for dev visualization
          const isEmpty = data.sites.length === 0 && (data.totals.contractAmount ?? 0) === 0;
          setUseMock(isEmpty);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mode, year, month]);

  const fd = useMock ? generateMockData() : finance;
  const t = fd?.totals;
  const sites = fd?.sites ?? [];
  const prevT = fd?.prevTotals ?? null;

  const rankedSites = useMemo(() => {
    const withProfit = sites.map(s => {
      const totalCost = s.expenseTotal + s.costAmount;
      const profit = s.paidAmount - totalCost;
      const profitRate = s.paidAmount > 0 ? Math.round((profit / s.paidAmount) * 100) : (s.contractAmount > 0 ? null : 0);
      return { ...s, totalCost, profit, profitRate };
    }).filter(s => s.contractAmount > 0);

    return [...withProfit].sort((a, b) => {
      if (sortBy === "profitRate") return (b.profitRate ?? 100) - (a.profitRate ?? 100);
      return b.profit - a.profit;
    });
  }, [sites, sortBy]);

  // Alert sites
  const alertSites = rankedSites.filter(s => {
    if (s.contractAmount === 0) return false;
    const costRate = Math.round((s.totalCost / s.contractAmount) * 100);
    return costRate > COST_ALERT_RATE || (s.profitRate != null && s.profitRate < 0);
  });

  const warningSites = rankedSites.filter(s => {
    if (alertSites.some(a => a.id === s.id)) return false;
    return s.profitRate != null && s.paidAmount > 0 && s.profitRate < 20;
  });

  const periodLabel = mode === "year" ? `${year}年 年間` : `${year}年${month}月`;

  // Cost pie
  const expenseCats = fd?.expenseByCategory ?? {};
  const pieSlices = Object.entries(expenseCats)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({ value: amount, color: COST_COLORS[cat] ?? "#94A3B8", label: cat }));

  const totalCost = t?.totalCost ?? 0;
  const profit = (t?.paidAmount ?? 0) - totalCost;
  const profitRate = (t?.paidAmount ?? 0) > 0 ? Math.round((profit / (t?.paidAmount ?? 1)) * 1000) / 10 : 0;

  // Quick period buttons
  const currentYear = now.getFullYear();
  const quickPeriods = [
    { label: "今月", action: () => { setMode("month"); setYear(currentYear); setMonth(now.getMonth() + 1); setShowPicker(false); } },
    { label: "先月", action: () => { const pm = now.getMonth() === 0 ? 12 : now.getMonth(); const py = now.getMonth() === 0 ? currentYear - 1 : currentYear; setMode("month"); setYear(py); setMonth(pm); setShowPicker(false); } },
    { label: "今年度", action: () => { setMode("year"); setYear(currentYear); setShowPicker(false); } },
  ];

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${P.border}`, borderTopColor: P.blue, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 14, color: P.muted }}>データを読み込み中...</p>
      </div>
    );
  }

  // No data & no mock
  if (!fd) {
    return (
      <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">
        <h1 className="text-2xl font-bold" style={{ color: P.text }}>経営分析</h1>
        <div className="flex flex-col items-center justify-center py-20 gap-4" style={{ background: P.white, borderRadius: 16, border: `1.5px dashed ${P.border}` }}>
          <BarChart2 size={48} style={{ color: P.muted }} />
          <p style={{ fontSize: 18, fontWeight: 800, color: P.sub }}>まだデータがありません</p>
          <Link href="/kaitai/admin/projects" className="px-5 py-3 rounded-xl font-bold text-sm" style={{ background: P.blue, color: "#FFF" }}>
            現場を登録する
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-5 flex flex-col gap-5 pb-28 md:pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 style={{ fontSize: 22, fontWeight: 800, color: P.text, letterSpacing: "-0.02em" }}>経営分析</h1>
          <button onClick={() => setShowHelp(h => !h)} className="relative" style={{ color: P.muted }}>
            <HelpCircle size={18} />
            {showHelp && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowHelp(false)} />
                <div className="absolute left-0 top-full mt-2 z-50 p-4 rounded-xl w-80" style={{ background: P.white, border: `1px solid ${P.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                  <p className="text-sm font-bold mb-2" style={{ color: P.text }}>収支計上の仕組み</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { n: "1", c: P.blue, t: "契約金額の登録 → 見込み受注額として計上" },
                      { n: "2", c: P.green, t: "入金の登録 → 売上額へ移動" },
                      { n: "3", c: P.orange, t: "経費報告 → リアルタイムに原価計上" },
                    ].map(item => (
                      <div key={item.n} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${item.c}15`, marginTop: 1 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: item.c }}>{item.n}</span>
                        </div>
                        <p style={{ fontSize: 12, color: P.sub, lineHeight: 1.4 }}>{item.t}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </button>
          {useMock && (
            <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: P.orangeLt, color: P.orange }}>
              デモデータ表示中
            </span>
          )}
        </div>

        {/* Period picker */}
        <div className="relative flex items-center gap-2">
          {quickPeriods.map(q => (
            <button key={q.label} onClick={q.action}
              className="hidden md:block px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: P.bg, color: P.sub, border: `1px solid ${P.border}` }}>
              {q.label}
            </button>
          ))}
          <button
            onClick={() => setShowPicker(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm"
            style={{ background: P.white, border: `1px solid ${P.border}`, color: P.text }}
          >
            <Calendar size={15} style={{ color: P.blue }} />
            {periodLabel}
          </button>
          {showPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 p-4 rounded-xl" style={{ background: P.white, border: `1px solid ${P.border}`, width: 320, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                {/* Mode toggle */}
                <div className="flex gap-1 p-1 rounded-lg mb-3" style={{ background: P.bg }}>
                  {(["month", "year"] as const).map(m => (
                    <button key={m} onClick={() => setMode(m)}
                      className="flex-1 px-3 py-1.5 rounded-md text-sm font-bold transition-all"
                      style={mode === m ? { background: P.blue, color: "#FFF" } : { color: P.sub }}>
                      {m === "month" ? "月別" : "年間"}
                    </button>
                  ))}
                </div>
                {/* Year */}
                <div className="flex items-center justify-center gap-3 mb-3">
                  <button onClick={() => setYear(year - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ border: `1px solid ${P.border}`, color: P.sub }}>
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: 16, fontWeight: 800, color: P.text }}>{year}年</span>
                  <button onClick={() => setYear(Math.min(year + 1, currentYear))} disabled={year >= currentYear}
                    className="w-8 h-8 flex items-center justify-center rounded-lg"
                    style={{ border: `1px solid ${P.border}`, color: year >= currentYear ? P.muted : P.sub, opacity: year >= currentYear ? 0.4 : 1 }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                {/* Months */}
                {mode === "month" && (
                  <div className="grid grid-cols-6 gap-1 mb-3">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                      const isFuture = year === currentYear && m > now.getMonth() + 1;
                      return (
                        <button key={m} onClick={() => { if (!isFuture) { setMonth(m); setShowPicker(false); } }} disabled={isFuture}
                          className="py-2 rounded-md text-sm font-bold transition-all"
                          style={month === m ? { background: P.blue, color: "#FFF" } : isFuture ? { color: P.muted, opacity: 0.3 } : { color: P.sub, background: P.bg }}>
                          {m}月
                        </button>
                      );
                    })}
                  </div>
                )}
                {/* Quick links */}
                <div className="flex gap-1.5">
                  {quickPeriods.map(q => (
                    <button key={q.label} onClick={q.action} className="flex-1 py-2 rounded-md text-xs font-bold" style={{ background: P.bg, color: P.sub }}>
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Alert banner ── */}
      {(alertSites.length > 0 || warningSites.length > 0) && (
        <div className="flex flex-col gap-2">
          {alertSites.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: P.redLt, border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={18} style={{ color: P.red, flexShrink: 0 }} />
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: P.red }}>原価率超過（{COST_ALERT_RATE}%以上）</p>
                <p className="text-xs mt-0.5" style={{ color: P.sub }}>{alertSites.map(s => s.name).join("、")}</p>
              </div>
            </div>
          )}
          {warningSites.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: P.orangeLt, border: "1px solid rgba(249,115,22,0.15)" }}>
              <AlertTriangle size={18} style={{ color: P.orange, flexShrink: 0 }} />
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: P.orange }}>粗利率 低水準（20%以下）</p>
                <p className="text-xs mt-0.5" style={{ color: P.sub }}>{warningSites.map(s => s.name).join("、")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          icon={<Building2 size={18} style={{ color: P.blue }} />}
          iconBg={P.blueLt} label="見込み受注残"
          value={fmt(t?.contractAmount ?? 0)}
          sub={`${fd?.activeSiteCount ?? 0}現場稼働中 / 全${fd?.totalSiteCount ?? 0}現場`}
          color={P.blue}
          trend={prevT ? trendPct(t?.contractAmount ?? 0, prevT.contractAmount) : null}
        />
        <KPICard
          icon={<Wallet size={18} style={{ color: P.green }} />}
          iconBg={P.greenLt} label="当月確定売上"
          value={fmt(t?.paidAmount ?? 0)}
          sub={`入金率 ${t && t.contractAmount > 0 ? Math.round((t.paidAmount / t.contractAmount) * 100) : 0}%`}
          color={P.green}
          trend={prevT ? trendPct(t?.paidAmount ?? 0, prevT.paidAmount) : null}
        />
        <KPICard
          icon={<Activity size={18} style={{ color: profit >= 0 ? P.green : P.red }} />}
          iconBg={profit >= 0 ? P.greenLt : P.redLt}
          label={`粗利 · 粗利率 ${profitRate}%`}
          value={fmt(profit)}
          sub={`原価 ${fmt(totalCost)}`}
          color={profit >= 0 ? P.green : P.red}
          trend={prevT ? trendPct(profit, prevT.profit) : null}
        />
        <KPICard
          icon={<AlertCircle size={18} style={{ color: (t?.remainingAmount ?? 0) > 0 ? P.orange : P.green }} />}
          iconBg={(t?.remainingAmount ?? 0) > 0 ? P.orangeLt : P.greenLt}
          label="未回収金"
          value={fmt(t?.remainingAmount ?? 0)}
          sub={(t?.remainingAmount ?? 0) > 0 ? `${rankedSites.filter(s => s.remainingAmount > 0).length}現場に未入金残` : "全額回収済み"}
          color={(t?.remainingAmount ?? 0) > 0 ? P.orange : P.green}
          isAlert={(t?.remainingAmount ?? 0) > 0 && rankedSites.some(s => s.remainingAmount > 0 && s.progressPct >= 90)}
        />
      </div>

      {/* ── Chart Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Monthly trend chart (3/5) */}
        <div className="lg:col-span-3 rounded-xl p-5" style={{ background: P.white, border: `1px solid ${P.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} style={{ color: P.blue }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: P.text }}>月次推移</span>
            </div>
            <span style={{ fontSize: 12, color: P.muted }}>過去6ヶ月</span>
          </div>
          <MonthlyChart data={fd?.monthlyData ?? {}} />
        </div>

        {/* Donut chart (2/5) */}
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: P.white, border: `1px solid ${P.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} style={{ color: P.orange }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: P.text }}>原価構造</span>
          </div>
          {pieSlices.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <DonutChart slices={pieSlices} size={180} outerR={80} innerR={52} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p style={{ fontSize: 11, color: P.muted }}>原価合計</p>
                  <p className="font-bold" style={{ fontSize: 16, color: P.text }}>{fmt(totalCost)}</p>
                </div>
              </div>
              <div className="w-full flex flex-col gap-2">
                {pieSlices.map(({ label, value, color }) => {
                  const pct = totalCost > 0 ? Math.round((value / totalCost) * 100) : 0;
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                      <span className="text-xs flex-1" style={{ color: P.sub }}>{label}</span>
                      <span className="text-xs font-bold" style={{ color: P.muted }}>{fmt(value)}</span>
                      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center" style={{ color: P.muted, fontSize: 13 }}>
              経費データがまだありません
            </div>
          )}
        </div>
      </div>

      {/* ── Site List ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: P.white, border: `1px solid ${P.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ background: P.bg, borderBottom: `1px solid ${P.border}` }}>
          <div className="flex items-center gap-2">
            <Receipt size={14} style={{ color: P.blue }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: P.text }}>現場別収支一覧</span>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: P.blueLt, color: P.blue }}>
              {rankedSites.length}現場
            </span>
          </div>
          <button
            onClick={() => setSortBy(s => s === "profitRate" ? "profitAmt" : "profitRate")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: P.white, border: `1px solid ${P.border}`, color: P.sub }}
          >
            <ArrowUpDown size={12} />
            {sortBy === "profitRate" ? "利益率順" : "利益額順"}
          </button>
        </div>

        {rankedSites.length === 0 ? (
          <div className="py-16 text-center" style={{ color: P.muted, fontSize: 14 }}>
            契約金額が登録された現場がありません
          </div>
        ) : (
          rankedSites.map((site, rank) => (
            <SiteRow key={site.id} site={site} rank={rank} />
          ))
        )}
      </div>
    </div>
  );
}
