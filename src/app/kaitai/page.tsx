"use client";

import Link from "next/link";
import { MapPin, TrendingUp, Users, Eye, Plus, Calendar, BarChart2 } from "lucide-react";
import { KaitaiLogo } from "./components/kaitai-logo";

// ─── Mock data ────────────────────────────────────────────────────────────────

type SiteStatus = "着工前" | "解体中" | "完工";

const mockSites = [
  {
    id: "s1", name: "山田邸解体工事",
    address: "東京都世田谷区豪徳寺2-14-5",
    status: "解体中" as SiteStatus,
    endDate: "2026-04-10",
    progressPct: 68, todayWorkers: 4, hasWorkToday: true,
    contract: 3_200_000, cost: 1_840_000,
    breakdown: { waste: 520_000, labor: 980_000, other: 340_000 },
  },
  {
    id: "s2", name: "旧田中倉庫解体",
    address: "神奈川県川崎市幸区堀川町580",
    status: "解体中" as SiteStatus,
    endDate: "2026-04-20",
    progressPct: 42, todayWorkers: 6, hasWorkToday: false,
    contract: 5_600_000, cost: 2_100_000,
    breakdown: { waste: 780_000, labor: 1_050_000, other: 270_000 },
  },
  {
    id: "s3", name: "松本アパート解体",
    address: "埼玉県さいたま市浦和区常盤6-4-21",
    status: "着工前" as SiteStatus,
    endDate: "2026-04-30",
    progressPct: 0, todayWorkers: 0, hasWorkToday: false,
    contract: 2_800_000, cost: 0,
    breakdown: { waste: 0, labor: 0, other: 0 },
  },
  {
    id: "s4", name: "旧工場棟解体（第1期）",
    address: "千葉県船橋市本町2-7-3",
    status: "完工" as SiteStatus,
    endDate: "2026-03-20",
    progressPct: 100, todayWorkers: 0, hasWorkToday: false,
    contract: 8_400_000, cost: 6_100_000,
    breakdown: { waste: 1_920_000, labor: 2_850_000, other: 1_330_000 },
  },
];

const STATUS: Record<SiteStatus, { bg: string; fg: string; border: string }> = {
  着工前: { bg: "#EDE9FE", fg: "#4C1D95", border: "#C4B5FD" },
  解体中: { bg: "#FFF3E0", fg: "#B45309", border: "#FCD34D" },
  完工:   { bg: "#DCFCE7", fg: "#15803D", border: "#86EFAC" },
};

// ─── Cost bar ─────────────────────────────────────────────────────────────────

function CostBar({ contract, breakdown }: {
  contract: number;
  breakdown: { waste: number; labor: number; other: number };
}) {
  const total = breakdown.waste + breakdown.labor + breakdown.other;
  if (total === 0) return null;
  const pct = (n: number) => `${Math.round((n / contract) * 100)}%`;
  return (
    <div>
      <div className="flex justify-between mb-1" style={{ fontSize: 12, color: "#888" }}>
        <span>原価内訳</span>
        <span style={{ fontWeight: 700, color: "#111" }}>
          ¥{(total / 10_000).toFixed(0)}万 / ¥{(contract / 10_000).toFixed(0)}万
        </span>
      </div>
      <div className="flex rounded-full overflow-hidden h-3">
        <div style={{ width: pct(breakdown.waste), background: "#EF4444" }} />
        <div style={{ width: pct(breakdown.labor), background: "#1565C0" }} />
        <div style={{ width: pct(breakdown.other), background: "#78909C" }} />
        <div style={{ flex: 1, background: "#EEEEEE" }} />
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        {[
          { color: "#EF4444", label: "産廃", val: breakdown.waste },
          { color: "#1565C0", label: "労務", val: breakdown.labor },
          { color: "#78909C", label: "その他", val: breakdown.other },
        ].map(({ color, label, val }) => (
          <div key={label} className="flex items-center gap-1">
            <div style={{ width: 7, height: 7, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 10, color: "#888" }}>{label} ¥{(val / 10_000).toFixed(0)}万</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Site card (shared, adapts to container width) ────────────────────────────

function SiteCard({ site }: { site: typeof mockSites[0] }) {
  const cfg = STATUS[site.status];
  const profitPct = site.cost > 0
    ? Math.round(((site.contract - site.cost) / site.contract) * 100)
    : null;

  return (
    <div
      className="rounded-2xl flex flex-col h-full"
      style={{ background: "#FFFFFF", border: "1.5px solid #E0E0E0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    >
      {/* Top */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.fg, border: `1px solid ${cfg.border}` }}>
              {site.status}
            </span>
            {site.hasWorkToday && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#E8F5E9", color: "#2E7D32", border: "1px solid #A5D6A7" }}>
                🟢 稼働中
              </span>
            )}
          </div>
          <h3 className="font-black leading-tight mb-1.5" style={{ fontSize: 17, color: "#111111" }}>
            {site.name}
          </h3>
          <div className="flex items-start gap-1">
            <MapPin size={12} style={{ color: "#999", marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.4 }}>{site.address}</p>
          </div>
        </div>
        <Link href={`/kaitai/site/${site.id}`} className="flex-shrink-0">
          <div className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: "#F5F5F5", border: "1px solid #DDD", color: "#444" }}>
            詳細
          </div>
        </Link>
      </div>

      {/* Progress */}
      {site.progressPct > 0 && (
        <div className="px-5 pb-3">
          <div className="flex justify-between mb-1" style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>
            <span>工事進捗</span>
            <span style={{ color: "#FF9800", fontWeight: 800 }}>{site.progressPct}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#EEE" }}>
            <div className="h-full rounded-full"
              style={{ width: `${site.progressPct}%`, background: "linear-gradient(90deg,#FF9800,#FFC107)" }} />
          </div>
        </div>
      )}

      {/* Cost bar */}
      <div className="px-5 pb-4 flex-1">
        <CostBar contract={site.contract} breakdown={site.breakdown} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 rounded-b-2xl"
        style={{ background: "#F9F9F9", borderTop: "1.5px solid #EEE" }}>
        <div className="flex items-center gap-1.5">
          <Users size={14} style={{ color: "#1565C0" }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{site.todayWorkers}名</span>
          <span style={{ fontSize: 12, color: "#888" }}>本日</span>
        </div>
        <div style={{ fontSize: 12, color: "#888" }}>
          {site.endDate.replace(/-/g, "/")}まで
        </div>
        {profitPct !== null && (
          <div className="px-2 py-0.5 rounded-lg text-xs font-bold"
            style={{
              background: profitPct >= 25 ? "#E8F5E9" : profitPct >= 10 ? "#FFF3E0" : "#FFEBEE",
              color: profitPct >= 25 ? "#2E7D32" : profitPct >= 10 ? "#B45309" : "#C62828",
            }}>
            粗利 {profitPct}%
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KaitaiHome() {
  const now = new Date();
  const month  = now.getMonth() + 1;
  const day    = now.getDate();
  const weekday = ["日","月","火","水","木","金","土"][now.getDay()];

  const activeSites   = mockSites.filter(s => s.status === "解体中");
  const upcomingSites = mockSites.filter(s => s.status === "着工前");
  const doneSites     = mockSites.filter(s => s.status === "完工");
  const totalWorkers  = activeSites.reduce((s, x) => s + x.todayWorkers, 0);
  const totalContract = mockSites.reduce((s, x) => s + x.contract, 0);
  const totalCost     = mockSites.reduce((s, x) => s + x.cost, 0);
  const grossMargin   = totalContract > 0
    ? Math.round(((totalContract - totalCost) / totalContract) * 100) : 0;

  return (
    <div className="flex flex-col">

      {/* ── Mobile header（md+ではトップバーが代わり）────── */}
      <header
        className="md:hidden px-5 pt-10 pb-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "2px solid #EEEEEE" }}
      >
        <KaitaiLogo iconSize={36} textSize={22} />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
            style={{ background: "#F0F4FF", border: "1px solid #BBCFFF" }}>
            <Eye size={12} style={{ color: "#1565C0" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#1565C0" }}>閲覧専用</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-xl" style={{ background: "#F5F5F5", border: "1px solid #E0E0E0" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#555" }}>
              {month}月{day}日（{weekday}）
            </span>
          </div>
        </div>
      </header>

      {/* ── PC サブヘッダー（日付・アクション）────────────── */}
      <div className="hidden md:flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid #F0F0F0" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: "#FFF8F0", border: "1px solid #FFD9A8" }}>
            <Calendar size={14} style={{ color: "#FF9800" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#B45309" }}>
              {now.getFullYear()}年{month}月{day}日（{weekday}）
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: "#F0F4FF", border: "1px solid #BBCFFF" }}>
            <Eye size={13} style={{ color: "#1565C0" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1565C0" }}>閲覧専用モード</span>
          </div>
        </div>
        <Link href="/kaitai/sites/new">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: "#FF9800", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(255,152,0,0.35)" }}>
            <Plus size={15} />新規現場登録
          </div>
        </Link>
      </div>

      {/* ── KPI サマリー ──────────────────────────────────── */}
      <div className="px-4 md:px-8 pt-5 pb-2">
        {/* モバイル：3列 / PC：5列 */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { icon: "🏗️", label: "稼働現場",    value: `${activeSites.length}件`,  color: "#FF9800",  bg: "#FFF8F0", border: "#FFD9A8" },
            { icon: "👷", label: "本日作業員",  value: `${totalWorkers}名`,         color: "#1565C0",  bg: "#F0F4FF", border: "#BBCFFF" },
            { icon: "📋", label: "着工前",       value: `${upcomingSites.length}件`, color: "#5C6BC0",  bg: "#EDE9FE", border: "#C4B5FD" },
            { icon: "✅", label: "今月完工",     value: `${doneSites.length}件`,     color: "#2E7D32",  bg: "#F0FFF4", border: "#86EFAC" },
            { icon: "📈", label: "平均粗利率",   value: `${grossMargin}%`,           color: "#0D7C5C",  bg: "#ECFDF5", border: "#6EE7B7" },
          ].map(({ icon, label, value, color, bg, border }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
              style={{ background: bg, border: `1.5px solid ${border}` }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <p style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1.1, marginTop: 2 }}>{value}</p>
              <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── メインコンテンツ ─────────────────────────────── */}
      <div className="px-4 md:px-8 flex flex-col gap-6 pt-5 pb-6">

        {/* ── PC: 2カラムレイアウト（左:稼働中、右:着工前+完工） */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 左側：稼働中の現場（lg:2列） */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {activeSites.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-black tracking-widest" style={{ fontSize: 13, color: "#FF9800" }}>
                    ▶ 稼働中の現場（{activeSites.length}件）
                  </p>
                </div>
                {/* 稼働中：モバイル1列 / md:2列（lg:colspanの中なので） */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeSites.map(site => (
                    <SiteCard key={site.id} site={site} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* 右側：着工前 + 完工 + 月次サマリー */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* 月次収支サマリー（PCのみ） */}
            <div className="hidden lg:block rounded-2xl p-5"
              style={{ background: "#FFFBF5", border: "1.5px solid #FFD9A8" }}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} style={{ color: "#FF9800" }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: "#B45309" }}>月次収支サマリー</span>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "受注総額", value: `¥${(totalContract/10_000).toFixed(0)}万`, color: "#1565C0" },
                  { label: "原価合計", value: `¥${(totalCost/10_000).toFixed(0)}万`,     color: "#D32F2F" },
                  { label: "粗利合計", value: `¥${((totalContract-totalCost)/10_000).toFixed(0)}万`, color: "#2E7D32" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-1.5"
                    style={{ borderBottom: "1px solid #FFE8C0" }}>
                    <span style={{ fontSize: 12, color: "#888" }}>{label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color }}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#B45309" }}>粗利率</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#2E7D32" }}>{grossMargin}%</span>
                </div>
              </div>
              <Link href="/kaitai/admin">
                <div className="mt-4 text-center py-2 rounded-xl text-xs font-bold"
                  style={{ background: "#FF9800", color: "#FFF" }}>
                  詳細分析を見る →
                </div>
              </Link>
            </div>

            {/* 着工前 */}
            {upcomingSites.length > 0 && (
              <section>
                <p className="font-black tracking-widest mb-3" style={{ fontSize: 13, color: "#5C6BC0" }}>
                  ▶ 着工前（{upcomingSites.length}件）
                </p>
                <div className="flex flex-col gap-2">
                  {upcomingSites.map(site => (
                    <Link key={site.id} href={`/kaitai/site/${site.id}`}>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl active:scale-[0.99]"
                        style={{ background: "#FFF", border: "1.5px solid #E0E0E0" }}>
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xl"
                          style={{ background: "#EDE9FE" }}>📅</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black truncate" style={{ fontSize: 15, color: "#111" }}>{site.name}</p>
                          <p style={{ fontSize: 12, color: "#888" }}>着工 {site.endDate.replace(/-/g, "/")}</p>
                        </div>
                        <span style={{ fontSize: 13, color: "#5C6BC0", fontWeight: 700 }}>→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 完工済 */}
            {doneSites.length > 0 && (
              <section>
                <p className="font-black tracking-widest mb-3" style={{ fontSize: 13, color: "#888" }}>
                  ▶ 完工済（{doneSites.length}件）
                </p>
                <div className="flex flex-col gap-2">
                  {doneSites.map(site => {
                    const profitPct = Math.round(((site.contract - site.cost) / site.contract) * 100);
                    return (
                      <Link key={site.id} href={`/kaitai/site/${site.id}`}>
                        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                          style={{ background: "#FAFAFA", border: "1.5px solid #E8E8E8" }}>
                          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-lg"
                            style={{ background: "#F0FFF4" }}>✅</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate" style={{ fontSize: 14, color: "#888" }}>{site.name}</p>
                            <p style={{ fontSize: 11, color: "#AAA" }}>完工 {site.endDate.replace(/-/g, "/")} · 粗利 {profitPct}%</p>
                          </div>
                          <TrendingUp size={14} style={{ color: profitPct >= 20 ? "#2E7D32" : "#AAA" }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
