"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Edit3, X, AlertTriangle } from "lucide-react";

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

const STATUS_COLOR: Record<EquipmentStatus, { bg: string; color: string }> = {
  "稼働中":   { bg: "rgba(59,130,246,0.12)",   color: "#60A5FA" },
  "待機中":   { bg: "rgba(100,116,139,0.12)",  color: "#94A3B8" },
  "修理中":   { bg: "rgba(245,158,11,0.12)",   color: "#FBBF24" },
  "返却済み": { bg: "rgba(239,68,68,0.12)",    color: "#F87171" },
};

const CATEGORY_COLOR: Record<EquipmentCategory, { bg: string; color: string }> = {
  "自社保有": { bg: "rgba(167,139,250,0.12)", color: "#A78BFA" },
  "リース":   { bg: "rgba(96,165,250,0.12)",  color: "#60A5FA" },
  "レンタル": { bg: "rgba(74,222,128,0.1)",   color: "#4ADE80" },
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

// ─── ChipSelector ─────────────────────────────────────────────────────────────

function ChipSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(opt => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              border: active ? "1.5px solid #F97316" : "1.5px solid #2D3E54",
              background: active ? "rgba(249,115,22,0.15)" : "transparent",
              color: active ? "#FB923C" : "#94A3B8",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

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

function EquipmentModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Equipment | null;
  onSave: (data: Omit<Equipment, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(initial
      ? {
          name: initial.name,
          type: initial.type,
          category: initial.category,
          supplier: initial.supplier,
          unitPrice: initial.unitPrice,
          status: initial.status,
          returnDeadline: initial.returnDeadline ?? "",
          notes: initial.notes ?? "",
        }
      : {}),
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
    const data: Omit<Equipment, "id" | "createdAt"> = {
      name: form.name.trim(),
      type: form.type,
      category: form.category,
      supplier: form.supplier.trim(),
      unitPrice: Number(form.unitPrice) || 0,
      status: form.status,
      notes: form.notes.trim() || undefined,
      returnDeadline:
        (form.category === "リース" || form.category === "レンタル") &&
        form.returnDeadline
          ? form.returnDeadline
          : undefined,
    };
    onSave(data);
  }

  const needsDeadline = form.category === "リース" || form.category === "レンタル";

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid #2D3E54",
    background: "#0F1928",
    color: "#F1F5F9",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
  };
  const labelStyle = {
    fontSize: 11,
    fontWeight: 700 as const,
    color: "#94A3B8",
    display: "block" as const,
    marginBottom: 6,
    letterSpacing: "0.05em",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%", maxWidth: 480,
          borderRadius: "24px 24px 0 0",
          background: "#1A2535",
          border: "1px solid #2D3E54",
          maxHeight: "92dvh",
          display: "flex", flexDirection: "column",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 20px 16px",
            borderBottom: "1px solid #2D3E54",
          }}
        >
          <p style={{ fontSize: 17, fontWeight: 900, color: "#F1F5F9" }}>
            {initial ? "機材を編集" : "機材を追加"}
          </p>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 10, background: "#0F1928", border: "none", cursor: "pointer",
            }}
          >
            <X size={17} color="#64748B" />
          </button>
        </div>

        {/* Form */}
        <div style={{ overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* 機材名 */}
          <div>
            <label style={labelStyle}>
              機材名 <span style={{ color: "#F87171" }}>*</span>
            </label>
            <input
              style={{ ...inputStyle, borderColor: errors.name ? "#F87171" : "#2D3E54" }}
              placeholder="例：コマツ PC200 油圧ショベル"
              value={form.name}
              onChange={e => set("name", e.target.value)}
            />
            {errors.name && (
              <p style={{ fontSize: 11, color: "#F87171", marginTop: 4 }}>{errors.name}</p>
            )}
          </div>

          {/* 種類 */}
          <div>
            <label style={labelStyle}>種類</label>
            <ChipSelector options={TYPE_OPTIONS} value={form.type} onChange={v => set("type", v)} />
          </div>

          {/* 区分 */}
          <div>
            <label style={labelStyle}>区分</label>
            <ChipSelector options={CATEGORY_OPTIONS} value={form.category} onChange={v => set("category", v)} />
          </div>

          {/* 入手先 */}
          <div>
            <label style={labelStyle}>入手先</label>
            <input
              style={inputStyle}
              placeholder="リース会社名・自社拠点など"
              value={form.supplier}
              onChange={e => set("supplier", e.target.value)}
            />
          </div>

          {/* 日単価 */}
          <div>
            <label style={labelStyle}>日単価</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  color: "#64748B", fontSize: 14, pointerEvents: "none",
                }}
              >¥</span>
              <input
                type="number"
                style={{ ...inputStyle, paddingLeft: 28 }}
                placeholder="0"
                value={form.unitPrice || ""}
                onChange={e => set("unitPrice", Number(e.target.value))}
              />
            </div>
          </div>

          {/* 状態 */}
          <div>
            <label style={labelStyle}>状態</label>
            <ChipSelector options={STATUS_OPTIONS} value={form.status} onChange={v => set("status", v)} />
          </div>

          {/* 返却期限 (only for リース/レンタル) */}
          {needsDeadline && (
            <div>
              <label style={labelStyle}>返却期限</label>
              <input
                type="date"
                style={inputStyle}
                value={form.returnDeadline}
                onChange={e => set("returnDeadline", e.target.value)}
              />
            </div>
          )}

          {/* メモ */}
          <div>
            <label style={labelStyle}>メモ</label>
            <textarea
              style={{
                ...inputStyle,
                minHeight: 72,
                resize: "vertical",
                fontFamily: "inherit",
              }}
              placeholder="特記事項・点検履歴など"
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, paddingBottom: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "13px 0",
                borderRadius: 14, border: "1.5px solid #2D3E54",
                background: "transparent", color: "#94A3B8",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}
            >
              キャンセル
            </button>
            <button
              onClick={submit}
              style={{
                flex: 2, padding: "13px 0",
                borderRadius: 14, border: "none",
                background: "#F97316", color: "#fff",
                fontSize: 15, fontWeight: 900, cursor: "pointer",
              }}
            >
              保存する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EquipmentPage() {
  const router = useRouter();

  // Try to get equipment from context; fall back to local state with seed data
  let ctxEquipment: Equipment[] | undefined;
  let ctxAddEquipment: ((data: Omit<Equipment, "id" | "createdAt">) => void) | undefined;
  let ctxUpdateEquipment: ((id: string, patch: Partial<Omit<Equipment, "id" | "createdAt">>) => void) | undefined;
  let ctxAssignments: EquipmentAssignment[] | undefined;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ctx = require("../lib/app-context");
    const appCtx = ctx.useAppContext?.();
    if (appCtx) {
      ctxEquipment      = (appCtx as { equipment?: Equipment[] }).equipment;
      ctxAddEquipment   = (appCtx as { addEquipment?: typeof ctxAddEquipment }).addEquipment;
      ctxUpdateEquipment = (appCtx as { updateEquipment?: typeof ctxUpdateEquipment }).updateEquipment;
      ctxAssignments    = (appCtx as { assignments?: EquipmentAssignment[] }).assignments;
    }
  } catch {
    // context not yet extended — use local state below
  }

  const [localEquipment, setLocalEquipment] = useState<Equipment[]>(
    ctxEquipment ?? SEED_EQUIPMENT
  );
  const [localAssignments] = useState<EquipmentAssignment[]>(
    ctxAssignments ?? SEED_ASSIGNMENTS
  );

  const equipment   = ctxEquipment   ?? localEquipment;
  const assignments = ctxAssignments ?? localAssignments;

  function addEquipment(data: Omit<Equipment, "id" | "createdAt">) {
    if (ctxAddEquipment) {
      ctxAddEquipment(data);
    } else {
      const item: Equipment = {
        ...data,
        id: newId(),
        createdAt: new Date().toISOString(),
      };
      setLocalEquipment(prev => [item, ...prev]);
    }
  }

  function updateEquipment(id: string, patch: Partial<Omit<Equipment, "id" | "createdAt">>) {
    if (ctxUpdateEquipment) {
      ctxUpdateEquipment(id, patch);
    } else {
      setLocalEquipment(prev =>
        prev.map(e => e.id === id ? { ...e, ...patch } : e)
      );
    }
  }

  // ─── Filter state ──────────────────────────────────────────────────────────

  const [typeFilter,   setTypeFilter]   = useState<EquipmentType | "全て">("全て");
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | "全状態">("全状態");
  const [modalTarget,  setModalTarget]  = useState<Equipment | null | "new">(null);

  // ─── Computed ──────────────────────────────────────────────────────────────

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
      return true;
    });
  }, [equipment, typeFilter, statusFilter]);

  const activeAssignments = useMemo(
    () => assignments.filter(a => {
      const today = new Date(); today.setHours(0,0,0,0);
      const end   = new Date(a.endDate); end.setHours(0,0,0,0);
      return end >= today;
    }),
    [assignments]
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function handleSave(data: Omit<Equipment, "id" | "createdAt">) {
    const target = modalTarget;
    if (target === "new") {
      addEquipment(data);
    } else if (target !== null && typeof target === "object") {
      updateEquipment(target.id, data);
    }
    setModalTarget(null);
  }

  // ─── Chip row ──────────────────────────────────────────────────────────────

  function FilterChip<T extends string>({
    label, active, onClick,
  }: { label: T; active: boolean; onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        style={{
          padding: "5px 13px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: active ? 700 : 500,
          border: active ? "1.5px solid #F97316" : "1.5px solid #2D3E54",
          background: active ? "rgba(249,115,22,0.15)" : "transparent",
          color: active ? "#FB923C" : "#64748B",
          cursor: "pointer",
          whiteSpace: "nowrap" as const,
          flexShrink: 0,
        }}
      >
        {label}
      </button>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#080F1A",
        color: "#F1F5F9",
        fontFamily: "'Noto Sans JP', sans-serif",
        paddingBottom: 96,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "#080F1A",
          borderBottom: "1px solid #2D3E54",
          padding: "12px 16px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 10, background: "#1A2535", border: "none", cursor: "pointer",
            }}
          >
            <ChevronLeft size={20} color="#94A3B8" />
          </button>
          <div>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#F1F5F9", lineHeight: 1.2 }}>
              機材・車両管理
            </p>
            <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
              重機・車両・リース品の一元管理
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* ── Alert strip ── */}
        {alertItems.length > 0 && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: 14,
              background: "rgba(239,68,68,0.08)",
              border: "1.5px solid rgba(239,68,68,0.35)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <AlertTriangle size={15} color="#F87171" />
              <p style={{ fontSize: 13, fontWeight: 800, color: "#F87171" }}>
                返却期限が近い機材があります
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {alertItems.map(e => {
                const days = daysUntil(e.returnDeadline!);
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 13, color: "#F1F5F9", fontWeight: 600 }}>{e.name}</p>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "#F87171" }}>
                      返却期限まで {days} 日
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Stats bar ── */}
        <div
          style={{
            marginTop: 16,
            display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10,
          }}
        >
          {[
            { label: "登録台数", value: equipment.length, color: "#F1F5F9" },
            { label: "稼働中",   value: equipment.filter(e => e.status === "稼働中").length, color: "#60A5FA" },
            { label: "期限間近", value: nearDeadlineCount, color: nearDeadlineCount > 0 ? "#FBBF24" : "#F1F5F9" },
          ].map(s => (
            <div
              key={s.label}
              style={{
                background: "#1A2535",
                borderRadius: 14,
                padding: "12px 0",
                textAlign: "center",
                border: "1px solid #2D3E54",
              }}
            >
              <p style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Filter chips ── */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Row 1: type */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {(["全て", ...TYPE_OPTIONS] as const).map(t => (
              <FilterChip
                key={t}
                label={t}
                active={typeFilter === t}
                onClick={() => setTypeFilter(t as typeof typeFilter)}
              />
            ))}
          </div>
          {/* Row 2: status */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {(["全状態", ...STATUS_OPTIONS] as const).map(s => (
              <FilterChip
                key={s}
                label={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s as typeof statusFilter)}
              />
            ))}
          </div>
        </div>

        {/* ── Equipment list ── */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 && (
            <div
              style={{
                textAlign: "center", padding: "40px 0",
                color: "#64748B", fontSize: 14,
              }}
            >
              該当する機材がありません
            </div>
          )}
          {filtered.map(e => {
            const assignment = assignmentMap[e.id];
            const deadline   = e.returnDeadline ? daysUntil(e.returnDeadline) : null;
            const isUrgent   = deadline !== null && deadline <= 7 && deadline >= 0;
            const isNear     = deadline !== null && deadline >= 8 && deadline <= 14;
            const sc = STATUS_COLOR[e.status];
            const cc = CATEGORY_COLOR[e.category];

            return (
              <div
                key={e.id}
                style={{
                  background: "#1A2535",
                  borderRadius: 16,
                  border: `1px solid ${isUrgent ? "rgba(239,68,68,0.5)" : "#2D3E54"}`,
                  borderLeft: `4px solid ${isUrgent ? "#F87171" : "#2D3E54"}`,
                  padding: "14px 14px 12px",
                  position: "relative",
                }}
              >
                {/* Top row: icon + name + edit */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>
                    {TYPE_ICON[e.type]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 15, fontWeight: 900, color: "#F1F5F9",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}
                    >
                      {e.name}
                    </p>
                    {/* Badges */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700,
                          padding: "2px 8px", borderRadius: 20,
                          background: cc.bg, color: cc.color,
                        }}
                      >
                        {e.category}
                      </span>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700,
                          padding: "2px 8px", borderRadius: 20,
                          background: sc.bg, color: sc.color,
                        }}
                      >
                        {e.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalTarget(e)}
                    style={{
                      width: 32, height: 32, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: 9, background: "#0F1928",
                      border: "1px solid #2D3E54", cursor: "pointer",
                    }}
                  >
                    <Edit3 size={14} color="#64748B" />
                  </button>
                </div>

                {/* Supplier + price */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                  <p style={{ fontSize: 12, color: "#64748B" }}>{e.supplier || "—"}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8" }}>
                    {fmtPrice(e.unitPrice)}&thinsp;/ 日
                  </p>
                </div>

                {/* Assignment */}
                {assignment && (
                  <p style={{ fontSize: 12, color: "#FB923C", marginTop: 6, fontWeight: 600 }}>
                    現場: {assignment.siteName}
                  </p>
                )}

                {/* Deadline */}
                {isUrgent && (
                  <p style={{ fontSize: 12, fontWeight: 900, color: "#F87171", marginTop: 6 }}>
                    ⚠ 返却 {fmtDate(e.returnDeadline!)}
                  </p>
                )}
                {isNear && (
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#FBBF24", marginTop: 6 }}>
                    返却 {fmtDate(e.returnDeadline!)}
                  </p>
                )}

                {/* Notes */}
                {e.notes && (
                  <p
                    style={{
                      fontSize: 11, color: "#64748B", marginTop: 6,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}
                  >
                    {e.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Assignments section ── */}
        {activeAssignments.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <p
              style={{
                fontSize: 13, fontWeight: 800, color: "#94A3B8",
                letterSpacing: "0.06em", marginBottom: 10,
              }}
            >
              現場アサイン状況
            </p>
            <div
              style={{
                background: "#1A2535",
                borderRadius: 16,
                border: "1px solid #2D3E54",
                overflow: "hidden",
              }}
            >
              {activeAssignments.map((a, i) => {
                const eq = equipment.find(e => e.id === a.equipmentId);
                return (
                  <div
                    key={a.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "11px 14px",
                      borderBottom: i < activeAssignments.length - 1 ? "1px solid #2D3E54" : "none",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>
                      {eq ? TYPE_ICON[eq.type] : "📦"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13, fontWeight: 700, color: "#F1F5F9",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}
                      >
                        {eq?.name ?? a.equipmentId}
                      </p>
                      <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                        {a.siteName}
                      </p>
                    </div>
                    <p style={{ fontSize: 11, color: "#64748B", whiteSpace: "nowrap" }}>
                      {a.startDate} 〜 {a.endDate}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => setModalTarget("new")}
        style={{
          position: "fixed", bottom: 28, right: 20,
          width: 56, height: 56,
          borderRadius: 28,
          background: "#F97316",
          border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(249,115,22,0.45)",
          zIndex: 30,
        }}
      >
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </button>

      {/* ── Modal ── */}
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
