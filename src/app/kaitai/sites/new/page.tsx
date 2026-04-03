"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin, Calendar, ChevronRight,
  Building2, Zap, Droplets, Flame, AlertTriangle,
  Truck, FileText, Camera, Upload, X, Check,
  Clock, Edit3, Plus, Info, ChevronDown,
} from "lucide-react";
import { useAppContext } from "../../lib/app-context";
import type { LineItem } from "../../lib/doc-types";
import type { LatLng } from "../../lib/geocode";
import { T } from "../../lib/design-tokens";

const MapPicker = dynamic(
  () => import("../../components/map-picker").then(m => m.MapPicker),
  { ssr: false, loading: () => <div style={{ height: 300, background: T.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 14, color: T.muted }}>地図を読み込み中...</span></div> }
);

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface, bg: T.bg,
  amber: T.primary, amberDk: T.primaryDk,
  red: "#EF4444", green: "#10B981",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "見積中" | "受注確定" | "施工中" | "完了" | "請求済";
type StructureType = "木造" | "RC" | "鉄骨" | "軽量鉄骨" | "混合" | "その他";
type AsbestosLevel = "なし" | "あり(L1)" | "あり(L2)" | "あり(L3)" | "調査中";
type VehicleLimit = "2t" | "4t" | "10t" | "制限なし";
type Utility = "電気" | "ガス" | "水道";

type ChangeLogEntry = {
  field: string;
  before: string;
  after: string;
  reason: string;
  timestamp: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LIST: Status[] = ["見積中", "受注確定", "施工中", "完了", "請求済"];
const STATUS_STYLE: Record<Status, { bg: string; color: string; border: string }> = {
  "見積中":   { bg: "#EFF6FF", color: "#3B82F6", border: "#BFDBFE" },
  "受注確定": { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
  "施工中":   { bg: "${T.primaryLt}", color: T.primaryDk, border: "#FED7AA" },
  "完了":     { bg: T.bg, color: "#475569", border: "#CBD5E1" },
  "請求済":   { bg: "#FAF5FF", color: "#9333EA", border: "#E9D5FF" },
};

const STRUCTURE_TYPES: { type: StructureType; icon: string }[] = [
  { type: "木造",     icon: "🪵" },
  { type: "RC",       icon: "🏗" },
  { type: "鉄骨",    icon: "⚙️" },
  { type: "軽量鉄骨", icon: "🔩" },
  { type: "混合",     icon: "🏠" },
  { type: "その他",   icon: "📋" },
];

const ASBESTOS_LEVELS: { level: AsbestosLevel; color: string }[] = [
  { level: "なし",    color: "#16A34A" },
  { level: "あり(L1)", color: T.primaryDk },
  { level: "あり(L2)", color: T.primaryDk },
  { level: "あり(L3)", color: "#DC2626" },
  { level: "調査中",  color: T.sub },
];

const VEHICLE_LIMITS: VehicleLimit[] = ["2t", "4t", "10t", "制限なし"];
const UTILITIES: Utility[] = ["電気", "ガス", "水道"];

// Estimated waste per ㎡ based on structure type (㎥)
const WASTE_ESTIMATE: Record<StructureType, number> = {
  "木造":     0.4,
  "RC":       0.8,
  "鉄骨":     0.5,
  "軽量鉄骨": 0.3,
  "混合":     0.6,
  "その他":   0.5,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: number; onChange: (i: number) => void }) {
  const tabs = ["基本・スケジュール", "契約・お金", "現場環境・リスク", "見積明細"];
  return (
    <div className="flex" style={{ borderBottom: `2px solid ${C.border}` }}>
      {tabs.map((label, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className="flex-1 py-3 text-sm font-bold transition-all"
          style={{
            color: active === i ? C.amber : C.muted,
            borderBottom: active === i ? `2px solid ${C.amber}` : "2px solid transparent",
            marginBottom: -2,
            background: "transparent",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-sm font-bold tracking-widest uppercase mb-3"
      style={{ color: C.amber }}
    >
      {children}
    </p>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-sm font-bold mb-1.5" style={{ color: C.sub }}>
      {children}
      {required && <span className="ml-1" style={{ color: C.red }}>*</span>}
    </p>
  );
}

function InputField({
  value, onChange, placeholder, type = "text", className = "", highlight = false,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; className?: string; highlight?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${className}`}
      style={{
        background: C.card,
        border: `1.5px solid ${highlight ? C.red : C.border}`,
        color: C.text,
        fontFamily: "inherit",
      }}
    />
  );
}

function AmountInput({
  value, onChange, placeholder, highlight = false,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; highlight?: boolean;
}) {
  return (
    <div className="relative">
      <span
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold"
        style={{ color: C.sub }}
      >¥</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm outline-none"
        style={{
          background: C.card,
          border: `1.5px solid ${highlight ? C.red : C.border}`,
          color: C.text,
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SiteNewPage() {
  const { clients } = useAppContext();
  const [tab, setTab] = useState(0);

  // 元請け
  const [clientType, setClientType] = useState<"registered" | "direct" | "none">("none");
  const [clientId,   setClientId]   = useState<string | null>(null);
  const [directClientName, setDirectClientName] = useState("");

  // Tab 1 — 基本・スケジュール
  const [name, setName]           = useState("");
  const [address, setAddress]     = useState("");
  const [mapPos, setMapPos]       = useState<LatLng | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [extendedEnd, setExtendedEnd]   = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [showExtend, setShowExtend]     = useState(false);
  const [status, setStatus]       = useState<Status>("受注確定");

  // Tab 2 — 契約・お金
  const [contract, setContract]     = useState("");
  const [wasteB, setWasteB]         = useState("");
  const [laborB, setLaborB]         = useState("");
  const [subB, setSubB]             = useState("");
  const [otherB, setOtherB]         = useState("");

  // Tab 3 — 現場環境・リスク
  const [structureType, setStructureType] = useState<StructureType | null>(null);
  const [area, setArea]             = useState("");
  const [asbestos, setAsbestos]     = useState<AsbestosLevel>("なし");
  const [vehicles, setVehicles]     = useState<Set<VehicleLimit>>(new Set());
  const [utils, setUtils]           = useState<Set<Utility>>(new Set(["電気", "ガス", "水道"]));
  const [memo, setMemo]             = useState("");

  // Line items (見積書用明細)
  const [items, setItems] = useState<LineItem[]>([]);
  function removeItem(i: number) {
    setItems(prev => prev.filter((_, j) => j !== i));
  }
  function updateItem<K extends keyof LineItem>(i: number, key: K, value: LineItem[K]) {
    setItems(prev => prev.map((it, j) => j === i ? { ...it, [key]: value } : it));
  }

  // Photos / files
  const [photos, setPhotos]   = useState<string[]>([]);
  const [files, setFiles]     = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  // Change log modal (for edit mode — demo: tracks contract/endDate changes after first save)
  const [saved, setSaved]           = useState(false);
  const [savedContract, setSavedContract] = useState("");
  const [savedEndDate, setSavedEndDate]   = useState("");
  const [changeLog, setChangeLog]   = useState<ChangeLogEntry[]>([]);
  const [pendingChange, setPendingChange] = useState<{ field: string; before: string; after: string } | null>(null);
  const [changeReason, setChangeReason] = useState("");

  // Computed — Tab 2
  const contractNum  = parseFloat(contract.replace(/,/g, "")) || 0;
  const wasteBNum    = parseFloat(wasteB.replace(/,/g, "")) || 0;
  const laborBNum    = parseFloat(laborB.replace(/,/g, "")) || 0;
  const subBNum      = parseFloat(subB.replace(/,/g, "")) || 0;
  const otherBNum    = parseFloat(otherB.replace(/,/g, "")) || 0;
  const taxAmount    = Math.round(contractNum * 0.1);
  const totalExTax   = contractNum;
  const totalBudget  = wasteBNum + laborBNum + subBNum + otherBNum;
  const profit       = totalExTax - totalBudget;
  const profitPct    = contractNum > 0 ? Math.round((profit / totalExTax) * 100) : 0;
  const profitColor  = profitPct >= 25 ? "#16A34A" : profitPct >= 10 ? C.amberDk : "#DC2626";

  // Items totals
  const itemsTotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const itemsTax   = Math.floor(itemsTotal * 0.1);
  const itemsDiff  = contractNum - itemsTotal;

  // Waste estimate hint
  const estWaste = structureType && area
    ? Math.round(parseFloat(area) * WASTE_ESTIMATE[structureType] * 10) / 10
    : null;

  function toggleVehicle(v: VehicleLimit) {
    setVehicles((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  }
  function toggleUtil(u: Utility) {
    setUtils((prev) => {
      const next = new Set(prev);
      next.has(u) ? next.delete(u) : next.add(u);
      return next;
    });
  }

  // When user changes contract or endDate after save, trigger change log
  function handleContractChange(v: string) {
    if (saved && savedContract && v !== savedContract) {
      setPendingChange({ field: "契約金額", before: `¥${parseFloat(savedContract).toLocaleString()}`, after: `¥${parseFloat(v || "0").toLocaleString()}` });
    }
    setContract(v);
  }
  function handleEndDateChange(v: string) {
    if (saved && savedEndDate && v !== savedEndDate) {
      setPendingChange({ field: "工期終了日", before: savedEndDate, after: v });
    }
    setEndDate(v);
  }

  function confirmChange() {
    if (!pendingChange || !changeReason.trim()) return;
    setChangeLog((prev) => [
      ...prev,
      {
        ...pendingChange,
        reason: changeReason,
        timestamp: new Date().toLocaleString("ja-JP"),
      },
    ]);
    setPendingChange(null);
    setChangeReason("");
  }

  function handleSave() {
    if (!name.trim()) { setTab(0); return; }
    setSaved(true);
    setSavedContract(contract);
    setSavedEndDate(endDate);
    // In real app: POST to API
    alert("保存しました（デモ）");
  }

  const canSave = name.trim().length > 0;

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh" }}>
      {/* ── Page header ── */}
      <div
        className="py-5"
        style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: C.text }}>
              現場登録
            </h1>
            <p className="text-sm mt-0.5" style={{ color: C.muted }}>
              ※ 必須項目（*）以外は後から入力できます
            </p>
          </div>
          {/* Status chip */}
          <button
            className="px-3 py-1.5 rounded-full text-sm font-bold"
            style={{
              background: STATUS_STYLE[status].bg,
              color: STATUS_STYLE[status].color,
              border: `1px solid ${STATUS_STYLE[status].border}`,
            }}
          >
            {status}
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div>
          <TabBar active={tab} onChange={setTab} />
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="py-6 pb-28 md:pb-8">

        {/* ════════════════════════════════════════
            TAB 0 — 基本・スケジュール
        ════════════════════════════════════════ */}
        {tab === 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: main form */}
            <div className="flex-1 flex flex-col gap-5">

              {/* Site name & client — 2-col */}
              <Card>
                <SectionLabel>基本情報</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Site name */}
                  <div className="md:col-span-2">
                    <FieldLabel required>現場名</FieldLabel>
                    <InputField
                      value={name}
                      onChange={setName}
                      placeholder="例：山田邸解体工事"
                      highlight={!name.trim() && saved}
                    />
                    {!name.trim() && saved && (
                      <p className="text-sm mt-1" style={{ color: C.red }}>現場名は必須です</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <FieldLabel>住所</FieldLabel>
                    <InputField
                      value={address}
                      onChange={setAddress}
                      placeholder="例：東京都世田谷区豪徳寺2-14-5"
                    />
                  </div>

                  {/* Map Picker */}
                  <div className="md:col-span-2">
                    <FieldLabel>
                      <MapPin size={12} style={{ display: "inline", marginRight: 4, color: C.amber }} />
                      現場位置（地図で確認・調整）
                    </FieldLabel>
                    <MapPicker
                      address={address}
                      value={mapPos}
                      onChange={setMapPos}
                    />
                  </div>

                  {/* 元請け */}
                  <div className="md:col-span-2">
                    <FieldLabel>元請け</FieldLabel>
                    <div className="flex gap-1.5 mb-2">
                      {([["none", "元請け未設定"], ["registered", "元請けあり"], ["direct", "直接依頼"]] as const).map(([v, label]) => (
                        <button
                          key={v}
                          onClick={() => setClientType(v)}
                          className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                          style={clientType === v
                            ? { background: T.primaryLt, color: C.amberDk, border: `1.5px solid #E5E7EB` }
                            : { background: C.bg, color: C.muted, border: `1.5px solid ${C.border}` }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {clientType === "registered" && (
                      <div className="relative">
                        <Building2 size={14} color={C.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        <select
                          value={clientId ?? ""}
                          onChange={e => setClientId(e.target.value || null)}
                          className="w-full rounded-xl outline-none appearance-none"
                          style={{ height: 40, paddingLeft: 34, paddingRight: 36, fontSize: 14, background: C.card, border: `1.5px solid ${C.border}`, color: clientId ? C.text : C.muted }}
                        >
                          <option value="">元請けを選択</option>
                          {clients.filter(c => !c.archived).map(c => (
                            <option key={c.id} value={c.id}>{c.name}{c.contactName ? ` (${c.contactName})` : ""}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} color={C.muted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      </div>
                    )}
                    {clientType === "direct" && (
                      <InputField
                        value={directClientName}
                        onChange={setDirectClientName}
                        placeholder="依頼者名（任意）例：山田 太郎"
                      />
                    )}
                    {clientType === "none" && (
                      <p style={{ fontSize: 14, color: C.muted }}>直接依頼の場合も元請け未設定のままで登録できます</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Schedule */}
              <Card>
                <SectionLabel>工期・スケジュール</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Date range */}
                  <div>
                    <FieldLabel>工期</FieldLabel>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-sm mb-1" style={{ color: C.muted }}>着工日</p>
                        <InputField
                          type="date"
                          value={startDate}
                          onChange={setStartDate}
                        />
                      </div>
                      <span className="text-sm font-bold" style={{ color: C.border, paddingTop: 18 }}>〜</span>
                      <div className="flex-1">
                        <p className="text-sm mb-1" style={{ color: C.muted }}>
                          完工予定日
                          {extendedEnd && (
                            <span className="ml-1 px-1.5 py-0.5 rounded text-sm font-bold bg-amber-100 text-amber-700">
                              延長中
                            </span>
                          )}
                        </p>
                        <InputField
                          type="date"
                          value={extendedEnd || endDate}
                          onChange={handleEndDateChange}
                          highlight={!!extendedEnd}
                        />
                      </div>
                    </div>

                    {/* 工期延長 UI */}
                    {!showExtend ? (
                      <button
                        onClick={() => setShowExtend(true)}
                        className="mt-2 flex items-center gap-1.5 text-sm font-semibold"
                        style={{ color: C.amber }}
                      >
                        <Plus size={12} /> 工期延長を記録する
                      </button>
                    ) : (
                      <div
                        className="mt-3 rounded-2xl p-4 flex flex-col gap-3"
                        style={{ background: T.primaryLt, border: `1px solid #E5E7EB` }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold" style={{ color: C.amberDk }}>
                            工期延長
                          </p>
                          <button onClick={() => { setShowExtend(false); setExtendedEnd(""); setExtendReason(""); }}>
                            <X size={14} style={{ color: C.muted }} />
                          </button>
                        </div>
                        <div>
                          <p className="text-sm mb-1" style={{ color: C.muted }}>延長後完工予定日</p>
                          <InputField
                            type="date"
                            value={extendedEnd}
                            onChange={setExtendedEnd}
                          />
                        </div>
                        <div>
                          <p className="text-sm mb-1" style={{ color: C.muted }}>延長理由</p>
                          <InputField
                            value={extendReason}
                            onChange={setExtendReason}
                            placeholder="例：雨天による作業遅延"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <FieldLabel>ステータス</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_LIST.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(s)}
                          className="px-4 py-2 rounded-full text-sm font-bold transition-all"
                          style={
                            status === s
                              ? {
                                  background: STATUS_STYLE[s].bg,
                                  color: STATUS_STYLE[s].color,
                                  border: `2px solid ${STATUS_STYLE[s].color}`,
                                }
                              : {
                                  background: C.bg,
                                  color: C.muted,
                                  border: `1.5px solid ${C.border}`,
                                }
                          }
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Tab advance button */}
              <button
                onClick={() => setTab(1)}
                className="self-end flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.sub }}
              >
                <span>次へ：契約・お金</span>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Right sidebar: summary card */}
            <div className="lg:w-80 flex flex-col gap-4">
              <Card>
                <SectionLabel>登録サマリー</SectionLabel>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm mb-0.5" style={{ color: C.muted }}>現場名</p>
                    <p className="text-sm font-semibold" style={{ color: name ? C.text : C.muted }}>
                      {name || "未入力"}
                    </p>
                  </div>
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <p className="text-sm mb-0.5" style={{ color: C.muted }}>住所</p>
                    <p className="text-sm" style={{ color: address ? C.text : C.muted }}>
                      {address || "未入力"}
                    </p>
                  </div>
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <p className="text-sm mb-0.5" style={{ color: C.muted }}>工期</p>
                    <p className="text-sm" style={{ color: startDate || endDate ? C.text : C.muted }}>
                      {startDate || endDate
                        ? `${startDate || "—"} 〜 ${extendedEnd || endDate || "—"}`
                        : "未入力"}
                    </p>
                  </div>
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <p className="text-sm mb-1" style={{ color: C.muted }}>ステータス</p>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-bold"
                      style={{
                        background: STATUS_STYLE[status].bg,
                        color: STATUS_STYLE[status].color,
                        border: `1px solid ${STATUS_STYLE[status].border}`,
                      }}
                    >
                      {status}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB 1 — 契約・お金の管理
        ════════════════════════════════════════ */}
        {tab === 1 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: inputs */}
            <div className="flex-1 flex flex-col gap-5">

              <Card>
                <SectionLabel>契約金額</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <FieldLabel>契約金額（税抜）</FieldLabel>
                    <AmountInput
                      value={contract}
                      onChange={handleContractChange}
                      placeholder="3200000"
                    />
                    {contractNum > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div
                          className="flex items-center justify-between px-3 py-2 rounded-xl"
                          style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                        >
                          <span className="text-sm" style={{ color: C.sub }}>消費税（10%）</span>
                          <span className="text-sm font-bold" style={{ color: "#16A34A" }}>
                            ＋¥{taxAmount.toLocaleString()}
                          </span>
                        </div>
                        <div
                          className="flex items-center justify-between px-3 py-2 rounded-xl"
                          style={{ background: C.bg, border: `1px solid ${C.border}` }}
                        >
                          <span className="text-sm" style={{ color: C.sub }}>税込金額</span>
                          <span className="text-sm font-bold" style={{ color: C.text }}>
                            ¥{(contractNum + taxAmount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card>
                <SectionLabel>予算内訳</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "産廃処分費", icon: "🚛", val: wasteB,  set: setWasteB },
                    { label: "労務費",     icon: "👷", val: laborB,  set: setLaborB },
                    { label: "外注費",     icon: "🏢", val: subB,    set: setSubB },
                    { label: "その他経費", icon: "📋", val: otherB,  set: setOtherB },
                  ].map(({ label, icon, val, set }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm"
                        style={{ background: T.primaryLt }}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm mb-1" style={{ color: C.muted }}>{label}</p>
                        <AmountInput value={val} onChange={set} placeholder="0" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Change log (if any) */}
              {changeLog.length > 0 && (
                <Card>
                  <SectionLabel>変更履歴</SectionLabel>
                  <div className="flex flex-col gap-2">
                    {changeLog.map((entry, i) => (
                      <div
                        key={i}
                        className="rounded-xl px-3 py-2.5"
                        style={{ background: T.primaryLt, border: `1px solid #E5E7EB` }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold" style={{ color: C.amberDk }}>{entry.field}</span>
                          <span className="text-sm" style={{ color: C.muted }}>{entry.timestamp}</span>
                        </div>
                        <p className="text-sm" style={{ color: C.sub }}>
                          {entry.before} → {entry.after}
                        </p>
                        <p className="text-sm mt-0.5 font-medium" style={{ color: C.text }}>
                          理由：{entry.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <button
                onClick={() => setTab(2)}
                className="self-end flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.sub }}
              >
                <span>次へ：現場環境・リスク</span>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Right sidebar: profit meter */}
            <div className="lg:w-80 flex flex-col gap-4">
              {contractNum > 0 ? (
                <Card>
                  <SectionLabel>利益シミュレーション</SectionLabel>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold" style={{ color: C.sub }}>利益</p>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: profitColor }}
                    >
                      {profit >= 0 ? "+" : ""}¥{profit.toLocaleString()}
                    </span>
                  </div>

                  {/* Profit % gauge */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1" style={{ color: C.muted }}>
                      <span>利益率</span>
                      <span style={{ color: profitColor, fontWeight: "bold" }}>{profitPct}%</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: C.border }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(Math.max(profitPct, 0), 100)}%`,
                          background:
                            profitPct >= 25
                              ? "linear-gradient(90deg, #16A34A, #4ADE80)"
                              : profitPct >= 10
                              ? `linear-gradient(90deg, ${C.amberDk}, #92400E)`
                              : "linear-gradient(90deg, #DC2626, #F87171)",
                        }}
                      />
                    </div>
                    <div
                      className="flex justify-between text-sm mt-1"
                      style={{ color: C.muted }}
                    >
                      <span>0%</span>
                      <span>10%</span>
                      <span>25%</span>
                      <span>50%+</span>
                    </div>
                  </div>

                  {/* Breakdown summary */}
                  <div className="flex flex-col gap-1">
                    {[
                      { label: "受注金額", value: contractNum, color: C.text },
                      { label: "産廃処分費", value: -wasteBNum, color: C.red },
                      { label: "労務費", value: -laborBNum, color: C.red },
                      { label: "外注費", value: -subBNum, color: C.red },
                      { label: "その他", value: -otherBNum, color: C.red },
                    ]
                      .filter(({ value }) => value !== 0)
                      .map(({ label, value, color }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: C.muted }}>{label}</span>
                          <span className="text-sm font-semibold" style={{ color }}>
                            {value > 0 ? "+" : ""}¥{Math.abs(value).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    <div
                      className="flex items-center justify-between pt-1.5 mt-0.5"
                      style={{ borderTop: `1px solid ${C.border}` }}
                    >
                      <span className="text-sm font-bold" style={{ color: C.sub }}>利益</span>
                      <span className="text-sm font-bold" style={{ color: profitColor }}>
                        {profit >= 0 ? "+" : ""}¥{profit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card>
                  <SectionLabel>利益シミュレーション</SectionLabel>
                  <p className="text-sm text-center py-6" style={{ color: C.muted }}>
                    契約金額を入力すると利益シミュレーションが表示されます
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB 2 — 現場環境・リスク情報
        ════════════════════════════════════════ */}
        {tab === 2 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: main form */}
            <div className="flex-1 flex flex-col gap-5">

              <Card>
                <SectionLabel>建物・構造</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Structure type */}
                  <div>
                    <FieldLabel>構造種別</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {STRUCTURE_TYPES.map(({ type, icon }) => (
                        <button
                          key={type}
                          onClick={() => setStructureType(type === structureType ? null : type)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={
                            structureType === type
                              ? {
                                  background: T.primaryLt,
                                  color: C.amberDk,
                                  border: `2px solid ${C.amber}`,
                                }
                              : {
                                  background: C.bg,
                                  color: C.sub,
                                  border: `1.5px solid ${C.border}`,
                                }
                          }
                        >
                          <span>{icon}</span>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Area with waste estimate hint */}
                  <div>
                    <FieldLabel>延床面積</FieldLabel>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 relative">
                        <InputField
                          value={area}
                          onChange={setArea}
                          placeholder="例：120"
                          type="number"
                        />
                        <span
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                          style={{ color: C.muted }}
                        >㎡</span>
                      </div>
                    </div>
                    {estWaste !== null && (
                      <div
                        className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
                      >
                        <Info size={13} style={{ color: "#3B82F6" }} />
                        <p className="text-sm" style={{ color: "#3B82F6" }}>
                          <span style={{ fontWeight: "bold" }}>{structureType}</span> {area}㎡ の場合、
                          産廃発生量の目安は約 <span style={{ fontWeight: "bold" }}>{estWaste}㎥</span> です
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card>
                <SectionLabel>リスク・規制</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Asbestos level */}
                  <div>
                    <FieldLabel>アスベスト</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {ASBESTOS_LEVELS.map(({ level, color }) => (
                        <button
                          key={level}
                          onClick={() => setAsbestos(level)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all"
                          style={
                            asbestos === level
                              ? {
                                  background: `${color}18`,
                                  color,
                                  border: `2px solid ${color}`,
                                }
                              : {
                                  background: C.bg,
                                  color: C.muted,
                                  border: `1.5px solid ${C.border}`,
                                }
                          }
                        >
                          {level.startsWith("あり") && (
                            <AlertTriangle size={11} style={{ color: asbestos === level ? color : "#CBD5E1" }} />
                          )}
                          {level}
                        </button>
                      ))}
                    </div>
                    {asbestos !== "なし" && asbestos !== "調査中" && (
                      <div
                        className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
                      >
                        <AlertTriangle size={13} style={{ color: "#DC2626" }} />
                        <p className="text-sm" style={{ color: "#DC2626" }}>
                          アスベスト含有材は特別管理産業廃棄物として別途処理が必要です
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Vehicle limits */}
                  <div>
                    <FieldLabel>搬出車両制限</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {VEHICLE_LIMITS.map((v) => (
                        <button
                          key={v}
                          onClick={() => toggleVehicle(v)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={
                            vehicles.has(v)
                              ? {
                                  background: T.primaryLt,
                                  color: C.amberDk,
                                  border: `2px solid ${C.amber}`,
                                }
                              : {
                                  background: C.bg,
                                  color: C.sub,
                                  border: `1.5px solid ${C.border}`,
                                }
                          }
                        >
                          <Truck size={12} />
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionLabel>設備・環境</SectionLabel>
                {/* Utilities */}
                <div className="mb-5">
                  <FieldLabel>電気・ガス・水道（現況）</FieldLabel>
                  <div className="flex gap-3">
                    {(
                      [
                        { util: "電気" as Utility, icon: <Zap size={15} />, color: T.primaryDk },
                        { util: "ガス" as Utility, icon: <Flame size={15} />, color: T.primaryDk },
                        { util: "水道" as Utility, icon: <Droplets size={15} />, color: "#3B82F6" },
                      ]
                    ).map(({ util, icon, color }) => (
                      <button
                        key={util}
                        onClick={() => toggleUtil(util)}
                        className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl font-semibold text-sm transition-all"
                        style={
                          utils.has(util)
                            ? {
                                background: `${color}12`,
                                color,
                                border: `2px solid ${color}`,
                              }
                            : {
                                background: C.bg,
                                color: "#CBD5E1",
                                border: `1.5px solid ${C.border}`,
                              }
                        }
                      >
                        <span style={{ color: utils.has(util) ? color : "#CBD5E1" }}>{icon}</span>
                        {util}
                        <span
                          className="text-sm px-1.5 py-0.5 rounded-full font-bold"
                          style={
                            utils.has(util)
                              ? { background: `${color}20`, color }
                              : { background: C.bg, color: "#CBD5E1" }
                          }
                        >
                          {utils.has(util) ? "接続中" : "未接続"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Memo */}
                <div>
                  <FieldLabel>特記事項・メモ</FieldLabel>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="近隣環境・搬出経路・注意事項など"
                    rows={4}
                    className="w-full px-3.5 py-3 rounded-xl text-sm outline-none resize-none"
                    style={{
                      background: C.card,
                      border: `1.5px solid ${C.border}`,
                      color: C.text,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </Card>

              {/* Photo / document upload */}
              <Card>
                <SectionLabel>写真・書類</SectionLabel>

                {/* Photo grid */}
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {photos.map((p, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl overflow-hidden relative flex items-center justify-center text-2xl"
                      style={{ background: C.bg, border: `1px solid ${C.border}` }}
                    >
                      📷
                      <button
                        onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "#DC2626" }}
                      >
                        <X size={9} style={{ color: "#fff" }} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all hover:border-amber-400"
                    style={{ background: C.bg, border: `2px dashed ${C.border}` }}
                  >
                    <Camera size={16} style={{ color: C.muted }} />
                    <span className="text-sm" style={{ color: C.muted }}>写真追加</span>
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const names = Array.from(e.target.files ?? []).map((f) => f.name);
                      setPhotos((prev) => [...prev, ...names]);
                    }}
                  />
                </div>

                {/* PDF / doc upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl transition-all hover:border-amber-400"
                  style={{ background: C.bg, border: `2px dashed ${C.border}` }}
                >
                  <Upload size={15} style={{ color: C.muted }} />
                  <span className="text-sm" style={{ color: C.sub }}>
                    {files.length > 0
                      ? `${files.length}件 のファイルが添付されています`
                      : "見積書・図面（PDF）をアップロード"}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const names = Array.from(e.target.files ?? []).map((f) => f.name);
                    setFiles((prev) => [...prev, ...names]);
                  }}
                />
                {files.length > 0 && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                        style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
                      >
                        <FileText size={12} style={{ color: "#3B82F6" }} />
                        <span className="flex-1 text-sm truncate" style={{ color: C.text }}>{f}</span>
                        <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}>
                          <X size={12} style={{ color: C.muted }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right sidebar */}
            <div className="lg:w-80 flex flex-col gap-4">
              <Card>
                <SectionLabel>現場リスクサマリー</SectionLabel>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm mb-0.5" style={{ color: C.muted }}>構造種別</p>
                    <p className="text-sm font-semibold" style={{ color: structureType ? C.text : C.muted }}>
                      {structureType
                        ? `${STRUCTURE_TYPES.find(s => s.type === structureType)?.icon} ${structureType}`
                        : "未選択"}
                    </p>
                  </div>
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <p className="text-sm mb-0.5" style={{ color: C.muted }}>延床面積</p>
                    <p className="text-sm font-semibold" style={{ color: area ? C.text : C.muted }}>
                      {area ? `${area} ㎡` : "未入力"}
                    </p>
                    {estWaste !== null && (
                      <p className="text-sm mt-0.5" style={{ color: C.sub }}>
                        産廃目安：約 {estWaste}㎥
                      </p>
                    )}
                  </div>
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <p className="text-sm mb-1" style={{ color: C.muted }}>アスベスト</p>
                    <span
                      className="px-2.5 py-1 rounded-full text-sm font-bold"
                      style={{
                        background: `${ASBESTOS_LEVELS.find(a => a.level === asbestos)?.color ?? C.muted}18`,
                        color: ASBESTOS_LEVELS.find(a => a.level === asbestos)?.color ?? C.muted,
                        border: `1px solid ${ASBESTOS_LEVELS.find(a => a.level === asbestos)?.color ?? C.border}`,
                      }}
                    >
                      {asbestos}
                    </span>
                  </div>
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <p className="text-sm mb-1" style={{ color: C.muted }}>接続中の設備</p>
                    <div className="flex gap-1 flex-wrap">
                      {utils.size === 0 ? (
                        <span className="text-sm" style={{ color: C.muted }}>なし</span>
                      ) : (
                        Array.from(utils).map(u => (
                          <span
                            key={u}
                            className="px-2 py-0.5 rounded-full text-sm font-semibold"
                            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.sub }}
                          >
                            {u}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB 3 — 見積明細
        ════════════════════════════════════════ */}
        {tab === 3 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: items list */}
            <div className="flex-1 flex flex-col gap-5">

              <Card>
                <SectionLabel>よく使う項目をクリックして追加</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {[
                    ...(structureType
                      ? [{ name: `${structureType}造解体工事`, spec: "", qty: 1, unit: "式", unitPrice: 0 }]
                      : [{ name: "解体工事", spec: "", qty: 1, unit: "式", unitPrice: 0 }]),
                    { name: "産廃処理費（コンクリート）", spec: "約●㎥", qty: 1, unit: "㎥", unitPrice: 8_000 },
                    { name: "産廃処理費（木材）", spec: "約●㎥", qty: 1, unit: "㎥", unitPrice: 12_000 },
                    { name: "産廃処理費（金属くず）", spec: "約●kg", qty: 1, unit: "kg", unitPrice: 15 },
                    { name: "アスベスト含有建材除去", spec: "", qty: 1, unit: "式", unitPrice: 0 },
                    { name: "重機回送費", spec: "往復", qty: 1, unit: "式", unitPrice: 80_000 },
                    { name: "養生費", spec: "周囲防護シート", qty: 1, unit: "式", unitPrice: 60_000 },
                    { name: "仮設工事費", spec: "足場・防護ネット一式", qty: 1, unit: "式", unitPrice: 0 },
                    { name: "近隣挨拶費", spec: "", qty: 1, unit: "式", unitPrice: 20_000 },
                    { name: "石綿事前調査費", spec: "", qty: 1, unit: "式", unitPrice: 0 },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setItems(prev => [...prev, { ...preset }])}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: T.primaryLt, color: C.amberDk, border: `1px solid #E5E7EB` }}
                    >
                      <Plus size={10} /> {preset.name}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Empty state */}
              {items.length === 0 && (
                <div className="py-10 flex flex-col items-center gap-2" style={{ color: C.muted }}>
                  <FileText size={32} style={{ color: C.border }} />
                  <p className="text-sm">上のボタンか「行を追加」で明細を入力してください</p>
                </div>
              )}

              {/* Item cards */}
              <div className="flex flex-col gap-3">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-4 flex flex-col gap-2.5"
                    style={{ background: C.card, border: `1.5px solid ${C.border}`,
 }}
                  >
                    {/* 項目名 + 削除 */}
                    <div className="flex gap-2 items-center">
                      <div
                        className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold"
                        style={{ background: C.amber, color: "#fff" }}
                      >
                        {i + 1}
                      </div>
                      <input
                        value={item.name}
                        onChange={e => updateItem(i, "name", e.target.value)}
                        placeholder="項目名（例：木造家屋解体工事）"
                        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: C.bg, border: `1.5px solid ${C.border}`, color: C.text, fontFamily: "inherit" }}
                      />
                      <button onClick={() => removeItem(i)} style={{ color: C.red, flexShrink: 0 }}>
                        <X size={16} />
                      </button>
                    </div>
                    {/* 仕様 */}
                    <input
                      value={item.spec}
                      onChange={e => updateItem(i, "spec", e.target.value)}
                      placeholder="仕様・内容（例：木造2階建 148㎡）"
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: C.bg, border: `1.5px solid ${C.border}`, color: C.sub, fontFamily: "inherit" }}
                    />
                    {/* 数量 × 単位 × 単価 = 金額 */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={item.qty || ""}
                        onChange={e => updateItem(i, "qty", Number(e.target.value))}
                        placeholder="数量"
                        className="py-2 rounded-xl text-sm text-center outline-none"
                        style={{ width: 60, background: C.bg, border: `1.5px solid ${C.border}`, color: C.text, fontFamily: "inherit" }}
                      />
                      <input
                        value={item.unit}
                        onChange={e => updateItem(i, "unit", e.target.value)}
                        placeholder="単位"
                        className="py-2 rounded-xl text-sm text-center outline-none"
                        style={{ width: 48, background: C.bg, border: `1.5px solid ${C.border}`, color: C.text, fontFamily: "inherit" }}
                      />
                      <span className="text-sm" style={{ color: C.muted }}>×</span>
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: C.muted }}>¥</span>
                        <input
                          type="number"
                          value={item.unitPrice || ""}
                          onChange={e => updateItem(i, "unitPrice", Number(e.target.value))}
                          placeholder="単価"
                          className="w-full pl-6 pr-2 py-2 rounded-xl text-sm outline-none"
                          style={{ background: C.bg, border: `1.5px solid ${C.border}`, color: C.text, fontFamily: "inherit" }}
                        />
                      </div>
                      <span className="text-sm font-bold flex-shrink-0" style={{ color: C.amberDk, minWidth: 68, textAlign: "right" }}>
                        ={" "}{item.qty * item.unitPrice > 0
                          ? `¥${(item.qty * item.unitPrice).toLocaleString()}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 行を追加 */}
              <button
                onClick={() => setItems(prev => [...prev, { name: "", spec: "", qty: 1, unit: "式", unitPrice: 0 }])}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all hover:border-amber-400"
                style={{ background: C.bg, border: `1.5px dashed ${C.border}`, color: C.sub }}
              >
                <Plus size={15} /> 行を追加
              </button>
            </div>

            {/* Right sidebar: subtotal */}
            <div className="lg:w-80 flex flex-col gap-4">
              {items.length > 0 ? (
                <Card>
                  <SectionLabel>明細合計</SectionLabel>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: C.muted }}>小計（税抜）</span>
                      <span className="text-sm font-bold" style={{ color: C.text }}>¥{itemsTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: C.muted }}>消費税（10%）</span>
                      <span className="text-sm" style={{ color: C.sub }}>¥{itemsTax.toLocaleString()}</span>
                    </div>
                    <div
                      className="flex items-center justify-between pt-3 mt-1"
                      style={{ borderTop: `1px solid ${C.border}` }}
                    >
                      <span className="text-sm font-bold" style={{ color: C.amberDk }}>合計（税込）</span>
                      <span className="text-xl font-bold" style={{ color: C.amberDk }}>¥{(itemsTotal + itemsTax).toLocaleString()}</span>
                    </div>
                    {contractNum > 0 && itemsTotal > 0 && (
                      <div
                        className="flex items-center gap-1.5 mt-1 px-3 py-2 rounded-xl text-sm"
                        style={{
                          background: Math.abs(itemsDiff) < contractNum * 0.01 ? "#F0FDF4" : itemsDiff >= 0 ? T.primaryLt : "#FEF2F2",
                          color: Math.abs(itemsDiff) < contractNum * 0.01 ? "#16A34A" : itemsDiff >= 0 ? C.amberDk : "#DC2626",
                        }}
                      >
                        <Info size={12} />
                        <span>
                          契約金額との差額：{itemsDiff >= 0 ? "+" : ""}¥{itemsDiff.toLocaleString()}
                          {Math.abs(itemsDiff) < contractNum * 0.01
                            ? "（一致）"
                            : itemsDiff > 0
                            ? "（明細合計が契約金額より低い）"
                            : "（明細合計が契約金額を超過）"}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <Card>
                  <SectionLabel>明細合計</SectionLabel>
                  <p className="text-sm text-center py-6" style={{ color: C.muted }}>
                    明細を追加すると合計が表示されます
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ── Footer save bar ── */}
        <div
          className="mt-6 pt-5 flex gap-3 justify-end"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <Link href="/kaitai">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              style={{ background: T.surface, border: "1.5px solid #E2E8F0", color: T.text,
 }}
            >
              キャンセル
            </button>
          </Link>
          <button
            onClick={handleSave}
            className="px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
            style={
              canSave
                ? {
                    background: C.amber,
                    color: "#fff",
                    minHeight: 48,
                  }
                : {
                    background: C.bg,
                    color: "#CBD5E1",
                    border: `1px solid ${C.border}`,
                    minHeight: 48,
                  }
            }
          >
            <Check size={16} />
            {saved ? "更新して保存" : "現場を登録する"}
          </button>
        </div>

      </div>

      {/* ── Change log modal ── */}
      {pendingChange && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(15,23,42,0.5)" }}
          onClick={() => setPendingChange(null)}
        >
          <div
            className="w-full max-w-md mx-4 rounded-2xl px-6 pt-6 pb-7 flex flex-col gap-4"
            style={{ background: C.card,
 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: T.primaryLt }}
              >
                <Edit3 size={18} style={{ color: C.amberDk }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: C.text }}>変更理由を記録</p>
                <p className="text-sm" style={{ color: C.muted }}>
                  {pendingChange.field}を変更しました
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: C.bg, border: `1px solid ${C.border}` }}
            >
              <div className="flex-1 text-center">
                <p className="text-sm mb-0.5" style={{ color: C.muted }}>変更前</p>
                <p className="text-sm font-bold line-through" style={{ color: C.red }}>
                  {pendingChange.before}
                </p>
              </div>
              <ChevronRight size={16} style={{ color: C.border }} />
              <div className="flex-1 text-center">
                <p className="text-sm mb-0.5" style={{ color: C.muted }}>変更後</p>
                <p className="text-sm font-bold" style={{ color: "#16A34A" }}>
                  {pendingChange.after}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold mb-2" style={{ color: C.sub }}>変更理由</p>
              <textarea
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="例：施主都合により工期変更"
                rows={3}
                autoFocus
                className="w-full px-3.5 py-3 rounded-xl text-sm outline-none resize-none"
                style={{
                  background: C.bg,
                  border: `1.5px solid ${changeReason.trim() ? C.amber : C.border}`,
                  color: C.text,
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPendingChange(null)}
                className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.sub }}
              >
                キャンセル
              </button>
              <button
                onClick={confirmChange}
                className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={
                  changeReason.trim()
                    ? {
                        background: C.amber,
                        color: "#fff",
                      }
                    : { background: C.bg, color: "#CBD5E1", border: `1px solid ${C.border}` }
                }
              >
                <Clock size={15} />
                変更を記録して保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
