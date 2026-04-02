"use client";

import Link from "next/link";
import { MapPin, TrendingUp, Users, Eye } from "lucide-react";
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
      <div className="flex rounded-full overflow-hidden h-4">
        <div style={{ width: pct(breakdown.waste), background: "#EF4444" }} title={`産廃 ¥${(breakdown.waste/10_000).toFixed(0)}万`} />
        <div style={{ width: pct(breakdown.labor), background: "#1565C0" }} title={`労務 ¥${(breakdown.labor/10_000).toFixed(0)}万`} />
        <div style={{ width: pct(breakdown.other), background: "#78909C" }} title={`他 ¥${(breakdown.other/10_000).toFixed(0)}万`} />
        <div style={{ flex: 1, background: "#EEEEEE" }} />
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        {[
          { color: "#EF4444", label: "産廃", val: breakdown.waste },
          { color: "#1565C0", label: "労務", val: breakdown.labor },
          { color: "#78909C", label: "その他", val: breakdown.other },
        ].map(({ color, label, val }) => (
          <div key={label} className="flex items-center gap-1">
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 11, color: "#888" }}>{label} ¥{(val / 10_000).toFixed(0)}万</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KaitaiHome() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day   = now.getDate();
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][now.getDay()];

  const activeSites   = mockSites.filter(s => s.status === "解体中");
  const upcomingSites = mockSites.filter(s => s.status === "着工前");
  const doneSites     = mockSites.filter(s => s.status === "完工");
  const totalWorkers  = activeSites.reduce((s, x) => s + x.todayWorkers, 0);

  return (
    <div className="max-w-md mx-auto flex flex-col">

      {/* ── Header ── */}
      <header
        className="px-5 pt-10 pb-4 flex items-center justify-between"
        style={{ borderBottom: "2px solid #EEEEEE" }}
      >
        <KaitaiLogo iconSize={38} textSize={24} />
        <div className="flex items-center gap-2">
          {/* Read-only badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: "#F0F4FF", border: "1px solid #BBCFFF" }}
          >
            <Eye size={13} style={{ color: "#1565C0" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#1565C0" }}>閲覧専用</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl" style={{ background: "#F5F5F5", border: "1px solid #E0E0E0" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#555555" }}>
              {month}月{day}日（{weekday}）
            </span>
          </div>
        </div>
      </header>

      <div className="px-4 flex flex-col gap-5 pt-4 pb-4">

        {/* ── Today summary ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "🏗️", label: "稼働現場",  value: `${activeSites.length}件`,   color: "#FF9800" },
            { icon: "👷", label: "本日作業員", value: `${totalWorkers}名`,         color: "#1565C0" },
            { icon: "✅", label: "今月完工",  value: `${doneSites.length}件`,      color: "#2E7D32" },
          ].map(({ icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl p-3 text-center"
              style={{ background: "#FAFAFA", border: "1.5px solid #EEEEEE" }}
            >
              <span style={{ fontSize: 22 }}>{icon}</span>
              <p style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1.1, marginTop: 2 }}>
                {value}
              </p>
              <p style={{ fontSize: 11, color: "#888888", marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── 稼働中の現場 ── */}
        {activeSites.length > 0 && (
          <section>
            <p className="font-black tracking-widest mb-3 px-1" style={{ fontSize: 13, color: "#FF9800" }}>
              ▶ 稼働中の現場（{activeSites.length}件）
            </p>
            <div className="flex flex-col gap-4">
              {activeSites.map(site => {
                const cfg = STATUS[site.status];
                const profitPct = Math.round(((site.contract - site.cost) / site.contract) * 100);
                return (
                  <div
                    key={site.id}
                    className="rounded-3xl"
                    style={{
                      background: "#FFFFFF",
                      border: "1.5px solid #E0E0E0",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* Top */}
                    <div className="flex items-start justify-between px-5 pt-5 pb-3">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ background: cfg.bg, color: cfg.fg, border: `1px solid ${cfg.border}` }}
                          >
                            {site.status}
                          </span>
                          {site.hasWorkToday && (
                            <span
                              className="text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{ background: "#E8F5E9", color: "#2E7D32", border: "1px solid #A5D6A7" }}
                            >
                              🟢 本日稼働中
                            </span>
                          )}
                        </div>
                        <h3 className="font-black leading-tight mb-1" style={{ fontSize: 20, color: "#111111" }}>
                          {site.name}
                        </h3>
                        <div className="flex items-start gap-1.5">
                          <MapPin size={13} style={{ color: "#999999", marginTop: 2, flexShrink: 0 }} />
                          <p style={{ fontSize: 14, color: "#666666", lineHeight: 1.4 }}>{site.address}</p>
                        </div>
                      </div>
                      {/* Detail link (read-only) */}
                      <Link href={`/kaitai/site/${site.id}`} className="flex-shrink-0">
                        <div
                          className="flex items-center gap-1 px-3 py-2 rounded-2xl"
                          style={{ background: "#F5F5F5", border: "1px solid #DDDDDD", fontSize: 13, fontWeight: 700, color: "#444444", minHeight: 44 }}
                        >
                          詳細
                        </div>
                      </Link>
                    </div>

                    {/* Progress */}
                    <div className="px-5 pb-3">
                      <div className="flex justify-between mb-1" style={{ fontSize: 13, color: "#888888", fontWeight: 600 }}>
                        <span>工事進捗</span>
                        <span style={{ color: "#FF9800", fontWeight: 800 }}>{site.progressPct}%</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: "#EEEEEE" }}>
                        <div className="h-full rounded-full" style={{ width: `${site.progressPct}%`, background: "linear-gradient(90deg, #FF9800, #FFC107)" }} />
                      </div>
                    </div>

                    {/* Cost breakdown bar */}
                    <div className="px-5 pb-4">
                      <CostBar contract={site.contract} breakdown={site.breakdown} />
                    </div>

                    {/* Bottom strip */}
                    <div
                      className="flex items-center justify-between px-5 py-3 rounded-b-3xl"
                      style={{ background: "#F9F9F9", borderTop: "1.5px solid #EEEEEE" }}
                    >
                      <div className="flex items-center gap-2">
                        <Users size={16} style={{ color: "#1565C0" }} />
                        <span style={{ fontSize: 17, fontWeight: 800, color: "#111111" }}>{site.todayWorkers}名</span>
                        <span style={{ fontSize: 13, color: "#888888" }}>本日</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#888888" }}>
                        完工予定 {site.endDate.replace(/-/g, "/")}
                      </div>
                      <div
                        className="px-2.5 py-1 rounded-xl"
                        style={{
                          background: profitPct >= 25 ? "#E8F5E9" : profitPct >= 10 ? "#FFF3E0" : "#FFEBEE",
                          fontSize: 13, fontWeight: 800,
                          color: profitPct >= 25 ? "#2E7D32" : profitPct >= 10 ? "#B45309" : "#C62828",
                        }}
                      >
                        粗利 {profitPct}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 着工前 ── */}
        {upcomingSites.length > 0 && (
          <section>
            <p className="font-black tracking-widest mb-3 px-1" style={{ fontSize: 13, color: "#5C6BC0" }}>
              ▶ 着工前（{upcomingSites.length}件）
            </p>
            <div className="flex flex-col gap-2">
              {upcomingSites.map(site => (
                <Link key={site.id} href={`/kaitai/site/${site.id}`}>
                  <div
                    className="flex items-center gap-4 px-5 rounded-3xl active:scale-[0.99]"
                    style={{ background: "#FFFFFF", border: "1.5px solid #E0E0E0", minHeight: 72 }}
                  >
                    <div className="w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center" style={{ background: "#EDE9FE", fontSize: 22 }}>📅</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black truncate" style={{ fontSize: 17, color: "#111111" }}>{site.name}</p>
                      <p style={{ fontSize: 13, color: "#888888" }}>着工 {site.endDate.replace(/-/g, "/")}</p>
                    </div>
                    <span style={{ fontSize: 14, color: "#5C6BC0", fontWeight: 700 }}>詳細 →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 完工済 ── */}
        {doneSites.length > 0 && (
          <section>
            <p className="font-black tracking-widest mb-3 px-1" style={{ fontSize: 13, color: "#888888" }}>
              ▶ 完工済（{doneSites.length}件）
            </p>
            <div className="flex flex-col gap-2">
              {doneSites.map(site => {
                const profitPct = Math.round(((site.contract - site.cost) / site.contract) * 100);
                return (
                  <Link key={site.id} href={`/kaitai/site/${site.id}`}>
                    <div
                      className="flex items-center gap-4 px-5 rounded-3xl active:scale-[0.99]"
                      style={{ background: "#FAFAFA", border: "1.5px solid #E8E8E8", minHeight: 68 }}
                    >
                      <div className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center" style={{ background: "#F0FFF4", fontSize: 20 }}>✅</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate" style={{ fontSize: 16, color: "#888888" }}>{site.name}</p>
                        <p style={{ fontSize: 12, color: "#AAAAAA" }}>完工 {site.endDate.replace(/-/g, "/")} ・ 粗利 {profitPct}%</p>
                      </div>
                      <TrendingUp size={16} style={{ color: profitPct >= 20 ? "#2E7D32" : "#888888" }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
