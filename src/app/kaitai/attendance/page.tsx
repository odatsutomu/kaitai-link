"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Crown, Coffee, RotateCcw, LogOut, Phone,
  ChevronRight, Camera, Plus, Minus, X, Check,
  Clock, FileText, Truck, Receipt, Users, CheckCircle2,
  AlertCircle, Loader2,
} from "lucide-react";
import { T } from "../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
  red: "#EF4444", green: "#10B981", blue: "#3B82F6",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus = "勤務中" | "休憩中" | "退勤済";

type AttendanceMember = {
  id: string;
  name: string;
  avatar: string;
  isLead: boolean;
  phone: string;
  clockIn: string;
  status: AttendanceStatus;
  breakMinutes: number;
  clockOut: string | null;
};

type Expense = {
  id: string;
  type: string;
  amount: string;
  hasReceipt: boolean;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const SITE_NAMES: Record<string, string> = {
  s1: "山田邸解体工事",
  s2: "旧田中倉庫解体",
  s3: "松本アパート解体",
};

const INITIAL_MEMBERS: Record<string, AttendanceMember[]> = {
  s1: [
    { id: "m1", name: "田中 義雄", avatar: "田", isLead: true,  phone: "090-1234-5678", clockIn: "08:15", status: "勤務中", breakMinutes: 0,  clockOut: null },
    { id: "m2", name: "鈴木 誠",   avatar: "鈴", isLead: false, phone: "090-2345-6789", clockIn: "08:20", status: "勤務中", breakMinutes: 0,  clockOut: null },
    { id: "m3", name: "佐藤 隆",   avatar: "佐", isLead: false, phone: "090-3456-7890", clockIn: "08:30", status: "休憩中", breakMinutes: 0,  clockOut: null },
    { id: "m4", name: "渡辺 健",   avatar: "渡", isLead: false, phone: "090-4567-8901", clockIn: "08:15", status: "退勤済", breakMinutes: 60, clockOut: "16:45" },
  ],
  s2: [
    { id: "m5", name: "山本 浩二", avatar: "山", isLead: true,  phone: "090-5678-9012", clockIn: "07:50", status: "勤務中", breakMinutes: 0,  clockOut: null },
    { id: "m6", name: "中村 博",   avatar: "中", isLead: false, phone: "090-6789-0123", clockIn: "07:55", status: "勤務中", breakMinutes: 0,  clockOut: null },
    { id: "m7", name: "小林 清",   avatar: "小", isLead: false, phone: "090-7890-1234", clockIn: "08:00", status: "休憩中", breakMinutes: 30, clockOut: null },
    { id: "m8", name: "加藤 哲",   avatar: "加", isLead: false, phone: "090-8901-2345", clockIn: "07:50", status: "勤務中", breakMinutes: 0,  clockOut: null },
    { id: "m9", name: "松田 修",   avatar: "松", isLead: false, phone: "090-9012-3456", clockIn: "08:10", status: "退勤済", breakMinutes: 0,  clockOut: "15:30" },
    { id: "m10",name: "伊藤 勝",  avatar: "伊", isLead: false, phone: "090-0123-4567", clockIn: "08:05", status: "勤務中", breakMinutes: 0,  clockOut: null },
  ],
  s3: [
    { id: "m2", name: "鈴木 誠",   avatar: "鈴", isLead: true,  phone: "090-2345-6789", clockIn: "09:00", status: "勤務中", breakMinutes: 0,  clockOut: null },
    { id: "m11",name: "木村 仁",   avatar: "木", isLead: false, phone: "090-1111-2222", clockIn: "09:05", status: "勤務中", breakMinutes: 0,  clockOut: null },
  ],
};

// Work items
const WORK_ITEMS = [
  { id: "interior",   label: "内装解体",     emoji: "🔨" },
  { id: "electric",   label: "電気設備撤去", emoji: "⚡" },
  { id: "plumbing",   label: "配管撤去",     emoji: "🔧" },
  { id: "structure",  label: "構造体解体",   emoji: "🏗" },
  { id: "sorting",    label: "分別・積込み", emoji: "🚛" },
  { id: "cleanup",    label: "整地・清掃",   emoji: "🧹" },
];

// Waste items for final report
const WASTE_ITEMS = [
  { id: "concrete", label: "コンクリートガラ", unit: "㎥",  step: 0.5, unitPrice: 8_000 },
  { id: "wood",     label: "木くず",           unit: "㎥",  step: 0.5, unitPrice: 12_000 },
  { id: "metal",    label: "金属くず",          unit: "kg", step: 50,  unitPrice: 15 },
  { id: "mixed",    label: "混合廃棄物",        unit: "㎥",  step: 0.5, unitPrice: 18_000 },
];

const EXPENSE_TYPES = ["燃料代", "駐車場代", "材料費", "通行料", "その他"];

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AttendanceStatus, { bg: string; fg: string; border: string; label: string }> = {
  勤務中: { bg: "rgba(34,197,94,0.1)",   fg: "#4ADE80", border: "rgba(34,197,94,0.3)",  label: "勤務中" },
  休憩中: { bg: "rgba(251,191,36,0.1)",  fg: "#92400E", border: "rgba(251,191,36,0.3)", label: "休憩中" },
  退勤済: { bg: "rgba(100,116,139,0.08)",fg: T.sub, border: "rgba(100,116,139,0.2)",label: "退勤済" },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function nowTime() {
  const n = new Date();
  return `${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  const { site } = use(searchParams);
  const siteId   = site ?? "s1";
  const siteName = SITE_NAMES[siteId] ?? "現場";

  // Member state
  const [members, setMembers] = useState<AttendanceMember[]>(
    () => (INITIAL_MEMBERS[siteId] ?? INITIAL_MEMBERS.s1).map((m) => ({ ...m }))
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // Final report state
  const [showReport, setShowReport]   = useState(false);
  const [reportStep, setReportStep]   = useState(0);
  const [submitted, setSubmitted]     = useState(false);

  // Report form state
  const [doneWork, setDoneWork]       = useState<Set<string>>(new Set());
  const [reportPhotos, setReportPhotos] = useState(0);
  const [wasteQty, setWasteQty]       = useState<Record<string, number>>(
    Object.fromEntries(WASTE_ITEMS.map((w) => [w.id, 0]))
  );
  const [expenses, setExpenses]       = useState<Expense[]>([]);
  const [expenseType, setExpenseType] = useState("燃料代");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [clockOutTimes, setClockOutTimes] = useState<Record<string, string>>(
    () => Object.fromEntries(
      (INITIAL_MEMBERS[siteId] ?? []).map((m) => [m.id, m.clockOut ?? nowTime()])
    )
  );

  // Stats
  const working  = members.filter((m) => m.status === "勤務中").length;
  const onBreak  = members.filter((m) => m.status === "休憩中").length;
  const clocked  = members.filter((m) => m.status === "退勤済").length;
  const lead     = members.find((m) => m.isLead);

  // Actions
  function applyAction(id: string, action: "休憩" | "復帰" | "退勤") {
    const member = members.find((m) => m.id === id);
    if (!member) return;

    if (action === "退勤" && member.isLead) {
      // Update status first
      setMembers((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status: "退勤済", clockOut: nowTime() } : m
        )
      );
      setActiveId(null);
      // Trigger final report after short delay for visual feedback
      setTimeout(() => setShowReport(true), 400);
      return;
    }

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        if (action === "休憩") return { ...m, status: "休憩中" };
        if (action === "復帰") return { ...m, status: "勤務中" };
        if (action === "退勤") return { ...m, status: "退勤済", clockOut: nowTime() };
        return m;
      })
    );
    setActiveId(null);
  }

  function adjustWaste(id: string, delta: number) {
    const item = WASTE_ITEMS.find((w) => w.id === id)!;
    setWasteQty((prev) => ({
      ...prev,
      [id]: Math.max(0, parseFloat(((prev[id] ?? 0) + delta).toFixed(1))),
    }));
  }

  function addExpense() {
    const amt = parseFloat(expenseAmount);
    if (!amt || amt <= 0) return;
    setExpenses((prev) => [
      ...prev,
      { id: Date.now().toString(), type: expenseType, amount: expenseAmount, hasReceipt: false },
    ]);
    setExpenseAmount("");
  }

  const REPORT_STEPS = ["作業内容", "写真", "産廃", "経費", "作業時間", "完了"];
  const totalWasteCost = WASTE_ITEMS.reduce((s, w) => s + wasteQty[w.id] * w.unitPrice, 0);
  const totalExpense   = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  // ── Submitted screen ──
  if (submitted) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: "#0F1928" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: "rgba(74,222,128,0.15)", border: "2px solid #4ADE80" }}>
          <CheckCircle2 size={36} style={{ color: "#4ADE80" }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: T.bg }}>報告が完了しました</h2>
        <p className="text-sm mb-1" style={{ color: T.muted }}>{siteName}</p>
        <p className="text-sm mb-8" style={{ color: T.sub }}>
          産廃 ¥{totalWasteCost.toLocaleString()} · 経費 ¥{totalExpense.toLocaleString()}
        </p>
        <Link href="/kaitai">
          <button className="rounded-2xl px-8 py-4 font-bold text-base"
            style={{ background: "#1A2535", border: "1px solid #2D3E54", color: T.bg }}>
            現場一覧へ戻る
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 pb-28 md:pb-8 flex flex-col gap-5">

      {/* ── Header ── */}
      <section>
        <Link href="/kaitai/work" className="inline-flex items-center gap-1.5 mb-3 text-sm" style={{ color: T.sub }}>
          <ArrowLeft size={15} /> 作業報告
        </Link>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: C.text }}>勤怠・ステータス管理</h1>
            <p className="text-sm mt-1" style={{ color: C.sub }}>{siteName}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4ADE80" }} />
            <span className="text-sm font-semibold" style={{ color: "#4ADE80" }}>LIVE</span>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "勤務中", value: working, color: "#4ADE80" },
            { label: "休憩中", value: onBreak, color: "#92400E" },
            { label: "退勤済", value: clocked, color: T.sub },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl py-2.5 text-center"
              style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-sm mt-0.5" style={{ color: T.sub }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Lead warning */}
        {lead && lead.status !== "退勤済" && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <Crown size={12} fill="#92400E" style={{ color: "#92400E" }} />
            <p className="text-sm" style={{ color: T.muted }}>
              <span style={{ color: "#92400E", fontWeight: 700 }}>{lead.name}</span> の退勤で終了報告が開始されます
            </p>
          </div>
        )}
      </section>

      {/* ── Member list ── */}
      <div className="flex flex-col gap-2">
        {members.map((member) => {
          const cfg        = STATUS_CONFIG[member.status];
          const isActive   = activeId === member.id;
          const isDisabled = member.status === "退勤済";

          return (
            <div key={member.id}>
              {/* Member card */}
              <button
                className="w-full rounded-2xl transition-all active:scale-[0.99]"
                style={{
                  background: isActive ? T.primaryLt : "#1A2535",
                  border: isActive ? `1.5px solid ${T.primaryMd}` : `1px solid ${cfg.border}`,
                }}
                onClick={() => setActiveId(isActive ? null : member.id)}
              >
                <div className="flex items-center gap-3 px-4 py-3.5">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold"
                      style={{ background: cfg.bg, color: cfg.fg, border: `1.5px solid ${cfg.border}` }}>
                      {member.avatar}
                    </div>
                    {member.isLead && (
                      <Crown size={11} fill="#92400E"
                        style={{ color: "#92400E", position: "absolute", top: -5, right: -3 }} />
                    )}
                    {/* Pulse for 勤務中 */}
                    {member.status === "勤務中" && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                        style={{ background: "#4ADE80", borderColor: "#0F1928" }} />
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-bold truncate" style={{ color: isDisabled ? "#475569" : T.bg }}>
                        {member.name}
                      </span>
                      {member.isLead && (
                        <span className="text-sm px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                          style={{ background: "rgba(251,191,36,0.12)", color: "#92400E" }}>
                          責任者
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: "#475569" }}>
                      <Clock size={9} />
                      <span>IN {member.clockIn}</span>
                      {member.clockOut && <span>→ OUT {member.clockOut}</span>}
                      {member.breakMinutes > 0 && <span>休憩 {member.breakMinutes}分</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm px-2.5 py-1 rounded-full font-bold"
                      style={{ background: cfg.bg, color: cfg.fg }}>
                      {cfg.label}
                    </span>
                    <ChevronRight size={13} style={{
                      color: "#475569",
                      transform: isActive ? "rotate(90deg)" : "none",
                      transition: "transform 0.2s",
                    }} />
                  </div>
                </div>
              </button>

              {/* Action panel */}
              {isActive && !isDisabled && (
                <div className="mt-1 mb-1 rounded-2xl px-4 py-3 flex flex-col gap-2.5"
                  style={{ background: "rgba(249,115,22,0.05)", border: `1px solid ${T.primaryMd}` }}>

                  {/* Phone shortcut */}
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm" style={{ color: T.muted }}>
                      アクションを選択してください
                    </p>
                    <a href={`tel:${member.phone}`}>
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm font-semibold"
                        style={{ background: "rgba(34,197,94,0.1)", color: "#4ADE80", border: "1px solid rgba(34,197,94,0.2)" }}>
                        <Phone size={11} />
                        電話
                      </button>
                    </a>
                  </div>

                  <div className="flex gap-2">
                    {member.status === "勤務中" && (
                      <>
                        <button
                          onClick={() => applyAction(member.id, "休憩")}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform"
                          style={{
                            background: "rgba(251,191,36,0.12)",
                            border: "1.5px solid rgba(251,191,36,0.3)",
                            color: "#92400E",
                          }}
                        >
                          <Coffee size={16} />
                          休憩
                        </button>
                        <button
                          onClick={() => applyAction(member.id, "退勤")}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform"
                          style={
                            member.isLead
                              ? {
                                  background: "linear-gradient(135deg, #EF4444, #B45309)",
                                  color: "#fff",
                                }
                              : {
                                  background: "rgba(248,113,113,0.1)",
                                  border: "1.5px solid rgba(248,113,113,0.3)",
                                  color: "#F87171",
                                }
                          }
                        >
                          <LogOut size={16} />
                          退勤{member.isLead ? "→報告" : ""}
                        </button>
                      </>
                    )}
                    {member.status === "休憩中" && (
                      <button
                        onClick={() => applyAction(member.id, "復帰")}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform"
                        style={{
                          background: "rgba(34,197,94,0.12)",
                          border: "1.5px solid rgba(34,197,94,0.3)",
                          color: "#4ADE80",
                        }}
                      >
                        <RotateCcw size={16} />
                        作業に復帰
                      </button>
                    )}
                  </div>

                  {/* Lead hint */}
                  {member.isLead && member.status === "勤務中" && (
                    <p className="text-sm text-center" style={{ color: T.sub }}>
                      ⚠️ 退勤すると【最終報告画面】が開始されます
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Final Report Modal ── */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0F1928" }}>

          {/* Report header */}
          <div className="px-5 pt-12 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid #2D3E54" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm" style={{ color: T.sub }}>最終報告 — {siteName}</p>
                <h2 className="text-lg font-bold" style={{ color: T.bg }}>
                  {REPORT_STEPS[reportStep]}
                </h2>
              </div>
              {reportStep < 5 && (
                <button
                  onClick={() => { setShowReport(false); setReportStep(0); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "#1A2535", border: "1px solid #2D3E54" }}
                >
                  <X size={15} style={{ color: T.sub }} />
                </button>
              )}
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1.5">
              {REPORT_STEPS.slice(0, -1).map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    flex: i === reportStep ? 2 : 1,
                    background: i < reportStep ? T.primary : i === reportStep ? T.primary : "#2D3E54",
                    opacity: i < reportStep ? 0.4 : 1,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1 overflow-y-auto px-5 py-5">

            {/* ── Step 0: 作業内容 ── */}
            {reportStep === 0 && (
              <div className="flex flex-col gap-4">
                <p className="text-sm" style={{ color: T.muted }}>本日実施した作業工程を選択してください</p>
                <div className="grid grid-cols-2 gap-2">
                  {WORK_ITEMS.map((item) => {
                    const done = doneWork.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => setDoneWork((prev) => {
                          const next = new Set(prev);
                          next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                          return next;
                        })}
                        className="flex items-center gap-2.5 px-3 py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
                        style={
                          done
                            ? { background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.4)", color: "#4ADE80" }
                            : { background: "#1A2535", border: "1px solid #2D3E54", color: T.muted }
                        }
                      >
                        <span>{item.emoji}</span>
                        {item.label}
                        {done && <Check size={13} style={{ color: "#4ADE80", marginLeft: "auto" }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 1: 写真 ── */}
            {reportStep === 1 && (
              <div className="flex flex-col gap-4">
                <p className="text-sm" style={{ color: T.muted }}>完工写真を添付してください（任意）</p>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: reportPhotos }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-2xl flex items-center justify-center text-3xl"
                      style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
                      📷
                    </div>
                  ))}
                  <button
                    onClick={() => setReportPhotos((p) => p + 1)}
                    className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                    style={{ background: "#1A2535", border: "1.5px dashed #2D3E54" }}
                  >
                    <Camera size={20} style={{ color: T.sub }} />
                    <span className="text-sm" style={{ color: T.sub }}>追加</span>
                  </button>
                </div>
                {reportPhotos === 0 && (
                  <p className="text-center text-sm" style={{ color: "#475569" }}>写真なしでもスキップできます</p>
                )}
              </div>
            )}

            {/* ── Step 2: 産廃入力 ── */}
            {reportStep === 2 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm" style={{ color: T.muted }}>廃棄物の品目・数量を入力してください</p>
                {WASTE_ITEMS.map((item) => {
                  const qty    = wasteQty[item.id];
                  const active = qty > 0;
                  return (
                    <div key={item.id} className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
                      style={{
                        background: active ? T.primaryLt : "#1A2535",
                        border: active ? `1.5px solid ${T.primaryMd}` : "1px solid #2D3E54",
                      }}>
                      <Truck size={14} style={{ color: active ? T.primary : "#475569" }} className="flex-shrink-0" />
                      <p className="flex-1 text-sm font-semibold" style={{ color: active ? T.bg : T.muted }}>
                        {item.label}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustWaste(item.id, -item.step)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                          style={{ background: "#0F1928", border: "1px solid #2D3E54" }}
                        >
                          <Minus size={14} style={{ color: "#475569" }} />
                        </button>
                        <div className="text-center" style={{ minWidth: 52 }}>
                          <span className="text-base font-bold" style={{ color: active ? T.primary : "#475569" }}>
                            {qty}
                          </span>
                          <span className="text-sm ml-0.5" style={{ color: T.sub }}>{item.unit}</span>
                        </div>
                        <button
                          onClick={() => adjustWaste(item.id, item.step)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                          style={{ background: T.primaryMd, border: `1px solid ${T.primaryMd}` }}
                        >
                          <Plus size={14} style={{ color: T.primary }} />
                        </button>
                      </div>
                      {active && (
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: "#F87171" }}>
                          ¥{(qty * item.unitPrice).toLocaleString()}
                        </span>
                      )}
                    </div>
                  );
                })}
                {totalWasteCost > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl"
                    style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)" }}>
                    <span className="text-sm" style={{ color: T.muted }}>産廃処分費（概算）</span>
                    <span className="text-base font-bold" style={{ color: "#F87171" }}>
                      ¥{totalWasteCost.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: 経費入力 ── */}
            {reportStep === 3 && (
              <div className="flex flex-col gap-4">
                <p className="text-sm" style={{ color: T.muted }}>現場経費を入力してください（任意）</p>

                {/* Type selector */}
                <div>
                  <p className="text-sm mb-2" style={{ color: T.sub }}>経費種別</p>
                  <div className="flex flex-wrap gap-2">
                    {EXPENSE_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setExpenseType(t)}
                        className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                        style={
                          expenseType === t
                            ? { background: T.primaryMd, color: T.primary, border: `1px solid ${T.primaryMd}` }
                            : { background: "#1A2535", color: T.sub, border: "1px solid #2D3E54" }
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount + add */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#475569" }}>¥</span>
                    <input
                      type="number"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="金額を入力"
                      className="w-full pl-8 pr-4 py-3 rounded-2xl text-sm outline-none"
                      style={{ background: "#1A2535", border: "1px solid #2D3E54", color: T.bg, fontFamily: "inherit" }}
                    />
                  </div>
                  <button
                    onClick={addExpense}
                    className="px-4 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
                    style={
                      expenseAmount
                        ? { background: T.primaryMd, color: T.primary, border: `1px solid ${T.primaryMd}` }
                        : { background: "#1A2535", color: "#475569", border: "1px solid #2D3E54" }
                    }
                  >
                    追加
                  </button>
                </div>

                {/* Expense list */}
                {expenses.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {expenses.map((exp) => (
                      <div key={exp.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                        style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
                        <Receipt size={13} style={{ color: T.primary }} />
                        <span className="flex-1 text-sm" style={{ color: T.bg }}>{exp.type}</span>
                        <span className="text-sm font-bold" style={{ color: "#92400E" }}>
                          ¥{parseFloat(exp.amount).toLocaleString()}
                        </span>
                        <button
                          onClick={() => setExpenses((prev) => prev.filter((e) => e.id !== exp.id))}
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(248,113,113,0.1)" }}
                        >
                          <X size={11} style={{ color: "#F87171" }} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-2"
                      style={{ borderTop: "1px solid #2D3E54" }}>
                      <span className="text-sm" style={{ color: T.sub }}>経費合計</span>
                      <span className="text-sm font-bold" style={{ color: "#92400E" }}>
                        ¥{totalExpense.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Receipt photo hint */}
                <button className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                  style={{ background: "#1A2535", border: "1.5px dashed #2D3E54" }}>
                  <Camera size={15} style={{ color: T.sub }} />
                  <span className="text-sm" style={{ color: T.sub }}>レシートを撮影・添付</span>
                </button>
              </div>
            )}

            {/* ── Step 4: 作業時間確認 ── */}
            {reportStep === 4 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm" style={{ color: T.muted }}>各メンバーの作業終了時刻を確認・修正してください</p>
                {members.map((member) => (
                  <div key={member.id} className="rounded-2xl px-4 py-3.5"
                    style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                          style={{ background: T.primaryLt, color: T.primary }}>
                          {member.avatar}
                        </div>
                        {member.isLead && (
                          <Crown size={9} fill="#92400E"
                            style={{ color: "#92400E", position: "absolute", top: -4, right: -2 }} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: T.bg }}>{member.name}</p>
                        <p className="text-sm" style={{ color: T.sub }}>
                          {STATUS_CONFIG[member.status].label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ background: "#0F1928", border: "1px solid #2D3E54" }}>
                        <Clock size={12} style={{ color: "#475569" }} />
                        <span className="text-sm" style={{ color: T.sub }}>出勤</span>
                        <span className="text-sm font-bold" style={{ color: T.muted }}>{member.clockIn}</span>
                      </div>
                      <span style={{ color: "#2D3E54" }}>→</span>
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ background: T.primaryLt, border: `1px solid ${T.primaryMd}` }}>
                        <Clock size={12} style={{ color: T.primary }} />
                        <span className="text-sm" style={{ color: T.sub }}>退勤</span>
                        <input
                          type="time"
                          value={clockOutTimes[member.id] ?? nowTime()}
                          onChange={(e) => setClockOutTimes((prev) => ({ ...prev, [member.id]: e.target.value }))}
                          className="text-sm font-bold bg-transparent outline-none w-full"
                          style={{ color: T.primary, fontFamily: "inherit" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* ── Footer buttons ── */}
          {reportStep < 5 && (
            <div className="flex-shrink-0 px-5 py-4 flex gap-3"
              style={{ borderTop: "1px solid #2D3E54" }}>
              {reportStep > 0 && (
                <button
                  onClick={() => setReportStep((s) => s - 1)}
                  className="px-5 py-4 rounded-2xl font-bold text-sm"
                  style={{ background: "#1A2535", border: "1px solid #2D3E54", color: T.muted }}
                >
                  戻る
                </button>
              )}
              <button
                onClick={() => {
                  if (reportStep < 4) {
                    setReportStep((s) => s + 1);
                  } else {
                    setReportStep(5);
                    setTimeout(() => { setShowReport(false); setSubmitted(true); }, 500);
                  }
                }}
                className="flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{
                  background: "linear-gradient(135deg, #B45309 0%, #EF4444 100%)",
                  color: "#fff",
                }}
              >
                {reportStep === 4 ? (
                  <><FileText size={16} /> 報告を送信する</>
                ) : (
                  <>次へ：{REPORT_STEPS[reportStep + 1]} <ChevronRight size={16} /></>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
