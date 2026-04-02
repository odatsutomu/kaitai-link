"use client";

import { useState, useRef, use } from "react";
import Link from "next/link";
import {
  MapPin, Calendar, ChevronRight,
  Building2, Zap, Droplets, Flame, AlertTriangle,
  Truck, FileText, Camera, Upload, X, Check,
  Clock, Edit3, Plus, Info, Shield, ChevronDown,
} from "lucide-react";
import { useAppContext } from "../../../lib/app-context";

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  text: "#1E293B", sub: "#64748B", muted: "#94A3B8",
  border: "#E2E8F0", card: "#FFFFFF", bg: "#F8FAFC",
  amber: "#F59E0B", amberDk: "#D97706",
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

// ─── Mock existing site data ──────────────────────────────────────────────────

const MOCK_SITES: Record<string, {
  name: string; address: string; startDate: string; endDate: string;
  status: Status; contract: string; wasteB: string; laborB: string; subB: string; otherB: string;
  structureType: StructureType; area: string; asbestos: AsbestosLevel;
  vehicles: VehicleLimit[]; utilities: Utility[]; memo: string;
}> = {
  s1: {
    name: "山田邸解体工事",
    address: "東京都世田谷区豪徳寺2-14-5",
    startDate: "2026-03-18",
    endDate: "2026-04-10",
    status: "施工中",
    contract: "3200000",
    wasteB: "840000",
    laborB: "760000",
    subB: "0",
    otherB: "240000",
    structureType: "木造",
    area: "148",
    asbestos: "調査中",
    vehicles: ["4t"],
    utilities: ["電気", "水道"],
    memo: "隣家との距離が狭いため養生に注意。搬出は北側より。",
  },
  s2: {
    name: "旧田中倉庫解体",
    address: "神奈川県川崎市幸区堀川町580",
    startDate: "2026-03-25",
    endDate: "2026-04-20",
    status: "施工中",
    contract: "5600000",
    wasteB: "1400000",
    laborB: "1200000",
    subB: "300000",
    otherB: "400000",
    structureType: "鉄骨",
    area: "320",
    asbestos: "あり(L2)",
    vehicles: ["4t", "10t"],
    utilities: ["電気", "ガス", "水道"],
    memo: "重機は15t以下。敷地内転回可。",
  },
};

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LIST: Status[] = ["見積中", "受注確定", "施工中", "完了", "請求済"];
const STATUS_STYLE: Record<Status, { bg: string; color: string; border: string }> = {
  "見積中":   { bg: "#EFF6FF", color: "#3B82F6", border: "#BFDBFE" },
  "受注確定": { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
  "施工中":   { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
  "完了":     { bg: "#F8FAFC", color: "#475569", border: "#CBD5E1" },
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
  { level: "あり(L1)", color: "#D97706" },
  { level: "あり(L2)", color: "#EA580C" },
  { level: "あり(L3)", color: "#DC2626" },
  { level: "調査中",  color: "#6B7280" },
];

const VEHICLE_LIMITS: VehicleLimit[] = ["2t", "4t", "10t", "制限なし"];
const UTILITIES: Utility[] = ["電気", "ガス", "水道"];

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
  const tabs = ["基本・スケジュール", "契約・お金", "現場環境・リスク"];
  return (
    <div className="flex" style={{ borderBottom: `2px solid ${C.border}` }}>
      {tabs.map((label, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className="flex-1 py-3 text-xs font-bold transition-all"
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
      className="text-[11px] font-bold tracking-widest uppercase mb-3"
      style={{ color: C.amber }}
    >
      {children}
    </p>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-xs font-bold mb-1.5" style={{ color: C.sub }}>
      {children}
      {required && <span className="ml-1" style={{ color: C.red }}>*</span>}
    </p>
  );
}

function InputField({
  value, onChange, placeholder, type = "text", className = "", highlight = false, readOnly = false,
}: {
  value: string; onChange?: (v: string) => void; placeholder?: string;
  type?: string; className?: string; highlight?: boolean; readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3.5 py-3 rounded-xl text-sm outline-none transition-all ${className}`}
      style={{
        background: readOnly ? C.bg : C.card,
        border: `1.5px solid ${highlight ? C.amber : C.border}`,
        color: readOnly ? C.muted : C.text,
        fontFamily: "inherit",
        cursor: readOnly ? "not-allowed" : undefined,
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
        className="w-full pl-8 pr-3.5 py-3 rounded-xl text-sm outline-none"
        style={{
          background: C.card,
          border: `1.5px solid ${highlight ? C.amber : C.border}`,
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
      className={className}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: "0.75rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        padding: "1.25rem",
      }}
    >
      {children}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SiteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const seed = MOCK_SITES[id];
  const { clients } = useAppContext();

  const [tab, setTab] = useState(0);

  // 元請け
  const [clientType, setClientType] = useState<"registered" | "direct" | "none">("none");
  const [clientId,   setClientId]   = useState<string | null>(null);
  const [directClientName, setDirectClientName] = useState("");

  // Tab 1
  const [name, setName]               = useState(seed?.name ?? "");
  const [address, setAddress]         = useState(seed?.address ?? "");
  const [startDate, setStartDate]     = useState(seed?.startDate ?? "");
  const [endDate, setEndDate]         = useState(seed?.endDate ?? "");
  const [extendedEnd, setExtendedEnd] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [showExtend, setShowExtend]   = useState(false);
  const [status, setStatus]           = useState<Status>(seed?.status ?? "施工中");

  // Tab 2
  const [contract, setContract] = useState(seed?.contract ?? "");
  const [wasteB, setWasteB]     = useState(seed?.wasteB ?? "");
  const [laborB, setLaborB]     = useState(seed?.laborB ?? "");
  const [subB, setSubB]         = useState(seed?.subB ?? "");
  const [otherB, setOtherB]     = useState(seed?.otherB ?? "");

  // Tab 3
  const [structureType, setStructureType] = useState<StructureType | null>(seed?.structureType ?? null);
  const [area, setArea]         = useState(seed?.area ?? "");
  const [asbestos, setAsbestos] = useState<AsbestosLevel>(seed?.asbestos ?? "なし");
  const [vehicles, setVehicles] = useState<Set<VehicleLimit>>(new Set(seed?.vehicles ?? []));
  const [utils, setUtils]       = useState<Set<Utility>>(new Set(seed?.utilities ?? ["電気", "ガス", "水道"]));
  const [memo, setMemo]         = useState(seed?.memo ?? "");

  // Photos / files
  const [photos, setPhotos] = useState<string[]>([]);
  const [files, setFiles]   = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  // Change log (pre-populated with saved originals)
  const [changeLog, setChangeLog]   = useState<ChangeLogEntry[]>([]);
  const [pendingChange, setPendingChange] = useState<{ field: string; before: string; after: string } | null>(null);
  const [changeReason, setChangeReason]   = useState("");

  // Saved originals for change detection
  const savedContract = seed?.contract ?? "";
  const savedEndDate  = seed?.endDate ?? "";

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

  const estWaste = structureType && area
    ? Math.round(parseFloat(area) * WASTE_ESTIMATE[structureType] * 10) / 10
    : null;

  function toggleVehicle(v: VehicleLimit) {
    setVehicles((prev) => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; });
  }
  function toggleUtil(u: Utility) {
    setUtils((prev) => { const n = new Set(prev); n.has(u) ? n.delete(u) : n.add(u); return n; });
  }

  function handleContractChange(v: string) {
    if (savedContract && v !== savedContract) {
      setPendingChange({
        field: "契約金額",
        before: `¥${parseFloat(savedContract || "0").toLocaleString()}`,
        after: `¥${parseFloat(v || "0").toLocaleString()}`,
      });
    }
    setContract(v);
  }

  function handleEndDateChange(v: string) {
    if (savedEndDate && v !== savedEndDate) {
      setPendingChange({ field: "工期終了日", before: savedEndDate, after: v });
    }
    setEndDate(v);
  }

  function confirmChange() {
    if (!pendingChange || !changeReason.trim()) return;
    setChangeLog((prev) => [
      ...prev,
      { ...pendingChange, reason: changeReason, timestamp: new Date().toLocaleString("ja-JP") },
    ]);
    setPendingChange(null);
    setChangeReason("");
  }

  function handleSave() {
    if (!name.trim()) { setTab(0); return; }
    alert("更新しました（デモ）");
  }

  const canSave = name.trim().length > 0;

  if (!seed) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: C.bg, color: C.muted }}>
        現場データが見つかりません
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, color: C.text }}>
      <div className="px-4 md:px-8 py-6 pb-24 md:pb-8 flex flex-col gap-6">

        {/* ── Page title ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: C.text }}>
              現場編集
            </h1>
            <p className="text-sm mt-0.5" style={{ color: C.sub }}>
              {seed.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {changeLog.length > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}
              >
                <Clock size={12} style={{ color: "#EA580C" }} />
                <span className="text-xs font-semibold" style={{ color: "#EA580C" }}>
                  {changeLog.length}件の変更が記録されています
                </span>
              </div>
            )}
            <button
              className="px-3 py-1.5 rounded-full text-xs font-bold"
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
        <div style={{ background: C.card, borderRadius: "0.75rem", border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <TabBar active={tab} onChange={setTab} />

          {/* ── Tab content ── */}
          <div className="px-6 py-6 flex flex-col gap-6">

            {/* ════ TAB 0 ════ */}
            {tab === 0 && (
              <>
                <SectionLabel>基本情報</SectionLabel>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>現場名</FieldLabel>
                    <InputField value={name} onChange={setName} placeholder="例：山田邸解体工事" />
                  </div>

                  {/* 元請け */}
                  <div>
                    <FieldLabel>元請け</FieldLabel>
                    <div className="flex gap-1.5 mb-2">
                      {([["none", "元請け未設定"], ["registered", "元請けあり"], ["direct", "直接依頼"]] as const).map(([v, label]) => (
                        <button
                          key={v}
                          onClick={() => setClientType(v)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                          style={clientType === v
                            ? { background: "#FFFBEB", color: C.amberDk, border: `1.5px solid #FDE68A` }
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
                          style={{ height: 44, paddingLeft: 34, paddingRight: 36, fontSize: 14, background: C.card, border: `1.5px solid ${C.border}`, color: clientId ? C.text : C.muted }}
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
                      <p style={{ fontSize: 11, color: C.muted }}>直接依頼の場合も元請け未設定のままで登録できます</p>
                    )}
                  </div>
                </div>

                <div>
                  <FieldLabel>住所</FieldLabel>
                  <div className="flex gap-2">
                    <InputField
                      value={address}
                      onChange={setAddress}
                      placeholder="例：東京都世田谷区"
                      className="flex-1"
                    />
                    <a
                      href={address ? `https://www.google.com/maps/search/${encodeURIComponent(address)}` : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold"
                      style={{
                        background: address ? "#FFF7ED" : C.bg,
                        color: address ? "#EA580C" : "#CBD5E1",
                        border: `1px solid ${address ? "#FED7AA" : C.border}`,
                      }}
                    >
                      <MapPin size={13} />
                      地図
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>工期</FieldLabel>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-[10px] mb-1" style={{ color: C.muted }}>着工日</p>
                        <InputField type="date" value={startDate} onChange={setStartDate} />
                      </div>
                      <span className="text-sm font-bold" style={{ color: "#CBD5E1", paddingTop: 18 }}>〜</span>
                      <div className="flex-1">
                        <p className="text-[10px] mb-1" style={{ color: C.muted }}>
                          完工予定日
                          {extendedEnd && (
                            <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "#FFFBEB", color: C.amberDk }}>
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

                    {!showExtend ? (
                      <button
                        onClick={() => setShowExtend(true)}
                        className="mt-2 flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: C.amber }}
                      >
                        <Plus size={12} /> 工期延長を記録する
                      </button>
                    ) : (
                      <div
                        className="mt-3 rounded-2xl p-4 flex flex-col gap-3"
                        style={{ background: "#FFFBEB", border: `1px solid #FDE68A` }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold" style={{ color: C.amberDk }}>工期延長</p>
                          <button onClick={() => { setShowExtend(false); setExtendedEnd(""); setExtendReason(""); }}>
                            <X size={14} style={{ color: C.muted }} />
                          </button>
                        </div>
                        <div>
                          <p className="text-[10px] mb-1" style={{ color: C.muted }}>延長後完工予定日</p>
                          <InputField type="date" value={extendedEnd} onChange={setExtendedEnd} />
                        </div>
                        <div>
                          <p className="text-[10px] mb-1" style={{ color: C.muted }}>延長理由</p>
                          <InputField value={extendReason} onChange={setExtendReason} placeholder="例：雨天による作業遅延" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <FieldLabel>ステータス</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_LIST.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(s)}
                          className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                          style={
                            status === s
                              ? { background: STATUS_STYLE[s].bg, color: STATUS_STYLE[s].color, border: `2px solid ${STATUS_STYLE[s].color}` }
                              : { background: C.bg, color: C.muted, border: `1.5px solid ${C.border}` }
                          }
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setTab(1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.sub }}
                  >
                    <span>次へ：契約・お金</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* ════ TAB 1 ════ */}
            {tab === 1 && (
              <>
                <SectionLabel>契約・予算</SectionLabel>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-4">
                    <div>
                      <FieldLabel>契約金額（税抜）</FieldLabel>
                      <AmountInput value={contract} onChange={handleContractChange} placeholder="3200000" />
                      {contractNum > 0 && (
                        <>
                          <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                            <span className="text-xs" style={{ color: C.sub }}>消費税（10%）</span>
                            <span className="text-sm font-bold" style={{ color: "#16A34A" }}>＋¥{taxAmount.toLocaleString()}</span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                            <span className="text-xs" style={{ color: C.sub }}>税込金額</span>
                            <span className="text-sm font-bold" style={{ color: C.text }}>¥{(contractNum + taxAmount).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <FieldLabel>予算内訳</FieldLabel>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "産廃処分費", icon: "🚛", val: wasteB, set: setWasteB },
                          { label: "労務費",     icon: "👷", val: laborB, set: setLaborB },
                          { label: "外注費",     icon: "🏢", val: subB,   set: setSubB },
                          { label: "その他経費", icon: "📋", val: otherB, set: setOtherB },
                        ].map(({ label, icon, val, set }) => (
                          <div key={label} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm" style={{ background: "#FFFBEB" }}>
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] mb-1" style={{ color: C.muted }}>{label}</p>
                              <AmountInput value={val} onChange={set} placeholder="0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {contractNum > 0 && (
                    <div>
                      <div className="rounded-xl p-4" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold" style={{ color: C.sub }}>利益シミュレーション</p>
                          <span className="text-lg font-bold" style={{ color: profitColor }}>
                            {profit >= 0 ? "+" : ""}¥{profit.toLocaleString()}
                          </span>
                        </div>
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: C.muted }}>
                            <span>利益率</span>
                            <span style={{ color: profitColor, fontWeight: "bold" }}>{profitPct}%</span>
                          </div>
                          <div className="h-4 rounded-full overflow-hidden" style={{ background: C.border }}>
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(Math.max(profitPct, 0), 100)}%`,
                                background: profitPct >= 25
                                  ? `linear-gradient(90deg, #16A34A, ${C.green})`
                                  : profitPct >= 10
                                  ? `linear-gradient(90deg, ${C.amberDk}, ${C.amber})`
                                  : "linear-gradient(90deg, #DC2626, #F87171)",
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] mt-1" style={{ color: "#CBD5E1" }}>
                            <span>0%</span><span>10%</span><span>25%</span><span>50%+</span>
                          </div>
                        </div>
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
                                <span className="text-[10px]" style={{ color: C.muted }}>{label}</span>
                                <span className="text-xs font-semibold" style={{ color }}>
                                  {value > 0 ? "+" : ""}¥{Math.abs(value).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          <div className="flex items-center justify-between pt-1.5 mt-0.5" style={{ borderTop: `1px solid ${C.border}` }}>
                            <span className="text-xs font-bold" style={{ color: C.sub }}>利益</span>
                            <span className="text-sm font-bold" style={{ color: profitColor }}>
                              {profit >= 0 ? "+" : ""}¥{profit.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {changeLog.length > 0 && (
                  <div>
                    <SectionLabel>変更履歴</SectionLabel>
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                    >
                      {changeLog.map((entry, i) => (
                        <div
                          key={i}
                          className="px-4 py-3"
                          style={{ borderBottom: i < changeLog.length - 1 ? `1px solid ${C.border}` : "none" }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold" style={{ color: C.text }}>{entry.field}</span>
                            <span className="text-[10px]" style={{ color: C.muted }}>{entry.timestamp}</span>
                          </div>
                          <p className="text-[10px]" style={{ color: C.sub }}>{entry.before} → {entry.after}</p>
                          <p className="text-[10px] mt-0.5 font-medium" style={{ color: C.text }}>理由：{entry.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setTab(2)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.sub }}
                  >
                    <span>次へ：現場環境・リスク</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* ════ TAB 2 ════ */}
            {tab === 2 && (
              <>
                <SectionLabel>現場環境・リスク</SectionLabel>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-4">
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
                                ? { background: "#FFFBEB", color: C.amberDk, border: `2px solid #FDE68A` }
                                : { background: C.bg, color: C.sub, border: `1.5px solid ${C.border}` }
                            }
                          >
                            <span>{icon}</span>{type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel>延床面積</FieldLabel>
                      <div className="relative">
                        <InputField value={area} onChange={setArea} placeholder="例：120" type="number" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: C.muted }}>㎡</span>
                      </div>
                      {estWaste !== null && (
                        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                          <Info size={13} style={{ color: "#3B82F6" }} />
                          <p className="text-xs" style={{ color: "#3B82F6" }}>
                            <span style={{ fontWeight: "bold" }}>{structureType}</span> {area}㎡ の場合、産廃発生量の目安は約 <span style={{ fontWeight: "bold" }}>{estWaste}㎥</span> です
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <FieldLabel>アスベスト</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {ASBESTOS_LEVELS.map(({ level, color }) => (
                          <button
                            key={level}
                            onClick={() => setAsbestos(level)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                            style={
                              asbestos === level
                                ? { background: `${color}18`, color, border: `2px solid ${color}` }
                                : { background: C.bg, color: C.muted, border: `1.5px solid ${C.border}` }
                            }
                          >
                            {level.startsWith("あり") && <AlertTriangle size={11} style={{ color: asbestos === level ? color : "#CBD5E1" }} />}
                            {level}
                          </button>
                        ))}
                      </div>
                      {asbestos !== "なし" && asbestos !== "調査中" && (
                        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                          <AlertTriangle size={13} style={{ color: "#DC2626" }} />
                          <p className="text-xs" style={{ color: "#DC2626" }}>アスベスト含有材は特別管理産業廃棄物として別途処理が必要です</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
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
                                ? { background: "#FFFBEB", color: C.amberDk, border: `2px solid #FDE68A` }
                                : { background: C.bg, color: C.sub, border: `1.5px solid ${C.border}` }
                            }
                          >
                            <Truck size={12} />{v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel>電気・ガス・水道（現況）</FieldLabel>
                      <div className="flex gap-3">
                        {(
                          [
                            { util: "電気" as Utility, icon: <Zap size={15} />, color: "#D97706" },
                            { util: "ガス" as Utility, icon: <Flame size={15} />, color: "#EA580C" },
                            { util: "水道" as Utility, icon: <Droplets size={15} />, color: "#3B82F6" },
                          ]
                        ).map(({ util, icon, color }) => (
                          <button
                            key={util}
                            onClick={() => toggleUtil(util)}
                            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl font-semibold text-xs transition-all"
                            style={
                              utils.has(util)
                                ? { background: `${color}12`, color, border: `2px solid ${color}` }
                                : { background: C.bg, color: "#CBD5E1", border: `1.5px solid ${C.border}` }
                            }
                          >
                            <span style={{ color: utils.has(util) ? color : "#CBD5E1" }}>{icon}</span>
                            {util}
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                              style={utils.has(util) ? { background: `${color}20`, color } : { background: C.bg, color: "#CBD5E1" }}>
                              {utils.has(util) ? "接続中" : "未接続"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel>特記事項・メモ</FieldLabel>
                      <textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder="近隣環境・搬出経路・注意事項など"
                        rows={4}
                        className="w-full px-3.5 py-3 rounded-xl text-sm outline-none resize-none"
                        style={{ background: C.card, border: `1.5px solid ${C.border}`, color: C.text, fontFamily: "inherit" }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <FieldLabel>写真・書類</FieldLabel>
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {photos.map((p, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden relative flex items-center justify-center text-2xl" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                        📷
                        <button onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#DC2626" }}>
                          <X size={9} style={{ color: "#fff" }} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                      style={{ background: C.bg, border: `1.5px dashed ${C.border}` }}
                    >
                      <Camera size={16} style={{ color: C.muted }} />
                      <span className="text-[9px]" style={{ color: C.muted }}>写真追加</span>
                    </button>
                    <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => { const names = Array.from(e.target.files ?? []).map((f) => f.name); setPhotos((prev) => [...prev, ...names]); }} />
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl transition-all" style={{ background: C.bg, border: `1.5px dashed ${C.border}` }}>
                    <Upload size={15} style={{ color: C.muted }} />
                    <span className="text-xs" style={{ color: C.sub }}>
                      {files.length > 0 ? `${files.length}件 のファイルが添付されています` : "見積書・図面（PDF）をアップロード"}
                    </span>
                  </button>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple className="hidden"
                    onChange={(e) => { const names = Array.from(e.target.files ?? []).map((f) => f.name); setFiles((prev) => [...prev, ...names]); }} />
                </div>
              </>
            )}

          </div>
        </div>

        {/* ── Footer actions ── */}
        <div
          className="flex gap-3 justify-end"
          style={{ paddingTop: "0.5rem" }}
        >
          <Link href={`/kaitai/site/${id}`} className="flex-shrink-0">
            <button
              className="px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.sub, minHeight: 48 }}
            >
              キャンセル
            </button>
          </Link>
          <button
            onClick={handleSave}
            className="px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-[0.98]"
            style={
              canSave
                ? {
                    background: C.amber,
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
                    minHeight: 48,
                  }
                : { background: C.bg, color: "#CBD5E1", border: `1px solid ${C.border}`, minHeight: 48 }
            }
          >
            <Check size={16} />
            変更を保存する
          </button>
        </div>

      </div>

      {/* ── Change log modal ── */}
      {pendingChange && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={() => setPendingChange(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl px-6 pt-6 pb-7 flex flex-col gap-4 mx-4"
            style={{ background: C.card, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#FFFBEB" }}>
                <Edit3 size={18} style={{ color: C.amber }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: C.text }}>変更理由を記録</p>
                <p className="text-xs" style={{ color: C.muted }}>{pendingChange.field}を変更しました</p>
              </div>
            </div>

            <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <div className="flex-1 text-center">
                <p className="text-[10px] mb-0.5" style={{ color: C.muted }}>変更前</p>
                <p className="text-sm font-bold line-through" style={{ color: C.red }}>{pendingChange.before}</p>
              </div>
              <ChevronRight size={16} style={{ color: "#CBD5E1" }} />
              <div className="flex-1 text-center">
                <p className="text-[10px] mb-0.5" style={{ color: C.muted }}>変更後</p>
                <p className="text-sm font-bold" style={{ color: C.green }}>{pendingChange.after}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: C.sub }}>変更理由</p>
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
            <button
              onClick={confirmChange}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={
                changeReason.trim()
                  ? { background: C.amber, color: "#fff", minHeight: 48 }
                  : { background: C.bg, color: "#CBD5E1", border: `1px solid ${C.border}`, minHeight: 48 }
              }
            >
              <Clock size={15} />
              変更を記録して保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
