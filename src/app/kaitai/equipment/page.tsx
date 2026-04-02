"use client";

import { useState, useMemo } from "react";
import { Plus, Edit3, X, AlertTriangle, Search } from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: "#1E293B", sub: "#64748B", muted: "#94A3B8",
  border: "#E2E8F0", card: "#FFFFFF",
  amber: "#F59E0B", amberDk: "#D97706",
  green: "#10B981", red: "#EF4444", blue: "#3B82F6",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type EquipmentCategory = "自社保有" | "リース" | "レンタル";
export type EquipmentType     = "重機" | "アタッチメント" | "車両" | "その他";
export type EquipmentStatus   = "稼働中" | "待機中" | "修理中" | "返却済み";

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  type: EquipmentType;
  supplier: string;
  unitPrice: number;
  status: EquipmentStatus;
  returnDeadline?: string;
  notes?: string;
  createdAt: string;
}

export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  siteId: string;
  siteName: string;
  startDate: string;
  endDate: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_EQUIPMENT: Equipment[] = [
  {
    id: "eq001",
    name: "コマツ PC200-10 油圧ショベル",
    category: "自社保有",
    type: "重機",
    supplier: "自社",
    unitPrice: 45000,
    status: "稼働中",
    notes: "定期点検済み。アワーメーター 3,200h",
    createdAt: "2025-04-01T00:00:00.000Z",
  },
  {
    id: "eq002",
    name: "日立 ZX135US-6 ショベル",
    category: "リース",
    type: "重機",
    supplier: "建機リース西東京",
    unitPrice: 38000,
    status: "稼働中",
    returnDeadline: "2026-04-05",
    notes: "4月5日返却予定",
    createdAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "eq003",
    name: "解体用大型ブレーカー",
    category: "レンタル",
    type: "アタッチメント",
    supplier: "アクティオ株式会社",
    unitPrice: 12000,
    status: "稼働中",
    returnDeadline: "2026-04-09",
    notes: "ソーシャルアタッチメント対応",
    createdAt: "2026-03-15T00:00:00.000Z",
  },
  {
    id: "eq004",
    name: "4tトラック（平ボディ）",
    category: "自社保有",
    type: "車両",
    supplier: "自社",
    unitPrice: 15000,
    status: "待機中",
    notes: "車検 2026年8月",
    createdAt: "2025-01-10T00:00:00.000Z",
  },
  {
    id: "eq005",
    name: "10t ダンプトラック",
    category: "リース",
    type: "車両",
    supplier: "オリックス自動車",
    unitPrice: 22000,
    status: "稼働中",
    returnDeadline: "2026-04-14",
    notes: "長期リース契約 2023年〜",
    createdAt: "2023-06-01T00:00:00.000Z",
  },
  {
    id: "eq006",
    name: "コマツ D65PX-18 ブルドーザー",
    category: "レンタル",
    type: "重機",
    supplier: "カナモト",
    unitPrice: 55000,
    status: "修理中",
    returnDeadline: "2026-04-20",
    notes: "エンジン修理中。修理完了後返却予定",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "eq007",
    name: "高所作業車 12m",
    category: "レンタル",
    type: "その他",
    supplier: "ニシケン",
    unitPrice: 18000,
    status: "返却済み",
    returnDeadline: "2026-03-25",
    notes: "",
    createdAt: "2026-02-20T00:00:00.000Z",
  },
];

const SEED_ASSIGNMENTS: EquipmentAssignment[] = [
  {
    id: "as001",
    equipmentId: "eq001",
    siteId: "site001",
    siteName: "世田谷区 木造2階建解体",
    startDate: "2026-03-15",
    endDate: "2026-04-10",
  },
  {
    id: "as002",
    equipmentId: "eq002",
    siteId: "site001",
    siteName: "世田谷区 木造2階建解体",
    startDate: "2026-03-20",
    endDate: "2026-04-05",
  },
  {
    id: "as003",
    equipmentId: "eq003",
    siteId: "site002",
    siteName: "品川区 鉄骨造3階解体",
    startDate: "2026-03-25",
    endDate: "2026-04-09",
  },
  {
    id: "as004",
    equipmentId: "eq005",
    siteId: "site002",
    siteName: "品川区 鉄骨造3階解体",
    startDate: "2026-04-01",
    endDate: "2026-04-14",
  },
];

// ─── Color maps ───────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<EquipmentStatus, { bg: string; color: string }> = {
  "稼働中":   { bg: "#EFF6FF", color: "#2563EB" },
  "待機中":   { bg: "#F1F5F9", color: "#64748B" },
  "修理中":   { bg: "#FFFBEB", color: "#D97706" },
  "返却済み": { bg: "#F0FDF4", color: "#16A34A" },
};

const CATEGORY_STYLE: Record<EquipmentCategory, { bg: string; color: string }> = {
  "自社保有": { bg: "#F5F3FF", color: "#7C3AED" },
  "リース":   { bg: "#EFF6FF", color: "#2563EB" },
  "レンタル": { bg: "#F0FDF4", color: "#16A34A" },
};

const TYPE_ICON: Record<EquipmentType, string> = {
  "重機":         "🦾",
  "アタッチメント": "🔩",
  "車両":         "🚚",
  "その他":       "📦",
};

const TYPE_OPTIONS: EquipmentType[]     = ["重機", "アタッチメント", "車両", "その他"];
const CATEGORY_OPTIONS: EquipmentCategory[] = ["自社保有", "リース", "レンタル"];
const STATUS_OPTIONS: EquipmentStatus[] = ["稼働中", "待機中", "修理中", "返却済み"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function fmtPrice(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

function newId(): string {
  return `eq${Date.now().toString(36)}`;
}

// ─── Equipment Form Modal ─────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  type: "重機" as EquipmentType,
  category: "自社保有" as EquipmentCategory,
  supplier: "",
  unitPrice: 0,
  status: "待機中" as EquipmentStatus,
  returnDeadline: "",
  notes: "",
};

function ChipGroup<T extends string>({
  options, value, onChange,
}: {
  options: T[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              border: active ? `1.5px solid ${C.amber}` : `1.5px solid ${C.border}`,
              background: active ? "rgba(245,158,11,0.1)" : C.card,
              color: active ? C.amberDk : C.sub,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function EquipmentModal({
  initial, onSave, onClose,
}: {
  initial?: Equipment | null;
  onSave: (data: Omit<Equipment, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(initial ? {
      name: initial.name,
      type: initial.type,
      category: initial.category,
      supplier: initial.supplier,
      unitPrice: initial.unitPrice,
      status: initial.status,
      returnDeadline: initial.returnDeadline ?? "",
      notes: initial.notes ?? "",
    } : {}),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: "" }));
  }

  function submit() {
    if (!form.name.trim()) {
      setErrors({ name: "機材名は必須です" });
      return;
    }
    onSave({
      name: form.name.trim(),
      type: form.type,
      category: form.category,
      supplier: form.supplier.trim(),
      unitPrice: Number(form.unitPrice) || 0,
      status: form.status,
      notes: form.notes.trim() || undefined,
      returnDeadline:
        (form.category === "リース" || form.category === "レンタル") && form.returnDeadline
          ? form.returnDeadline : undefined,
    });
  }

  const needsDeadline = form.category === "リース" || form.category === "レンタル";

  const inputCls = "w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all";
  const inputStyle = { border: `1.5px solid ${C.border}`, background: "#F8FAFC", color: C.text };
  const labelCls = "block text-xs font-bold mb-1.5 uppercase tracking-wide";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl flex flex-col"
        style={{ maxWidth: 640, background: C.card, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90dvh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 className="text-lg font-bold" style={{ color: C.text }}>
            {initial ? "機材を編集" : "機材を追加"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: C.muted }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* 機材名 */}
          <div>
            <label className={labelCls} style={{ color: C.muted }}>
              機材名 <span style={{ color: C.red }}>*</span>
            </label>
            <input
              className={inputCls}
              style={{ ...inputStyle, borderColor: errors.name ? C.red : C.border }}
              placeholder="例：コマツ PC200 油圧ショベル"
              value={form.name}
              onChange={e => set("name", e.target.value)}
            />
            {errors.name && <p className="text-xs mt-1" style={{ color: C.red }}>{errors.name}</p>}
          </div>

          {/* 種類 + 区分 (2-col) */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls} style={{ color: C.muted }}>種類</label>
              <ChipGroup options={TYPE_OPTIONS} value={form.type} onChange={v => set("type", v)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: C.muted }}>区分</label>
              <ChipGroup options={CATEGORY_OPTIONS} value={form.category} onChange={v => set("category", v)} />
            </div>
          </div>

          {/* 入手先 + 日単価 (2-col) */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls} style={{ color: C.muted }}>入手先</label>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="リース会社・自社拠点など"
                value={form.supplier}
                onChange={e => set("supplier", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: C.muted }}>日単価</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: C.muted }}>¥</span>
                <input
                  type="number"
                  className={inputCls}
                  style={{ ...inputStyle, paddingLeft: 24 }}
                  placeholder="0"
                  value={form.unitPrice || ""}
                  onChange={e => set("unitPrice", Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* 状態 */}
          <div>
            <label className={labelCls} style={{ color: C.muted }}>状態</label>
            <ChipGroup options={STATUS_OPTIONS} value={form.status} onChange={v => set("status", v)} />
          </div>

          {/* 返却期限 */}
          {needsDeadline && (
            <div>
              <label className={labelCls} style={{ color: C.muted }}>返却期限</label>
              <input
                type="date"
                className={inputCls}
                style={inputStyle}
                value={form.returnDeadline}
                onChange={e => set("returnDeadline", e.target.value)}
              />
            </div>
          )}

          {/* メモ */}
          <div>
            <label className={labelCls} style={{ color: C.muted }}>メモ</label>
            <textarea
              className={inputCls}
              style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
              placeholder="特記事項・点検履歴など"
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-6 py-5" style={{ borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors hover:bg-gray-50"
            style={{ border: `1.5px solid ${C.border}`, color: C.sub }}
          >
            キャンセル
          </button>
          <button
            onClick={submit}
            className="flex-2 px-8 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
            style={{ background: C.amber, boxShadow: "0 2px 12px rgba(245,158,11,0.35)", minWidth: 160 }}
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter chip ─────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
      style={active
        ? { background: "rgba(245,158,11,0.1)", color: C.amberDk, border: `1.5px solid rgba(245,158,11,0.35)` }
        : { background: C.card, color: C.sub, border: `1px solid ${C.border}` }
      }
    >
      {label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EquipmentPage() {
  let ctxEquipment: Equipment[] | undefined;
  let ctxAddEquipment: ((data: Omit<Equipment, "id" | "createdAt">) => void) | undefined;
  let ctxUpdateEquipment: ((id: string, patch: Partial<Omit<Equipment, "id" | "createdAt">>) => void) | undefined;
  let ctxAssignments: EquipmentAssignment[] | undefined;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ctx = require("../lib/app-context");
    const appCtx = ctx.useAppContext?.();
    if (appCtx) {
      ctxEquipment       = (appCtx as { equipment?: Equipment[] }).equipment;
      ctxAddEquipment    = (appCtx as { addEquipment?: typeof ctxAddEquipment }).addEquipment;
      ctxUpdateEquipment = (appCtx as { updateEquipment?: typeof ctxUpdateEquipment }).updateEquipment;
      ctxAssignments     = (appCtx as { assignments?: EquipmentAssignment[] }).assignments;
    }
  } catch { /* context not extended */ }

  const [localEquipment, setLocalEquipment] = useState<Equipment[]>(ctxEquipment ?? SEED_EQUIPMENT);
  const [localAssignments] = useState<EquipmentAssignment[]>(ctxAssignments ?? SEED_ASSIGNMENTS);

  const equipment   = ctxEquipment   ?? localEquipment;
  const assignments = ctxAssignments ?? localAssignments;

  function addEquipment(data: Omit<Equipment, "id" | "createdAt">) {
    if (ctxAddEquipment) {
      ctxAddEquipment(data);
    } else {
      setLocalEquipment(prev => [{ ...data, id: newId(), createdAt: new Date().toISOString() }, ...prev]);
    }
  }

  function updateEquipment(id: string, patch: Partial<Omit<Equipment, "id" | "createdAt">>) {
    if (ctxUpdateEquipment) {
      ctxUpdateEquipment(id, patch);
    } else {
      setLocalEquipment(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    }
  }

  const [typeFilter,   setTypeFilter]   = useState<EquipmentType | "全て">("全て");
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | "全状態">("全状態");
  const [search,       setSearch]       = useState("");
  const [modalTarget,  setModalTarget]  = useState<Equipment | null | "new">(null);

  const assignmentMap = useMemo(() => {
    const m: Record<string, EquipmentAssignment> = {};
    assignments.forEach(a => { m[a.equipmentId] = a; });
    return m;
  }, [assignments]);

  const alertItems = useMemo(
    () => equipment.filter(e => e.returnDeadline && daysUntil(e.returnDeadline) <= 7 && daysUntil(e.returnDeadline) >= 0),
    [equipment]
  );

  const nearDeadlineCount = useMemo(
    () => equipment.filter(e => e.returnDeadline && daysUntil(e.returnDeadline) <= 14 && daysUntil(e.returnDeadline) >= 0).length,
    [equipment]
  );

  const filtered = useMemo(() => {
    return equipment.filter(e => {
      if (typeFilter !== "全て" && e.type !== typeFilter) return false;
      if (statusFilter !== "全状態" && e.status !== statusFilter) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.supplier.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [equipment, typeFilter, statusFilter, search]);

  const activeAssignments = useMemo(
    () => assignments.filter(a => {
      const today = new Date(); today.setHours(0,0,0,0);
      const end   = new Date(a.endDate); end.setHours(0,0,0,0);
      return end >= today;
    }),
    [assignments]
  );

  function handleSave(data: Omit<Equipment, "id" | "createdAt">) {
    const target = modalTarget;
    if (target === "new") {
      addEquipment(data);
    } else if (target !== null && typeof target === "object") {
      updateEquipment(target.id, data);
    }
    setModalTarget(null);
  }

  return (
    <div className="px-4 md:px-8 py-6 flex flex-col gap-6 pb-24 md:pb-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>機材・車両管理</h1>
          <p className="text-sm mt-1" style={{ color: C.sub }}>重機・車両・リース品の一元管理</p>
        </div>
        <button
          onClick={() => setModalTarget("new")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-white flex-shrink-0 transition-all hover:opacity-90"
          style={{ background: C.amber, boxShadow: "0 2px 10px rgba(245,158,11,0.35)" }}
        >
          <Plus size={16} />
          機材を追加
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "登録台数",  value: equipment.length,                                          color: C.text,    note: "総登録数" },
          { label: "稼働中",    value: equipment.filter(e => e.status === "稼働中").length,        color: C.blue,    note: "現在稼働" },
          { label: "修理中",    value: equipment.filter(e => e.status === "修理中").length,        color: C.amber,   note: "要確認" },
          { label: "返却期限近", value: nearDeadlineCount, color: nearDeadlineCount > 0 ? C.red : C.green, note: "14日以内" },
        ].map(({ label, value, color, note }) => (
          <div key={label} className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p className="text-xs mb-1" style={{ color: C.sub }}>{label}</p>
            <p className="text-3xl font-bold font-numeric" style={{ color }}>{value}</p>
            <p className="text-[10px] mt-1" style={{ color: C.muted }}>{note}</p>
          </div>
        ))}
      </div>

      {/* ── Alert banner ── */}
      {alertItems.length > 0 && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <AlertTriangle size={18} style={{ color: C.red, flexShrink: 0, marginTop: 1 }} />
          <div className="flex-1">
            <p className="text-sm font-bold mb-2" style={{ color: C.red }}>返却期限が7日以内の機材があります</p>
            <div className="flex flex-col gap-1.5">
              {alertItems.map(e => {
                const days = daysUntil(e.returnDeadline!);
                return (
                  <div key={e.id} className="flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: C.text }}>{e.name}</p>
                    <p className="text-sm font-bold" style={{ color: C.red }}>あと {days} 日（{fmtDate(e.returnDeadline!)}）</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar: search + filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, minWidth: 200 }}>
          <Search size={14} style={{ color: C.muted }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="機材名・入手先で検索…"
            className="bg-transparent text-sm outline-none"
            style={{ color: C.text, width: 180 }}
          />
        </div>
        {/* Type filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium mr-1" style={{ color: C.muted }}>種類:</span>
          {(["全て", ...TYPE_OPTIONS] as const).map(t => (
            <FilterChip key={t} label={t} active={typeFilter === t} onClick={() => setTypeFilter(t as typeof typeFilter)} />
          ))}
        </div>
        {/* Status filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium mr-1" style={{ color: C.muted }}>状態:</span>
          {(["全状態", ...STATUS_OPTIONS] as const).map(s => (
            <FilterChip key={s} label={s} active={statusFilter === s} onClick={() => setStatusFilter(s as typeof statusFilter)} />
          ))}
        </div>
      </div>

      {/* ── Equipment table ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {/* Table header */}
        <div
          className="grid items-center px-5 py-3 text-xs font-bold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "2.5fr 90px 90px 140px 110px 120px 80px",
            borderBottom: `1px solid ${C.border}`,
            background: "#F8FAFC",
            color: C.muted,
          }}
        >
          <span>機材名</span>
          <span>種類</span>
          <span>区分</span>
          <span>入手先</span>
          <span className="text-right">日単価</span>
          <span>返却期限</span>
          <span className="text-right">操作</span>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: C.muted }}>
            <p className="text-sm">該当する機材がありません</p>
          </div>
        )}

        {filtered.map((e, idx) => {
          const assignment = assignmentMap[e.id];
          const deadline   = e.returnDeadline ? daysUntil(e.returnDeadline) : null;
          const isUrgent   = deadline !== null && deadline <= 7 && deadline >= 0;
          const isNear     = deadline !== null && deadline >= 8 && deadline <= 14;
          const sc = STATUS_STYLE[e.status];
          const cc = CATEGORY_STYLE[e.category];

          return (
            <div
              key={e.id}
              className="grid items-center px-5 py-4 hover:bg-gray-50 transition-colors"
              style={{
                gridTemplateColumns: "2.5fr 90px 90px 140px 110px 120px 80px",
                borderBottom: idx < filtered.length - 1 ? `1px solid #F1F5F9` : undefined,
                borderLeft: isUrgent ? `3px solid ${C.red}` : "3px solid transparent",
              }}
            >
              {/* 機材名 + badges */}
              <div className="flex flex-col gap-1.5 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 18 }}>{TYPE_ICON[e.type]}</span>
                  <span className="text-sm font-semibold truncate" style={{ color: C.text }}>{e.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                    {e.status}
                  </span>
                  {assignment && (
                    <span className="text-[10px]" style={{ color: C.amber }}>📍 {assignment.siteName}</span>
                  )}
                  {e.notes && (
                    <span className="text-[10px] truncate max-w-[200px]" style={{ color: C.muted }}>{e.notes}</span>
                  )}
                </div>
              </div>

              {/* 種類 */}
              <span className="text-sm" style={{ color: C.sub }}>{e.type}</span>

              {/* 区分 */}
              <span className="text-xs font-bold px-2 py-1 rounded-full w-fit" style={{ background: cc.bg, color: cc.color }}>
                {e.category}
              </span>

              {/* 入手先 */}
              <span className="text-sm truncate" style={{ color: C.sub }}>{e.supplier || "—"}</span>

              {/* 日単価 */}
              <span className="text-sm font-bold text-right font-numeric" style={{ color: C.amberDk }}>
                {fmtPrice(e.unitPrice)}<span className="text-xs font-normal" style={{ color: C.muted }}>/日</span>
              </span>

              {/* 返却期限 */}
              <div>
                {e.returnDeadline ? (
                  <div>
                    <p className="text-sm font-medium" style={{ color: isUrgent ? C.red : isNear ? C.amber : C.sub }}>
                      {fmtDate(e.returnDeadline)}
                    </p>
                    {(isUrgent || isNear) && (
                      <p className="text-[10px] font-bold" style={{ color: isUrgent ? C.red : C.amber }}>
                        あと {deadline} 日
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-sm" style={{ color: C.muted }}>—</span>
                )}
              </div>

              {/* 操作 */}
              <div className="flex justify-end">
                <button
                  onClick={() => setModalTarget(e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-gray-100"
                  style={{ color: C.sub, border: `1px solid ${C.border}` }}
                >
                  <Edit3 size={12} />
                  編集
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Active assignments ── */}
      {activeAssignments.length > 0 && (
        <section>
          <h2 className="text-[11px] font-bold tracking-widest uppercase mb-4" style={{ color: C.amber }}>
            現場アサイン状況
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div
              className="grid px-5 py-3 text-xs font-bold uppercase tracking-wider"
              style={{ gridTemplateColumns: "2fr 2fr 200px", borderBottom: `1px solid ${C.border}`, background: "#F8FAFC", color: C.muted }}
            >
              <span>機材</span>
              <span>現場</span>
              <span>期間</span>
            </div>
            {activeAssignments.map((a, i) => {
              const eq = equipment.find(e => e.id === a.equipmentId);
              return (
                <div
                  key={a.id}
                  className="grid px-5 py-4 items-center"
                  style={{ gridTemplateColumns: "2fr 2fr 200px", borderBottom: i < activeAssignments.length - 1 ? "1px solid #F1F5F9" : undefined }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 16 }}>{eq ? TYPE_ICON[eq.type] : "📦"}</span>
                    <span className="text-sm font-medium truncate" style={{ color: C.text }}>{eq?.name ?? a.equipmentId}</span>
                  </div>
                  <span className="text-sm" style={{ color: C.sub }}>{a.siteName}</span>
                  <span className="text-sm font-numeric" style={{ color: C.muted }}>{a.startDate} 〜 {a.endDate}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modal */}
      {modalTarget !== null && (
        <EquipmentModal
          initial={modalTarget === "new" ? null : modalTarget}
          onSave={handleSave}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
}
