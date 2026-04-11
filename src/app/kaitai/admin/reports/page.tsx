"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ClipboardList, Clock, Fuel, AlertTriangle, Truck, Wrench, Coffee,
  ChevronRight, ChevronLeft, Calendar, Users, MapPin,
  X, Search, CheckCircle, LogIn, LogOut,
  FileText, DollarSign, Trash2,
} from "lucide-react";
import { T } from "../../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface, bg: T.bg,
  amber: T.primary, amberDk: T.primaryDk,
  green: "#10B981", red: "#EF4444", blue: "#3B82F6",
  orange: "#F97316", purple: "#8B5CF6", teal: "#14B8A6",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type OperationLog = {
  id: string;
  action: string;
  user: string;
  siteId: string | null;
  device: string;
  createdAt: string;
};

type ExpenseLog = {
  id: string;
  siteId: string | null;
  siteName: string | null;
  category: string;
  amount: number;
  description: string | null;
  reporter: string;
  date: string;
  memo: string | null;
  equipmentId: string | null;
  equipmentName: string | null;
  liters: number | null;
  pricePerLiter: number | null;
  createdAt: string;
};

type WasteDispatch = {
  id: string;
  siteId: string;
  siteName: string | null;
  date: string;
  wasteType: string;
  quantity: number;
  unit: string;
  processorId: string | null;
  processorName: string | null;
  cost: number;
  direction: string;
  reporter: string;
  createdAt: string;
};

type ReportCategory = "all" | "attendance" | "expense" | "waste" | "irregular" | "daily" | "finish";

// ─── Report category definitions ─────────────────────────────────────────────

const CATEGORIES: { id: ReportCategory; label: string; icon: typeof ClipboardList; color: string; bg: string }[] = [
  { id: "all",        label: "すべて",     icon: ClipboardList, color: C.amber,  bg: T.primaryLt },
  { id: "attendance", label: "出退勤",     icon: Clock,         color: C.blue,   bg: "rgba(59,130,246,0.08)" },
  { id: "expense",    label: "経費・燃料", icon: DollarSign,    color: C.orange,  bg: "rgba(249,115,22,0.08)" },
  { id: "waste",      label: "廃材搬出",   icon: Truck,         color: C.teal,   bg: "rgba(20,184,166,0.08)" },
  { id: "irregular",  label: "異常報告",   icon: AlertTriangle, color: C.red,    bg: "rgba(239,68,68,0.08)" },
  { id: "daily",      label: "機材点検",   icon: Wrench,        color: C.purple, bg: "rgba(139,92,246,0.08)" },
  { id: "finish",     label: "作業終了",   icon: CheckCircle,   color: C.green,  bg: "rgba(16,185,129,0.08)" },
];

// ─── Parse action string into structured report ──────────────────────────────

type ParsedReport = {
  category: ReportCategory;
  title: string;
  detail: string;
  icon: typeof ClipboardList;
  color: string;
  bg: string;
  amount?: number;
  urgency?: string;
};

function parseAction(action: string): ParsedReport {
  // 出勤
  if (action.startsWith("start:")) {
    const detail = action.replace("start: ", "").replace("start:", "");
    return { category: "attendance", title: "出勤打刻", detail, icon: LogIn, color: C.blue, bg: "rgba(59,130,246,0.08)" };
  }
  // 休憩
  if (action.startsWith("break_in:")) {
    return { category: "attendance", title: "休憩開始", detail: action.replace("break_in: ", "").replace("break_in:", ""), icon: Coffee, color: C.blue, bg: "rgba(59,130,246,0.08)" };
  }
  if (action.startsWith("break_out:")) {
    return { category: "attendance", title: "休憩終了", detail: action.replace("break_out: ", "").replace("break_out:", ""), icon: Coffee, color: C.blue, bg: "rgba(59,130,246,0.08)" };
  }
  // 退勤
  if (action.startsWith("clockout:")) {
    return { category: "attendance", title: "退勤打刻", detail: action.replace("clockout: ", "").replace("clockout:", ""), icon: LogOut, color: C.blue, bg: "rgba(59,130,246,0.08)" };
  }
  // 経費
  if (action.startsWith("expense_log:")) {
    const parts = action.replace("expense_log:", "").split(":");
    const cat = parts[0] ?? "";
    const amt = parts[1] ?? "";
    return { category: "expense", title: `経費報告（${cat}）`, detail: amt, icon: DollarSign, color: C.orange, bg: "rgba(249,115,22,0.08)", amount: parseInt(amt.replace(/[¥,]/g, "")) || 0 };
  }
  // 燃料
  if (action.startsWith("fuel_log:")) {
    const detail = action.replace("fuel_log:", "");
    return { category: "expense", title: "燃料報告", detail, icon: Fuel, color: C.orange, bg: "rgba(249,115,22,0.08)" };
  }
  // 廃材搬出
  if (action.startsWith("waste_dispatch:")) {
    const detail = action.replace("waste_dispatch: ", "").replace("waste_dispatch:", "");
    return { category: "waste", title: "廃材搬出", detail, icon: Truck, color: C.teal, bg: "rgba(20,184,166,0.08)" };
  }
  // 機材点検
  if (action.startsWith("daily_report:")) {
    const detail = action.replace("daily_report: ", "").replace("daily_report:", "");
    return { category: "daily", title: "機材チェック", detail, icon: Wrench, color: C.purple, bg: "rgba(139,92,246,0.08)" };
  }
  // 作業終了
  if (action.startsWith("finish:")) {
    const detail = action.replace("finish: ", "").replace("finish:", "");
    return { category: "finish", title: "作業終了報告", detail, icon: CheckCircle, color: C.green, bg: "rgba(16,185,129,0.08)" };
  }
  // 異常報告
  if (action.startsWith("irregular")) {
    const match = action.match(/^irregular\[(.+?)\]:\s*(.+)/);
    if (match) {
      return { category: "irregular", title: "異常報告", detail: match[2], icon: AlertTriangle, color: C.red, bg: "rgba(239,68,68,0.08)", urgency: match[1] };
    }
    return { category: "irregular", title: "異常報告", detail: action.replace("irregular:", ""), icon: AlertTriangle, color: C.red, bg: "rgba(239,68,68,0.08)" };
  }
  // その他
  return { category: "all", title: "操作ログ", detail: action, icon: FileText, color: C.muted, bg: T.bg };
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const mo = d.getMonth() + 1;
  const da = d.getDate();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${mo}/${da} ${h}:${m}`;
}

function fmt(n: number) {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  log, parsed, expenses, wastes, onClose, onDelete,
}: {
  log: OperationLog;
  parsed: ParsedReport;
  expenses: ExpenseLog[];
  wastes: WasteDispatch[];
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  // Find related expense or waste records
  const relatedExpenses = useMemo(() => {
    if (parsed.category !== "expense") return [];
    const logTime = new Date(log.createdAt).getTime();
    return expenses.filter(e => {
      const eTime = new Date(e.createdAt).getTime();
      return Math.abs(eTime - logTime) < 60000 && e.reporter === log.user;
    });
  }, [expenses, log, parsed.category]);

  const relatedWastes = useMemo(() => {
    if (parsed.category !== "waste") return [];
    const logTime = new Date(log.createdAt).getTime();
    return wastes.filter(w => {
      const wTime = new Date(w.createdAt).getTime();
      return Math.abs(wTime - logTime) < 60000 && w.reporter === log.user;
    });
  }, [wastes, log, parsed.category]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: parsed.bg }}>
              <parsed.icon size={20} style={{ color: parsed.color }} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{parsed.title}</h3>
              <p style={{ fontSize: 12, color: C.muted }}>{fmtDateTime(log.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDelete(log.id)}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="この報告を削除"
            >
              <Trash2 size={18} style={{ color: C.red }} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={20} style={{ color: C.sub }} /></button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* 基本情報 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>報告者</p>
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: C.amber }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{log.user || "—"}</span>
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>日時</p>
              <div className="flex items-center gap-2">
                <Calendar size={14} style={{ color: C.amber }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{fmtDateTime(log.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* 緊急度バッジ */}
          {parsed.urgency && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{
              background: parsed.urgency === "緊急" ? "rgba(239,68,68,0.08)" : parsed.urgency === "要対応" ? "rgba(249,115,22,0.08)" : C.bg,
              border: `1px solid ${parsed.urgency === "緊急" ? "rgba(239,68,68,0.2)" : parsed.urgency === "要対応" ? "rgba(249,115,22,0.2)" : C.border}`,
            }}>
              <AlertTriangle size={16} style={{ color: parsed.urgency === "緊急" ? C.red : parsed.urgency === "要対応" ? C.orange : C.muted }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: parsed.urgency === "緊急" ? C.red : parsed.urgency === "要対応" ? C.orange : C.sub }}>
                緊急度: {parsed.urgency}
              </span>
            </div>
          )}

          {/* 詳細内容 */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6 }}>詳細内容</p>
            <div className="rounded-xl p-4" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {parsed.detail || "—"}
              </p>
            </div>
          </div>

          {/* 関連経費 */}
          {relatedExpenses.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6 }}>経費詳細</p>
              {relatedExpenses.map(e => (
                <div key={e.id} className="rounded-xl p-4 mb-2" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold" style={{ color: C.text }}>{e.category}</span>
                    <span className="text-base font-bold" style={{ color: C.orange }}>{fmt(e.amount)}</span>
                  </div>
                  {e.siteName && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin size={12} style={{ color: C.muted }} />
                      <span style={{ fontSize: 12, color: C.sub }}>{e.siteName}</span>
                    </div>
                  )}
                  {e.description && <p style={{ fontSize: 13, color: C.sub }}>{e.description}</p>}
                  {e.memo && <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>メモ: {e.memo}</p>}
                  {e.liters && e.pricePerLiter && (
                    <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                      {e.equipmentName && `${e.equipmentName} / `}{e.liters}L × ¥{e.pricePerLiter}/L
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 関連廃材搬出 */}
          {relatedWastes.length > 0 && (() => {
            const wasteTotal = relatedWastes.reduce((sum, w) => sum + (w.direction === "buyback" ? -w.cost : w.cost), 0);
            return (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>廃材搬出詳細（{relatedWastes.length}品目）</p>
                  <span style={{ fontSize: 15, fontWeight: 800, color: C.teal }}>合計 {fmt(Math.abs(wasteTotal))}</span>
                </div>
                {relatedWastes.map(w => (
                  <div key={w.id} className="rounded-xl p-4 mb-2" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold" style={{ color: C.text }}>{w.wasteType}</span>
                      <span className="text-base font-bold" style={{ color: w.direction === "buyback" ? C.green : C.teal }}>
                        {w.direction === "buyback" ? "+" : ""}{fmt(w.cost)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm" style={{ color: C.sub }}>
                      <span>{w.quantity}{w.unit}</span>
                      {w.processorName && <span>→ {w.processorName}</span>}
                    </div>
                    {w.siteName && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin size={12} style={{ color: C.muted }} />
                        <span style={{ fontSize: 12, color: C.muted }}>{w.siteName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* デバイス情報 */}
          {log.device && (
            <div>
              <p style={{ fontSize: 11, color: C.muted }}>
                デバイス: {log.device.length > 60 ? log.device.slice(0, 60) + "…" : log.device}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [expenses, setExpenses] = useState<ExpenseLog[]>([]);
  const [wastes, setWastes] = useState<WasteDispatch[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState<ReportCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<OperationLog | null>(null);

  // Date range
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => now.toISOString().slice(0, 10));

  // Fetch data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/kaitai/operation-logs?type=reports&limit=1000", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/expense", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/waste-dispatch", { credentials: "include" }).then(r => r.ok ? r.json() : null),
    ])
      .then(([logData, expData, wasteData]) => {
        if (logData?.logs) setLogs(logData.logs);
        if (expData?.logs) setExpenses(expData.logs);
        if (wasteData?.dispatches) setWastes(wasteData.dispatches);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Date filter
      const logDate = log.createdAt.slice(0, 10);
      if (logDate < dateFrom || logDate > dateTo) return false;

      // Category filter
      if (category !== "all") {
        const parsed = parseAction(log.action);
        if (parsed.category !== category) return false;
      }

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = log.action.toLowerCase().includes(q) ||
          log.user.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [logs, category, searchQuery, dateFrom, dateTo]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<ReportCategory, number> = { all: 0, attendance: 0, expense: 0, waste: 0, irregular: 0, daily: 0, finish: 0 };
    for (const log of logs) {
      const logDate = log.createdAt.slice(0, 10);
      if (logDate < dateFrom || logDate > dateTo) continue;
      counts.all++;
      const parsed = parseAction(log.action);
      if (parsed.category in counts) counts[parsed.category as ReportCategory]++;
    }
    return counts;
  }, [logs, dateFrom, dateTo]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { date: string; logs: OperationLog[] }[] = [];
    let currentDate = "";
    let currentGroup: OperationLog[] = [];

    for (const log of filteredLogs) {
      const logDate = log.createdAt.slice(0, 10);
      if (logDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, logs: currentGroup });
        }
        currentDate = logDate;
        currentGroup = [log];
      } else {
        currentGroup.push(log);
      }
    }
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, logs: currentGroup });
    }
    return groups;
  }, [filteredLogs]);

  // Compute waste cost for each waste_dispatch log
  const wasteLogCostMap = useMemo(() => {
    const map = new Map<string, { total: number; items: WasteDispatch[] }>();
    for (const log of logs) {
      if (!log.action.startsWith("waste_dispatch:")) continue;
      const logTime = new Date(log.createdAt).getTime();
      const related = wastes.filter(w => {
        const wTime = new Date(w.createdAt).getTime();
        return Math.abs(wTime - logTime) < 120000 && w.reporter === log.user;
      });
      if (related.length > 0) {
        const total = related.reduce((sum, w) => sum + (w.direction === "buyback" ? -w.cost : w.cost), 0);
        map.set(log.id, { total, items: related });
      }
    }
    return map;
  }, [logs, wastes]);

  // Total waste cost in date range
  const wasteTotalCost = useMemo(() => {
    const inRange = wastes.filter(w => w.date >= dateFrom && w.date <= dateTo);
    return inRange.reduce((sum, w) => sum + (w.direction === "buyback" ? -w.cost : w.cost), 0);
  }, [wastes, dateFrom, dateTo]);

  // Selected log parsed
  const selectedParsed = selectedLog ? parseAction(selectedLog.action) : null;

  if (loading) {
    return <div className="py-20 text-center" style={{ color: C.sub }}>読み込み中...</div>;
  }

  return (
    <div className="py-6 flex flex-col gap-5 pb-28 md:pb-8">

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>報告一覧</h1>
        <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>従業員からのすべての報告をカテゴリー別に確認</p>
      </div>

      {/* ── Category Tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(cat => {
          const active = category === cat.id;
          const count = categoryCounts[cat.id];
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0"
              style={{
                background: active ? cat.color : C.bg,
                color: active ? "#fff" : C.sub,
                border: `1.5px solid ${active ? cat.color : C.border}`,
              }}
            >
              <cat.icon size={15} />
              {cat.label}
              <span className="px-1.5 py-0.5 rounded-md text-xs font-bold" style={{
                background: active ? "rgba(255,255,255,0.25)" : C.bg,
                color: active ? "#fff" : C.muted,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
          <input
            type="text"
            placeholder="報告者名・内容で検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl outline-none"
            style={{ height: 44, fontSize: 14, padding: "0 14px 0 36px", border: `1.5px solid ${C.border}`, color: C.text, background: "#fff" }}
          />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="rounded-xl outline-none"
            style={{ height: 44, fontSize: 13, padding: "0 12px", border: `1.5px solid ${C.border}`, color: C.text }}
          />
          <span style={{ fontSize: 13, color: C.muted }}>〜</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="rounded-xl outline-none"
            style={{ height: 44, fontSize: 13, padding: "0 12px", border: `1.5px solid ${C.border}`, color: C.text }}
          />
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl p-4" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={14} style={{ color: C.amber }} />
            <span style={{ fontSize: 12, color: C.muted }}>総報告数</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1 }}>
            {categoryCounts.all}
            <span style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginLeft: 2 }}>件</span>
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} style={{ color: C.orange }} />
            <span style={{ fontSize: 12, color: C.muted }}>経費報告</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: C.orange, lineHeight: 1 }}>
            {categoryCounts.expense}
            <span style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginLeft: 2 }}>件</span>
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} style={{ color: C.red }} />
            <span style={{ fontSize: 12, color: C.muted }}>異常報告</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: categoryCounts.irregular > 0 ? C.red : C.muted, lineHeight: 1 }}>
            {categoryCounts.irregular}
            <span style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginLeft: 2 }}>件</span>
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-1">
            <Truck size={14} style={{ color: C.teal }} />
            <span style={{ fontSize: 12, color: C.muted }}>廃材搬出</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: C.teal, lineHeight: 1 }}>
            {categoryCounts.waste}
            <span style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginLeft: 2 }}>件</span>
          </p>
          {wasteTotalCost !== 0 && (
            <p style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginTop: 4 }}>
              合計 {fmt(Math.abs(wasteTotalCost))}
            </p>
          )}
        </div>
      </div>

      {/* ── Report List ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
        {/* List header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>
            {filteredLogs.length}件の報告
          </span>
          <span style={{ fontSize: 12, color: C.muted }}>
            {dateFrom.replace(/-/g, "/")} 〜 {dateTo.replace(/-/g, "/")}
          </span>
        </div>

        {/* Empty state */}
        {filteredLogs.length === 0 && (
          <div className="py-16 text-center">
            <ClipboardList size={40} style={{ color: C.muted, margin: "0 auto 12px" }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: C.sub }}>報告がありません</p>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              {category !== "all" ? "別のカテゴリーを選択するか、" : ""}期間を変更してください
            </p>
          </div>
        )}

        {/* Grouped by date */}
        {groupedByDate.map(group => (
          <div key={group.date}>
            {/* Date header */}
            <div className="px-5 py-2 sticky top-0 z-10" style={{ background: "rgba(248,250,252,0.95)", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(8px)" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.amber }}>
                {(() => {
                  const d = new Date(group.date + "T00:00:00");
                  const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
                  return `${d.getMonth() + 1}月${d.getDate()}日（${dow}）`;
                })()}
              </span>
              <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>{group.logs.length}件</span>
            </div>

            {/* Logs for this date */}
            {group.logs.map(log => {
              const parsed = parseAction(log.action);
              return (
                <button
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-gray-50"
                  style={{ borderBottom: `1px solid #F1F5F9` }}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: parsed.bg }}>
                    <parsed.icon size={18} style={{ color: parsed.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{parsed.title}</span>
                      {parsed.urgency && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{
                          background: parsed.urgency === "緊急" ? "rgba(239,68,68,0.1)" : parsed.urgency === "要対応" ? "rgba(249,115,22,0.1)" : C.bg,
                          color: parsed.urgency === "緊急" ? C.red : parsed.urgency === "要対応" ? C.orange : C.muted,
                        }}>
                          {parsed.urgency}
                        </span>
                      )}
                      {parsed.amount && parsed.amount > 0 && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{fmt(parsed.amount)}</span>
                      )}
                      {parsed.category === "waste" && (() => {
                        const wc = wasteLogCostMap.get(log.id);
                        if (!wc || wc.total === 0) return null;
                        return (
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>{fmt(wc.total)}</span>
                        );
                      })()}
                    </div>
                    <p className="truncate" style={{ fontSize: 13, color: C.sub, maxWidth: "100%" }}>
                      {parsed.detail}
                      {parsed.category === "waste" && (() => {
                        const wc = wasteLogCostMap.get(log.id);
                        if (!wc) return null;
                        return ` （${wc.items.length}品目）`;
                      })()}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>{log.user || "—"}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>
                      {new Date(log.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <ChevronRight size={16} style={{ color: C.muted, flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Detail Modal ── */}
      {selectedLog && selectedParsed && (
        <DetailModal
          log={selectedLog}
          parsed={selectedParsed}
          expenses={expenses}
          wastes={wastes}
          onClose={() => setSelectedLog(null)}
          onDelete={async (id) => {
            if (!confirm("この報告を削除しますか？この操作は取り消せません。")) return;
            try {
              const res = await fetch("/api/kaitai/operation-logs", {
                method: "DELETE", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
              });
              if (res.ok) {
                setLogs(prev => prev.filter(l => l.id !== id));
                setSelectedLog(null);
              } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "削除に失敗しました");
              }
            } catch {
              alert("削除に失敗しました");
            }
          }}
        />
      )}
    </div>
  );
}
