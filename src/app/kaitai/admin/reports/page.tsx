"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ClipboardList, Clock, Fuel, AlertTriangle, Truck, Wrench, Coffee,
  ChevronRight, ChevronLeft, Calendar, Users, MapPin,
  X, Search, CheckCircle, LogIn, LogOut,
  FileText, DollarSign, Trash2, ImageIcon, Send,
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

// ─── Reaction status config ──────────────────────────────────────────────────

type ReactionStatus = "confirmed" | "approved" | "action_required" | "call_required";

type Reaction = {
  id: string;
  logId: string;
  status: ReactionStatus;
  comment: string | null;
  adminName: string;
  createdAt: string;
};

const REACTION_CONFIG: Record<ReactionStatus, { label: string; bg: string; fg: string; border: string }> = {
  confirmed:       { label: "確認済",   bg: "#F3F4F6", fg: "#4B5563", border: "#D1D5DB" },
  approved:        { label: "承 認",   bg: "#EFF6FF", fg: "#1D4ED8", border: "#BFDBFE" },
  action_required: { label: "要対応",   bg: "#FEF2F2", fg: "#DC2626", border: "#FECACA" },
  call_required:   { label: "電話連絡", bg: "#1F2937", fg: "#FFFFFF", border: "#374151" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type OperationLog = {
  id: string;
  action: string;
  user: string;
  siteId: string | null;
  device: string;
  imageIds?: string[];
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

/** Convert ISO string to local date string YYYY-MM-DD (fixes UTC vs JST mismatch) */
function toLocalDateStr(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

// ─── Fullscreen Image Viewer ──────────────────────────────────────────────────

function ImageViewer({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.9)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full"
        style={{ width: 44, height: 44, background: "rgba(255,255,255,0.2)" }}
      >
        <X size={22} style={{ color: "#fff" }} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="max-w-full max-h-full object-contain"
        style={{ touchAction: "pinch-zoom" }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

type ReportImage = { id: string; url: string; reportType: string | null; uploadedBy: string; createdAt: string };

function DetailModal({
  log, parsed, expenses, wastes, allImages, reaction, onClose, onDelete, onReact,
}: {
  log: OperationLog;
  parsed: ParsedReport;
  expenses: ExpenseLog[];
  wastes: WasteDispatch[];
  allImages: ReportImage[];
  reaction: Reaction | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onReact: (logId: string, status: ReactionStatus, comment?: string) => Promise<void>;
}) {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [comment, setComment] = useState(reaction?.comment ?? "");
  const [sending, setSending] = useState(false);
  const [activeStatus, setActiveStatus] = useState<ReactionStatus | null>(reaction?.status as ReactionStatus ?? null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // ── Match images by direct imageIds link ──
  const images = useMemo(() => {
    const ids = log.imageIds;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
    const idSet = new Set(ids);
    return allImages.filter(img => idSet.has(img.id));
  }, [allImages, log.imageIds]);

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

          {/* 添付写真 */}
          {images.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6 }}>
                添付写真（{images.length}枚）
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                gap: 8,
              }}>
                {images.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setViewUrl(img.url)}
                    className="relative rounded-xl overflow-hidden"
                    style={{
                      aspectRatio: "1",
                      border: `1px solid ${C.border}`,
                      cursor: "pointer",
                      background: C.bg,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      loading="lazy"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = "none";
                        el.parentElement!.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${C.muted};font-size:11px">読込失敗</div>`;
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

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

          {/* ── 既存リアクション表示 ── */}
          {activeStatus && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-lg"
              style={{
                background: REACTION_CONFIG[activeStatus].bg,
                border: `1.5px solid ${REACTION_CONFIG[activeStatus].border}`,
              }}
            >
              <span style={{
                fontSize: 14, fontWeight: 800,
                color: REACTION_CONFIG[activeStatus].fg,
              }}>
                {REACTION_CONFIG[activeStatus].label}
              </span>
              {reaction?.adminName && (
                <span style={{ fontSize: 12, color: REACTION_CONFIG[activeStatus].fg, opacity: 0.7 }}>
                  — {reaction.adminName}
                </span>
              )}
              {reaction?.comment && (
                <p style={{
                  fontSize: 13, color: REACTION_CONFIG[activeStatus].fg,
                  flex: 1, opacity: 0.85,
                }}>
                  {reaction.comment}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── 業務リアクションバー ── */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px 24px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10, letterSpacing: 1 }}>
            業務判断
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {(Object.entries(REACTION_CONFIG) as [ReactionStatus, typeof REACTION_CONFIG[ReactionStatus]][]).map(([key, cfg]) => {
              const isActive = activeStatus === key;
              return (
                <button
                  key={key}
                  disabled={sending}
                  onClick={async () => {
                    if (key === "action_required") {
                      setActiveStatus(key);
                      setTimeout(() => commentRef.current?.focus(), 100);
                      return;
                    }
                    setSending(true);
                    await onReact(log.id, key, comment || undefined);
                    setActiveStatus(key);
                    setSending(false);
                  }}
                  style={{
                    padding: "10px 4px",
                    fontSize: 13,
                    fontWeight: 800,
                    borderRadius: 6,
                    border: `1.5px solid ${isActive ? cfg.border : C.border}`,
                    background: isActive ? cfg.bg : "#fff",
                    color: isActive ? cfg.fg : C.sub,
                    cursor: sending ? "wait" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* コメント入力 */}
          <div style={{ marginTop: 12 }}>
            <textarea
              ref={commentRef}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="※詳細な指示や返信事項を入力"
              rows={2}
              style={{
                width: "100%",
                fontSize: 14,
                padding: "10px 14px",
                borderRadius: 6,
                border: `1.5px solid ${C.border}`,
                color: C.text,
                background: "#fff",
                resize: "vertical",
                outline: "none",
              }}
            />
            <button
              disabled={sending || (!activeStatus && !comment.trim())}
              onClick={async () => {
                if (!activeStatus && !comment.trim()) return;
                setSending(true);
                await onReact(log.id, activeStatus ?? "confirmed", comment || undefined);
                setSending(false);
              }}
              className="flex items-center justify-center gap-2"
              style={{
                marginTop: 8,
                width: "100%",
                height: 44,
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 800,
                background: activeStatus ? REACTION_CONFIG[activeStatus].fg === "#FFFFFF" ? "#1F2937" : REACTION_CONFIG[activeStatus].fg : C.sub,
                color: "#fff",
                border: "none",
                cursor: sending ? "wait" : "pointer",
                opacity: sending || (!activeStatus && !comment.trim()) ? 0.5 : 1,
              }}
            >
              <Send size={16} />
              送信
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen image viewer */}
      {viewUrl && <ImageViewer url={viewUrl} onClose={() => setViewUrl(null)} />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [expenses, setExpenses] = useState<ExpenseLog[]>([]);
  const [wastes, setWastes] = useState<WasteDispatch[]>([]);
  const [allImages, setAllImages] = useState<ReportImage[]>([]);
  const [reactions, setReactions] = useState<Map<string, Reaction>>(new Map());
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);

  const [category, setCategory] = useState<ReportCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<OperationLog | null>(null);

  // Date range (local time)
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return toLocalDateStr(d.toISOString());
  });
  const [dateTo, setDateTo] = useState(() => toLocalDateStr(now.toISOString()));
  const [siteFilter, setSiteFilter] = useState<string>("all");

  // Fetch data (including all recent images for instant display)
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/kaitai/operation-logs?type=reports&limit=1000", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/expense", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/waste-dispatch?all=1", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/upload?recent=1&days=30", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/sites", { credentials: "include" }).then(r => r.ok ? r.json() : null),
    ])
      .then(async ([logData, expData, wasteData, imgData, sitesData]) => {
        const fetchedLogs: OperationLog[] = logData?.logs ?? [];
        if (fetchedLogs.length > 0) setLogs(fetchedLogs);
        if (expData?.logs) setExpenses(expData.logs);
        if (wasteData?.dispatches) setWastes(wasteData.dispatches);
        if (imgData?.images) setAllImages(imgData.images);
        if (sitesData?.sites) setSites((sitesData.sites as { id: string; name: string }[]).map(s => ({ id: s.id, name: s.name })));

        // Fetch reactions for all logs (batch)
        if (fetchedLogs.length > 0) {
          const logIds = fetchedLogs.map(l => l.id).join(",");
          try {
            const rRes = await fetch(`/api/kaitai/reactions?logIds=${logIds}`, { credentials: "include" });
            if (rRes.ok) {
              const rData = await rRes.json();
              const map = new Map<string, Reaction>();
              for (const r of (rData.reactions ?? [])) {
                map.set(r.logId, r);
              }
              setReactions(map);
            }
          } catch { /* best effort */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Handle reaction submission
  const handleReact = useCallback(async (logId: string, status: ReactionStatus, comment?: string) => {
    try {
      const res = await fetch("/api/kaitai/reactions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId, status, comment }),
      });
      if (res.ok) {
        const data = await res.json();
        setReactions(prev => {
          const next = new Map(prev);
          next.set(logId, data.reaction);
          return next;
        });
      }
    } catch { /* ignore */ }
  }, []);

  // Find orphaned waste dispatches (no matching operation log)
  const orphanedWasteLogs = useMemo(() => {
    const matchedWasteIds = new Set<string>();
    for (const log of logs) {
      if (!log.action.startsWith("waste_dispatch:")) continue;
      const logTime = new Date(log.createdAt).getTime();
      for (const w of wastes) {
        const wTime = new Date(w.createdAt).getTime();
        if (Math.abs(wTime - logTime) < 120000 && w.reporter === log.user) {
          matchedWasteIds.add(w.id);
        }
      }
    }
    // Create virtual operation logs for unmatched waste dispatches
    return wastes
      .filter(w => !matchedWasteIds.has(w.id))
      .map(w => ({
        id: `orphan_waste_${w.id}`,
        action: `waste_dispatch:${w.wasteType} ${w.quantity}${w.unit}${w.processorName ? " → " + w.processorName : ""}`,
        user: w.reporter || "不明",
        siteId: w.siteId,
        device: "",
        createdAt: w.createdAt,
        _orphanWasteId: w.id,
      }));
  }, [logs, wastes]);

  // Find orphaned expense logs (no matching operation log)
  const orphanedExpenseLogs = useMemo(() => {
    const matchedExpIds = new Set<string>();
    for (const log of logs) {
      if (!log.action.startsWith("expense_log:") && !log.action.startsWith("fuel_log:")) continue;
      const logTime = new Date(log.createdAt).getTime();
      for (const e of expenses) {
        const eTime = new Date(e.createdAt).getTime();
        if (Math.abs(eTime - logTime) < 120000 && e.reporter === log.user) {
          matchedExpIds.add(e.id);
        }
      }
    }
    return expenses
      .filter(e => !matchedExpIds.has(e.id))
      .map(e => ({
        id: `orphan_exp_${e.id}`,
        action: `expense_log:${e.category}:¥${e.amount}`,
        user: e.reporter || "不明",
        siteId: e.siteId,
        device: "",
        createdAt: e.createdAt,
        _orphanExpenseId: e.id,
      }));
  }, [logs, expenses]);

  // Merge real logs + orphaned virtual logs
  const allLogs = useMemo(() => {
    const merged = [
      ...logs,
      ...orphanedWasteLogs,
      ...orphanedExpenseLogs,
    ];
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return merged;
  }, [logs, orphanedWasteLogs, orphanedExpenseLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      // Date filter
      const logDate = toLocalDateStr(log.createdAt);
      if (logDate < dateFrom || logDate > dateTo) return false;

      // Site filter
      if (siteFilter !== "all") {
        const site = sites.find(s => s.id === siteFilter);
        if (site) {
          const matchesSiteId = log.siteId === siteFilter;
          const matchesSiteName = log.action.includes(site.name);
          if (!matchesSiteId && !matchesSiteName) return false;
        }
      }

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
  }, [allLogs, category, searchQuery, dateFrom, dateTo, siteFilter, sites]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<ReportCategory, number> = { all: 0, attendance: 0, expense: 0, waste: 0, irregular: 0, daily: 0, finish: 0 };
    for (const log of allLogs) {
      const logDate = toLocalDateStr(log.createdAt);
      if (logDate < dateFrom || logDate > dateTo) continue;
      counts.all++;
      const parsed = parseAction(log.action);
      if (parsed.category in counts) counts[parsed.category as ReportCategory]++;
    }
    return counts;
  }, [allLogs, dateFrom, dateTo]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { date: string; logs: OperationLog[] }[] = [];
    let currentDate = "";
    let currentGroup: OperationLog[] = [];

    for (const log of filteredLogs) {
      const logDate = toLocalDateStr(log.createdAt);
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

  // Compute waste cost for each waste_dispatch log (including orphaned)
  const wasteLogCostMap = useMemo(() => {
    const map = new Map<string, { total: number; items: WasteDispatch[] }>();
    for (const log of allLogs) {
      if (!log.action.startsWith("waste_dispatch:")) continue;
      // Orphaned waste log — directly reference its waste record
      const orphanId = (log as typeof log & { _orphanWasteId?: string })._orphanWasteId;
      if (orphanId) {
        const w = wastes.find(w2 => w2.id === orphanId);
        if (w) {
          const total = w.direction === "buyback" ? -w.cost : w.cost;
          map.set(log.id, { total, items: [w] });
        }
        continue;
      }
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
  }, [allLogs, wastes]);

  // Total waste cost in date range
  const wasteTotalCost = useMemo(() => {
    const inRange = wastes.filter(w => w.date >= dateFrom && w.date <= dateTo);
    return inRange.reduce((sum, w) => sum + (w.direction === "buyback" ? -w.cost : w.cost), 0);
  }, [wastes, dateFrom, dateTo]);

  // Precompute image counts for each log (direct imageIds link)
  const logImageCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of allLogs) {
      const ids = (log as OperationLog).imageIds;
      if (Array.isArray(ids) && ids.length > 0) {
        map.set(log.id, ids.length);
      }
    }
    return map;
  }, [allLogs]);

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

        {/* Site filter */}
        <select
          value={siteFilter}
          onChange={e => setSiteFilter(e.target.value)}
          className="rounded-xl outline-none"
          style={{
            height: 44, fontSize: 13, padding: "0 12px",
            border: `1.5px solid ${C.border}`, color: C.text,
            background: "#fff", minWidth: 120,
          }}
        >
          <option value="all">全現場</option>
          {sites.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
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
              const reaction = reactions.get(log.id);
              const isHandled = reaction && (reaction.status === "confirmed" || reaction.status === "approved");
              const isAlert = reaction && (reaction.status === "action_required" || reaction.status === "call_required");

              return (
                <button
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-gray-50 relative"
                  style={{
                    borderBottom: `1px solid #F1F5F9`,
                    opacity: isHandled ? 0.55 : 1,
                    background: isAlert
                      ? reaction.status === "call_required" ? "rgba(31,41,55,0.03)" : "rgba(239,68,68,0.03)"
                      : "transparent",
                  }}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{
                    background: isHandled ? "#F3F4F6" : parsed.bg,
                  }}>
                    <parsed.icon size={18} style={{ color: isHandled ? "#9CA3AF" : parsed.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: 14, fontWeight: 700, color: isHandled ? "#9CA3AF" : C.text }}>{parsed.title}</span>
                      {(log.id.startsWith("orphan_waste_") || log.id.startsWith("orphan_exp_")) && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(239,68,68,0.1)", color: C.red }}>
                          ログ欠損
                        </span>
                      )}
                      {parsed.urgency && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{
                          background: parsed.urgency === "緊急" ? "rgba(239,68,68,0.1)" : parsed.urgency === "要対応" ? "rgba(249,115,22,0.1)" : C.bg,
                          color: parsed.urgency === "緊急" ? C.red : parsed.urgency === "要対応" ? C.orange : C.muted,
                        }}>
                          {parsed.urgency}
                        </span>
                      )}
                      {parsed.amount && parsed.amount > 0 && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: isHandled ? "#9CA3AF" : C.orange }}>{fmt(parsed.amount)}</span>
                      )}
                      {parsed.category === "waste" && (() => {
                        const wc = wasteLogCostMap.get(log.id);
                        if (!wc || wc.total === 0) return null;
                        return (
                          <span style={{ fontSize: 13, fontWeight: 700, color: isHandled ? "#9CA3AF" : C.teal }}>{fmt(wc.total)}</span>
                        );
                      })()}
                      {logImageCountMap.has(log.id) && (
                        <span className="flex items-center gap-0.5" style={{ color: C.muted }}>
                          <ImageIcon size={12} />
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{logImageCountMap.get(log.id)}</span>
                        </span>
                      )}
                      {reaction && (() => {
                        const cfg = REACTION_CONFIG[reaction.status as ReactionStatus];
                        if (!cfg) return null;
                        return (
                          <span
                            className="px-1.5 py-0.5 rounded"
                            style={{
                              fontSize: 11, fontWeight: 800,
                              background: cfg.bg, color: cfg.fg,
                              border: `1px solid ${cfg.border}`,
                            }}
                          >
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="truncate" style={{ fontSize: 13, color: isHandled ? "#B0B8C4" : C.sub, maxWidth: "100%" }}>
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
                    <span style={{ fontSize: 12, fontWeight: 600, color: isHandled ? "#B0B8C4" : C.sub }}>{log.user || "—"}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>
                      {new Date(log.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <ChevronRight size={16} style={{ color: C.muted, flexShrink: 0 }} />

                  {/* Handled stamp overlay */}
                  {isHandled && (
                    <div
                      className="absolute flex items-center justify-center pointer-events-none"
                      style={{
                        right: 50, top: "50%", transform: "translateY(-50%) rotate(-12deg)",
                      }}
                    >
                      <span style={{
                        fontSize: 16, fontWeight: 900, letterSpacing: "0.1em",
                        color: reaction.status === "approved" ? "rgba(29,78,216,0.25)" : "rgba(107,114,128,0.2)",
                        border: `2.5px solid ${reaction.status === "approved" ? "rgba(29,78,216,0.2)" : "rgba(107,114,128,0.18)"}`,
                        borderRadius: 6,
                        padding: "2px 10px",
                      }}>
                        {reaction.status === "approved" ? "承認済" : "確認済"}
                      </span>
                    </div>
                  )}
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
          allImages={allImages}
          reaction={reactions.get(selectedLog.id) ?? null}
          onClose={() => setSelectedLog(null)}
          onReact={handleReact}
          onDelete={async (id) => {
            if (!confirm("この報告を削除しますか？関連する経費・廃材データも削除されます。")) return;
            try {
              // Orphaned waste dispatch — delete directly via waste-dispatch API
              if (id.startsWith("orphan_waste_")) {
                const realId = id.replace("orphan_waste_", "");
                const res = await fetch("/api/kaitai/waste-dispatch", {
                  method: "DELETE", credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: realId }),
                });
                if (res.ok) {
                  setWastes(prev => prev.filter(w => w.id !== realId));
                  setSelectedLog(null);
                } else {
                  const data = await res.json().catch(() => ({}));
                  alert(data.error || "削除に失敗しました");
                }
                return;
              }
              // Orphaned expense — delete directly via expense API
              if (id.startsWith("orphan_exp_")) {
                const realId = id.replace("orphan_exp_", "");
                const res = await fetch("/api/kaitai/expense", {
                  method: "DELETE", credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: realId }),
                });
                if (res.ok) {
                  setExpenses(prev => prev.filter(e => e.id !== realId));
                  setSelectedLog(null);
                } else {
                  const data = await res.json().catch(() => ({}));
                  alert(data.error || "削除に失敗しました");
                }
                return;
              }
              // Normal operation log — cascade delete via operation-logs API
              const res = await fetch("/api/kaitai/operation-logs", {
                method: "DELETE", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
              });
              if (res.ok) {
                setLogs(prev => prev.filter(l => l.id !== id));
                // Also remove related local expense/waste state
                const deletedLog = logs.find(l => l.id === id);
                if (deletedLog) {
                  const logTime = new Date(deletedLog.createdAt).getTime();
                  if (deletedLog.action.startsWith("expense_log:") || deletedLog.action.startsWith("fuel_log:")) {
                    setExpenses(prev => prev.filter(e => {
                      const eTime = new Date(e.createdAt).getTime();
                      return !(Math.abs(eTime - logTime) < 120000 && e.reporter === deletedLog.user);
                    }));
                  } else if (deletedLog.action.startsWith("waste_dispatch:")) {
                    setWastes(prev => prev.filter(w => {
                      const wTime = new Date(w.createdAt).getTime();
                      return !(Math.abs(wTime - logTime) < 120000 && w.reporter === deletedLog.user);
                    }));
                  }
                }
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
