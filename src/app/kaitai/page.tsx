"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin, Users, HardHat,
  CheckCircle2, Clock, ChevronRight, ArrowUpRight,
  Sun, Cloud, CloudRain, Wind, Wrench, X,
} from "lucide-react";
import { KaitaiLogo } from "./components/kaitai-logo";
import { useAppContext, getSiteStatusMap, type AttendanceStatus, type AttendanceLog } from "./lib/app-context";
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

// ─── 型定義 ──────────────────────────────────────────────────────────────────
type SiteStatus = "着工前" | "解体中" | "完工";

type SiteData = {
  id: string; code: string; name: string; type: string;
  address: string; status: SiteStatus; endDate: string;
  progressPct: number; workers: number; hasWorkToday: boolean;
  contract: number; cost: number;
  breakdown: { waste: number; labor: number; other: number };
  imgHue: string; lat: number; lng: number;
};

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

// MEMBER_NAMES is populated dynamically from API

// 勤怠ステータス表示設定
const ATTENDANCE_STYLE: Record<AttendanceStatus, { icon: string; label: string; bg: string; color: string }> = {
  clock_in:  { icon: "🟢", label: "出勤中",  bg: "#F0FDF4", color: "#166534" },
  break_in:  { icon: "☕",  label: "休憩中",  bg: T.primaryLt, color: "#92400E" },
  break_out: { icon: "🟢", label: "出勤中",  bg: "#F0FDF4", color: "#166534" },
  clock_out: { icon: "🚪", label: "退勤済",  bg: T.bg, color: T.muted },
};

function fmtTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}

// fmt は管理者画面でのみ使用するため削除済み

// ─── KPIカード（横長・クリック可能） ─────────────────────────────────────────
type ModalType = "稼働中" | "本日作業員" | "着工前完工" | null;

function KpiCard({
  label, value, unit, icon: Icon, color, onClick,
}: {
  label: string; value: string; unit?: string;
  icon: React.ElementType; color: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        border: `1px solid ${C.border}`,
        padding: "18px 20px",
        cursor: "pointer",
        width: "100%",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* 左：ラベル＋数値 */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <span style={{ fontSize: 12, fontWeight: 600, color: C.sub, whiteSpace: "nowrap" }}>{label}</span>
          <div className="flex items-baseline gap-1" style={{ flexWrap: "nowrap" }}>
            <span className="font-numeric" style={{ fontSize: value.length > 3 ? 22 : 30, fontWeight: 800, color: C.navy, lineHeight: 1, whiteSpace: "nowrap" }}>
              {value}
            </span>
            {unit && <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, whiteSpace: "nowrap" }}>{unit}</span>}
          </div>
        </div>
        {/* 右：アイコン */}
        <div
          className="flex items-center justify-center flex-shrink-0 rounded-xl"
          style={{ width: 44, height: 44, background: color + "18" }}
        >
          <Icon size={20} style={{ color }} strokeWidth={2.2} />
        </div>
      </div>
    </button>
  );
}

// ─── KPIモーダル ──────────────────────────────────────────────────────────────
function KpiModal({
  type, onClose, sites, attendanceLogs, today, MEMBER_NAMES,
}: {
  type: ModalType;
  onClose: () => void;
  sites: SiteData[];
  attendanceLogs: AttendanceLog[];
  today: string;
  MEMBER_NAMES: Record<string, string>;
}) {
  if (!type) return null;

  const active   = sites.filter(s => s.status === "解体中");
  const upcoming = sites.filter(s => s.status === "着工前");
  const done     = sites.filter(s => s.status === "完工");

  // 本日ログのある全スタッフ
  const todayLogs = attendanceLogs.filter(l => l.timestamp.startsWith(today));
  const workerSet = new Map<string, { userId: string; siteId: string; latestStatus: AttendanceStatus; time: string }>();
  todayLogs.forEach(l => {
    const prev = workerSet.get(l.userId);
    if (!prev || l.timestamp > prev.time) {
      workerSet.set(l.userId, { userId: l.userId, siteId: l.siteId, latestStatus: l.status, time: l.timestamp });
    }
  });
  const todayWorkers = Array.from(workerSet.values());

  let title = "";
  let content: React.ReactNode = null;

  if (type === "稼働中") {
    title = "稼働中の現場・スタッフ";
    content = (
      <div className="flex flex-col gap-4">
        {active.length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>稼働中の現場はありません</p>}
        {active.map(site => {
          const siteMap = getSiteStatusMap(attendanceLogs, site.id, today);
          const staff = Array.from(siteMap.entries());
          return (
            <div key={site.id} style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ background: T.primaryLt, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{site.name}</span>
                <span style={{ fontSize: 12, color: C.sub }}>{site.type}</span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {staff.length === 0
                  ? <p style={{ fontSize: 13, color: C.muted }}>本日の作業員なし</p>
                  : staff.map(([userId, status]) => {
                      const sty = ATTENDANCE_STYLE[status];
                      const name = MEMBER_NAMES[userId] ?? userId;
                      return (
                        <div key={userId} className="flex items-center gap-3">
                          <div className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
                            style={{ width: 34, height: 34, fontSize: 13, background: sty.color, color: "#fff" }}>
                            {name.charAt(0)}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{name}</p>
                            <p style={{ fontSize: 11, color: sty.color, fontWeight: 600 }}>{sty.label}</p>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            </div>
          );
        })}
      </div>
    );
  } else if (type === "本日作業員") {
    title = "本日の作業員一覧";
    content = (
      <div className="flex flex-col gap-2">
        {todayWorkers.length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>本日の作業記録はありません</p>}
        {todayWorkers.map(w => {
          const sty = ATTENDANCE_STYLE[w.latestStatus];
          const name = MEMBER_NAMES[w.userId] ?? w.userId;
          const site = sites.find(s => s.id === w.siteId);
          return (
            <div key={w.userId} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ border: `1px solid ${C.border}`, background: C.card }}>
              <div className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
                style={{ width: 38, height: 38, fontSize: 14, background: sty.color, color: "#fff" }}>
                {name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{name}</p>
                <p style={{ fontSize: 12, color: C.sub }}>{site?.name ?? w.siteId}</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg font-bold"
                style={{ fontSize: 12, background: sty.bg, color: sty.color }}>{sty.label}</span>
            </div>
          );
        })}
        {/* モックで10名表示（デモ用追加） */}
        {todayWorkers.length === 0 && (
          <div className="pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>デモ用スタッフデータがありません</p>
          </div>
        )}
      </div>
    );
  } else if (type === "着工前完工") {
    title = "現場ステータス";
    content = (
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: C.blue }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: C.blue }}>着工前 ({upcoming.length}件)</span>
          </div>
          {upcoming.length === 0
            ? <p style={{ fontSize: 13, color: C.muted }}>なし</p>
            : upcoming.map(s => (
                <Link key={s.id} href={`/kaitai/site/${s.id}`} onClick={onClose}>
                  <div className="flex items-center justify-between px-4 py-3.5 rounded-xl mb-2"
                    style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{s.name}</p>
                      <p style={{ fontSize: 12, color: C.sub }}>{s.endDate.replace(/-/g, "/")} 着工予定</p>
                    </div>
                    <ChevronRight size={15} style={{ color: C.blue }} />
                  </div>
                </Link>
              ))
          }
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: C.green }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>完工済 ({done.length}件)</span>
          </div>
          {done.length === 0
            ? <p style={{ fontSize: 13, color: C.muted }}>なし</p>
            : done.map(s => (
                <Link key={s.id} href={`/kaitai/site/${s.id}`} onClick={onClose}>
                  <div className="flex items-center justify-between px-4 py-3.5 rounded-xl mb-2"
                    style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.sub }}>{s.name}</p>
                      <p style={{ fontSize: 12, color: C.muted }}>{s.endDate.replace(/-/g, "/")} 引渡済</p>
                    </div>
                    <CheckCircle2 size={15} style={{ color: C.green }} />
                  </div>
                </Link>
              ))
          }
        </div>
      </div>
    );
  }

  return (
    <>
      {/* オーバーレイ */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
        }}
      />
      {/* モーダル */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 0 env(safe-area-inset-bottom, 0)",
        pointerEvents: "none",
      }}>
        <div style={{
          width: "100%", maxWidth: 540,
          background: C.card,
          borderRadius: "20px 20px 0 0",
          maxHeight: "80vh",
          overflowY: "auto",
          pointerEvents: "auto",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        }}>
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4"
            style={{ borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.card, zIndex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>{title}</h3>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: T.bg, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <X size={16} style={{ color: C.sub }} />
            </button>
          </div>
          {/* コンテンツ */}
          <div className="p-5">{content}</div>
        </div>
      </div>
    </>
  );
}

// ─── 現場カード（横長） ────────────────────────────────────────────────────────
interface SiteAttendance {
  userId: string;
  status: AttendanceStatus;
  latestTimestamp: string;
}

function SiteCard({ site, attendance, MEMBER_NAMES }: { site: SiteData; attendance: SiteAttendance[]; MEMBER_NAMES: Record<string, string> }) {
  const st = STATUS_STYLE[site.status];
  const typeColor = TYPE_COLOR[site.type] ?? C.blue;

  return (
    <div
      className="overflow-hidden"
      style={{
        background: C.card,
        border: `1.5px solid ${C.border}`,
        borderLeft: `6px solid ${st.dot}`,
        borderRadius: 16,
      }}
    >
      {/* ─ メイン本体 ─ */}
      <div className="flex">

        {/* サムネイル（ダークパネル） */}
        <div
          className="hidden md:flex flex-col flex-shrink-0 items-center justify-center gap-2"
          style={{ width: 152, minHeight: 180, background: "#1E293B" }}
        >
          <HardHat size={36} color="rgba(255,255,255,0.18)" />
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em" }}>
            SITE PHOTO
          </span>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0 px-6 py-5">

          {/* バッジ行 + 進捗% */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-3 py-1.5 rounded-lg font-bold"
                style={{ background: typeColor + "18", color: typeColor, fontSize: 13 }}
              >
                {site.type}
              </span>
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold"
                style={{ background: st.bg, color: st.text, fontSize: 13 }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: st.dot }} />
                {site.status}
              </span>
              {site.hasWorkToday && (
                <span
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold"
                  style={{ background: "#F0FDF4", color: C.green, fontSize: 13 }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: C.green }} />
                  本日稼働
                </span>
              )}
            </div>
            {/* 施工進捗率 */}
            <div className="flex-shrink-0 text-right">
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 1 }}>施工進捗率</div>
              <div className="flex items-baseline gap-0.5">
                <span style={{ fontSize: 40, fontWeight: 800, color: C.amber, lineHeight: 1 }}>
                  {site.progressPct}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.amberDk }}>%</span>
              </div>
            </div>
          </div>

          {/* 現場名 */}
          <h3 style={{ fontSize: 24, fontWeight: 800, color: C.navy, marginBottom: 10, lineHeight: 1.2 }}>
            {site.name}
          </h3>

          {/* メタ情報 */}
          <div className="flex flex-wrap items-center gap-5 mb-4">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} style={{ color: C.muted }} />
              <span style={{ fontSize: 13, color: C.muted }}>{site.address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} style={{ color: C.muted }} />
              <span style={{ fontSize: 13, color: C.sub }}>
                完工予定&nbsp;<strong style={{ color: C.text }}>{site.endDate.replace(/-/g, "/")}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={13} style={{ color: C.green }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>
                {site.workers}名稼働中
              </span>
            </div>
          </div>

          {/* 進捗バー */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: T.bg }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${site.progressPct}%`, background: st.dot }}
            />
          </div>

        </div>
      </div>

      {/* ─ 本日のスタッフ + 詳細ボタン ─ */}
      <div
        className="px-6 py-5"
        style={{ background: T.bg, borderTop: `1px solid ${C.border}` }}
      >
        {/* ヘッダー行 */}
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "0.07em" }}>
            本日のスタッフ
          </p>
          <span style={{ fontSize: 12, color: C.muted }}>{site.code}</span>
        </div>

        {/* チップ群 + 詳細ボタン */}
        <div className="flex items-end gap-4">
          <div className="flex flex-wrap gap-2.5 flex-1">
            {attendance.length > 0 ? attendance.map(a => {
              const sty = ATTENDANCE_STYLE[a.status];
              const name = MEMBER_NAMES[a.userId] ?? a.userId;
              const isBreak = a.status === "break_in";
              return (
                <div
                  key={a.userId}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                  style={{ background: C.card, border: `1.5px solid ${C.border}` }}
                >
                  {/* アバター */}
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
                    style={{
                      width: 36, height: 36, fontSize: 14,
                      background: isBreak ? T.bg : sty.color,
                      color: isBreak ? C.muted : "#fff",
                      border: isBreak ? `1.5px solid ${C.border}` : "none",
                    }}
                  >
                    {isBreak ? <span style={{ fontSize: 16 }}>☕</span> : name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{name}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: sty.color, marginTop: 2 }}>
                      {sty.label}&nbsp;·&nbsp;{fmtTime(a.latestTimestamp)}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <p style={{ fontSize: 13, color: C.muted }}>本日の作業員はいません</p>
            )}
          </div>

          {/* 詳細ボタン */}
          <Link
            href={`/kaitai/site/${site.id}`}
            className="flex-shrink-0 flex items-center gap-2 rounded-xl font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ background: C.amber, color: T.surface, fontSize: 14, padding: "14px 24px", whiteSpace: "nowrap" }}
          >
            この現場の詳細を見る
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>

    </div>
  );
}

// ─── 右パネル：ステータス管理 ─────────────────────────────────────────────────
function StatusPanel({ sites }: { sites: SiteData[] }) {
  const upcoming = sites.filter(s => s.status === "着工前");
  const done = sites.filter(s => s.status === "完工");
  return (
    <div className="bg-white rounded-xl" style={{ border: `1.5px solid ${C.border}`, boxShadow: shadow }}>
      <div className="px-5 py-4" style={{ borderBottom: `1.5px solid ${C.border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>ステータス管理</h3>
      </div>
      <div className="px-5 py-5 flex flex-col gap-3">
        {/* 着工前 */}
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: C.blue }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: C.blue }}>
            着工前 ({upcoming.length})
          </span>
        </div>
        {upcoming.map(s => (
          <Link key={s.id} href={`/kaitai/site/${s.id}`}>
            <div className="flex items-center justify-between px-4 py-3.5 rounded-lg transition-colors hover:bg-blue-50"
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
          <span className="ml-auto px-2.5 py-1 rounded text-sm font-bold"
            style={{ background: "#F0FDF4", color: C.green, border: "1px solid #BBF7D0" }}>今月</span>
        </div>
        {done.map(s => (
          <Link key={s.id} href={`/kaitai/site/${s.id}`}>
            <div className="flex items-center justify-between px-4 py-3.5 rounded-lg transition-colors hover:bg-green-50"
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
function MapPanel({ sites }: { sites: SiteData[] }) {
  const mapSites = sites.map(s => ({
    id: s.id, name: s.name, lat: s.lat, lng: s.lng, status: s.status, address: s.address,
  }));
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, boxShadow: shadow }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1.5px solid ${C.border}` }}>
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
      <div className="px-5 py-4" style={{ borderBottom: `1.5px solid ${C.border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>本日の天気（世田谷区）</h3>
      </div>
      <div className="px-5 pt-4 pb-3">
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
            <div key={label} className="flex flex-col items-center gap-1.5 py-2">
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

// Structure type → display name mapping
const STRUCTURE_TYPE_LABEL: Record<string, string> = {
  "木造": "木造解体", "RC": "RC解体", "鉄骨": "鉄骨解体", "S造": "鉄骨解体",
};

export default function KaitaiHome() {
  const { attendanceLogs } = useAppContext();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [sites, setSites] = useState<SiteData[]>([]);
  const [MEMBER_NAMES, setMemberNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/kaitai/sites", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.sites) return;
        const mapped: SiteData[] = data.sites.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          code: (s.id as string).slice(-6).toUpperCase(),
          name: s.name as string,
          type: STRUCTURE_TYPE_LABEL[s.structureType as string] ?? (s.structureType ? `${s.structureType}解体` : "解体工事"),
          address: s.address as string,
          status: (s.status === "施工中" ? "解体中" : s.status) as SiteStatus,
          endDate: (s.endDate as string) ?? "",
          progressPct: (s.progressPct as number) ?? 0,
          workers: 0,
          hasWorkToday: false,
          contract: (s.contractAmount as number) ?? 0,
          cost: (s.costAmount as number) ?? 0,
          breakdown: { waste: 0, labor: 0, other: 0 },
          imgHue: "",
          lat: (s.lat as number) ?? 34.6617,
          lng: (s.lng as number) ?? 133.9175,
        }));
        setSites(mapped);
      })
      .catch(() => {});

    fetch("/api/kaitai/members", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.members) return;
        const names: Record<string, string> = {};
        for (const m of data.members) names[m.id] = m.name;
        setMemberNames(names);
      })
      .catch(() => {});
  }, []);

  const now = new Date();
  const wd = ["日", "月", "火", "水", "木", "金", "土"][now.getDay()];
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${wd}）`;
  const today = now.toISOString().slice(0, 10);

  const active   = sites.filter(s => s.status === "解体中");
  const upcoming = sites.filter(s => s.status === "着工前");
  const done     = sites.filter(s => s.status === "完工");
  const workers  = active.reduce((s, x) => s + x.workers, 0);

  const kpis: { label: string; value: string; unit: string; icon: React.ElementType; color: string; modal: ModalType }[] = [
    { label: "稼働中",        value: `${active.length}`,                      unit: "件", icon: Wrench, color: C.blue,      modal: "稼働中" },
    { label: "本日作業員",    value: `${workers}`,                             unit: "名", icon: Users,  color: C.green,     modal: "本日作業員" },
    { label: "着工前/完工", value: `${upcoming.length}/${done.length}`,   unit: "件", icon: Clock,  color: "#8B5CF6",   modal: "着工前完工" },
  ];

  const mapSites = sites.map(s => ({
    id: s.id, name: s.name, lat: s.lat, lng: s.lng, status: s.status, address: s.address,
  }));

  return (
    <div className="flex flex-col">

      {/* ── KPIモーダル ──────────────────── */}
      <KpiModal
        type={activeModal}
        onClose={() => setActiveModal(null)}
        sites={sites}
        attendanceLogs={attendanceLogs}
        today={today}
        MEMBER_NAMES={MEMBER_NAMES}
      />

      {/* ── モバイルヘッダー ─────────────── */}
      <header className="md:hidden px-4 pt-8 pb-3 flex items-center justify-between bg-white"
        style={{ borderBottom: `1px solid ${C.border}` }}>
        <KaitaiLogo iconSize={28} textSize={18} />
        <span style={{ fontSize: 14, color: C.muted }}>{dateStr}</span>
      </header>

      {/* ── KPI行 ────────────────────────── */}
      <div className="pt-5 pb-4">
        <div className="grid grid-cols-3 gap-3">
          {kpis.map(kpi => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              unit={kpi.unit}
              icon={kpi.icon}
              color={kpi.color}
              onClick={() => setActiveModal(kpi.modal)}
            />
          ))}
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
                className="px-3 py-1.5 rounded-full font-bold"
                style={{ background: T.primaryLt, color: C.amberDk, fontSize: 13 }}
              >
                {active.length}件
              </span>
            </h2>
            <Link href="/kaitai/schedule"
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
              return <SiteCard key={site.id} site={site} attendance={siteAttendance} MEMBER_NAMES={MEMBER_NAMES} />;
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
