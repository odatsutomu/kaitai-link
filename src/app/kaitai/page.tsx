"use client";

import Link from "next/link";
import {
  MapPin, TrendingUp, Users, Plus, Calendar,
  HardHat, CheckCircle2, Clock, BarChart3,
  ArrowRight, ChevronRight,
} from "lucide-react";
import { KaitaiLogo } from "./components/kaitai-logo";

// ─── 型定義・モックデータ ──────────────────────────────────────────────────────

type SiteStatus = "着工前" | "解体中" | "完工";

const mockSites = [
  {
    id: "s1", name: "山田邸解体工事",
    address: "東京都世田谷区豪徳寺 2-14-5",
    status: "解体中" as SiteStatus,
    endDate: "2026-04-10",
    progressPct: 68, todayWorkers: 4, hasWorkToday: true,
    contract: 3_200_000, cost: 1_840_000,
    breakdown: { waste: 520_000, labor: 980_000, other: 340_000 },
  },
  {
    id: "s2", name: "旧田中倉庫解体",
    address: "神奈川県川崎市幸区堀川町 580",
    status: "解体中" as SiteStatus,
    endDate: "2026-04-20",
    progressPct: 42, todayWorkers: 6, hasWorkToday: false,
    contract: 5_600_000, cost: 2_100_000,
    breakdown: { waste: 780_000, labor: 1_050_000, other: 270_000 },
  },
  {
    id: "s3", name: "松本アパート解体",
    address: "埼玉県さいたま市浦和区常盤 6-4-21",
    status: "着工前" as SiteStatus,
    endDate: "2026-04-30",
    progressPct: 0, todayWorkers: 0, hasWorkToday: false,
    contract: 2_800_000, cost: 0,
    breakdown: { waste: 0, labor: 0, other: 0 },
  },
  {
    id: "s4", name: "旧工場棟解体（第1期）",
    address: "千葉県船橋市本町 2-7-3",
    status: "完工" as SiteStatus,
    endDate: "2026-03-20",
    progressPct: 100, todayWorkers: 0, hasWorkToday: false,
    contract: 8_400_000, cost: 6_100_000,
    breakdown: { waste: 1_920_000, labor: 2_850_000, other: 1_330_000 },
  },
];

// ─── デザイントークン ─────────────────────────────────────────────────────────

const STATUS_STYLE: Record<SiteStatus, { bg: string; text: string; dot: string }> = {
  着工前: { bg: "#EEF2FF", text: "#4338CA", dot: "#818CF8" },
  解体中: { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
  完工:   { bg: "#F0FDF4", text: "#166534", dot: "#22C55E" },
};

const fmt万 = (n: number) => `¥${(n / 10_000).toFixed(0)}万`;

// ─── 小コンポーネント ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SiteStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {status}
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E9EF" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: pct === 100 ? "#22C55E" : "#F59E0B" }}
        />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", width: 28, textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
}

function CostBar({ contract, breakdown }: {
  contract: number;
  breakdown: { waste: number; labor: number; other: number };
}) {
  const total = breakdown.waste + breakdown.labor + breakdown.other;
  if (total === 0) return <span style={{ fontSize: 11, color: "#9CA3AF" }}>原価未入力</span>;
  const pct = (n: number) => `${Math.round((n / contract) * 100)}%`;
  return (
    <div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        <div style={{ width: pct(breakdown.waste), background: "#EF4444" }} />
        <div style={{ width: pct(breakdown.labor), background: "#3B82F6" }} />
        <div style={{ width: pct(breakdown.other), background: "#94A3B8" }} />
        <div style={{ flex: 1, background: "#E5E9EF" }} />
      </div>
      <div className="flex items-center gap-3 mt-1">
        {[
          { color: "#EF4444", label: "産廃", val: breakdown.waste },
          { color: "#3B82F6", label: "労務", val: breakdown.labor },
          { color: "#94A3B8", label: "その他", val: breakdown.other },
        ].map(({ color, label, val }) => (
          <div key={label} className="flex items-center gap-1">
            <div style={{ width: 6, height: 6, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>{label} {fmt万(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 現場カード ───────────────────────────────────────────────────────────────

function SiteCard({ site }: { site: typeof mockSites[0] }) {
  const profit = site.cost > 0 ? site.contract - site.cost : null;
  const profitPct = profit !== null
    ? Math.round((profit / site.contract) * 100) : null;

  return (
    <div
      className="bg-white rounded-xl flex flex-col"
      style={{ border: "1px solid #E5E9EF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      {/* ヘッダー */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusBadge status={site.status} />
              {site.hasWorkToday && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                  style={{ background: "#F0FDF4", color: "#166534" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  本日稼働中
                </span>
              )}
            </div>
            <h3 className="font-semibold leading-snug" style={{ fontSize: 15, color: "#111827" }}>
              {site.name}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>{site.address}</p>
            </div>
          </div>
          <Link href={`/kaitai/site/${site.id}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, fontWeight: 500, color: "#374151" }}>
            詳細 <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* ボディ */}
      <div className="px-5 py-4 flex flex-col gap-3 flex-1">
        {/* 進捗 */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span style={{ fontSize: 11, color: "#6B7280" }}>工事進捗</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
              完工予定 {site.endDate.replace(/-/g, "/")}
            </span>
          </div>
          <ProgressBar pct={site.progressPct} />
        </div>

        {/* 原価バー */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span style={{ fontSize: 11, color: "#6B7280" }}>原価内訳</span>
            <span style={{ fontSize: 11, color: "#374151" }}>
              {site.cost > 0 ? `${fmt万(site.cost)} / ${fmt万(site.contract)}` : fmt万(site.contract)}
            </span>
          </div>
          <CostBar contract={site.contract} breakdown={site.breakdown} />
        </div>
      </div>

      {/* フッター */}
      <div
        className="flex items-center justify-between px-5 py-3 rounded-b-xl"
        style={{ background: "#F8FAFC", borderTop: "1px solid #F1F5F9" }}
      >
        <div className="flex items-center gap-1.5">
          <Users size={13} style={{ color: "#6B7280" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            {site.todayWorkers}名
          </span>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>本日</span>
        </div>
        {profitPct !== null && (
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold"
            style={{
              background: profitPct >= 25 ? "#F0FDF4" : profitPct >= 10 ? "#FFFBEB" : "#FEF2F2",
              color: profitPct >= 25 ? "#166534" : profitPct >= 10 ? "#92400E" : "#991B1B",
              border: `1px solid ${profitPct >= 25 ? "#BBF7D0" : profitPct >= 10 ? "#FDE68A" : "#FECACA"}`,
            }}
          >
            <TrendingUp size={11} />
            粗利 {profitPct}%
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ページ本体 ───────────────────────────────────────────────────────────────

export default function KaitaiHome() {
  const now = new Date();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${weekdays[now.getDay()]}）`;

  const activeSites   = mockSites.filter(s => s.status === "解体中");
  const upcomingSites = mockSites.filter(s => s.status === "着工前");
  const doneSites     = mockSites.filter(s => s.status === "完工");
  const totalWorkers  = activeSites.reduce((s, x) => s + x.todayWorkers, 0);
  const totalContract = mockSites.reduce((s, x) => s + x.contract, 0);
  const totalCost     = mockSites.reduce((s, x) => s + x.cost, 0);
  const grossMargin   = totalContract > 0
    ? Math.round(((totalContract - totalCost) / totalContract) * 100) : 0;

  const kpis = [
    { icon: HardHat,      label: "稼働現場",   value: activeSites.length,   unit: "件", color: "#D97706" },
    { icon: Users,        label: "本日作業員", value: totalWorkers,          unit: "名", color: "#2563EB" },
    { icon: Clock,        label: "着工前",     value: upcomingSites.length,  unit: "件", color: "#7C3AED" },
    { icon: CheckCircle2, label: "今月完工",   value: doneSites.length,      unit: "件", color: "#059669" },
    { icon: BarChart3,    label: "平均粗利率", value: grossMargin,           unit: "%",  color: "#0891B2" },
  ];

  return (
    <div className="flex flex-col">

      {/* ── モバイルヘッダー ────────────────────── */}
      <header className="md:hidden px-5 pt-10 pb-4 flex items-center justify-between bg-white"
        style={{ borderBottom: "1px solid #E5E9EF" }}>
        <KaitaiLogo iconSize={32} textSize={20} />
        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{dateStr}</span>
      </header>

      {/* ── PC ページヘッダー ───────────────────── */}
      <div className="hidden md:flex items-center justify-between px-8 py-4 bg-white"
        style={{ borderBottom: "1px solid #E5E9EF" }}>
        <div>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 2 }}>{dateStr}</p>
          <p style={{ fontSize: 12, color: "#6B7280" }}>
            稼働現場 <strong style={{ color: "#111827" }}>{activeSites.length}件</strong> ／
            本日作業員 <strong style={{ color: "#111827" }}>{totalWorkers}名</strong>
          </p>
        </div>
        <Link href="/kaitai/sites/new">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "#D97706", boxShadow: "0 1px 4px rgba(217,119,6,0.3)" }}>
            <Plus size={14} /> 新規現場登録
          </button>
        </Link>
      </div>

      {/* ── KPI サマリー ────────────────────────── */}
      <div className="px-4 md:px-8 pt-5 pb-4">
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {kpis.map(({ icon: Icon, label, value, unit, color }) => (
            <div key={label} className="bg-white rounded-xl p-4"
              style={{ border: "1px solid #E5E9EF", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: color + "14" }}>
                  <Icon size={14} style={{ color }} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 11, color: "#6B7280" }}>{label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span style={{ fontSize: 24, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── メインコンテンツ（3カラムグリッド） ── */}
      <div className="px-4 md:px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* 左カラム：稼働中の現場（lg:2/3） */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* セクションタイトル */}
          {activeSites.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="flex items-center gap-2 font-semibold"
                  style={{ fontSize: 13, color: "#374151" }}>
                  <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#F59E0B" }} />
                  稼働中の現場
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ background: "#FFFBEB", color: "#92400E" }}>
                    {activeSites.length}件
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSites.map(site => <SiteCard key={site.id} site={site} />)}
              </div>
            </div>
          )}

          {/* 着工前（モバイルではこちらにも表示） */}
          {upcomingSites.length > 0 && (
            <div className="lg:hidden">
              <h2 className="flex items-center gap-2 font-semibold mb-3"
                style={{ fontSize: 13, color: "#374151" }}>
                <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#818CF8" }} />
                着工前
                <span className="px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{ background: "#EEF2FF", color: "#4338CA" }}>
                  {upcomingSites.length}件
                </span>
              </h2>
              <div className="flex flex-col gap-2">
                {upcomingSites.map(site => (
                  <Link key={site.id} href={`/kaitai/site/${site.id}`}>
                    <div className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl"
                      style={{ border: "1px solid #E5E9EF" }}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" style={{ fontSize: 14, color: "#111827" }}>{site.name}</p>
                        <p style={{ fontSize: 12, color: "#9CA3AF" }}>着工 {site.endDate.replace(/-/g, "/")}</p>
                      </div>
                      <ArrowRight size={14} style={{ color: "#9CA3AF" }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右カラム（lg:1/3） */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          {/* 月次収支 */}
          <div className="bg-white rounded-xl" style={{ border: "1px solid #E5E9EF", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid #F1F5F9" }}>
              <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: 13, color: "#374151" }}>
                <BarChart3 size={14} style={{ color: "#D97706" }} />
                月次収支サマリー
              </h3>
              <Link href="/kaitai/admin"
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: "#D97706" }}>
                詳細 <ArrowRight size={11} />
              </Link>
            </div>
            <div className="px-5 py-4 flex flex-col gap-0">
              {[
                { label: "受注総額", value: fmt万(totalContract), color: "#1D4ED8" },
                { label: "原価合計", value: fmt万(totalCost),     color: "#DC2626" },
                { label: "粗利合計", value: fmt万(totalContract - totalCost), color: "#059669" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2.5"
                  style={{ borderBottom: "1px solid #F8FAFC" }}>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>粗利率</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: "#059669" }}>{grossMargin}%</span>
              </div>
            </div>
          </div>

          {/* 着工前 */}
          {upcomingSites.length > 0 && (
            <div className="bg-white rounded-xl" style={{ border: "1px solid #E5E9EF" }}>
              <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: "1px solid #F1F5F9" }}>
                <Clock size={13} style={{ color: "#818CF8" }} />
                <h3 className="font-semibold" style={{ fontSize: 13, color: "#374151" }}>
                  着工前 <span className="font-normal text-xs ml-1" style={{ color: "#9CA3AF" }}>{upcomingSites.length}件</span>
                </h3>
              </div>
              <div className="px-3 py-2 flex flex-col gap-0.5">
                {upcomingSites.map(site => (
                  <Link key={site.id} href={`/kaitai/site/${site.id}`}>
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium truncate" style={{ fontSize: 13, color: "#111827" }}>{site.name}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{site.endDate.replace(/-/g, "/")}</p>
                      </div>
                      <ChevronRight size={13} style={{ color: "#CBD5E1" }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 完工済 */}
          {doneSites.length > 0 && (
            <div className="bg-white rounded-xl" style={{ border: "1px solid #E5E9EF" }}>
              <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: "1px solid #F1F5F9" }}>
                <CheckCircle2 size={13} style={{ color: "#22C55E" }} />
                <h3 className="font-semibold" style={{ fontSize: 13, color: "#374151" }}>
                  完工済 <span className="font-normal text-xs ml-1" style={{ color: "#9CA3AF" }}>{doneSites.length}件</span>
                </h3>
              </div>
              <div className="px-3 py-2 flex flex-col gap-0.5">
                {doneSites.map(site => {
                  const pct = Math.round(((site.contract - site.cost) / site.contract) * 100);
                  return (
                    <Link key={site.id} href={`/kaitai/site/${site.id}`}>
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-medium truncate" style={{ fontSize: 13, color: "#6B7280" }}>{site.name}</p>
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{site.endDate.replace(/-/g, "/")} · 粗利 {pct}%</p>
                        </div>
                        <TrendingUp size={13} style={{ color: pct >= 20 ? "#22C55E" : "#D1D5DB" }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
