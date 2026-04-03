"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin, Users, HardHat,
  CheckCircle2, Clock, ChevronRight, ArrowUpRight,
  Sun, Cloud, CloudRain, Wind,
} from "lucide-react";
import { KaitaiLogo } from "./components/kaitai-logo";
import { useAppContext, getSiteStatusMap, type AttendanceStatus } from "./lib/app-context";
import { T } from "./lib/design-tokens";

const HomeMap = dynamic(
  () => import("./components/home-map").then(m => m.HomeMap),
  { ssr: false, loading: () => <div style={{ height: 200, background: T.bg, borderRadius: "0 0 12px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 14, color: T.muted }}>地図を読み込み中...</span></div> }
);

// ─── デザイントークン ─────────────────────────────────────────────────────────
const C = {
  text:    T.text,
  sub:     T.sub,
  muted:   T.muted,
  border:  T.border,
  bg:      T.bg,
  card:    T.surface,
  amber:   T.primary,
  amberDk: T.primaryDk,
  blue:    "#3B82F6",
  green:   "#10B981",
  red:     "#EF4444",
  navy:    T.text,
};
const shadow = "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)";

// ─── モックデータ ─────────────────────────────────────────────────────────────
type SiteStatus = "着工前" | "解体中" | "完工";

const sites = [
  {
    id: "s1", code: "#2026-008",
    name: "田辺邸解体工事",   type: "木造解体",
    address: "岡山市北区鹿田町1-1-1",
    status: "解体中" as SiteStatus,
    endDate: "2026-04-10",
    progressPct: 68, workers: 4, hasWorkToday: true,
    contract: 8_500_000, cost: 4_120_000,
    breakdown: { waste: 1_200_000, labor: 2_100_000, other: 820_000 },
    imgHue: "220",
    lat: 34.6617, lng: 133.9175,
  },
  {
    id: "s2", code: "#2026-012",
    name: "旧山陽倉庫解体",   type: "RC解体",
    address: "岡山市北区奉還町2-3-5",
    status: "解体中" as SiteStatus,
    endDate: "2026-04-20",
    progressPct: 42, workers: 6, hasWorkToday: false,
    contract: 11_500_000, cost: 5_920_000,
    breakdown: { waste: 2_100_000, labor: 2_800_000, other: 1_020_000 },
    imgHue: "160",
    lat: 34.6572, lng: 133.9143,
  },
  {
    id: "s3", code: "#2026-015",
    name: "森本アパート解体", type: "木造解体",
    address: "岡山市中区円山560",
    status: "着工前" as SiteStatus,
    endDate: "2026-04-30",
    progressPct: 0, workers: 0, hasWorkToday: false,
    contract: 2_800_000, cost: 0,
    breakdown: { waste: 0, labor: 0, other: 0 },
    imgHue: "280",
    lat: 34.6480, lng: 133.9520,
  },
  {
    id: "s4", code: "#2026-003",
    name: "旧備前工場棟解体（第1期）", type: "鉄骨解体",
    address: "岡山市南区大福900",
    status: "完工" as SiteStatus,
    endDate: "2026-03-28",
    progressPct: 100, workers: 0, hasWorkToday: false,
    contract: 8_400_000, cost: 6_100_000,
    breakdown: { waste: 1_920_000, labor: 2_850_000, other: 1_330_000 },
    imgHue: "30",
    lat: 34.6221, lng: 133.9126,
  },
];

const STATUS_STYLE: Record<SiteStatus, { dot: string; bg: string; text: string }> = {
  着工前: { dot: C.blue,  bg: "#EFF6FF", text: "#1D4ED8" },
  解体中: { dot: C.amber, bg: T.primaryLt, text: "#92400E" },
  完工:   { dot: C.green, bg: "#F0FDF4", text: "#166534" },
};

const TYPE_COLOR: Record<string, string> = {
  "木造解体": "#0EA5E9",
  "RC解体":   "#8B5CF6",
  "鉄骨解体": T.primary,
};

// ─── メンバー名前引き ─────────────────────────────────────────────────────────
const MEMBER_NAMES: Record<string, string> = {
  m1: "田中 義雄", m2: "鈴木 健太", m3: "山本 大輔",
  m4: "佐藤 翔",   m5: "渡辺 誠",   m6: "伊藤 拓也",
};

// 勤怠ステータス表示設定
const ATTENDANCE_STYLE: Record<AttendanceStatus, { icon: string; label: string; bg: string; color: string }> = {
  clock_in:  { icon: "🟢", label: "出勤中",  bg: "#F0FDF4", color: "#166534" },
  break_in:  { icon: "☕",  label: "休憩中",  bg: "${T.primaryLt}", color: "#92400E" },
  break_out: { icon: "🟢", label: "出勤中",  bg: "#F0FDF4", color: "#166534" },
  clock_out: { icon: "🚪", label: "退勤済",  bg: T.bg, color: T.muted },
};

function fmtTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}

// fmt は管理者画面でのみ使用するため削除済み

// ─── KPIカード ────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, unit, sub, icon: Icon, color, wide,
}: {
  label: string; value: string; unit?: string; sub?: string;
  icon: React.ElementType; color: string; wide?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl p-5 flex flex-col gap-2 ${wide ? "md:col-span-2" : ""}`}
      style={{ border: `1px solid ${C.border}`, boxShadow: shadow }}
    >
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 14, fontWeight: 500, color: C.sub }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: color + "18" }}>
          <Icon size={14} style={{ color }} strokeWidth={2} />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-numeric" style={{ fontSize: 36, fontWeight: 800, color: C.navy, lineHeight: 1 }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 14, fontWeight: 600, color: C.sub }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 14, color: C.muted }}>{sub}</div>}
      {wide && (
        <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: T.bg }}>
          <div className="h-full rounded-full" style={{ width: `${value}%`, background: C.amber }} />
        </div>
      )}
    </div>
  );
}

// ─── 現場カード（横長） ────────────────────────────────────────────────────────
interface SiteAttendance {
  userId: string;
  status: AttendanceStatus;
  latestTimestamp: string;
}

function SiteCard({ site, attendance }: { site: typeof sites[0]; attendance: SiteAttendance[] }) {
  const st = STATUS_STYLE[site.status];
  const typeColor = TYPE_COLOR[site.type] ?? C.blue;

  return (
    <div
      className="overflow-hidden"
      style={{
        background: C.card,
        border: `1.5px solid ${C.border}`,
        borderLeft: `5px solid ${st.dot}`,
        borderRadius: 16,
        boxShadow: shadow,
      }}
    >
      {/* ─ メイン本体 ─ */}
      <div className="flex">
        {/* サムネイル */}
        <div
          className="hidden md:flex flex-shrink-0 w-36 items-center justify-center"
          style={{
            background: `linear-gradient(160deg, hsl(${site.imgHue},42%,32%) 0%, hsl(${site.imgHue},30%,20%) 100%)`,
            minHeight: 160,
          }}
        >
          <HardHat size={40} color="rgba(255,255,255,0.22)" />
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0 p-6">
          {/* バッジ行 + 進捗 */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-1 rounded-lg font-bold"
                style={{ background: typeColor + "18", color: typeColor, fontSize: 13 }}
              >
                {site.type}
              </span>
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold"
                style={{ background: st.bg, color: st.text, fontSize: 13 }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: st.dot }} />
                {site.status}
              </span>
              {site.hasWorkToday && (
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold"
                  style={{ background: "#F0FDF4", color: C.green, fontSize: 13 }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: C.green }} />
                  本日稼働
                </span>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>施工進捗</div>
              <div className="flex items-baseline gap-1">
                <span style={{ fontSize: 34, fontWeight: 800, color: C.amber, lineHeight: 1 }}>
                  {site.progressPct}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.amberDk }}>%</span>
              </div>
            </div>
          </div>

          {/* 進捗バー */}
          <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: T.bg }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${site.progressPct}%`, background: st.dot }}
            />
          </div>

          {/* 現場名 */}
          <h3 style={{ fontSize: 20, fontWeight: 800, color: C.navy, marginBottom: 10 }}>
            {site.name}
          </h3>

          {/* メタ情報 */}
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} style={{ color: C.muted }} />
              <span style={{ fontSize: 14, color: C.muted }}>{site.address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} style={{ color: C.muted }} />
              <span style={{ fontSize: 14, color: C.sub }}>
                完工予定&nbsp;<strong style={{ color: C.text }}>{site.endDate.replace(/-/g, "/")}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={14} style={{ color: C.green }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>
                {site.workers}名稼働中
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─ 本日のスタッフ ─ */}
      {attendance.length > 0 && (
        <div
          className="px-6 py-5"
          style={{ background: T.bg, borderTop: `1px solid ${C.border}` }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 12, letterSpacing: "0.07em", textTransform: "uppercase" as const }}>
            本日のスタッフ
          </p>
          <div className="flex flex-wrap gap-3">
            {attendance.map(a => {
              const sty = ATTENDANCE_STYLE[a.status];
              const name = MEMBER_NAMES[a.userId] ?? a.userId;
              return (
                <div
                  key={a.userId}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: sty.bg,
                    border: `1.5px solid ${sty.color}28`,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{sty.icon}</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: sty.color, lineHeight: 1.2 }}>{name}</p>
                    <p style={{ fontSize: 12, color: sty.color, opacity: 0.75, marginTop: 3 }}>
                      {sty.label}&nbsp;·&nbsp;{fmtTime(a.latestTimestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─ 詳細ボタン ─ */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <span style={{ fontSize: 13, color: C.muted }}>{site.code}</span>
        <Link
          href={`/kaitai/site/${site.id}`}
          className="flex items-center gap-2 rounded-xl font-bold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: C.amber,
            color: T.surface,
            fontSize: 15,
            padding: "12px 28px",
          }}
        >
          この現場の詳細を見る
          <ChevronRight size={17} />
        </Link>
      </div>
    </div>
  );
}

// ─── 右パネル：ステータス管理 ─────────────────────────────────────────────────
function StatusPanel({ sites }: { sites: typeof import("./page").mockSites }) {
  const upcoming = sites.filter(s => s.status === "着工前");
  const done = sites.filter(s => s.status === "完工");
  return (
    <div className="bg-white rounded-xl" style={{ border: `1.5px solid ${C.border}`, boxShadow: shadow }}>
      <div className="px-4 py-3.5" style={{ borderBottom: `1.5px solid ${C.border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>ステータス管理</h3>
      </div>
      <div className="px-4 py-4 flex flex-col gap-2.5">
        {/* 着工前 */}
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: C.blue }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: C.blue }}>
            着工前 ({upcoming.length})
          </span>
        </div>
        {upcoming.map(s => (
          <Link key={s.id} href={`/kaitai/site/${s.id}`}>
            <div className="flex items-center justify-between px-3 py-3 rounded-lg transition-colors hover:bg-blue-50"
              style={{ background: "#EFF6FF", border: `1.5px solid #BFDBFE` }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{s.name}</p>
                <p style={{ fontSize: 14, color: C.muted, marginTop: 1 }}>{s.endDate.replace(/-/g, "/")} 着工予定</p>
              </div>
              <ChevronRight size={15} style={{ color: C.blue }} />
            </div>
          </Link>
        ))}

        {/* 完工済 */}
        <div className="flex items-center gap-2 mt-3 mb-0.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: C.green }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>完工済 ({done.length})</span>
          <span className="ml-auto px-2 py-0.5 rounded text-sm font-bold"
            style={{ background: "#F0FDF4", color: C.green, border: "1px solid #BBF7D0" }}>今月</span>
        </div>
        {done.map(s => (
          <Link key={s.id} href={`/kaitai/site/${s.id}`}>
            <div className="flex items-center justify-between px-3 py-3 rounded-lg transition-colors hover:bg-green-50"
              style={{ background: "#F0FDF4", border: `1.5px solid #BBF7D0` }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.sub }}>{s.name}</p>
                <p style={{ fontSize: 14, color: C.muted, marginTop: 1 }}>
                  {s.endDate.replace(/-/g, "/")} 引渡済
                </p>
              </div>
              <CheckCircle2 size={15} style={{ color: C.green }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── 右パネル：現場マップ ─────────────────────────────────────────────────────
function MapPanel() {
  const mapSites = sites.map(s => ({
    id: s.id, name: s.name, lat: s.lat, lng: s.lng, status: s.status,
  }));
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, boxShadow: shadow }}>
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: `1.5px solid ${C.border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>現場マップ</h3>
        <ArrowUpRight size={14} style={{ color: C.muted }} />
      </div>
      <HomeMap sites={mapSites} height={200} />
    </div>
  );
}

// ─── 右パネル：天気 ──────────────────────────────────────────────────────────
function WeatherPanel() {
  const forecast = [
    { label: "明日",   icon: Cloud,      hi: 16, lo: 9  },
    { label: "4/4",   icon: CloudRain,  hi: 13, lo: 8  },
    { label: "4/5",   icon: Cloud,      hi: 15, lo: 10 },
    { label: "4/6",   icon: Sun,        hi: 19, lo: 11 },
  ];
  return (
    <div className="bg-white rounded-xl" style={{ border: `1.5px solid ${C.border}`, boxShadow: shadow }}>
      <div className="px-4 py-3.5" style={{ borderBottom: `1.5px solid ${C.border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>本日の天気（世田谷区）</h3>
      </div>
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <Sun size={36} style={{ color: "#92400E" }} />
          <div>
            <span className="font-numeric" style={{ fontSize: 28, fontWeight: 800, color: C.navy }}>18°</span>
            <span style={{ fontSize: 14, color: C.sub }}> / 12°C</span>
          </div>
        </div>
        <div className="flex items-center gap-1 mb-3">
          <Wind size={11} style={{ color: C.muted }} />
          <span style={{ fontSize: 14, color: C.muted }}>南西の風 3m/s · 湿度 62%</span>
        </div>
        <div className="grid grid-cols-4 gap-1 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
          {forecast.map(({ label, icon: Icon, hi, lo }) => (
            <div key={label} className="flex flex-col items-center gap-1 py-1">
              <span style={{ fontSize: 14, color: C.muted }}>{label}</span>
              <Icon size={14} style={{ color: C.sub }} />
              <span className="font-numeric" style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{hi}°</span>
              <span className="font-numeric" style={{ fontSize: 14, color: C.muted }}>{lo}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── ページ本体 ───────────────────────────────────────────────────────────────
export { sites as mockSites };

export default function KaitaiHome() {
  const { attendanceLogs } = useAppContext();
  const now = new Date();
  const wd = ["日", "月", "火", "水", "木", "金", "土"][now.getDay()];
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${wd}）`;
  const today = now.toISOString().slice(0, 10);

  const active   = sites.filter(s => s.status === "解体中");
  const upcoming = sites.filter(s => s.status === "着工前");
  const done     = sites.filter(s => s.status === "完工");
  const workers  = active.reduce((s, x) => s + x.workers, 0);

  const kpis = [
    { label: "稼働中",        value: `${active.length}`,   unit: "件", icon: HardHat,    color: C.blue  },
    { label: "本日作業員",    value: `${workers}`,         unit: "名", icon: Users,      color: C.green },
    { label: "着工前 / 完工", value: `${upcoming.length}/${done.length}`, unit: "件", icon: Clock, color: "#8B5CF6" },
  ];

  const mapSites = sites.map(s => ({
    id: s.id, name: s.name, lat: s.lat, lng: s.lng, status: s.status,
  }));

  return (
    <div className="flex flex-col">

      {/* ── モバイルヘッダー ─────────────── */}
      <header className="md:hidden px-4 pt-8 pb-3 flex items-center justify-between bg-white"
        style={{ borderBottom: `1px solid ${C.border}` }}>
        <KaitaiLogo iconSize={28} textSize={18} />
        <span style={{ fontSize: 14, color: C.muted }}>{dateStr}</span>
      </header>

      {/* ── KPI行 ────────────────────────── */}
      <div className="pt-5 pb-4">
        <div className="grid grid-cols-3 gap-3">
          {kpis.map(kpi => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
      </div>

      {/* ── 現場マップ（全幅） ────────────── */}
      <div className="mb-5 overflow-hidden rounded-2xl" style={{ border: `1.5px solid ${C.border}`, boxShadow: shadow, background: C.card }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1.5px solid ${C.border}` }}>
          <h2 className="flex items-center gap-2" style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>
            <MapPin size={16} style={{ color: C.amber }} />
            現場マップ
          </h2>
          <span
            className="flex items-center gap-1.5 px-3 py-1 rounded-full font-bold"
            style={{ background: T.primaryLt, color: C.amberDk, fontSize: 13, border: "1px solid #E5E7EB" }}
          >
            稼働中 {active.length}件
          </span>
        </div>
        <HomeMap sites={mapSites} height={320} />
      </div>

      {/* ── メインコンテンツ ─────────────── */}
      <div className="pb-28 md:pb-8 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* 左：稼働中の現場 */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2" style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>
              <span className="w-1 h-5 rounded-full" style={{ background: C.amber }} />
              稼働中の現場
              <span
                className="px-2.5 py-0.5 rounded-full font-bold"
                style={{ background: T.primaryLt, color: C.amberDk, fontSize: 13 }}
              >
                {active.length}件
              </span>
            </h2>
            <Link href="/kaitai/sites/new"
              className="flex items-center gap-1 font-medium" style={{ fontSize: 14, color: C.amber }}>
              全現場を表示 <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="flex flex-col gap-5">
            {active.map(site => {
              const statusMap = getSiteStatusMap(attendanceLogs, site.id, today);
              const siteAttendance: SiteAttendance[] = Array.from(statusMap.entries()).map(([userId, status]) => {
                const latestLog = attendanceLogs
                  .filter(l => l.siteId === site.id && l.userId === userId && l.timestamp.startsWith(today))
                  .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
                return { userId, status, latestTimestamp: latestLog?.timestamp ?? "" };
              });
              return <SiteCard key={site.id} site={site} attendance={siteAttendance} />;
            })}
          </div>
        </div>

        {/* 右：ステータス / 天気 */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <StatusPanel sites={sites} />
          <WeatherPanel />
        </div>
      </div>
    </div>
  );
}
