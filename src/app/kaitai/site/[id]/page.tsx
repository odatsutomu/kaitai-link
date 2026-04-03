"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, MapPin, Calendar, Users, Clock,
  Truck, Camera, FileText, CheckCircle2, ChevronRight,
  X, AlertTriangle, Shield,
} from "lucide-react";
import { T } from "../../lib/design-tokens";

// ─── Types ────────────────────────────────────────────────────────────────────

type SiteStatus = "着工前" | "解体中" | "完工";

type StaffLog = {
  name: string;
  avatar: string;
  role: string;
  clockIn: string;
  clockOut: string | null;
  color: string;
};

type TroubleLog = {
  type: string;
  severity: "軽微" | "中程度" | "重大";
  detail: string;
};

type DailyLog = {
  date: string;
  dateLabel: string;
  mainWork: string[];
  wasteM3: number;
  wasteItems: string[];
  photos: number;
  staff: StaffLog[];
  troubles: TroubleLog[];
  safetyNote: string;
};

type Site = {
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
  workLogs: DailyLog[];
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
  green: "#10B981", red: "#EF4444",
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SITES: Record<string, Site> = {
  s1: {
    id: "s1", name: "山田邸解体工事",
    address: "東京都世田谷区豪徳寺2-14-5",
    status: "解体中", startDate: "2026-03-18", endDate: "2026-04-10",
    progressPct: 68, contractAmount: 3_200_000,
    wasteDisposalCost: 840_000, laborCost: 760_000, otherCost: 240_000,
    todayWorkers: 4,
    workLogs: [
      {
        date: "2026-04-02", dateLabel: "4月2日（木）",
        mainWork: ["内装解体", "電気設備撤去"],
        wasteM3: 4.2, wasteItems: ["木材", "石膏ボード", "電線類"],
        photos: 3,
        staff: [
          { name: "田中 義雄", avatar: "田", role: "職長",  clockIn: "08:05", clockOut: "17:20", color: T.primary },
          { name: "佐藤 健太", avatar: "佐", role: "作業員", clockIn: "08:10", clockOut: "17:15", color: "#EF4444" },
          { name: "鈴木 大地", avatar: "鈴", role: "作業員", clockIn: "08:00", clockOut: "17:30", color: "#10B981" },
          { name: "山本 拓也", avatar: "山", role: "作業員", clockIn: "08:20", clockOut: "17:10", color: "#8B5CF6" },
        ],
        troubles: [],
        safetyNote: "電気配線切断前の電源遮断確認を徹底。アスベスト含有建材なし確認済。周辺住民への粉塵対策として散水実施。",
      },
      {
        date: "2026-04-01", dateLabel: "4月1日（水）",
        mainWork: ["内装解体"],
        wasteM3: 3.8, wasteItems: ["木材", "断熱材"],
        photos: 2,
        staff: [
          { name: "田中 義雄", avatar: "田", role: "職長",  clockIn: "08:00", clockOut: "17:30", color: T.primary },
          { name: "佐藤 健太", avatar: "佐", role: "作業員", clockIn: "08:15", clockOut: "17:00", color: "#EF4444" },
          { name: "鈴木 大地", avatar: "鈴", role: "作業員", clockIn: "08:05", clockOut: "17:25", color: "#10B981" },
        ],
        troubles: [
          { type: "設備破損", severity: "軽微", detail: "壁内の既設配管に亀裂を発見。写真記録済み、施主に報告完了。" },
        ],
        safetyNote: "軒下作業時の落下物に注意。ヘルメット・安全帯着用を徹底。",
      },
      {
        date: "2026-03-31", dateLabel: "3月31日（火）",
        mainWork: ["内装解体", "設備撤去"],
        wasteM3: 5.1, wasteItems: ["木材", "金属スクラップ", "石膏ボード"],
        photos: 4,
        staff: [
          { name: "田中 義雄", avatar: "田", role: "職長",  clockIn: "08:00", clockOut: "18:00", color: T.primary },
          { name: "佐藤 健太", avatar: "佐", role: "作業員", clockIn: "08:00", clockOut: "17:45", color: "#EF4444" },
          { name: "鈴木 大地", avatar: "鈴", role: "作業員", clockIn: "07:55", clockOut: "17:50", color: "#10B981" },
          { name: "高橋 真一", avatar: "高", role: "作業員", clockIn: "08:10", clockOut: "17:30", color: "#0EA5E9" },
        ],
        troubles: [],
        safetyNote: "重機搬入に伴い周辺道路の誘導員を配置。近隣3軒への事前挨拶実施済。",
      },
      {
        date: "2026-03-30", dateLabel: "3月30日（月）",
        mainWork: ["外構解体"],
        wasteM3: 2.6, wasteItems: ["コンクリートガラ"],
        photos: 2,
        staff: [
          { name: "田中 義雄", avatar: "田", role: "職長",  clockIn: "08:00", clockOut: "17:00", color: T.primary },
          { name: "佐藤 健太", avatar: "佐", role: "作業員", clockIn: "08:05", clockOut: "17:05", color: "#EF4444" },
        ],
        troubles: [],
        safetyNote: "外構ブロック撤去。粉塵対策として散水を適宜実施。廃材の分別を徹底。",
      },
    ],
  },
  s2: {
    id: "s2", name: "旧田中倉庫解体",
    address: "神奈川県川崎市幸区堀川町580",
    status: "解体中", startDate: "2026-03-25", endDate: "2026-04-20",
    progressPct: 42, contractAmount: 5_600_000,
    wasteDisposalCost: 1_200_000, laborCost: 680_000, otherCost: 220_000,
    todayWorkers: 6,
    workLogs: [
      {
        date: "2026-04-01", dateLabel: "4月1日（水）",
        mainWork: ["構造体解体"],
        wasteM3: 8.4, wasteItems: ["鉄骨", "コンクリートガラ"],
        photos: 5,
        staff: [
          { name: "田中 義雄", avatar: "田", role: "職長",  clockIn: "07:50", clockOut: "17:40", color: T.primary },
          { name: "佐藤 健太", avatar: "佐", role: "作業員", clockIn: "08:00", clockOut: "17:30", color: "#EF4444" },
          { name: "渡辺 誠",   avatar: "渡", role: "作業員", clockIn: "08:05", clockOut: "17:20", color: "#8B5CF6" },
          { name: "高橋 真一", avatar: "高", role: "作業員", clockIn: "07:55", clockOut: "17:45", color: "#0EA5E9" },
          { name: "伊藤 拓也", avatar: "伊", role: "重機OP", clockIn: "08:00", clockOut: "17:00", color: T.primaryDk },
        ],
        troubles: [],
        safetyNote: "バックホウ作業時は立入禁止区域を設定。鉄骨切断時の火花対策として防炎シート設置。",
      },
      {
        date: "2026-03-31", dateLabel: "3月31日（火）",
        mainWork: ["内装解体", "構造体解体"],
        wasteM3: 6.2, wasteItems: ["木材", "石膏ボード", "鉄骨"],
        photos: 3,
        staff: [
          { name: "田中 義雄", avatar: "田", role: "職長",  clockIn: "08:00", clockOut: "17:30", color: T.primary },
          { name: "鈴木 大地", avatar: "鈴", role: "作業員", clockIn: "08:10", clockOut: "17:20", color: "#10B981" },
          { name: "山本 拓也", avatar: "山", role: "作業員", clockIn: "08:05", clockOut: "17:35", color: "#8B5CF6" },
        ],
        troubles: [
          { type: "クレーム", severity: "中程度", detail: "近隣住民より騒音について苦情あり。作業時間を8:00〜17:00に変更、防音パネルを設置。" },
        ],
        safetyNote: "近隣クレームを受け防音対策を強化。作業前の周囲確認を徹底。",
      },
    ],
  },
  s3: {
    id: "s3", name: "松本アパート解体",
    address: "埼玉県さいたま市浦和区常盤6-4-21",
    status: "着工前", startDate: "2026-04-07", endDate: "2026-04-30",
    progressPct: 0, contractAmount: 2_800_000,
    wasteDisposalCost: 0, laborCost: 0, otherCost: 0,
    todayWorkers: 0, workLogs: [],
  },
  s4: {
    id: "s4", name: "旧工場棟解体（第1期）",
    address: "千葉県船橋市本町2-7-3",
    status: "完工", startDate: "2026-02-01", endDate: "2026-03-20",
    progressPct: 100, contractAmount: 8_400_000,
    wasteDisposalCost: 2_100_000, laborCost: 2_800_000, otherCost: 1_200_000,
    todayWorkers: 0, workLogs: [],
  },
};

const STATUS_CONFIG: Record<SiteStatus, { label: string; bg: string; fg: string }> = {
  着工前: { label: "着工前", bg: "#EFF6FF", fg: "#1D4ED8" },
  解体中: { label: "解体中", bg: T.primaryLt, fg: T.primaryDk },
  完工:   { label: "完工",   bg: "#F0FDF4", fg: "#16A34A" },
};

const SEVERITY_STYLE: Record<"軽微" | "中程度" | "重大", { bg: string; fg: string; border: string }> = {
  軽微:   { bg: "#FEF9C3", fg: "#854D0E", border: "#FDE68A" },
  中程度: { bg: "#FEF2F2", fg: "#DC2626", border: "#FECACA" },
  重大:   { bg: "#FFF1F2", fg: "#9F1239", border: "#FECDD3" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcDuration(clockIn: string, clockOut: string | null): string {
  if (!clockOut) return "勤務中";
  const [ih, im] = clockIn.split(":").map(Number);
  const [oh, om] = clockOut.split(":").map(Number);
  const mins = (oh * 60 + om) - (ih * 60 + im);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m > 0 ? `${m}m` : ""}`;
}

// ─── Daily Report Modal ────────────────────────────────────────────────────────

function DailyReportModal({ log, onClose }: { log: DailyLog; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] overflow-y-auto"
        style={{
          background: T.surface,
          borderRadius: "20px 20px 0 0",
          border: `1px solid ${T.border}`,
          boxShadow: "0 -4px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-5 sticky top-0 z-10"
          style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}
        >
          <div>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
              日報詳細
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{log.dateLabel}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
            style={{ width: 40, height: 40, flexShrink: 0 }}
          >
            <X size={20} style={{ color: C.sub }} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-7">

          {/* ── Summary chips ── */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
              <Users size={13} style={{ color: "#10B981" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>{log.staff.length}名出勤</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: T.primaryLt, border: `1px solid ${T.primaryMd}` }}>
              <Truck size={13} style={{ color: C.amber }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.amberDk }}>{log.wasteM3}㎥搬出</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
              <Camera size={13} style={{ color: "#3B82F6" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8" }}>写真{log.photos}枚</span>
            </div>
          </div>

          {/* ── Staff attendance ── */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 12 }}>
              出勤メンバー
            </p>
            <div className="flex flex-col gap-2">
              {log.staff.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                  style={{ background: T.bg, border: `1px solid ${T.border}` }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold"
                    style={{ width: 38, height: 38, background: `${s.color}18`, color: s.color, fontSize: 15 }}
                  >
                    {s.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{s.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: `${s.color}15`, color: s.color }}>
                        {s.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} style={{ color: C.muted }} />
                      <span style={{ fontSize: 12, color: C.sub }}>
                        {s.clockIn} — {s.clockOut ?? "勤務中"}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>
                        （{calcDuration(s.clockIn, s.clockOut)}）
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Work items ── */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 12 }}>
              作業内容
            </p>
            <div className="flex flex-wrap gap-2">
              {log.mainWork.map((w) => (
                <span
                  key={w}
                  className="px-3 py-1.5 rounded-lg font-bold"
                  style={{ background: T.primaryLt, color: C.amberDk, fontSize: 14, border: `1px solid ${T.primaryMd}` }}
                >
                  {w}
                </span>
              ))}
            </div>
          </div>

          {/* ── Waste/materials ── */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 12 }}>
              産廃搬出
            </p>
            <div
              className="flex items-start gap-5 px-5 py-4 rounded-xl"
              style={{ background: T.bg, border: `1px solid ${T.border}` }}
            >
              <div className="text-center flex-shrink-0">
                <p style={{ fontSize: 28, fontWeight: 800, color: C.amber, lineHeight: 1 }}>{log.wasteM3}</p>
                <p style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>㎥</p>
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>廃材種別</p>
                <div className="flex flex-wrap gap-1.5">
                  {log.wasteItems.map((w) => (
                    <span
                      key={w}
                      style={{ fontSize: 13, padding: "4px 10px", borderRadius: 20, background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Trouble reports ── */}
          {log.troubles.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 12 }}>
                トラブル報告
              </p>
              <div className="flex flex-col gap-2">
                {log.troubles.map((t, i) => {
                  const sty = SEVERITY_STYLE[t.severity];
                  return (
                    <div
                      key={i}
                      className="px-5 py-4 rounded-xl"
                      style={{ background: sty.bg, border: `1.5px solid ${sty.border}` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} style={{ color: sty.fg }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: sty.fg }}>{t.type}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: sty.border, color: sty.fg }}>
                          {t.severity}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: sty.fg, lineHeight: 1.65 }}>{t.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Safety note ── */}
          {log.safetyNote && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 12 }}>
                安全申し送り事項
              </p>
              <div
                className="flex items-start gap-3 px-5 py-4 rounded-xl"
                style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0" }}
              >
                <Shield size={16} style={{ color: "#10B981", flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.75 }}>{log.safetyNote}</p>
              </div>
            </div>
          )}

        </div>

        {/* ── Footer close ── */}
        <div className="px-6 pt-2 pb-8">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-bold transition-colors hover:bg-gray-100"
            style={{ background: T.bg, border: `1px solid ${T.border}`, color: C.sub, fontSize: 15 }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline entry ────────────────────────────────────────────────────────────

function TimelineEntry({
  log, showLine, onOpen,
}: {
  log: DailyLog;
  showLine: boolean;
  onOpen: () => void;
}) {
  const hasTrouble = log.troubles.length > 0;

  return (
    <div className="relative flex gap-4">
      {/* Dot + vertical connector */}
      <div className="flex flex-col items-center flex-shrink-0 pt-4" style={{ width: 20 }}>
        <div
          className="flex-shrink-0 rounded-full z-10"
          style={{
            width: 12, height: 12,
            background: hasTrouble ? C.red : C.amber,
            border: `2px solid ${hasTrouble ? "#FECACA" : T.primaryMd}`,
            flexShrink: 0,
          }}
        />
        {showLine && (
          <div className="flex-1 w-px mt-1.5" style={{ background: T.border, minHeight: 24 }} />
        )}
      </div>

      {/* Card */}
      <button
        onClick={onOpen}
        className="flex-1 min-w-0 mb-3 text-left"
      >
        <div
          className="px-5 py-4 rounded-xl transition-colors"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = T.bg;
            el.style.borderColor = `${T.primary}40`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = T.surface;
            el.style.borderColor = T.border;
          }}
        >
          {/* Row 1: date + meta + chevron */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{log.dateLabel}</span>
              {hasTrouble && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ fontSize: 11, fontWeight: 700, background: "#FEF2F2", color: C.red, border: "1px solid #FECACA" }}
                >
                  <AlertTriangle size={10} /> 報告あり
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="flex items-center gap-1" style={{ fontSize: 12, color: C.sub }}>
                <Users size={11} /> {log.staff.length}名
              </span>
              <span className="flex items-center gap-1" style={{ fontSize: 12, color: C.sub }}>
                <Truck size={11} /> {log.wasteM3}㎥
              </span>
              <ChevronRight size={14} style={{ color: C.muted }} />
            </div>
          </div>
          {/* Row 2: work tags */}
          <div className="flex flex-wrap gap-1.5">
            {log.mainWork.map((w) => (
              <span
                key={w}
                style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: T.primaryLt, color: C.amberDk }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SiteDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const site = MOCK_SITES[id];

  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);

  if (!site) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ color: C.sub }}>
        現場が見つかりません
      </div>
    );
  }

  const cfg = STATUS_CONFIG[site.status];
  const totalCost = site.wasteDisposalCost + site.laborCost + site.otherCost;
  const profit = site.contractAmount - totalCost;
  const profitPct = site.contractAmount > 0 ? Math.round((profit / site.contractAmount) * 100) : 0;
  const costPct   = site.contractAmount > 0 ? Math.round((totalCost / site.contractAmount) * 100) : 0;

  return (
    <div className="py-6 pb-28 md:pb-8 flex flex-col gap-6">

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ══════════════════════════════════════════
            Left column
        ══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col gap-6">

          {/* ── Page header (read-only) ── */}
          <section
            className="px-6 pt-8 pb-6 rounded-xl"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <Link
              href="/kaitai"
              className="inline-flex items-center gap-1.5 mb-5 text-sm"
              style={{ color: C.muted }}
            >
              <ArrowLeft size={15} /> 現場一覧
            </Link>

            {/* Status + title — NO edit button */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  className="text-sm font-bold px-3 py-1.5 rounded-full"
                  style={{ background: cfg.bg, color: cfg.fg }}
                >
                  {cfg.label}
                </span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1.3, marginBottom: 8 }}>
                {site.name}
              </h1>
              <div className="flex items-center gap-1.5">
                <MapPin size={13} style={{ color: C.sub }} />
                <p style={{ fontSize: 14, color: C.sub }}>{site.address}</p>
              </div>
            </div>

            {/* Dates + workers */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="flex items-center gap-1.5" style={{ fontSize: 13, color: C.muted }}>
                <Calendar size={13} />
                <span>{site.startDate.replace(/-/g, "/")} 〜 {site.endDate.replace(/-/g, "/")}</span>
              </div>
              {site.todayWorkers > 0 && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                >
                  <Users size={13} style={{ color: "#10B981" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>
                    本日 {site.todayWorkers}名稼働
                  </span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {site.status !== "着工前" && (
              <div>
                <div className="flex justify-between text-sm mb-2" style={{ color: C.sub }}>
                  <span>工事進捗</span>
                  <span style={{ fontWeight: 700, color: C.text }}>{site.progressPct}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: T.bg }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${site.progressPct}%`,
                      background: `linear-gradient(90deg, ${T.primary} 0%, ${T.primaryDk} 100%)`,
                    }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* ══════════════════════════════════════════
              作業・産廃履歴 タイムライン
          ══════════════════════════════════════════ */}
          {site.workLogs.length > 0 ? (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>作業・産廃履歴</h2>
                <span style={{ fontSize: 13, color: C.muted }}>{site.workLogs.length}件</span>
              </div>

              {/* Timeline */}
              <div>
                {site.workLogs.map((log, i) => (
                  <TimelineEntry
                    key={log.date}
                    log={log}
                    showLine={i < site.workLogs.length - 1}
                    onOpen={() => setSelectedLog(log)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-14 rounded-xl"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <Clock size={32} style={{ color: T.muted, marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: C.sub }}>
                {site.status === "着工前" ? "着工前のため履歴はありません" : "作業履歴がありません"}
              </p>
              {site.status === "着工前" && (
                <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                  着工日：{site.startDate.replace(/-/g, "/")}
                </p>
              )}
            </div>
          )}

          {/* ── マニフェスト ── */}
          <div
            className="flex items-center gap-4 px-5 py-4 rounded-xl transition-colors hover:bg-gray-50 cursor-pointer"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.08)" }}
            >
              <FileText size={18} style={{ color: "#6366F1" }} />
            </div>
            <div className="flex-1">
              <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>産廃マニフェスト</p>
              <p style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>作業票・マニフェストを確認する</p>
            </div>
            <ChevronRight size={16} style={{ color: C.muted }} />
          </div>

          {/* ── 完工報告 ── */}
          {site.status === "解体中" && (
            <div
              className="flex items-center gap-4 px-5 py-4 rounded-xl transition-colors hover:bg-gray-50 cursor-pointer"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.08)" }}
              >
                <CheckCircle2 size={18} style={{ color: C.green }} />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>完工報告を提出</p>
                <p style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>工事完了時に写真と共に提出</p>
              </div>
              <ChevronRight size={16} style={{ color: C.muted }} />
            </div>
          )}

        </div>
        {/* end left column */}

        {/* ══════════════════════════════════════════
            Right sidebar — financial summary
        ══════════════════════════════════════════ */}
        <div className="lg:w-80 xl:w-96 flex flex-col gap-6">

          <section>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.amber, marginBottom: 12 }}>
              原価・利益（現在値）
            </p>
            <div className="p-6 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>

              {/* Big profit number */}
              <div className="text-center mb-5">
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 6 }}>
                  現状利益
                </p>
                <p
                  style={{
                    fontSize: 36, fontWeight: 800, lineHeight: 1,
                    color: profit >= 0 ? C.green : C.red,
                    fontFeatureSettings: "'tnum'",
                  }}
                >
                  {profit >= 0 ? "+" : ""}¥{profit.toLocaleString()}
                </p>
                <p style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>粗利率 {profitPct}%</p>
              </div>

              {/* Cost breakdown */}
              <div className="flex flex-col gap-3 mb-5">
                {[
                  { label: "受注金額",   value: site.contractAmount,    color: C.green, bold: true },
                  { label: "産廃処分費", value: site.wasteDisposalCost, color: C.red },
                  { label: "労務費",     value: site.laborCost,         color: T.primary },
                  { label: "その他経費", value: site.otherCost,         color: "#3B82F6" },
                ].map(({ label, value, color, bold }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: bold ? 700 : 600, color: bold ? C.text : C.muted }}>
                      ¥{value.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: C.muted }} />
                    <span style={{ fontSize: 13, color: C.muted }}>原価合計</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                    ¥{totalCost.toLocaleString()}
                    <span style={{ fontSize: 12, fontWeight: 400, color: C.sub, marginLeft: 4 }}>
                      ({costPct}%)
                    </span>
                  </span>
                </div>
              </div>

              {/* Cost gauge */}
              <div>
                <div className="flex justify-between mb-1.5" style={{ fontSize: 13, color: C.sub }}>
                  <span>原価消化率</span>
                  <span>{costPct}% / 100%</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: T.bg }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(costPct, 100)}%`,
                      background: `linear-gradient(90deg, ${T.primary} 0%, ${T.primaryDk} 100%)`,
                    }}
                  />
                </div>
              </div>

            </div>
          </section>

        </div>
        {/* end right sidebar */}

      </div>

      {/* ── Daily report modal ── */}
      {selectedLog && (
        <DailyReportModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}

    </div>
  );
}
