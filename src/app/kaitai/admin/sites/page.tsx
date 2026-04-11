"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MapPin, Calendar, Edit3, ChevronRight, ChevronLeft, Search,
  Building2, CheckCircle, FileText, Handshake,
  Hammer, CreditCard, ClipboardCheck, Trash2,
  AlertCircle, XCircle, TrendingUp, TrendingDown, Minus,
  DollarSign, Banknote, AlertTriangle,
  X, Plus, History, Pencil,
} from "lucide-react";
import { T } from "../../lib/design-tokens";

type SiteRow = {
  id: string;
  name: string;
  address: string;
  status: string;
  startDate: string;
  endDate: string;
  contractAmount: number;
  paidAmount: number;
  costAmount: number;
  progressPct: number;
  structureType: string;
};

type PaymentRecord = {
  id: string;
  siteId: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
};

// ─── 9-stage status system (with 失注) ─────────────────────────────────────

const STATUSES = [
  { key: "調査・見積",       label: "調査・見積",       group: "pre",    icon: Search,         color: "#6B7280", bg: "rgba(107,114,128,0.08)" },
  { key: "契約・申請",       label: "契約・申請",       group: "pre",    icon: FileText,       color: "#6366F1", bg: "rgba(99,102,241,0.08)" },
  { key: "近隣挨拶・養生",   label: "近隣挨拶・養生",   group: "pre",    icon: Handshake,      color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
  { key: "着工・内装解体",   label: "着工・内装解体",   group: "active", icon: Hammer,         color: T.primary, bg: "rgba(180,83,9,0.08)" },
  { key: "上屋解体・基礎",   label: "上屋解体・基礎",   group: "active", icon: Building2,      color: "#B45309", bg: "rgba(180,83,9,0.12)" },
  { key: "完工・更地確認",   label: "完工・更地確認",   group: "post",   icon: CheckCircle,    color: "#10B981", bg: "rgba(16,185,129,0.08)" },
  { key: "産廃書類完了",     label: "産廃書類完了",     group: "post",   icon: ClipboardCheck, color: "#0D9488", bg: "rgba(13,148,136,0.08)" },
  { key: "入金確認",         label: "入金確認",         group: "done",   icon: CreditCard,     color: "#059669", bg: "rgba(5,150,105,0.08)" },
  { key: "失注（契約不成立）", label: "失注",           group: "lost",   icon: XCircle,        color: "#9CA3AF", bg: "rgba(156,163,175,0.10)" },
] as const;

const LEGACY_MAP: Record<string, string> = {
  "着工前": "調査・見積",
  "施工中": "着工・内装解体",
  "解体中": "着工・内装解体",
  "完工": "完工・更地確認",
};

function resolveStatus(raw: string) {
  const mapped = LEGACY_MAP[raw] ?? raw;
  return STATUSES.find(s => s.key === mapped) ?? STATUSES[0];
}

function statusIndex(raw: string): number {
  const mapped = LEGACY_MAP[raw] ?? raw;
  const idx = STATUSES.findIndex(s => s.key === mapped);
  return idx >= 0 ? idx : 0;
}

// ─── Groups for summary cards (5 groups) ──────────────────────────────────

const GROUPS = [
  { key: "pre",    label: "施工前",         color: "#3B82F6", icon: FileText,     statuses: ["調査・見積", "契約・申請", "近隣挨拶・養生"] },
  { key: "active", label: "施工中",         color: T.primary, icon: Hammer,       statuses: ["着工・内装解体", "上屋解体・基礎"] },
  { key: "post",   label: "完工処理",       color: "#10B981", icon: CheckCircle,  statuses: ["完工・更地確認", "産廃書類完了"] },
  { key: "done",   label: "入金済",         color: "#059669", icon: CreditCard,   statuses: ["入金確認"] },
  { key: "lost",   label: "失注",           color: "#9CA3AF", icon: XCircle,      statuses: ["失注（契約不成立）"] },
];

function siteGroup(raw: string): string {
  return resolveStatus(raw).group;
}

const fmt = (n: number) => n > 0 ? `¥${Math.round(n).toLocaleString("ja-JP")}` : "—";
const fmtMan = (n: number) => {
  if (n === 0) return "¥0";
  if (Math.abs(n) >= 10000) return `¥${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}万`;
  return `¥${n.toLocaleString("ja-JP")}`;
};

// ─── Period filter ──────────────────────────────────────────────────────────

type ViewMode = "all" | "month" | "year";

function periodLabel(mode: ViewMode, year: number, month: number): string {
  if (mode === "all") return "全期間";
  if (mode === "year") return `${year}年`;
  return `${year}年${month}月`;
}

function filterByPeriod(sites: SiteRow[], mode: ViewMode, year: number, month: number): SiteRow[] {
  if (mode === "all") return sites;
  return sites.filter(site => {
    const periodStart = mode === "month"
      ? `${year}-${String(month).padStart(2, "0")}-01`
      : `${year}-01-01`;
    const periodEnd = mode === "month"
      ? `${year}-${String(month).padStart(2, "0")}-31`
      : `${year}-12-31`;
    const siteStart = site.startDate || "2000-01-01";
    const siteEnd = site.endDate || "2099-12-31";
    return siteStart <= periodEnd && siteEnd >= periodStart;
  });
}

function PeriodPicker({
  mode, year, month,
  onModeChange, onYearChange, onMonthChange,
}: {
  mode: ViewMode; year: number; month: number;
  onModeChange: (m: ViewMode) => void;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
}) {
  const now = new Date();
  const currentYear = now.getFullYear();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: T.bg }}>
        {([["all", "全期間"], ["month", "月別"], ["year", "年間"]] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className="px-4 py-2 rounded-md font-bold transition-all"
            style={{
              fontSize: 14,
              ...(mode === m
                ? { background: T.primary, color: T.surface }
                : { color: T.sub }),
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode !== "all" && (
        <div className="flex items-center gap-2">
          <button onClick={() => onYearChange(year - 1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ border: `1px solid ${T.border}`, color: T.sub }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, color: T.text, minWidth: 70, textAlign: "center" }}>
            {year}年
          </span>
          <button onClick={() => onYearChange(Math.min(year + 1, currentYear))}
            disabled={year >= currentYear}
            className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ border: `1px solid ${T.border}`, color: year >= currentYear ? T.muted : T.sub, opacity: year >= currentYear ? 0.4 : 1 }}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {mode === "month" && (
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
            const isFuture = year === currentYear && m > now.getMonth() + 1;
            return (
              <button
                key={m}
                onClick={() => !isFuture && onMonthChange(m)}
                disabled={isFuture}
                className="py-2 rounded-md font-bold transition-all"
                style={{
                  fontSize: 14,
                  ...(month === m
                    ? { background: T.primary, color: "#FFF" }
                    : isFuture
                    ? { color: T.muted, opacity: 0.3 }
                    : { color: T.sub, background: T.bg }),
                }}
              >
                {m}月
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-1 flex-wrap">
        {[
          { label: "全期間", action: () => { onModeChange("all"); } },
          { label: "今月", action: () => { onModeChange("month"); onYearChange(currentYear); onMonthChange(now.getMonth() + 1); } },
          { label: "先月", action: () => {
            const pm = now.getMonth() === 0 ? 12 : now.getMonth();
            const py = now.getMonth() === 0 ? currentYear - 1 : currentYear;
            onModeChange("month"); onYearChange(py); onMonthChange(pm);
          }},
          { label: `${currentYear}年`, action: () => { onModeChange("year"); onYearChange(currentYear); } },
          { label: `${currentYear - 1}年`, action: () => { onModeChange("year"); onYearChange(currentYear - 1); } },
        ].map(q => (
          <button key={q.label} onClick={q.action}
            className="px-3 py-1.5 rounded-md font-bold transition-all"
            style={{ fontSize: 13, background: T.bg, color: T.sub, border: `1px solid ${T.border}` }}>
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Status Dropdown ───────────────────────────────────────────────────────

function StatusDropdown({
  siteId, currentStatus, onStatusChange,
}: {
  siteId: string;
  currentStatus: string;
  onStatusChange: (siteId: string, newStatus: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const resolved = resolveStatus(currentStatus);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === resolved.key) return;
    setSaving(true);
    try {
      const res = await fetch("/api/kaitai/sites", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: siteId, status: newStatus }),
      });
      if (res.ok) {
        onStatusChange(siteId, newStatus);
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <select
      value={resolved.key}
      onChange={handleChange}
      disabled={saving}
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: resolved.color,
        background: resolved.bg,
        border: `1px solid ${resolved.color}30`,
        borderRadius: 8,
        padding: "6px 10px",
        cursor: "pointer",
        outline: "none",
        opacity: saving ? 0.5 : 1,
        maxWidth: 200,
      }}
    >
      {STATUSES.map(s => (
        <option key={s.key} value={s.key}>{s.key}</option>
      ))}
    </select>
  );
}

// ─── Payment Bar (mini inline visualization) ───────────────────────────────

function PaymentBar({ paid, total }: { paid: number; total: number }) {
  if (total <= 0) return null;
  const pct = Math.min(Math.round((paid / total) * 100), 100);
  return (
    <div className="flex items-center gap-2" style={{ minWidth: 120 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        background: "#E5E7EB", overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 3,
          background: pct >= 100 ? "#059669" : pct >= 50 ? "#3B82F6" : "#F59E0B",
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 100 ? "#059669" : "#3B82F6" }}>
        {pct}%
      </span>
    </div>
  );
}

// ─── Summary Card ──────────────────────────────────────────────────────────

function SummaryCard({
  label, count, color, icon: Icon, prevCount,
}: {
  label: string; count: number; color: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  prevCount?: number;
}) {
  const trend = prevCount !== undefined ? count - prevCount : undefined;
  return (
    <div
      className="rounded-xl"
      style={{
        background: "#fff",
        border: `1px solid ${T.border}`,
        padding: "20px 20px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Color accent line at top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: color,
      }} />

      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontSize: 14, color: T.sub, fontWeight: 600, marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>
            {count}
            <span style={{ fontSize: 16, fontWeight: 500, marginLeft: 4, color: T.sub }}>件</span>
          </p>
        </div>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 44, height: 44, background: `${color}12` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
      </div>

      {/* Trend badge */}
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          {trend > 0 ? (
            <TrendingUp size={13} style={{ color: "#10B981" }} />
          ) : trend < 0 ? (
            <TrendingDown size={13} style={{ color: "#EF4444" }} />
          ) : (
            <Minus size={13} style={{ color: T.muted }} />
          )}
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: trend > 0 ? "#10B981" : trend < 0 ? "#EF4444" : T.muted,
          }}>
            前月比 {trend > 0 ? "+" : ""}{trend}件
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────────────

function PaymentModal({
  site, editingPayment, onClose, onSaved,
}: {
  site: SiteRow;
  editingPayment: PaymentRecord | null;
  onClose: () => void;
  onSaved: (siteId: string, totalPaid: number) => void;
}) {
  const isEdit = !!editingPayment;
  const [amount, setAmount] = useState(isEdit ? String(editingPayment.amount) : "");
  const [date, setDate] = useState(isEdit ? editingPayment.date : new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(isEdit ? (editingPayment.note ?? "") : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const remaining = site.contractAmount - site.paidAmount + (isEdit ? editingPayment.amount : 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = Math.round(Number(amount));
    if (!numAmount || numAmount <= 0) { setError("金額を正しく入力してください"); return; }
    if (!date) { setError("入金日を入力してください"); return; }

    setSaving(true);
    setError("");
    try {
      const url = "/api/kaitai/payments";
      const method = isEdit ? "PATCH" : "POST";
      const body = isEdit
        ? { id: editingPayment.id, amount: numAmount, date, note: note || null }
        : { siteId: site.id, amount: numAmount, date, note: note || null };

      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "保存に失敗しました"); setSaving(false); return; }
      onSaved(site.id, data.totalPaid);
      onClose();
    } catch {
      setError("通信エラーが発生しました");
      setSaving(false);
    }
  }

  function handleAmountPreset(value: number) {
    setAmount(String(value));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#fff", border: `1px solid ${T.border}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div>
            <p style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 2 }}>
              {isEdit ? "入金記録の編集" : "入金を記録する"}
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{site.name}</h3>
          </div>
          <button onClick={onClose} className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36 }}>
            <X size={18} style={{ color: T.sub }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          {/* Context info */}
          <div className="flex gap-4">
            <div className="flex-1 rounded-lg" style={{ padding: "10px 14px", background: T.bg }}>
              <p style={{ fontSize: 12, color: T.muted }}>受注額</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#3B82F6" }}>{fmtMan(site.contractAmount)}</p>
            </div>
            <div className="flex-1 rounded-lg" style={{ padding: "10px 14px", background: T.bg }}>
              <p style={{ fontSize: 12, color: T.muted }}>未入金残高</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: remaining > 0 ? T.primary : "#059669" }}>{fmtMan(remaining)}</p>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: T.text, display: "block", marginBottom: 6 }}>
              入金額 <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div className="relative">
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: T.muted }}>¥</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl outline-none"
                style={{
                  border: `1px solid ${T.border}`, padding: "14px 14px 14px 32px",
                  fontSize: 20, fontWeight: 700, color: T.text, background: "#fff",
                }}
              />
            </div>
            {/* Quick presets */}
            {remaining > 0 && (
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => handleAmountPreset(remaining)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: "rgba(5,150,105,0.08)", color: "#059669", border: "1px solid rgba(5,150,105,0.15)" }}>
                  全額 ({fmtMan(remaining)})
                </button>
                {remaining > 10000 && (
                  <button type="button" onClick={() => handleAmountPreset(Math.round(remaining / 2))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: "rgba(59,130,246,0.08)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.15)" }}>
                    半額 ({fmtMan(Math.round(remaining / 2))})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: T.text, display: "block", marginBottom: 6 }}>
              入金日 <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-xl outline-none"
              style={{
                border: `1px solid ${T.border}`, padding: "12px 14px",
                fontSize: 16, color: T.text, background: "#fff",
              }}
            />
          </div>

          {/* Note */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: T.text, display: "block", marginBottom: 6 }}>
              メモ（任意）
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="例：第1回目 振込"
              className="w-full rounded-xl outline-none"
              style={{
                border: `1px solid ${T.border}`, padding: "12px 14px",
                fontSize: 15, color: T.text, background: "#fff",
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: 13, color: "#EF4444", fontWeight: 600 }}>{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-bold transition-all"
            style={{
              fontSize: 16,
              background: saving ? T.muted : "#059669",
              color: "#fff",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "保存中..." : isEdit ? "入金記録を更新" : "入金を記録する"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Payment History Drawer ────────────────────────────────────────────────

function PaymentHistoryDrawer({
  site, onClose, onEdit, onPaidUpdate,
}: {
  site: SiteRow;
  onClose: () => void;
  onEdit: (payment: PaymentRecord) => void;
  onPaidUpdate: (siteId: string, totalPaid: number) => void;
}) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/kaitai/payments?siteId=${site.id}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.payments) {
          setPayments(data.payments.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            siteId: p.siteId as string,
            amount: p.amount as number,
            date: p.date as string,
            note: (p.note as string) ?? "",
            createdAt: (p.createdAt as string) ?? "",
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [site.id]);

  async function handleDelete(paymentId: string) {
    if (!confirm("この入金記録を削除しますか？")) return;
    try {
      const res = await fetch("/api/kaitai/payments", {
        method: "DELETE", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        onPaidUpdate(site.id, data.totalPaid);
      }
    } catch { /* ignore */ }
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "#fff", border: `1px solid ${T.border}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div>
            <p style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 2 }}>入金履歴</p>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{site.name}</h3>
          </div>
          <button onClick={onClose} className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36 }}>
            <X size={18} style={{ color: T.sub }} />
          </button>
        </div>

        {/* Summary */}
        <div className="flex gap-4 px-6 py-4 flex-shrink-0" style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
          <div className="flex-1">
            <p style={{ fontSize: 12, color: T.muted }}>受注額</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#3B82F6" }}>{fmtMan(site.contractAmount)}</p>
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 12, color: T.muted }}>入金済合計</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#059669" }}>{fmtMan(totalPaid)}</p>
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 12, color: T.muted }}>残高</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: site.contractAmount - totalPaid > 0 ? T.primary : "#059669" }}>
              {fmtMan(site.contractAmount - totalPaid)}
            </p>
          </div>
        </div>

        {/* Payment list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-center py-8" style={{ color: T.muted }}>読み込み中...</p>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard size={32} style={{ color: T.muted, margin: "0 auto 8px" }} />
              <p style={{ fontSize: 15, color: T.sub }}>入金記録がありません</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {payments.map((p, i) => (
                <div
                  key={p.id}
                  className="rounded-xl"
                  style={{ border: `1px solid ${T.border}`, padding: "14px 16px" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: "#059669",
                          background: "rgba(5,150,105,0.08)", padding: "2px 8px", borderRadius: 4,
                        }}>
                          第{payments.length - i}回
                        </span>
                        <span style={{ fontSize: 14, color: T.sub }}>
                          {p.date.replace(/-/g, "/")}
                        </span>
                      </div>
                      <p style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>
                        ¥{p.amount.toLocaleString("ja-JP")}
                      </p>
                      {p.note && (
                        <p style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>{p.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onEdit(p)}
                        className="flex items-center justify-center rounded-lg"
                        style={{ width: 34, height: 34, background: T.bg, border: `1px solid ${T.border}`, cursor: "pointer" }}
                        title="編集"
                      >
                        <Pencil size={13} style={{ color: T.sub }} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="flex items-center justify-center rounded-lg"
                        style={{ width: 34, height: 34, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", cursor: "pointer" }}
                        title="削除"
                      >
                        <Trash2 size={13} style={{ color: "#EF4444" }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${T.border}` }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold"
            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.sub, fontSize: 15 }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Site Card ─────────────────────────────────────────────────────────────

function SiteCard({
  site, onStatusChange, onDelete, onPayment, onPaymentHistory,
}: {
  site: SiteRow;
  onStatusChange: (siteId: string, newStatus: string) => void;
  onDelete: (siteId: string, siteName: string) => void;
  onPayment: (site: SiteRow) => void;
  onPaymentHistory: (site: SiteRow) => void;
}) {
  const ss = resolveStatus(site.status);
  const isLost = ss.group === "lost";
  const isActive = ss.group === "active";
  const remaining = site.contractAmount - site.paidAmount;
  const paidPct = site.contractAmount > 0 ? Math.round((site.paidAmount / site.contractAmount) * 100) : 0;
  const profit = site.contractAmount > 0 && site.costAmount > 0
    ? site.contractAmount - site.costAmount : null;
  const profitPct = profit !== null && site.contractAmount > 0
    ? Math.round((profit / site.contractAmount) * 100) : null;

  return (
    <div
      className="rounded-xl transition-all"
      style={{
        background: isLost ? "#F9FAFB" : "#fff",
        border: `1px solid ${isLost ? "#D1D5DB" : T.border}`,
        opacity: isLost ? 0.7 : 1,
      }}
    >
      <div style={{ padding: "20px 24px 16px" }}>
        {/* Row 1: status + name + actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <StatusDropdown
                siteId={site.id}
                currentStatus={site.status}
                onStatusChange={onStatusChange}
              />
              {site.structureType && (
                <span style={{
                  fontSize: 13, color: T.muted, fontWeight: 500,
                  padding: "2px 8px", background: T.bg, borderRadius: 6,
                }}>
                  {site.structureType}
                </span>
              )}
              {isLost && (
                <span style={{
                  fontSize: 13, fontWeight: 700, color: "#9CA3AF",
                  padding: "2px 10px", background: "rgba(156,163,175,0.12)", borderRadius: 6,
                }}>
                  契約不成立
                </span>
              )}
            </div>
            <p style={{
              fontSize: 18, fontWeight: 700, color: isLost ? T.muted : T.text,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              textDecoration: isLost ? "line-through" : "none",
            }}>
              {site.name}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/kaitai/sites/${site.id}/edit`}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold"
              style={{
                fontSize: 14,
                background: T.primaryLt,
                color: T.primary,
                textDecoration: "none",
                border: `1px solid ${T.primaryMd}`,
              }}
            >
              <Edit3 size={14} />
              編集
            </Link>
            <button
              onClick={(e) => { e.preventDefault(); onDelete(site.id, site.name); }}
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 40, height: 40,
                background: "rgba(239,68,68,0.06)",
                color: "#EF4444",
                border: "1px solid rgba(239,68,68,0.12)",
                cursor: "pointer",
              }}
              title="削除"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Row 2: address */}
        {site.address && (
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={14} style={{ color: T.muted, flexShrink: 0 }} />
            <p style={{
              fontSize: 16, color: "#4B5563",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {site.address}
            </p>
          </div>
        )}

        {/* Row 3: dates */}
        {(site.startDate || site.endDate) && (
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} style={{ color: T.muted }} />
            <span style={{ fontSize: 16, color: "#4B5563" }}>
              {site.startDate?.replace(/-/g, "/")} 〜 {site.endDate?.replace(/-/g, "/")}
            </span>
          </div>
        )}

        {/* Row 4: financial info (main feature) */}
        {site.contractAmount > 0 && !isLost && (
          <div
            className="rounded-lg"
            style={{
              background: "#F8FAFC",
              border: `1px solid ${T.border}`,
              padding: "14px 16px",
              marginBottom: 4,
            }}
          >
            <div className="grid grid-cols-3 gap-4">
              {/* 受注額 */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign size={13} style={{ color: "#3B82F6" }} />
                  <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>受注額</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#3B82F6", lineHeight: 1.2 }}>
                  {fmtMan(site.contractAmount)}
                </p>
              </div>

              {/* 入金済 */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Banknote size={13} style={{ color: "#10B981" }} />
                  <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>入金済</span>
                  {paidPct > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: paidPct >= 100 ? "#059669" : "#3B82F6",
                      background: paidPct >= 100 ? "rgba(5,150,105,0.1)" : "rgba(59,130,246,0.1)",
                      borderRadius: 4, padding: "1px 5px",
                    }}>
                      {paidPct}%
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#10B981", lineHeight: 1.2 }}>
                  {site.paidAmount > 0 ? fmtMan(site.paidAmount) : "—"}
                </p>
              </div>

              {/* 未入金 */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  {remaining > 0 && <AlertTriangle size={13} style={{ color: T.primary }} />}
                  <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>未入金</span>
                </div>
                <p style={{
                  fontSize: 18, fontWeight: 800, lineHeight: 1.2,
                  color: remaining > 0 ? T.primary : "#059669",
                }}>
                  {remaining > 0 ? fmtMan(remaining) : "—"}
                </p>
              </div>
            </div>

            {/* Payment progress bar */}
            <div style={{ marginTop: 12 }}>
              <PaymentBar paid={site.paidAmount} total={site.contractAmount} />
            </div>

            {/* Payment action buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={(e) => { e.stopPropagation(); onPayment(site); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold flex-1 justify-center"
                style={{
                  fontSize: 13,
                  background: "#059669", color: "#fff",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                <Plus size={14} /> 入金を記録
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onPaymentHistory(site); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold"
                style={{
                  fontSize: 13,
                  background: T.bg, color: T.sub,
                  cursor: "pointer",
                  border: `1px solid ${T.border}`,
                }}
              >
                <History size={14} /> 入金履歴
              </button>
            </div>
          </div>
        )}

        {/* Row 5: meta badges */}
        <div className="flex items-center gap-3 flex-wrap mt-3">
          {/* 粗利 */}
          {profitPct !== null && !isLost && (
            <span style={{
              fontSize: 14, fontWeight: 700,
              color: profitPct >= 20 ? "#10B981" : profitPct >= 10 ? "#D97706" : "#EF4444",
              padding: "3px 10px",
              background: profitPct >= 20 ? "rgba(16,185,129,0.08)" : profitPct >= 10 ? "rgba(217,119,6,0.08)" : "rgba(239,68,68,0.08)",
              borderRadius: 6,
            }}>
              粗利 {profitPct}%
            </span>
          )}

          {/* 進捗 */}
          {isActive && site.progressPct > 0 && (
            <span style={{
              fontSize: 14, fontWeight: 600, color: T.sub,
              padding: "3px 10px", background: T.bg, borderRadius: 6,
            }}>
              進捗 {site.progressPct}%
            </span>
          )}

          {/* 入金ステータス badge */}
          {ss.key === "入金確認" && (
            <span
              className="font-bold px-3 py-1 rounded-full"
              style={{ fontSize: 13, background: "#059669", color: "#fff" }}
            >
              ✓ 入金済
            </span>
          )}
          {ss.key === "産廃書類完了" && (
            <span
              className="font-bold px-3 py-1 rounded-full"
              style={{ fontSize: 13, background: "rgba(13,148,136,0.12)", color: "#0D9488" }}
            >
              請求可
            </span>
          )}
        </div>

        {/* Progress bar for active sites */}
        {isActive && site.progressPct > 0 && (
          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: T.border }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${site.progressPct}%`,
                background: `linear-gradient(90deg, ${T.primary}, ${T.primaryDk})`,
              }}
            />
          </div>
        )}
      </div>

      {/* Footer: detail link */}
      <Link
        href={`/kaitai/site/${site.id}`}
        className="flex items-center justify-between rounded-b-xl"
        style={{
          borderTop: `1px solid ${T.border}`,
          textDecoration: "none",
          background: isLost ? "#F3F4F6" : "#F8FAFC",
          padding: "14px 24px",
        }}
      >
        <span style={{ fontSize: 15, color: T.sub, fontWeight: 500 }}>現場詳細を見る</span>
        <ChevronRight size={16} style={{ color: T.muted }} />
      </Link>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AdminSitesPage() {
  const now = new Date();
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Period filter state
  const [mode, setMode] = useState<ViewMode>("all");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Group filter (click on summary card)
  const [activeGroupFilter, setActiveGroupFilter] = useState<string | null>(null);

  // Payment modal state
  const [paymentSite, setPaymentSite] = useState<SiteRow | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [historySite, setHistorySite] = useState<SiteRow | null>(null);

  useEffect(() => {
    fetch("/api/kaitai/sites", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.sites) return;
        setSites(
          data.sites.map((s: Record<string, unknown>) => ({
            id: s.id as string,
            name: s.name as string,
            address: (s.address as string) ?? "",
            status: (s.status as string) ?? "調査・見積",
            startDate: (s.startDate as string) ?? "",
            endDate: (s.endDate as string) ?? "",
            contractAmount: (s.contractAmount as number) ?? 0,
            paidAmount: (s.paidAmount as number) ?? 0,
            costAmount: (s.costAmount as number) ?? 0,
            progressPct: (s.progressPct as number) ?? 0,
            structureType: (s.structureType as string) ?? "",
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Close picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPicker]);

  function handleStatusChange(siteId: string, newStatus: string) {
    setSites(prev => prev.map(s => s.id === siteId ? { ...s, status: newStatus } : s));
  }

  async function handleDelete(siteId: string, siteName: string) {
    if (!confirm(`「${siteName}」を削除しますか？\n関連する経費・廃材・報告データもすべて削除されます。この操作は取り消せません。`)) return;
    try {
      const res = await fetch("/api/kaitai/sites", {
        method: "DELETE", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: siteId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "削除に失敗しました");
        return;
      }
      setSites(prev => prev.filter(s => s.id !== siteId));
    } catch {
      alert("削除に失敗しました");
    }
  }

  function handlePaidUpdate(siteId: string, totalPaid: number) {
    setSites(prev => prev.map(s => s.id === siteId ? { ...s, paidAmount: totalPaid } : s));
    // Also update historySite if it's the same site
    if (historySite?.id === siteId) {
      setHistorySite(prev => prev ? { ...prev, paidAmount: totalPaid } : null);
    }
  }

  // Apply period filter, then group filter, then text search
  const periodFiltered = filterByPeriod(sites, mode, year, month);

  const filtered = periodFiltered
    .filter(s => {
      if (activeGroupFilter && siteGroup(s.status) !== activeGroupFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
    })
    .sort((a, b) => statusIndex(a.status) - statusIndex(b.status));

  // Group sites
  const grouped = GROUPS.map(g => ({
    ...g,
    sites: filtered.filter(s => siteGroup(s.status) === g.key),
  }));

  // Counts for summary (based on period filter only, not group or search filter)
  const summaryFiltered = periodFiltered;
  const groupCounts = GROUPS.map(g => ({
    ...g,
    count: summaryFiltered.filter(s => siteGroup(s.status) === g.key).length,
  }));

  // Financial totals
  const totalContract = periodFiltered.filter(s => siteGroup(s.status) !== "lost").reduce((sum, s) => sum + s.contractAmount, 0);
  const totalPaid = periodFiltered.filter(s => siteGroup(s.status) !== "lost").reduce((sum, s) => sum + s.paidAmount, 0);
  const totalRemaining = totalContract - totalPaid;

  if (loading) {
    return (
      <div className="py-20 text-center" style={{ color: T.sub, fontSize: 18 }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div className="py-8 flex flex-col gap-8">

      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: T.heading, lineHeight: 1.2 }}>
            現場管理
          </h1>
          <p style={{ fontSize: 16, marginTop: 6, color: T.sub, fontWeight: 500 }}>
            登録現場の確認・ステータス管理
            <span style={{ marginLeft: 8, color: T.muted }}>
              （{filtered.length}/{sites.length}件表示）
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period picker */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all"
              style={{
                fontSize: 15,
                background: showPicker ? "rgba(180,83,9,0.08)" : "#fff",
                border: `1px solid ${showPicker ? T.primary : T.border}`,
                color: showPicker ? T.primary : T.sub,
              }}
            >
              <Calendar size={16} />
              {periodLabel(mode, year, month)}
            </button>
            {showPicker && (
              <div
                className="absolute right-0 top-full mt-2 z-50 p-5 rounded-xl"
                style={{ background: "#fff", border: `1px solid ${T.border}`, minWidth: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              >
                <PeriodPicker
                  mode={mode} year={year} month={month}
                  onModeChange={m => { setMode(m); if (m === "all") setShowPicker(false); }}
                  onYearChange={setYear}
                  onMonthChange={m => { setMonth(m); setShowPicker(false); }}
                />
              </div>
            )}
          </div>
          <Link
            href="/kaitai/sites/new"
            className="px-6 py-3 rounded-xl font-bold"
            style={{ fontSize: 16, background: T.primary, color: "#fff", textDecoration: "none" }}
          >
            + 新規現場登録
          </Link>
        </div>
      </div>

      {/* ── Summary cards (5 groups) ── */}
      <div className="grid grid-cols-5 gap-4">
        {groupCounts.map(g => (
          <button
            key={g.key}
            onClick={() => setActiveGroupFilter(activeGroupFilter === g.key ? null : g.key)}
            style={{
              textAlign: "left", cursor: "pointer", outline: "none",
              border: activeGroupFilter === g.key ? `2px solid ${g.color}` : "none",
              borderRadius: T.cardRadius,
            }}
          >
            <SummaryCard
              label={g.label}
              count={g.count}
              color={g.color}
              icon={g.icon}
            />
          </button>
        ))}
      </div>

      {/* Active group filter indicator */}
      {activeGroupFilter && (
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 14, color: T.sub }}>
            フィルタ: <strong>{GROUPS.find(g => g.key === activeGroupFilter)?.label}</strong>
          </span>
          <button
            onClick={() => setActiveGroupFilter(null)}
            className="px-2 py-1 rounded-md"
            style={{ fontSize: 13, color: T.primary, background: T.primaryLt, fontWeight: 600, cursor: "pointer" }}
          >
            解除
          </button>
        </div>
      )}

      {/* ── Financial summary bar ── */}
      {totalContract > 0 && (
        <div
          className="rounded-xl flex items-center gap-6 flex-wrap"
          style={{
            background: "#fff", border: `1px solid ${T.border}`,
            padding: "16px 24px",
          }}
        >
          <div className="flex items-center gap-2">
            <DollarSign size={16} style={{ color: "#3B82F6" }} />
            <span style={{ fontSize: 15, color: T.sub }}>受注合計</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#3B82F6" }}>{fmtMan(totalContract)}</span>
          </div>
          <div style={{ width: 1, height: 28, background: T.border }} />
          <div className="flex items-center gap-2">
            <Banknote size={16} style={{ color: "#10B981" }} />
            <span style={{ fontSize: 15, color: T.sub }}>入金済</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#10B981" }}>{fmtMan(totalPaid)}</span>
          </div>
          <div style={{ width: 1, height: 28, background: T.border }} />
          <div className="flex items-center gap-2">
            {totalRemaining > 0 && <AlertTriangle size={16} style={{ color: T.primary }} />}
            <span style={{ fontSize: 15, color: T.sub }}>未入金</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: totalRemaining > 0 ? T.primary : "#059669" }}>
              {fmtMan(totalRemaining)}
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <PaymentBar paid={totalPaid} total={totalContract} />
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <Search
          size={18}
          style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: T.muted }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="現場名・住所で検索..."
          className="w-full rounded-xl outline-none"
          style={{
            background: "#fff",
            border: `1px solid ${T.border}`,
            color: T.text,
            padding: "14px 16px 14px 48px",
            fontSize: 16,
          }}
        />
      </div>

      {/* ── 9-stage progress indicator ── */}
      <div
        className="flex items-center gap-0 rounded-xl overflow-hidden"
        style={{ background: "#fff", border: `1px solid ${T.border}`, padding: "14px 20px" }}
      >
        {STATUSES.map((s, i) => {
          const count = periodFiltered.filter(site => resolveStatus(site.status).key === s.key).length;
          return (
            <div key={s.key} className="flex items-center" style={{ flex: 1 }}>
              <div className="flex flex-col items-center gap-1.5" style={{ flex: 1 }}>
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 32, height: 32,
                    background: count > 0 ? s.bg : T.bg,
                    border: `2px solid ${count > 0 ? s.color : T.border}`,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: count > 0 ? s.color : T.muted }}>
                    {count}
                  </span>
                </div>
                <span style={{
                  fontSize: 10, color: count > 0 ? s.color : T.muted,
                  fontWeight: 600, textAlign: "center", lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}>
                  {s.label}
                </span>
              </div>
              {i < STATUSES.length - 1 && (
                <div style={{ width: 14, height: 2, background: T.border, flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Site groups ── */}
      {grouped.map(group => {
        if (group.sites.length === 0) return null;
        return (
          <section key={group.key}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 rounded-full" style={{ background: group.color }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text }}>
                {group.label}
                <span style={{ fontSize: 15, fontWeight: 500, color: T.sub, marginLeft: 10 }}>
                  {group.sites.length}件
                </span>
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {group.sites.map(site => (
                <SiteCard
                  key={site.id}
                  site={site}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onPayment={(s) => { setPaymentSite(s); setEditingPayment(null); }}
                  onPaymentHistory={(s) => setHistorySite(s)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 && !loading && (
        <div className="py-20 text-center">
          <Building2 size={44} style={{ color: T.muted, margin: "0 auto 16px" }} />
          <p style={{ fontSize: 18, color: T.sub }}>
            {search ? "検索条件に一致する現場がありません" : "登録されている現場がありません"}
          </p>
        </div>
      )}

      {/* ── Payment modal ── */}
      {paymentSite && (
        <PaymentModal
          site={paymentSite}
          editingPayment={editingPayment}
          onClose={() => { setPaymentSite(null); setEditingPayment(null); }}
          onSaved={handlePaidUpdate}
        />
      )}

      {/* ── Payment history drawer ── */}
      {historySite && (
        <PaymentHistoryDrawer
          site={historySite}
          onClose={() => setHistorySite(null)}
          onEdit={(payment) => {
            // Find the current site data for the payment modal
            const s = sites.find(si => si.id === payment.siteId);
            if (s) {
              setHistorySite(null);
              setPaymentSite(s);
              setEditingPayment(payment);
            }
          }}
          onPaidUpdate={handlePaidUpdate}
        />
      )}
    </div>
  );
}
