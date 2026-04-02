import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ChevronRight,
  Users,
  CheckCircle2,
  Clock,
  Truck,
  Camera,
  FileText,
  Edit3,
} from "lucide-react";

// ─── Mock data ───────────────────────────────────────────────────────────────

type SiteStatus = "着工前" | "解体中" | "完工";

const mockSites: Record<string, {
  id: string;
  name: string;
  address: string;
  status: SiteStatus;
  startDate: string;
  endDate: string;
  progressPct: number;
  contractAmount: number;
  wasteDisposalCost: number;
  laborCost: number;
  otherCost: number;
  todayWorkers: number;
  workHistory: { date: string; items: string[]; wasteM3: number; photos: number }[];
}> = {
  s1: {
    id: "s1",
    name: "山田邸解体工事",
    address: "東京都世田谷区豪徳寺2-14-5",
    status: "解体中",
    startDate: "2026-03-18",
    endDate: "2026-04-10",
    progressPct: 68,
    contractAmount: 3_200_000,
    wasteDisposalCost: 840_000,
    laborCost: 760_000,
    otherCost: 240_000,
    todayWorkers: 4,
    workHistory: [
      { date: "4月2日", items: ["内装解体", "電気設備撤去"], wasteM3: 4.2, photos: 3 },
      { date: "4月1日", items: ["内装解体"], wasteM3: 3.8, photos: 2 },
      { date: "3月31日", items: ["内装解体", "設備撤去"], wasteM3: 5.1, photos: 4 },
      { date: "3月30日", items: ["外構解体"], wasteM3: 2.6, photos: 2 },
    ],
  },
  s2: {
    id: "s2",
    name: "旧田中倉庫解体",
    address: "神奈川県川崎市幸区堀川町580",
    status: "解体中",
    startDate: "2026-03-25",
    endDate: "2026-04-20",
    progressPct: 42,
    contractAmount: 5_600_000,
    wasteDisposalCost: 1_200_000,
    laborCost: 680_000,
    otherCost: 220_000,
    todayWorkers: 6,
    workHistory: [
      { date: "4月1日", items: ["構造体解体"], wasteM3: 8.4, photos: 5 },
      { date: "3月31日", items: ["内装解体", "構造体解体"], wasteM3: 6.2, photos: 3 },
    ],
  },
  s3: {
    id: "s3",
    name: "松本アパート解体",
    address: "埼玉県さいたま市浦和区常盤6-4-21",
    status: "着工前",
    startDate: "2026-04-07",
    endDate: "2026-04-30",
    progressPct: 0,
    contractAmount: 2_800_000,
    wasteDisposalCost: 0,
    laborCost: 0,
    otherCost: 0,
    todayWorkers: 0,
    workHistory: [],
  },
  s4: {
    id: "s4",
    name: "旧工場棟解体（第1期）",
    address: "千葉県船橋市本町2-7-3",
    status: "完工",
    startDate: "2026-02-01",
    endDate: "2026-03-20",
    progressPct: 100,
    contractAmount: 8_400_000,
    wasteDisposalCost: 2_100_000,
    laborCost: 2_800_000,
    otherCost: 1_200_000,
    todayWorkers: 0,
    workHistory: [],
  },
};

const statusConfig: Record<SiteStatus, { label: string; bg: string; fg: string }> = {
  着工前: { label: "着工前", bg: "rgba(99,102,241,0.15)",  fg: "#818CF8" },
  解体中: { label: "解体中", bg: "rgba(249,115,22,0.15)", fg: "#FB923C" },
  完工:   { label: "完工",   bg: "rgba(34,197,94,0.15)",  fg: "#4ADE80" },
};

// ─── Components ───────────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ background: "#1A2535", border: "1px solid #2D3E54" }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-bold tracking-widest uppercase mb-3"
      style={{ color: "#F97316" }}
    >
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = mockSites[id];

  if (!site) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ color: "#64748B" }}>
        現場が見つかりません
      </div>
    );
  }

  const cfg = statusConfig[site.status];
  const totalCost = site.wasteDisposalCost + site.laborCost + site.otherCost;
  const profit = site.contractAmount - totalCost;
  const profitPct = site.contractAmount > 0
    ? Math.round((profit / site.contractAmount) * 100)
    : 0;
  const costPct = site.contractAmount > 0
    ? Math.round((totalCost / site.contractAmount) * 100)
    : 0;

  return (
    <div className="max-w-md mx-auto flex flex-col gap-5 pb-4">

      {/* ── Header ── */}
      <section
        className="px-5 pt-12 pb-6"
        style={{ borderBottom: "1px solid #2D3E54" }}
      >
        <Link
          href="/kaitai"
          className="inline-flex items-center gap-1.5 mb-4 text-sm"
          style={{ color: "#64748B" }}
        >
          <ArrowLeft size={15} /> 現場一覧
        </Link>

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: cfg.bg, color: cfg.fg }}
              >
                {cfg.label}
              </span>
            </div>
            <h1 className="text-xl font-bold leading-snug" style={{ color: "#F1F5F9" }}>
              {site.name}
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={12} style={{ color: "#64748B" }} />
              <p className="text-xs" style={{ color: "#64748B" }}>
                {site.address}
              </p>
            </div>
          </div>
          <Link href={`/kaitai/sites/${id}/edit`} className="flex-shrink-0">
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "#1A2535", border: "1px solid #2D3E54", color: "#94A3B8" }}
            >
              <Edit3 size={13} />
              編集
            </button>
          </Link>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-3 text-xs mb-5" style={{ color: "#94A3B8" }}>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{site.startDate.replace(/-/g, "/")} 〜 {site.endDate.replace(/-/g, "/")}</span>
          </div>
          {site.todayWorkers > 0 && (
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>本日 {site.todayWorkers}名</span>
            </div>
          )}
        </div>

        {/* Progress */}
        {site.status !== "着工前" && (
          <div>
            <div className="flex justify-between text-[11px] mb-1.5" style={{ color: "#64748B" }}>
              <span>工事進捗</span>
              <span className="font-bold" style={{ color: "#F1F5F9" }}>{site.progressPct}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "#0F1928" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${site.progressPct}%`,
                  background: "linear-gradient(90deg, #F97316 0%, #FBBF24 100%)",
                }}
              />
            </div>
          </div>
        )}
      </section>

      <div className="px-4 flex flex-col gap-5">

        {/* ══════════════════════════════════════════════
            原価・利益サマリー
        ══════════════════════════════════════════════ */}
        <section>
          <SectionLabel>原価・利益（現在値）</SectionLabel>
          <Card className="p-4">

            {/* Big profit number */}
            <div className="text-center mb-4">
              <p className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: "#64748B" }}>
                現状利益
              </p>
              <p
                className="text-4xl font-bold"
                style={{
                  color: profit >= 0 ? "#4ADE80" : "#F87171",
                  fontFeatureSettings: "'tnum'",
                }}
              >
                {profit >= 0 ? "+" : ""}¥{profit.toLocaleString()}
              </p>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>
                粗利率 {profitPct}%
              </p>
            </div>

            {/* Cost breakdown */}
            <div className="flex flex-col gap-2 mb-4">
              {[
                { label: "受注金額", value: site.contractAmount, color: "#4ADE80", bold: true },
                { label: "産廃処分費", value: site.wasteDisposalCost, color: "#F87171" },
                { label: "労務費", value: site.laborCost, color: "#FB923C" },
                { label: "その他経費", value: site.otherCost, color: "#FBBF24" },
              ].map(({ label, value, color, bold }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-xs" style={{ color: "#94A3B8" }}>{label}</span>
                  </div>
                  <span
                    className={`text-sm ${bold ? "font-bold" : "font-semibold"}`}
                    style={{ color: bold ? "#F1F5F9" : "#94A3B8" }}
                  >
                    ¥{value.toLocaleString()}
                  </span>
                </div>
              ))}
              <div
                className="flex items-center justify-between pt-2"
                style={{ borderTop: "1px solid #2D3E54" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#64748B" }} />
                  <span className="text-xs" style={{ color: "#94A3B8" }}>原価合計</span>
                </div>
                <span className="text-sm font-bold" style={{ color: "#F1F5F9" }}>
                  ¥{totalCost.toLocaleString()}
                  <span className="text-[10px] font-normal ml-1" style={{ color: "#64748B" }}>
                    ({costPct}%)
                  </span>
                </span>
              </div>
            </div>

            {/* Cost gauge bar */}
            <div>
              <div className="flex text-[10px] mb-1 justify-between" style={{ color: "#64748B" }}>
                <span>原価消化率</span>
                <span>{costPct}% / 100%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: "#0F1928" }}>
                <div style={{ width: `${Math.min(costPct, 100)}%`, background: "#F87171" }} className="h-full rounded-full" />
              </div>
            </div>
          </Card>
        </section>

        {/* ══════════════════════════════════════════════
            作業履歴
        ══════════════════════════════════════════════ */}
        {site.workHistory.length > 0 && (
          <section>
            <SectionLabel>作業・産廃履歴</SectionLabel>
            <div className="flex flex-col gap-2">
              {site.workHistory.map((h, i) => (
                <Card key={i} className="px-4 py-3 flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: "rgba(249,115,22,0.1)" }}
                  >
                    <Clock size={15} style={{ color: "#F97316" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold" style={{ color: "#F1F5F9" }}>
                        {h.date}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs" style={{ color: "#64748B" }}>
                          <Truck size={11} /> {h.wasteM3}㎥
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: "#64748B" }}>
                          <Camera size={11} /> {h.photos}枚
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {h.items.map((item) => (
                        <span
                          key={item}
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(249,115,22,0.1)", color: "#FB923C" }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ── マニフェスト ── */}
        <Card className="px-4 py-3 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.1)" }}
          >
            <FileText size={16} style={{ color: "#818CF8" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>
              産廃マニフェスト
            </p>
            <p className="text-xs" style={{ color: "#64748B" }}>
              作業票・マニフェストを確認する
            </p>
          </div>
          <ChevronRight size={15} style={{ color: "#2D3E54" }} />
        </Card>

        {/* ── 完工チェックリスト ── */}
        {site.status === "解体中" && (
          <Card className="px-4 py-3 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.1)" }}
            >
              <CheckCircle2 size={16} style={{ color: "#4ADE80" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>
                完工報告を提出
              </p>
              <p className="text-xs" style={{ color: "#64748B" }}>
                工事完了時に写真と共に提出
              </p>
            </div>
            <ChevronRight size={15} style={{ color: "#2D3E54" }} />
          </Card>
        )}

      </div>
    </div>
  );
}
