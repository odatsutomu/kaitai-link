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

const HomeMap = dynamic(
  () => import("./components/home-map").then(m => m.HomeMap),
  { ssr: false, loading: () => <div style={{ height: 200, background: "#F1F5F9", borderRadius: "0 0 12px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 14, color: "#94A3B8" }}>地図を読み込み中...</span></div> }
);

// ─── デザイントークン ─────────────────────────────────────────────────────────
const C = {
  text:    "#334155",
  sub:     "#64748B",
  muted:   "#94A3B8",
  border:  "#E2E8F0",
  bg:      "#F8F9FA",
  card:    "#FFFFFF",
  amber:   "#F59E0B",
  amberDk: "#D97706",
  blue:    "#3B82F6",
  green:   "#10B981",
  red:     "#EF4444",
  navy:    "#1E293B",
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
  解体中: { dot: C.amber, bg: "#FFFBEB", text: "#92400E" },
  完工:   { dot: C.green, bg: "#F0FDF4", text: "#166534" },
};

const TYPE_COLOR: Record<string, string> = {
  "木造解体": "#0EA5E9",
  "RC解体":   "#8B5CF6",
  "鉄骨解体": "#F97316",
};

// ─── メンバー名前引き ─────────────────────────────────────────────────────────
const MEMBER_NAMES: Record<string, string> = {
  m1: "田中 義雄", m2: "鈴木 健太", m3: "山本 大輔",
  m4: "佐藤 翔",   m5: "渡辺 誠",   m6: "伊藤 拓也",
};

// 勤怠ステータス表示設定
const ATTENDANCE_STYLE: Record<AttendanceStatus, { icon: string; label: string; bg: string; color: string }> = {
  clock_in:  { icon: "🟢", label: "出勤中",  bg: "#F0FDF4", color: "#166534" },
  break_in:  { icon: "☕",  label: "休憩中",  bg: "#FFF7ED", color: "#92400E" },
  break_out: { icon: "🟢", label: "出勤中",  bg: "#F0FDF4", color: "#166534" },
  clock_out: { icon: "🚪", label: "退勤済",  bg: "#F8FAFC", color: "#94A3B8" },
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
        <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
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
    <div className="bg-white rounded-xl overflow-hidden"
      style={{ border: `1.5px solid ${C.border}`, boxShadow: shadow, borderLeft: `4px solid ${st.dot}` }}>
      <div className="flex">
        {/* サムネイル */}
        <div
          className="hidden sm:block flex-shrink-0 w-28 self-stretch"
          style={{
            background: `linear-gradient(135deg, hsl(${site.imgHue},40%,35%) 0%, hsl(${site.imgHue},30%,22%) 100%)`,
          }}
        >
          {/* 工事現場のプレースホルダー */}
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <HardHat size={32} color="#FFF" />
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0 p-5">
          {/* ヘッダー行 */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-1.5 py-0.5 rounded text-sm font-medium"
                style={{ background: typeColor + "18", color: typeColor }}>
                {site.type}
              </span>
              <span style={{ fontSize: 14, color: C.muted }}>{site.code}</span>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-sm font-medium"
                style={{ background: st.bg, color: st.text }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                {site.status}
              </span>
              {site.hasWorkToday && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-sm font-medium"
                  style={{ background: "#F0FDF4", color: C.green }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }} />
                  本日稼働
                </span>
              )}
            </div>
            {/* 進捗 */}
            <div className="flex-shrink-0 text-right">
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 2 }}>施工進捗</div>
              <span className="font-numeric" style={{ fontSize: 26, fontWeight: 800, color: C.amber, lineHeight: 1 }}>
                {site.progressPct}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.amberDk }}>%</span>
            </div>
          </div>

          {/* 現場名・住所 */}
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
            {site.name}
          </h3>
          <div className="flex items-center gap-1 mb-3">
            <MapPin size={11} style={{ color: C.muted }} />
            <span style={{ fontSize: 14, color: C.muted }}>{site.address}</span>
          </div>

          {/* 完工予定 */}
          <div className="flex items-center gap-1.5" style={{ marginBottom: 4 }}>
            <Clock size={11} style={{ color: C.muted }} />
            <span style={{ fontSize: 14, color: C.muted }}>
              完工予定 <span style={{ color: C.sub, fontWeight: 600 }}>{site.endDate.replace(/-/g, "/")}</span>
            </span>
          </div>
        </div>

        {/* 詳細リンク */}
        <div className="flex flex-col items-center justify-center px-3" style={{ borderLeft: `1px solid ${C.border}` }}>
          <Link href={`/kaitai/site/${site.id}`}
            className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors cursor-pointer">
            <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: "#FFF8E6", color: "#F59E0B" }}>
              <ChevronRight size={14} />
            </div>
            <span style={{ fontSize: 14, writingMode: "vertical-rl", color: C.amber }}>詳細</span>
          </Link>
        </div>
      </div>

      {/* フッター（本日作業員） */}
      <div className="flex items-center px-5 py-3"
        style={{ background: "#F8FAFC", borderTop: `1.5px solid ${C.border}` }}>
        <div className="flex items-center gap-1.5">
          <Users size={12} style={{ color: C.sub }} />
          <span className="font-numeric" style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
            {site.workers}名
          </span>
          <span style={{ fontSize: 14, color: C.muted }}>本日稼働</span>
        </div>
      </div>

      {/* 勤怠アクティビティ */}
      {attendance.length > 0 && (
        <div className="px-4 py-3 flex flex-wrap gap-2"
          style={{ background: "#F1F5F9", borderTop: `1px dashed ${C.border}` }}>
          {attendance.map(a => {
            const style = ATTENDANCE_STYLE[a.status];
            const name = MEMBER_NAMES[a.userId] ?? a.userId;
            return (
              <span
                key={a.userId}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{ background: style.bg, color: style.color, fontSize: 13, fontWeight: 600, border: `1px solid ${style.color}22` }}
              >
                <span style={{ fontSize: 12 }}>{style.icon}</span>
                {name}
                <span style={{ fontSize: 12, opacity: 0.75 }}>{fmtTime(a.latestTimestamp)}</span>
                <span style={{ fontSize: 12 }}>{style.label}</span>
              </span>
            );
          })}
        </div>
      )}
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
          <Sun size={36} style={{ color: "#FBBF24" }} />
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

      {/* ── メインコンテンツ ─────────────── */}
      <div className="pb-28 md:pb-8 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* 左：稼働中の現場 + 月次収支 */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* セクションヘッダー */}
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2" style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>
              <span className="w-1 h-4 rounded-full" style={{ background: C.amber }} />
              稼働中の現場
              <span className="px-1.5 py-0.5 rounded text-sm font-medium"
                style={{ background: "#FFFBEB", color: C.amberDk }}>{active.length}件</span>
            </h2>
            <Link href="/kaitai/sites/new"
              className="flex items-center gap-1 text-sm font-medium" style={{ color: C.amber }}>
              全現場を表示 <ArrowUpRight size={11} />
            </Link>
          </div>

          {/* 現場カード一覧 */}
          <div className="flex flex-col gap-5">
            {active.map(site => {
              const statusMap = getSiteStatusMap(attendanceLogs, site.id, today);
              // Build per-user attendance with latest timestamp
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

        {/* 右：ステータス / マップ / 天気 */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <StatusPanel sites={sites} />
          <MapPanel />
          <WeatherPanel />
        </div>
      </div>
    </div>
  );
}
