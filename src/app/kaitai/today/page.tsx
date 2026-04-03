"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Phone, MessageSquare, MapPin, Users, Crown,
  Clock, RefreshCw, ChevronRight, Map, List,
  CheckCircle2, PlayCircle, AlertCircle, Camera,
  Wifi, Activity,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkStatus = "準備中" | "作業中" | "完了";

type Member = {
  id: string;
  name: string;
  avatar: string;
  isLead: boolean;
  phone: string;
};

type SiteReport = {
  id: string;
  name: string;
  address: string;
  status: WorkStatus;
  startTime: string | null;
  endTime: string | null;
  members: Member[];
  wasteToday: number;
  wasteCost: number;
  lastActivity: string;
  lastActivityTime: string;
  hasPhoto: boolean;
  photoEmoji: string;
  // Map position (0–100 relative in Tokyo area)
  mapX: number;
  mapY: number;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_REPORTS: SiteReport[] = [
  {
    id: "s1",
    name: "山田邸解体工事",
    address: "世田谷区豪徳寺2-14-5",
    status: "完了",
    startTime: "08:15",
    endTime: "17:23",
    members: [
      { id: "m1", name: "田中 義雄", avatar: "田", isLead: true,  phone: "090-1234-5678" },
      { id: "m2", name: "鈴木 誠",   avatar: "鈴", isLead: false, phone: "090-2345-6789" },
      { id: "m3", name: "佐藤 隆",   avatar: "佐", isLead: false, phone: "090-3456-7890" },
      { id: "m4", name: "渡辺 健",   avatar: "渡", isLead: false, phone: "090-4567-8901" },
    ],
    wasteToday: 4.2,
    wasteCost: 67_200,
    lastActivity: "作業終了報告",
    lastActivityTime: "17:23",
    hasPhoto: true,
    photoEmoji: "🏚",
    mapX: 32,
    mapY: 56,
  },
  {
    id: "s2",
    name: "旧田中倉庫解体",
    address: "川崎市幸区堀川町580",
    status: "作業中",
    startTime: "07:50",
    endTime: null,
    members: [
      { id: "m5", name: "山本 浩二", avatar: "山", isLead: true,  phone: "090-5678-9012" },
      { id: "m6", name: "中村 博",   avatar: "中", isLead: false, phone: "090-6789-0123" },
      { id: "m7", name: "小林 清",   avatar: "小", isLead: false, phone: "090-7890-1234" },
      { id: "m8", name: "加藤 哲",   avatar: "加", isLead: false, phone: "090-8901-2345" },
      { id: "m9", name: "松田 修",   avatar: "松", isLead: false, phone: "090-9012-3456" },
      { id: "m10",name: "伊藤 勝",  avatar: "伊", isLead: false, phone: "090-0123-4567" },
    ],
    wasteToday: 8.6,
    wasteCost: 154_800,
    lastActivity: "産廃搬出・積載写真",
    lastActivityTime: "15:47",
    hasPhoto: true,
    photoEmoji: "🏭",
    mapX: 41,
    mapY: 72,
  },
  {
    id: "s3",
    name: "松本アパート解体",
    address: "さいたま市浦和区常盤6-4-21",
    status: "準備中",
    startTime: null,
    endTime: null,
    members: [
      { id: "m2", name: "鈴木 誠",   avatar: "鈴", isLead: true,  phone: "090-2345-6789" },
      { id: "m11",name: "木村 仁",   avatar: "木", isLead: false, phone: "090-1111-2222" },
    ],
    wasteToday: 0,
    wasteCost: 0,
    lastActivity: "着工前確認",
    lastActivityTime: "09:05",
    hasPhoto: false,
    photoEmoji: "🏠",
    mapX: 47,
    mapY: 22,
  },
];

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<WorkStatus, {
  label: string; bg: string; fg: string; border: string;
  icon: React.ElementType; dot: string;
}> = {
  準備中: {
    label: "準備中",
    bg: "rgba(99,102,241,0.08)",
    fg: "#818CF8",
    border: "rgba(99,102,241,0.25)",
    icon: AlertCircle,
    dot: "#818CF8",
  },
  作業中: {
    label: "作業中",
    bg: "rgba(34,197,94,0.08)",
    fg: "#4ADE80",
    border: "rgba(34,197,94,0.25)",
    icon: PlayCircle,
    dot: "#4ADE80",
  },
  完了: {
    label: "完了",
    bg: "rgba(100,116,139,0.08)",
    fg: "#64748B",
    border: "rgba(100,116,139,0.2)",
    icon: CheckCircle2,
    dot: "#64748B",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiveBadge({ time }: { time: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          background: "#4ADE80",
          boxShadow: "0 0 0 3px rgba(74,222,128,0.25)",
          animation: "pulse 2s infinite",
        }}
      />
      <span style={{ fontSize: 14, fontWeight: 700, color: "#4ADE80" }}>
        LIVE
      </span>
      <span style={{ fontSize: 14, color: "#475569" }}>
        更新 {time}
      </span>
    </div>
  );
}

function MemberAvatars({ members }: { members: Member[] }) {
  const lead   = members.find((m) => m.isLead);
  const others = members.filter((m) => !m.isLead);
  const maxShow = 3;
  const overflow = others.length > maxShow ? others.length - maxShow : 0;

  return (
    <div className="flex items-center gap-1.5">
      {/* Lead */}
      {lead && (
        <div className="relative flex-shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: "rgba(251,191,36,0.15)", color: "#FBBF24", border: "1.5px solid rgba(251,191,36,0.4)" }}
          >
            {lead.avatar}
          </div>
          <Crown
            size={9}
            fill="#FBBF24"
            style={{ color: "#FBBF24", position: "absolute", top: -4, right: -2 }}
          />
        </div>
      )}
      {/* Others */}
      {others.slice(0, maxShow).map((m) => (
        <div
          key={m.id}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: "#1A2535", color: "#94A3B8", border: "1px solid #2D3E54" }}
        >
          {m.avatar}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: "#1A2535", color: "#64748B", border: "1px solid #2D3E54" }}
        >
          +{overflow}
        </div>
      )}
      <span style={{ fontSize: 14, marginLeft: 4, color: "#64748B" }}>
        計{members.length}名
      </span>
    </div>
  );
}

// ─── Map view ─────────────────────────────────────────────────────────────────

function MapView({ sites, selected, onSelect }: {
  sites: SiteReport[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        height: 260,
        background: "#0C1A2E",
        border: "1px solid #2D3E54",
      }}
    >
      {/* Map background — stylized road grid */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 260"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Water / bay area (Tokyo Bay) */}
        <ellipse cx="380" cy="200" rx="120" ry="80" fill="rgba(30,58,95,0.6)" />
        <ellipse cx="360" cy="240" rx="100" ry="60" fill="rgba(30,58,95,0.5)" />

        {/* Grid roads */}
        {[40, 80, 120, 160, 200, 240, 280, 320, 360].map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={260}
            stroke="rgba(45,62,84,0.5)" strokeWidth={0.5} />
        ))}
        {[40, 80, 120, 160, 200, 240].map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={400} y2={y}
            stroke="rgba(45,62,84,0.5)" strokeWidth={0.5} />
        ))}

        {/* Major roads */}
        <line x1="0" y1="130" x2="400" y2="130" stroke="rgba(45,62,84,0.9)" strokeWidth={2} />
        <line x1="200" y1="0"  x2="200" y2="260" stroke="rgba(45,62,84,0.9)" strokeWidth={2} />
        <line x1="0"   y1="80"  x2="400" y2="160" stroke="rgba(45,62,84,0.7)" strokeWidth={1.5} />
        <line x1="0"   y1="200" x2="300" y2="60"  stroke="rgba(45,62,84,0.7)" strokeWidth={1.5} />

        {/* Expressway */}
        <path d="M 20 200 Q 100 180 180 140 Q 240 110 320 90 Q 360 80 400 70"
          stroke="rgba(249,115,22,0.3)" strokeWidth={3} fill="none" />

        {/* Site connection lines */}
        {sites.filter(s => s.status === "作業中").map((s) => (
          <line
            key={`line-${s.id}`}
            x1={s.mapX * 4}
            y1={s.mapY * 2.6}
            x2={200}
            y2={130}
            stroke="rgba(74,222,128,0.15)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}

        {/* Site markers */}
        {sites.map((site) => {
          const cfg = STATUS_CONFIG[site.status];
          const x = site.mapX * 4;
          const y = site.mapY * 2.6;
          const isSelected = selected === site.id;
          const r = isSelected ? 14 : 10;

          return (
            <g key={site.id} onClick={() => onSelect(site.id)} style={{ cursor: "pointer" }}>
              {/* Pulse ring for 作業中 */}
              {site.status === "作業中" && (
                <>
                  <circle cx={x} cy={y} r={r + 8} fill="none"
                    stroke="rgba(74,222,128,0.2)" strokeWidth={2} />
                  <circle cx={x} cy={y} r={r + 4} fill="none"
                    stroke="rgba(74,222,128,0.15)" strokeWidth={1.5} />
                </>
              )}
              {/* Marker circle */}
              <circle cx={x} cy={y} r={r} fill={cfg.dot} opacity={isSelected ? 1 : 0.85} />
              <circle cx={x} cy={y} r={r - 3} fill="rgba(15,25,40,0.6)" />
              {/* Label */}
              <text
                x={x}
                y={y + r + 14}
                textAnchor="middle"
                fontSize={isSelected ? 9 : 8}
                fontWeight={isSelected ? "700" : "500"}
                fill={isSelected ? "#F1F5F9" : "#94A3B8"}
              >
                {site.name.length > 7 ? site.name.slice(0, 7) + "…" : site.name}
              </text>
            </g>
          );
        })}

        {/* Compass */}
        <text x={14} y={20} fontSize={10} fill="rgba(148,163,184,0.5)" fontWeight="700">N</text>
        <line x1={17} y1={22} x2={17} y2={32} stroke="rgba(148,163,184,0.4)" strokeWidth={1} />
      </svg>

      {/* Legend */}
      <div
        className="absolute bottom-3 left-3 flex items-center gap-3 px-3 py-1.5 rounded-xl"
        style={{ background: "rgba(15,25,40,0.85)", border: "1px solid #2D3E54" }}
      >
        {(["作業中", "完了", "準備中"] as WorkStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: STATUS_CONFIG[s].dot }}
            />
            <span style={{ fontSize: 14, color: "#64748B" }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Area label */}
      <div
        className="absolute top-3 right-3 px-2 py-1 rounded-lg"
        style={{ background: "rgba(15,25,40,0.7)" }}
      >
        <span style={{ fontSize: 14, color: "#475569" }}>東京・首都圏</span>
      </div>
    </div>
  );
}

// ─── Site card ────────────────────────────────────────────────────────────────

function SiteCard({
  site,
  highlight,
  onSelect,
}: {
  site: SiteReport;
  highlight: boolean;
  onSelect: () => void;
}) {
  const cfg  = STATUS_CONFIG[site.status];
  const lead = site.members.find((m) => m.isLead);
  const StatusIcon = cfg.icon;

  return (
    <div
      onClick={onSelect}
      className="rounded-2xl overflow-hidden transition-all cursor-pointer"
      style={{
        background: highlight ? "rgba(249,115,22,0.05)" : "#1A2535",
        border: highlight ? "1.5px solid rgba(249,115,22,0.3)" : `1px solid ${cfg.border}`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {/* Photo / emoji thumbnail */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 relative overflow-hidden"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          {site.photoEmoji}
          {site.hasPhoto && (
            <div
              className="absolute bottom-0 right-0 w-4 h-4 rounded-tl-lg flex items-center justify-center"
              style={{ background: "rgba(249,115,22,0.9)" }}
            >
              <Camera size={8} style={{ color: "#fff" }} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ fontSize: 14, fontWeight: 700, background: cfg.bg, color: cfg.fg }}
            >
              {site.status === "作業中" && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: cfg.fg }}
                />
              )}
              <StatusIcon size={12} />
              {cfg.label}
            </div>
            {site.startTime && (
              <span style={{ fontSize: 14, color: "#475569" }}>
                {site.startTime}〜{site.endTime ?? ""}
              </span>
            )}
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9" }} className="truncate">
            {site.name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={12} style={{ color: "#475569" }} />
            <span style={{ fontSize: 14, color: "#475569" }} className="truncate">{site.address}</span>
          </div>
        </div>

        {site.wasteToday > 0 && (
          <div className="text-right flex-shrink-0">
            <p style={{ fontSize: 16, fontWeight: 700, color: "#F87171" }}>
              ¥{(site.wasteCost / 10_000).toFixed(1)}万
            </p>
            <p style={{ fontSize: 14, color: "#64748B" }}>
              産廃 {site.wasteToday}㎥
            </p>
          </div>
        )}
      </div>

      {/* Members row */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <MemberAvatars members={site.members} />
        <div className="flex items-center gap-1" style={{ fontSize: 14, color: "#475569" }}>
          <Clock size={12} />
          <span>{site.lastActivityTime} {site.lastActivity}</span>
        </div>
      </div>

      {/* Contact row — only show lead when site is active */}
      {lead && site.status !== "準備中" && (
        <div
          className="flex items-center gap-2 px-4 py-2.5"
          style={{ borderTop: "1px solid #0F1928" }}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}
          >
            {lead.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <span style={{ fontSize: 15, fontWeight: 600, color: "#F1F5F9" }}>
              {lead.name}
            </span>
            <span style={{ fontSize: 14, marginLeft: 6, color: "#64748B" }}>
              責任者
            </span>
          </div>
          {/* One-tap call */}
          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95"
              style={{
                fontSize: 14, fontWeight: 600,
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.3)",
                color: "#4ADE80",
              }}
            >
              <Phone size={14} fill="rgba(74,222,128,0.2)" />
              電話
            </button>
          </a>
          {/* One-tap message */}
          <a href={`sms:${lead.phone}`} onClick={(e) => e.stopPropagation()}>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95"
              style={{
                fontSize: 14, fontWeight: 600,
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#818CF8",
              }}
            >
              <MessageSquare size={14} />
              SMS
            </button>
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TodayDashboard() {
  const [view, setView]           = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastSync, setLastSync]   = useState(() => {
    const n = new Date();
    return `${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`;
  });
  const [syncing, setSyncing]     = useState(false);

  // Auto-refresh every 60 seconds (mock)
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setLastSync(`${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  function handleRefresh() {
    setSyncing(true);
    setTimeout(() => {
      const n = new Date();
      setLastSync(`${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`);
      setSyncing(false);
    }, 800);
  }

  // Summary counts
  const preparing = MOCK_REPORTS.filter((s) => s.status === "準備中").length;
  const working   = MOCK_REPORTS.filter((s) => s.status === "作業中").length;
  const done      = MOCK_REPORTS.filter((s) => s.status === "完了").length;
  const totalWorkers = MOCK_REPORTS.reduce((sum, s) => sum + s.members.length, 0);
  const totalWaste   = MOCK_REPORTS.reduce((sum, s) => sum + s.wasteToday, 0);
  const totalWasteCost = MOCK_REPORTS.reduce((sum, s) => sum + s.wasteCost, 0);

  // Sorted: 作業中 first, then 準備中, then 完了
  const ORDER: Record<WorkStatus, number> = { 作業中: 0, 準備中: 1, 完了: 2 };
  const sorted = [...MOCK_REPORTS].sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日（${"日月火水木金土"[today.getDay()]}）`;

  return (
    <div className="py-6 pb-28 md:pb-8 flex flex-col gap-5">

      {/* ── Header ── */}
      <section
        className="rounded-xl p-5"
        style={{
          background: "linear-gradient(160deg, #0F1928 0%, #111E30 100%)",
          border: "1px solid #2D3E54",
        }}
      >
        <Link
          href="/kaitai"
          className="inline-flex items-center gap-1.5 mb-3 text-sm"
          style={{ color: "#64748B" }}
        >
          <ArrowLeft size={15} /> 現場一覧
        </Link>

        <div className="flex items-start justify-between mb-4">
          <div>
            <p style={{ fontSize: 14, marginBottom: 2, color: "#64748B" }}>{dateStr}</p>
            <h1 className="text-xl font-bold" style={{ color: "#F1F5F9" }}>
              本日の稼働状況
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LiveBadge time={lastSync} />
            <button
              onClick={handleRefresh}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: "#1A2535", border: "1px solid #2D3E54" }}
            >
              <RefreshCw
                size={14}
                style={{
                  color: "#64748B",
                  animation: syncing ? "spin 0.8s linear infinite" : "none",
                }}
              />
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "作業中",   value: working,           color: "#4ADE80", sub: "現場" },
            { label: "準備中",   value: preparing,         color: "#818CF8", sub: "現場" },
            { label: "完了",     value: done,              color: "#64748B", sub: "現場" },
            { label: "稼働人数", value: totalWorkers,      color: "#F97316", sub: "名" },
          ].map(({ label, value, color, sub }) => (
            <div
              key={label}
              className="rounded-2xl p-2.5 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #2D3E54" }}
            >
              <p style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color }}>
                {value}
                <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 2, color: "#94A3B8" }}>{sub}</span>
              </p>
              <p style={{ fontSize: 14, marginTop: 4, color: "#64748B" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Waste total */}
        {totalWaste > 0 && (
          <div
            className="mt-3 flex items-center justify-between px-4 py-2.5 rounded-2xl"
            style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            <div className="flex items-center gap-2">
              <Activity size={13} style={{ color: "#F87171" }} />
              <span style={{ fontSize: 14, color: "#94A3B8" }}>
                本日の産廃計：
                <span style={{ fontWeight: 700, marginLeft: 4, color: "#F1F5F9" }}>{totalWaste} ㎥</span>
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: "#F87171" }}>
              ¥{totalWasteCost.toLocaleString()}
            </span>
          </div>
        )}
      </section>

      {/* ── View toggle ── */}
      <div>
        <div
          className="flex rounded-2xl p-1 gap-1"
          style={{ background: "#1A2535", border: "1px solid #2D3E54" }}
        >
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all"
              style={{
                fontSize: 15, fontWeight: 600,
                ...(view === v
                  ? { background: "rgba(249,115,22,0.15)", color: "#F97316" }
                  : { color: "#64748B" })
              }}
            >
              {v === "list" ? <List size={14} /> : <Map size={14} />}
              {v === "list" ? "リスト表示" : "マップ表示"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">

        {/* ── Map view ── */}
        {view === "map" && (
          <>
            <MapView
              sites={MOCK_REPORTS}
              selected={selectedId}
              onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
            />
            {selectedId && (
              (() => {
                const site = MOCK_REPORTS.find((s) => s.id === selectedId);
                return site ? (
                  <SiteCard
                    key={site.id}
                    site={site}
                    highlight
                    onSelect={() => setSelectedId(null)}
                  />
                ) : null;
              })()
            )}
            {!selectedId && (
              <p className="text-center" style={{ fontSize: 14, color: "#475569" }}>
                マーカーをタップして現場の詳細を確認
              </p>
            )}
          </>
        )}

        {/* ── List view ── */}
        {view === "list" && (
          <>
            {/* 作業中 section */}
            {working > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: "#4ADE80", boxShadow: "0 0 0 3px rgba(74,222,128,0.2)" }}
                  />
                  <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#4ADE80" }}>
                    作業中 · {working}現場
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {sorted
                    .filter((s) => s.status === "作業中")
                    .map((site) => (
                      <SiteCard
                        key={site.id}
                        site={site}
                        highlight={selectedId === site.id}
                        onSelect={() => setSelectedId(selectedId === site.id ? null : site.id)}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* 準備中 section */}
            {preparing > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: "#818CF8" }}
                  />
                  <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#818CF8" }}>
                    準備中 · {preparing}現場
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {sorted
                    .filter((s) => s.status === "準備中")
                    .map((site) => (
                      <SiteCard
                        key={site.id}
                        site={site}
                        highlight={selectedId === site.id}
                        onSelect={() => setSelectedId(selectedId === site.id ? null : site.id)}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* 完了 section */}
            {done > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: "#475569" }}
                  />
                  <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#64748B" }}>
                    完了 · {done}現場
                  </p>
                </div>
                <div className="flex flex-col gap-3 opacity-80">
                  {sorted
                    .filter((s) => s.status === "完了")
                    .map((site) => (
                      <SiteCard
                        key={site.id}
                        site={site}
                        highlight={selectedId === site.id}
                        onSelect={() => setSelectedId(selectedId === site.id ? null : site.id)}
                      />
                    ))}
                </div>
              </section>
            )}
          </>
        )}

      </div>
    </div>
  );
}
