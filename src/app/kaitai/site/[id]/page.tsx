"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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

type CostBreakdown = {
  wasteDisposal: number;      // 産廃処分費
  labor: number;              // 労務費（人工×日当）
  equipmentRental: number;    // 重機リース費
  transport: number;          // 運搬費
  misc: number;               // その他（養生材・消耗品等）
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
  costs: CostBreakdown;
  todayWorkers: number;
  workLogs: DailyLog[];
  structureType: string;
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
  green: "#10B981", red: "#EF4444",
};

// ─── Work log generation helpers ──────────────────────────────────────────────

const STAFF_COLORS = [T.primary, "#3B82F6", "#10B981", "#8B5CF6", "#EF4444", "#0EA5E9", "#F97316"];

const WORK_TASKS_WOOD = [
  ["足場設置", "養生シート設置"],
  ["屋根材撤去", "内装解体"],
  ["内装解体", "建具撤去"],
  ["柱・梁解体", "重機搬入"],
  ["基礎解体", "重機作業"],
  ["産廃搬出", "整地作業"],
  ["コンクリート殻搬出", "埋め戻し"],
  ["最終清掃", "養生撤去", "完了検査"],
];

const WORK_TASKS_STEEL = [
  ["仮設足場設置", "養生ネット設置"],
  ["内装撤去", "設備配管撤去"],
  ["鉄骨切断準備", "ガス溶断"],
  ["鉄骨解体", "クレーン作業"],
  ["鉄骨搬出", "スクラップ分別"],
  ["基礎コンクリート解体", "重機作業"],
  ["産廃搬出", "鉄くずスクラップ搬出"],
  ["整地", "境界確認", "完了検査"],
];

const WORK_TASKS_RC = [
  ["仮設足場設置", "防音パネル設置"],
  ["内装解体", "設備撤去"],
  ["RC壁解体", "コンクリート圧砕"],
  ["RC梁・柱解体", "鉄筋切断"],
  ["コンクリート殻搬出", "鉄筋分別"],
  ["基礎解体", "杭頭処理"],
  ["埋め戻し", "整地作業"],
  ["最終清掃", "完了検査"],
];

const WASTE_ITEMS_MAP: Record<string, string[]> = {
  木造: ["木くず", "混合廃棄物", "石膏ボード", "ガラス陶磁器"],
  鉄骨: ["鉄くず", "混合廃棄物", "コンクリート殻", "石膏ボード"],
  RC: ["コンクリート殻", "鉄筋くず", "混合廃棄物", "石膏ボード"],
};

const SAFETY_NOTES = [
  "隣地境界付近の作業時、飛散物に注意。養生シートの点検を毎朝実施すること。",
  "重機旋回範囲への立入禁止を徹底。誘導員の配置を継続。",
  "粉塵が多いため散水を適宜実施。マスク着用の徹底。",
  "高所作業あり。安全帯の使用を確認。足場の点検を朝礼時に実施。",
  "搬出経路の一般車両通行に注意。誘導員を交差点に配置。",
  "夏季対策：水分補給の声掛けを1時間おきに実施。WBGT計の確認。",
  "近隣住民への騒音配慮。作業時間は8:00〜17:00厳守。",
  "",
];

const TROUBLE_TEMPLATES: TroubleLog[] = [
  { type: "埋設物", severity: "中程度", detail: "基礎解体中に想定外の配管（旧下水管）を発見。元請に報告し、対応方針を協議中。作業は一時中断。" },
  { type: "近隣クレーム", severity: "軽微", detail: "隣家より「振動が大きい」との連絡あり。午後の作業でブレーカー使用を控え、圧砕機に切り替えて対応。" },
  { type: "機材故障", severity: "軽微", detail: "0.7バックホーの油圧ホースから軽微な漏れを確認。応急処置後、翌日修理予定。予備機で作業継続。" },
  { type: "安全ヒヤリ", severity: "中程度", detail: "解体材の落下物が養生シート外に飛散。幸い通行人なし。養生範囲を拡大し、見張り員を追加配置。" },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type MemberInfo = { name: string; avatar: string; role: string };

function generateWorkLogs(
  siteStatus: string,
  startDate: string,
  endDate: string,
  progressPct: number,
  structureType: string,
  members: MemberInfo[],
  siteId: string,
): DailyLog[] {
  if (siteStatus === "着工前" || !startDate) return [];

  const start = new Date(startDate);
  const today = new Date("2026-04-03");
  const end = siteStatus === "完工" && endDate ? new Date(endDate) : today;
  const rand = seededRandom(siteId.split("").reduce((a, c) => a + c.charCodeAt(0), 0));

  const tasks = structureType === "鉄骨" ? WORK_TASKS_STEEL
    : structureType === "RC" ? WORK_TASKS_RC
    : WORK_TASKS_WOOD;
  const wasteItems = WASTE_ITEMS_MAP[structureType] ?? WASTE_ITEMS_MAP["木造"];

  const logs: DailyLog[] = [];
  const d = new Date(start);

  while (d <= end) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) { d.setDate(d.getDate() + 1); continue; }

    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = `${d.getMonth() + 1}/${d.getDate()}（${"日月火水木金土"[dow]}）`;

    // Progress through work tasks
    const elapsed = (d.getTime() - start.getTime()) / (end.getTime() - start.getTime() + 1);
    const taskIdx = Math.min(Math.floor(elapsed * tasks.length), tasks.length - 1);

    // Staff for the day (3-6 people)
    const staffCount = Math.min(3 + Math.floor(rand() * 4), members.length);
    const dayStaff: StaffLog[] = [];
    const shuffled = [...members].sort(() => rand() - 0.5);
    for (let i = 0; i < staffCount; i++) {
      const m = shuffled[i];
      const clockInH = 7 + Math.floor(rand() * 2);
      const clockInM = Math.floor(rand() * 4) * 15;
      const clockOutH = 16 + Math.floor(rand() * 2);
      const clockOutM = Math.floor(rand() * 4) * 15;
      const isToday = dateStr === today.toISOString().slice(0, 10);
      dayStaff.push({
        name: m.name,
        avatar: m.avatar,
        role: m.role,
        clockIn: `${String(clockInH).padStart(2, "0")}:${String(clockInM).padStart(2, "0")}`,
        clockOut: isToday && rand() > 0.3 ? null : `${String(clockOutH).padStart(2, "0")}:${String(clockOutM).padStart(2, "0")}`,
        color: STAFF_COLORS[i % STAFF_COLORS.length],
      });
    }

    // Waste volume
    const wasteM3 = Math.round((2 + rand() * 8) * 10) / 10;

    // Pick 1-2 waste items
    const dayWaste = wasteItems.slice(0, 1 + Math.floor(rand() * 2));

    // Photos
    const photos = 2 + Math.floor(rand() * 8);

    // Troubles (occasional)
    const troubles: TroubleLog[] = [];
    if (rand() < 0.12) {
      troubles.push(TROUBLE_TEMPLATES[Math.floor(rand() * TROUBLE_TEMPLATES.length)]);
    }

    // Safety note
    const safetyNote = SAFETY_NOTES[Math.floor(rand() * SAFETY_NOTES.length)];

    logs.push({
      date: dateStr,
      dateLabel: dayLabel,
      mainWork: tasks[taskIdx],
      wasteM3,
      wasteItems: dayWaste,
      photos,
      staff: dayStaff,
      troubles,
      safetyNote,
    });

    d.setDate(d.getDate() + 1);
  }

  return logs.reverse(); // Most recent first
}

// ─── Cost calculation from work logs ─────────────────────────────────────────

// 産廃処分単価（円/㎥）— 構造種別で異なる
const WASTE_UNIT_COST: Record<string, number> = {
  木造: 18_000,   // 木くず中心、比較的安価
  鉄骨: 22_000,   // 鉄くず＋混合
  RC:   28_000,    // コンクリート殻が重い
};

// 日当（円/人日）— 役割別
const DAY_RATE: Record<string, number> = {
  現場責任者: 28_000,
  重機オペ: 25_000,
  作業員: 18_000,
  見習い: 14_000,
};

function calcCostsFromLogs(
  workLogs: DailyLog[],
  structureType: string,
  contractAmount: number,
): CostBreakdown {
  if (workLogs.length === 0) {
    return { wasteDisposal: 0, labor: 0, equipmentRental: 0, transport: 0, misc: 0 };
  }

  const wasteUnitCost = WASTE_UNIT_COST[structureType] ?? 20_000;

  // 産廃処分費: 各日の搬出量 × 単価
  let totalWasteM3 = 0;
  let totalStaffDays = 0;
  let totalLaborCost = 0;
  let transportTrips = 0;

  for (const log of workLogs) {
    totalWasteM3 += log.wasteM3;

    // 搬出がある日は運搬1回カウント（4㎥以上で2回）
    if (log.wasteM3 > 0) {
      transportTrips += log.wasteM3 >= 4 ? 2 : 1;
    }

    // 労務費: スタッフ人数×役割別日当
    for (const s of log.staff) {
      totalStaffDays++;
      const rate = s.role === "責任者" || s.role === "現場責任者" ? DAY_RATE["現場責任者"]
        : s.role === "重機オペ" ? DAY_RATE["重機オペ"]
        : s.role === "見習い" ? DAY_RATE["見習い"]
        : DAY_RATE["作業員"];
      totalLaborCost += rate;
    }
  }

  const wasteDisposal = Math.round(totalWasteM3 * wasteUnitCost);
  const labor = totalLaborCost;
  // 重機リース: 作業日数ベース（日額35,000〜55,000、構造種別で変動）
  const equipmentDailyRate = structureType === "RC" ? 55_000 : structureType === "鉄骨" ? 48_000 : 35_000;
  const equipmentRental = workLogs.length * equipmentDailyRate;
  // 運搬費: トリップ数 × 運搬単価
  const transport = transportTrips * 25_000;
  // その他: 養生材・消耗品・ガス代等（受注額の3〜5%程度、日数按分）
  const misc = Math.round(contractAmount * 0.04 * (workLogs.length / Math.max(workLogs.length, 20)));

  return { wasteDisposal, labor, equipmentRental, transport, misc };
}

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
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }

    Promise.all([
      fetch("/api/kaitai/sites", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/members", { credentials: "include" }).then(r => r.ok ? r.json() : null),
    ]).then(([sitesData, membersData]) => {
      const siteRaw = sitesData?.sites?.find((s: Record<string, unknown>) => s.id === id);
      if (!siteRaw) { setLoading(false); return; }

      const members: MemberInfo[] = (membersData?.members ?? []).map((m: Record<string, unknown>) => ({
        name: m.name as string,
        avatar: (m.avatar as string) ?? (m.name as string).charAt(0),
        role: (m.role as string) ?? "作業員",
      }));

      const structureType = (siteRaw.structureType as string) ?? "木造";

      const status = ((siteRaw.status as string) === "施工中" ? "解体中" : siteRaw.status as string) as SiteStatus;

      const workLogs = generateWorkLogs(
        status,
        (siteRaw.startDate as string) ?? "",
        (siteRaw.endDate as string) ?? "",
        (siteRaw.progressPct as number) ?? 0,
        structureType,
        members,
        id,
      );

      const contractAmount = (siteRaw.contractAmount as number) ?? 0;
      const costs = calcCostsFromLogs(workLogs, structureType, contractAmount);

      setSite({
        id: siteRaw.id as string,
        name: siteRaw.name as string,
        address: siteRaw.address as string,
        status,
        startDate: (siteRaw.startDate as string) ?? "",
        endDate: (siteRaw.endDate as string) ?? "",
        progressPct: (siteRaw.progressPct as number) ?? 0,
        contractAmount,
        costs,
        todayWorkers: workLogs.length > 0 ? workLogs[0].staff.filter(s => !s.clockOut).length : 0,
        workLogs,
        structureType,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ color: C.sub }}>
        読み込み中...
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ color: C.sub }}>
        現場が見つかりません
      </div>
    );
  }

  const cfg = STATUS_CONFIG[site.status];
  const { wasteDisposal, labor, equipmentRental, transport, misc } = site.costs;
  const totalCost = wasteDisposal + labor + equipmentRental + transport + misc;
  const profit = site.contractAmount - totalCost;
  const profitPct = site.contractAmount > 0 ? Math.round((profit / site.contractAmount) * 100) : 0;
  const costPct   = site.contractAmount > 0 ? Math.round((totalCost / site.contractAmount) * 100) : 0;

  // 作業履歴サマリ
  const totalWasteM3 = site.workLogs.reduce((s, l) => s + l.wasteM3, 0);
  const totalStaffDays = site.workLogs.reduce((s, l) => s + l.staff.length, 0);

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

          {/* ── 受注・利益サマリ ── */}
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
                <p style={{
                  fontSize: 36, fontWeight: 800, lineHeight: 1,
                  color: profit >= 0 ? C.green : C.red,
                  fontFeatureSettings: "'tnum'",
                }}>
                  {profit >= 0 ? "+" : ""}¥{profit.toLocaleString()}
                </p>
                <p style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>
                  粗利率 <span style={{ fontWeight: 700, color: profitPct >= 20 ? C.green : profitPct >= 10 ? C.amber : C.red }}>{profitPct}%</span>
                </p>
              </div>

              {/* 受注金額 */}
              <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>受注金額</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>¥{site.contractAmount.toLocaleString()}</span>
              </div>

              {/* Cost breakdown — 5 categories */}
              <div className="flex flex-col gap-2.5 mb-4">
                {[
                  { label: "産廃処分費",   value: wasteDisposal,    color: C.red,      sub: `${Math.round(totalWasteM3)}㎥ × 単価` },
                  { label: "労務費",       value: labor,            color: T.primary,  sub: `${totalStaffDays}人日` },
                  { label: "重機リース費", value: equipmentRental,  color: "#8B5CF6",  sub: `${site.workLogs.length}日稼働` },
                  { label: "運搬費",       value: transport,        color: "#0EA5E9",  sub: "産廃搬出" },
                  { label: "その他経費",   value: misc,             color: "#6B7280",  sub: "養生材・消耗品等" },
                ].map(({ label, value, color, sub }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span style={{ fontSize: 13, color: C.text }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFeatureSettings: "'tnum'" }}>
                        ¥{value.toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: C.muted, marginLeft: 18, marginTop: 1 }}>{sub}</p>
                  </div>
                ))}
              </div>

              {/* 原価合計 */}
              <div className="flex items-center justify-between pt-3 mb-5" style={{ borderTop: `2px solid ${C.border}` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>原価合計</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
                  ¥{totalCost.toLocaleString()}
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.sub, marginLeft: 4 }}>
                    ({costPct}%)
                  </span>
                </span>
              </div>

              {/* Cost gauge — stacked bar */}
              <div>
                <div className="flex justify-between mb-1.5" style={{ fontSize: 12, color: C.sub }}>
                  <span>原価消化率</span>
                  <span style={{ fontWeight: 600 }}>{costPct}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden flex" style={{ background: T.bg }}>
                  {[
                    { value: wasteDisposal, color: C.red },
                    { value: labor, color: T.primary },
                    { value: equipmentRental, color: "#8B5CF6" },
                    { value: transport, color: "#0EA5E9" },
                    { value: misc, color: "#6B7280" },
                  ].map(({ value, color }, i) => {
                    const pct = site.contractAmount > 0 ? (value / site.contractAmount) * 100 : 0;
                    return pct > 0 ? (
                      <div key={i} style={{ width: `${pct}%`, background: color, minWidth: pct > 0 ? 2 : 0 }} />
                    ) : null;
                  })}
                </div>
              </div>

            </div>
          </section>

          {/* ── 作業実績サマリ ── */}
          <section className="p-5 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.amber, marginBottom: 14 }}>
              作業実績サマリ
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "稼働日数", value: `${site.workLogs.length}`, unit: "日" },
                { label: "延べ人工", value: `${totalStaffDays}`, unit: "人日" },
                { label: "産廃搬出量", value: `${Math.round(totalWasteM3 * 10) / 10}`, unit: "㎥" },
                { label: "構造種別", value: site.structureType, unit: "" },
              ].map(({ label, value, unit }) => (
                <div key={label} className="py-3 px-4 rounded-lg" style={{ background: T.bg }}>
                  <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                    {value}<span style={{ fontSize: 12, fontWeight: 500, color: C.sub, marginLeft: 2 }}>{unit}</span>
                  </p>
                </div>
              ))}
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
