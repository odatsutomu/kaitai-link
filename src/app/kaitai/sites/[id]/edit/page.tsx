"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin, ChevronRight,
  Building2, Zap, Droplets, Flame, AlertTriangle,
  Truck, FileText, Camera, Upload, X, Check,
  Clock, Edit3, Plus, Info, ChevronDown,
  Save, ExternalLink, Copy, AlertCircle,
} from "lucide-react";
import { useAppContext } from "../../../lib/app-context";
import type { LatLng } from "../../../lib/geocode";
import type { LineItem } from "../../../lib/doc-types";
import { T } from "../../../lib/design-tokens";

const MapPicker = dynamic(
  () => import("../../../components/map-picker").then(m => m.MapPicker),
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

type Status = "調査・見積" | "契約・申請" | "近隣挨拶・養生" | "着工・内装解体" | "上屋解体・基礎" | "完工・更地確認" | "産廃書類完了" | "入金確認";
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

const MOCK_SITES: Record<string, any> = {};

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LIST: Status[] = ["調査・見積", "契約・申請", "近隣挨拶・養生", "着工・内装解体", "上屋解体・基礎", "完工・更地確認", "産廃書類完了", "入金確認"];
const STATUS_STYLE: Record<Status, { bg: string; color: string; border: string }> = {
  "調査・見積":     { bg: "rgba(107,114,128,0.1)", color: "#6B7280", border: "#D1D5DB" },
  "契約・申請":     { bg: "rgba(99,102,241,0.1)",  color: "#6366F1", border: "#C7D2FE" },
  "近隣挨拶・養生": { bg: "#EFF6FF",               color: "#3B82F6", border: "#BFDBFE" },
  "着工・内装解体": { bg: T.primaryLt,              color: T.primaryDk, border: "#FED7AA" },
  "上屋解体・基礎": { bg: "rgba(180,83,9,0.15)",   color: T.primaryDk, border: "#FED7AA" },
  "完工・更地確認": { bg: "#F0FDF4",               color: "#16A34A", border: "#BBF7D0" },
  "産廃書類完了":   { bg: "rgba(13,148,136,0.1)",  color: "#0D9488", border: "#99F6E4" },
  "入金確認":       { bg: "rgba(5,150,105,0.1)",   color: "#059669", border: "#A7F3D0" },
};

// Legacy status mapping for existing DB values
const LEGACY_STATUS_MAP: Record<string, Status> = {
  "着工前": "調査・見積",
  "施工中": "着工・内装解体",
  "解体中": "着工・内装解体",
  "完工": "完工・更地確認",
  "見積中": "調査・見積",
  "受注確定": "契約・申請",
  "完了": "完工・更地確認",
  "請求済": "産廃書類完了",
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
  const tabs = ["基本・スケジュール", "契約・お金", "現場環境・リスク", "契約・帳票作成"];
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
  const { clients } = useAppContext();
  const [loaded, setLoaded] = useState(false);

  const [tab, setTab] = useState(0);

  // 元請け
  const [clientType, setClientType] = useState<"registered" | "direct" | "none">("none");
  const [clientId,   setClientId]   = useState<string | null>(null);
  const [directClientName, setDirectClientName] = useState("");

  // Tab 1
  const [name, setName]               = useState("");
  const [address, setAddress]         = useState("");
  const [mapPos, setMapPos]           = useState<LatLng | null>(null);
  const [startDate, setStartDate]     = useState("");
  const [endDate, setEndDate]         = useState("");
  const [extendedEnd, setExtendedEnd] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [showExtend, setShowExtend]   = useState(false);
  const [status, setStatus]           = useState<Status>("調査・見積");

  // Tab 2
  const [contract, setContract] = useState("");
  const [wasteB, setWasteB]     = useState("");
  const [laborB, setLaborB]     = useState("");
  const [subB, setSubB]         = useState("");
  const [otherB, setOtherB]     = useState("");

  // Tab 3
  const [structureType, setStructureType] = useState<StructureType | null>(null);
  const [area, setArea]         = useState("");
  const [asbestos, setAsbestos] = useState<AsbestosLevel>("なし");
  const [vehicles, setVehicles] = useState<Set<VehicleLimit>>(new Set());

  // Fetch existing site data
  useEffect(() => {
    if (!id) return;
    fetch("/api/kaitai/sites", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const s = data?.sites?.find((site: Record<string, unknown>) => site.id === id);
        if (!s) return;
        setName((s.name as string) ?? "");
        setAddress((s.address as string) ?? "");
        setStartDate((s.startDate as string) ?? "");
        setEndDate((s.endDate as string) ?? "");
        const rawStatus = (s.status as string) ?? "調査・見積";
        setStatus(LEGACY_STATUS_MAP[rawStatus] ?? rawStatus as Status);
        const contractStr = s.contractAmount ? String(s.contractAmount) : "";
        setContract(contractStr);
        setSavedContract(contractStr);
        const endStr = (s.endDate as string) ?? "";
        setSavedEndDate(endStr);
        if (s.structureType) setStructureType(s.structureType as StructureType);
        if (s.clientId) {
          setClientType("registered");
          setClientId(s.clientId as string);
        }
        if (s.lat && s.lng) setMapPos({ lat: s.lat as number, lng: s.lng as number });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [id]);
  const [utils, setUtils]       = useState<Set<Utility>>(new Set(["電気", "ガス", "水道"]));
  const [memo, setMemo]         = useState("");

  // Photos / files
  const [photos, setPhotos] = useState<string[]>([]);
  const [files, setFiles]   = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  // ─── Tab 3: Contract / Document data ────────────────────────────────────────
  // Section 1: 顧客・契約基本情報
  const [cClientName,    setCClientName]    = useState("");
  const [cClientZip,     setCClientZip]     = useState("");
  const [cClientAddress, setCClientAddress] = useState("");
  const [cClientContact, setCClientContact] = useState("");
  const [cPaymentTerms,  setCPaymentTerms]  = useState("");
  const [cExpiryDays,    setCExpiryDays]    = useState("30");
  const [cProjectName,   setCProjectName]   = useState("");
  const [cProjectAddr,   setCProjectAddr]   = useState("");

  // Section 2: 見積・請求明細
  const [activeItemsTab,  setActiveItemsTab]  = useState<"estimate" | "invoice">("estimate");
  const [estimateItems,   setEstimateItems]   = useState<LineItem[]>([]);
  const [invoiceItems,    setInvoiceItems]    = useState<LineItem[]>([]);
  const [cNotes,          setCNotes]          = useState("");

  // Section 3: 建物滅失登記用データ
  const [cLandAddress,   setCLandAddress]   = useState("");
  const [cHouseNo,       setCHouseNo]       = useState("");
  const [cStructureKind, setCStructureKind] = useState("");
  const [cFloor1Area,    setCFloor1Area]    = useState("");
  const [cFloor2Area,    setCFloor2Area]    = useState("");
  const [cFloor3Area,    setCFloor3Area]    = useState("");

  // Section 4: 工事完了報告写真
  const [siteImages,       setSiteImages]       = useState<{ id: string; url: string; reportType?: string }[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);

  const [contractSaving, setContractSaving] = useState(false);
  const [contractSaved,  setContractSaved]  = useState(false);

  // Load contract data when tab 3 is first opened
  useEffect(() => {
    if (tab !== 3 || !id || !loaded) return;
    fetch(`/api/kaitai/sites/contract?siteId=${id}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        const d = res?.data;
        if (!d) return;
        setCClientName(d.clientName ?? "");
        setCClientZip(d.clientZip ?? "");
        setCClientAddress(d.clientAddress ?? "");
        setCClientContact(d.clientContact ?? "");
        setCPaymentTerms(d.paymentTerms ?? "");
        setCExpiryDays(String(d.expiryDays ?? 30));
        setCProjectName(d.projectName ?? name);
        setCProjectAddr(d.projectAddress ?? address);
        setEstimateItems(Array.isArray(d.estimateItems) ? d.estimateItems : []);
        setInvoiceItems(Array.isArray(d.invoiceItems) ? d.invoiceItems : []);
        setCNotes(d.notes ?? "");
        setCLandAddress(d.landAddress ?? "");
        setCHouseNo(d.houseNo ?? "");
        setCStructureKind(d.structureKind ?? "");
        setCFloor1Area(d.floor1Area ?? "");
        setCFloor2Area(d.floor2Area ?? "");
        setCFloor3Area(d.floor3Area ?? "");
        setSelectedPhotoIds(Array.isArray(d.photoIds) ? d.photoIds : []);
      })
      .catch(() => {});

    // Also load site images for photo selection
    fetch(`/api/kaitai/upload?siteId=${id}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(res => { if (res?.images) setSiteImages(res.images); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, id, loaded]);

  // Change log (pre-populated with saved originals)
  const [changeLog, setChangeLog]   = useState<ChangeLogEntry[]>([]);
  const [pendingChange, setPendingChange] = useState<{ field: string; before: string; after: string } | null>(null);
  const [changeReason, setChangeReason]   = useState("");

  // Saved originals for change detection
  const [savedContract, setSavedContract] = useState("");
  const [savedEndDate, setSavedEndDate]  = useState("");

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

  // ─── Contract data helpers ──────────────────────────────────────────────────
  function blankLineItem(): LineItem {
    return { name: "", spec: "", qty: 1, unit: "式", unitPrice: 0 };
  }

  function updateLineItem(
    type: "estimate" | "invoice",
    i: number,
    field: keyof LineItem,
    value: string | number
  ) {
    const setter = type === "estimate" ? setEstimateItems : setInvoiceItems;
    setter(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }

  function removeLineItem(type: "estimate" | "invoice", i: number) {
    const setter = type === "estimate" ? setEstimateItems : setInvoiceItems;
    setter(prev => prev.filter((_, idx) => idx !== i));
  }

  function copyItemsToOther() {
    if (activeItemsTab === "estimate") {
      setInvoiceItems([...estimateItems]);
    } else {
      setEstimateItems([...invoiceItems]);
    }
  }

  function togglePhotoId(imgId: string) {
    setSelectedPhotoIds(prev =>
      prev.includes(imgId)
        ? prev.filter(p => p !== imgId)
        : prev.length < 6 ? [...prev, imgId] : prev
    );
  }

  async function handleContractSave() {
    if (!id) return;
    setContractSaving(true);
    try {
      await fetch("/api/kaitai/sites/contract", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId:        id,
          clientName:    cClientName,
          clientZip:     cClientZip,
          clientAddress: cClientAddress,
          clientContact: cClientContact,
          paymentTerms:  cPaymentTerms,
          expiryDays:    Number(cExpiryDays) || 30,
          projectName:   cProjectName,
          projectAddress: cProjectAddr,
          estimateItems,
          invoiceItems,
          notes:         cNotes,
          landAddress:   cLandAddress,
          houseNo:       cHouseNo,
          structureKind: cStructureKind,
          floor1Area:    cFloor1Area,
          floor2Area:    cFloor2Area,
          floor3Area:    cFloor3Area,
          photoIds:      selectedPhotoIds,
        }),
      });
      setContractSaved(true);
      setTimeout(() => setContractSaved(false), 2500);
    } finally {
      setContractSaving(false);
    }
  }

  const canSave = name.trim().length > 0;

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: C.bg, color: C.muted }}>
        読み込み中...
      </div>
    );
  }

  if (loaded && !name.trim()) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: C.bg, color: C.muted }}>
        現場データが見つかりません
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, color: C.text }}>
      <div className="py-6 pb-28 md:pb-8 flex flex-col gap-6">

        {/* ── Page title ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: C.text }}>
              現場編集
            </h1>
            <p className="text-sm mt-0.5" style={{ color: C.sub }}>
              {name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {changeLog.length > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: "${T.primaryLt}", border: "1px solid #FED7AA" }}
              >
                <Clock size={12} style={{ color: T.primaryDk }} />
                <span className="text-sm font-semibold" style={{ color: T.primaryDk }}>
                  {changeLog.length}件の変更が記録されています
                </span>
              </div>
            )}
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
        <div style={{ background: C.card, borderRadius: "0.75rem", border: `1px solid ${C.border}`,
 }}>
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
                      <p style={{ fontSize: 14, color: C.muted }}>直接依頼の場合も元請け未設定のままで登録できます</p>
                    )}
                  </div>
                </div>

                <div>
                  <FieldLabel>住所</FieldLabel>
                  <InputField
                    value={address}
                    onChange={setAddress}
                    placeholder="例：東京都世田谷区"
                  />
                </div>

                <div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>工期</FieldLabel>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-sm mb-1" style={{ color: C.muted }}>着工日</p>
                        <InputField type="date" value={startDate} onChange={setStartDate} />
                      </div>
                      <span className="text-sm font-bold" style={{ color: "#CBD5E1", paddingTop: 18 }}>〜</span>
                      <div className="flex-1">
                        <p className="text-sm mb-1" style={{ color: C.muted }}>
                          完工予定日
                          {extendedEnd && (
                            <span className="ml-1 px-1.5 py-0.5 rounded text-sm font-bold" style={{ background: T.primaryLt, color: C.amberDk }}>
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
                          <p className="text-sm font-bold" style={{ color: C.amberDk }}>工期延長</p>
                          <button onClick={() => { setShowExtend(false); setExtendedEnd(""); setExtendReason(""); }}>
                            <X size={14} style={{ color: C.muted }} />
                          </button>
                        </div>
                        <div>
                          <p className="text-sm mb-1" style={{ color: C.muted }}>延長後完工予定日</p>
                          <InputField type="date" value={extendedEnd} onChange={setExtendedEnd} />
                        </div>
                        <div>
                          <p className="text-sm mb-1" style={{ color: C.muted }}>延長理由</p>
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
                          className="px-4 py-2 rounded-full text-sm font-bold transition-all"
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
                            <span className="text-sm" style={{ color: C.sub }}>消費税（10%）</span>
                            <span className="text-sm font-bold" style={{ color: "#16A34A" }}>＋¥{taxAmount.toLocaleString()}</span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                            <span className="text-sm" style={{ color: C.sub }}>税込金額</span>
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
                            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm" style={{ background: T.primaryLt }}>
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm mb-1" style={{ color: C.muted }}>{label}</p>
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
                          <p className="text-sm font-bold" style={{ color: C.sub }}>利益シミュレーション</p>
                          <span className="text-lg font-bold" style={{ color: profitColor }}>
                            {profit >= 0 ? "+" : ""}¥{profit.toLocaleString()}
                          </span>
                        </div>
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1" style={{ color: C.muted }}>
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
                          <div className="flex justify-between text-sm mt-1" style={{ color: "#CBD5E1" }}>
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
                                <span className="text-sm" style={{ color: C.muted }}>{label}</span>
                                <span className="text-sm font-semibold" style={{ color }}>
                                  {value > 0 ? "+" : ""}¥{Math.abs(value).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          <div className="flex items-center justify-between pt-1.5 mt-0.5" style={{ borderTop: `1px solid ${C.border}` }}>
                            <span className="text-sm font-bold" style={{ color: C.sub }}>利益</span>
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
                      style={{ background: C.card, border: `1px solid ${C.border}`,
 }}
                    >
                      {changeLog.map((entry, i) => (
                        <div
                          key={i}
                          className="px-4 py-3"
                          style={{ borderBottom: i < changeLog.length - 1 ? `1px solid ${C.border}` : "none" }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold" style={{ color: C.text }}>{entry.field}</span>
                            <span className="text-sm" style={{ color: C.muted }}>{entry.timestamp}</span>
                          </div>
                          <p className="text-sm" style={{ color: C.sub }}>{entry.before} → {entry.after}</p>
                          <p className="text-sm mt-0.5 font-medium" style={{ color: C.text }}>理由：{entry.reason}</p>
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
                                ? { background: T.primaryLt, color: C.amberDk, border: `2px solid #E5E7EB` }
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
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: C.muted }}>㎡</span>
                      </div>
                      {estWaste !== null && (
                        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                          <Info size={13} style={{ color: "#3B82F6" }} />
                          <p className="text-sm" style={{ color: "#3B82F6" }}>
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
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all"
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
                          <p className="text-sm" style={{ color: "#DC2626" }}>アスベスト含有材は特別管理産業廃棄物として別途処理が必要です</p>
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
                                ? { background: T.primaryLt, color: C.amberDk, border: `2px solid #E5E7EB` }
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
                                ? { background: `${color}12`, color, border: `2px solid ${color}` }
                                : { background: C.bg, color: "#CBD5E1", border: `1.5px solid ${C.border}` }
                            }
                          >
                            <span style={{ color: utils.has(util) ? color : "#CBD5E1" }}>{icon}</span>
                            {util}
                            <span className="text-sm px-1.5 py-0.5 rounded-full font-bold"
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
                      <span className="text-sm" style={{ color: C.muted }}>写真追加</span>
                    </button>
                    <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => { const names = Array.from(e.target.files ?? []).map((f) => f.name); setPhotos((prev) => [...prev, ...names]); }} />
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl transition-all" style={{ background: C.bg, border: `1.5px dashed ${C.border}` }}>
                    <Upload size={15} style={{ color: C.muted }} />
                    <span className="text-sm" style={{ color: C.sub }}>
                      {files.length > 0 ? `${files.length}件 のファイルが添付されています` : "見積書・図面（PDF）をアップロード"}
                    </span>
                  </button>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple className="hidden"
                    onChange={(e) => { const names = Array.from(e.target.files ?? []).map((f) => f.name); setFiles((prev) => [...prev, ...names]); }} />
                </div>
              </>
            )}

            {/* ════ TAB 3 ════ */}
            {tab === 3 && (
              <>
                {/* ── Section 1: 顧客・契約基本情報 ──────────── */}
                <SectionLabel>① 顧客・契約基本情報</SectionLabel>
                <Card>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>顧客名（宛先）</FieldLabel>
                      <InputField value={cClientName} onChange={setCClientName} placeholder="例：山田 太郎 様" />
                    </div>
                    <div>
                      <FieldLabel>顧客担当者</FieldLabel>
                      <InputField value={cClientContact} onChange={setCClientContact} placeholder="例：田中 花子" />
                    </div>
                    <div>
                      <FieldLabel>顧客郵便番号</FieldLabel>
                      <InputField value={cClientZip} onChange={setCClientZip} placeholder="例：700-0000" />
                    </div>
                    <div>
                      <FieldLabel>顧客住所</FieldLabel>
                      <InputField value={cClientAddress} onChange={setCClientAddress} placeholder="例：岡山県岡山市..." />
                    </div>
                    <div>
                      <FieldLabel>工事件名（帳票用）</FieldLabel>
                      <InputField value={cProjectName} onChange={setCProjectName} placeholder={name || "例：山田邸解体工事"} />
                    </div>
                    <div>
                      <FieldLabel>工事場所（帳票用）</FieldLabel>
                      <InputField value={cProjectAddr} onChange={setCProjectAddr} placeholder={address || "例：岡山市北区..."} />
                    </div>
                    <div>
                      <FieldLabel>支払条件</FieldLabel>
                      <InputField value={cPaymentTerms} onChange={setCPaymentTerms} placeholder="例：工事完了後30日以内" />
                    </div>
                    <div>
                      <FieldLabel>見積有効期限（日数）</FieldLabel>
                      <InputField
                        type="number"
                        value={cExpiryDays}
                        onChange={setCExpiryDays}
                        placeholder="30"
                      />
                    </div>
                  </div>
                </Card>

                {/* ── Section 2: 見積・請求明細エディタ ────────── */}
                <SectionLabel>② 見積・請求明細エディタ</SectionLabel>
                <Card>
                  {/* Switcher */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {(["estimate", "invoice"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setActiveItemsTab(t)}
                          className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                          style={activeItemsTab === t
                            ? { background: C.amber, color: "#fff" }
                            : { background: C.bg, color: C.muted, border: `1px solid ${C.border}` }}
                        >
                          {t === "estimate" ? "📋 見積明細" : "💴 請求明細"}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={copyItemsToOther}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
                      style={{ background: C.bg, color: C.sub, border: `1px solid ${C.border}` }}
                      title={activeItemsTab === "estimate" ? "見積明細→請求明細にコピー" : "請求明細→見積明細にコピー"}
                    >
                      <Copy size={12} />
                      {activeItemsTab === "estimate" ? "請求にコピー" : "見積にコピー"}
                    </button>
                  </div>

                  {/* Line items table */}
                  {(() => {
                    const items = activeItemsTab === "estimate" ? estimateItems : invoiceItems;
                    const inputSt = { background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "5px 8px", fontSize: 13, outline: "none", width: "100%" };
                    const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
                    return (
                      <>
                        {items.length > 0 && (
                          <div
                            className="grid text-sm font-bold mb-1 px-1"
                            style={{ gridTemplateColumns: "1fr 0.8fr 60px 60px 90px 36px", color: C.muted, gap: 6 }}
                          >
                            <span>工事項目</span>
                            <span>仕様・内訳</span>
                            <span className="text-right">数量</span>
                            <span>単位</span>
                            <span className="text-right">単価</span>
                            <span />
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          {items.map((it, i) => (
                            <div key={i} className="grid items-center gap-1.5" style={{ gridTemplateColumns: "1fr 0.8fr 60px 60px 90px 36px" }}>
                              <input style={inputSt} value={it.name} onChange={e => updateLineItem(activeItemsTab, i, "name", e.target.value)} placeholder="例：仮設・養生工事" />
                              <input style={inputSt} value={it.spec} onChange={e => updateLineItem(activeItemsTab, i, "spec", e.target.value)} placeholder="仕様" />
                              <input style={{ ...inputSt, textAlign: "right" }} type="number" value={it.qty} onChange={e => updateLineItem(activeItemsTab, i, "qty", Number(e.target.value))} />
                              <input style={inputSt} value={it.unit} onChange={e => updateLineItem(activeItemsTab, i, "unit", e.target.value)} placeholder="式" />
                              <input style={{ ...inputSt, textAlign: "right" }} type="number" value={it.unitPrice} onChange={e => updateLineItem(activeItemsTab, i, "unitPrice", Number(e.target.value))} placeholder="0" />
                              <button onClick={() => removeLineItem(activeItemsTab, i)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 mx-auto" style={{ color: C.muted }}>
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            const setter = activeItemsTab === "estimate" ? setEstimateItems : setInvoiceItems;
                            setter(prev => [...prev, blankLineItem()]);
                          }}
                          className="mt-3 flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl"
                          style={{ background: T.primaryLt, color: C.amberDk, border: `1px solid #E5E7EB` }}
                        >
                          <Plus size={12} /> 行を追加
                        </button>
                        {items.length > 0 && (
                          <div className="mt-3 pt-3 flex items-center justify-end gap-4" style={{ borderTop: `1px solid ${C.border}` }}>
                            <span className="text-sm" style={{ color: C.muted }}>小計</span>
                            <span className="text-sm font-bold" style={{ color: C.text }}>¥{subtotal.toLocaleString()}</span>
                            <span className="text-sm" style={{ color: C.muted }}>税込</span>
                            <span className="font-bold" style={{ color: C.amberDk }}>¥{(Math.floor(subtotal * 1.1)).toLocaleString()}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div className="mt-4">
                    <FieldLabel>備考・特記事項</FieldLabel>
                    <textarea
                      value={cNotes}
                      onChange={e => setCNotes(e.target.value)}
                      placeholder="例：解体後の更地渡し。敷地境界の確認を含む。"
                      rows={3}
                      className="w-full px-3.5 py-3 rounded-xl text-sm outline-none resize-none"
                      style={{ background: C.bg, border: `1.5px solid ${C.border}`, color: C.text, fontFamily: "inherit" }}
                    />
                  </div>
                </Card>

                {/* ── Section 3: 建物滅失登記用データ ──────────── */}
                <SectionLabel>③ 建物滅失登記用データ</SectionLabel>
                <Card>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <FieldLabel>所在地（登記簿上の住所）</FieldLabel>
                      <InputField value={cLandAddress} onChange={setCLandAddress} placeholder="例：岡山市北区〇〇町123番地" />
                    </div>
                    <div>
                      <FieldLabel>家屋番号</FieldLabel>
                      <InputField value={cHouseNo} onChange={setCHouseNo} placeholder="例：123番1" />
                    </div>
                    <div>
                      <FieldLabel>種類</FieldLabel>
                      <InputField value={cStructureKind} onChange={setCStructureKind} placeholder="例：居宅、店舗、倉庫" />
                    </div>
                    <div>
                      <FieldLabel>1階床面積（㎡）</FieldLabel>
                      <InputField type="number" value={cFloor1Area} onChange={setCFloor1Area} placeholder="例：65.50" />
                    </div>
                    <div>
                      <FieldLabel>2階床面積（㎡）</FieldLabel>
                      <InputField type="number" value={cFloor2Area} onChange={setCFloor2Area} placeholder="例：45.20（なければ空欄）" />
                    </div>
                    <div>
                      <FieldLabel>3階床面積（㎡）</FieldLabel>
                      <InputField type="number" value={cFloor3Area} onChange={setCFloor3Area} placeholder="例：30.10（なければ空欄）" />
                    </div>
                    {(cFloor1Area || cFloor2Area || cFloor3Area) && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                        <span className="text-sm font-bold" style={{ color: "#16A34A" }}>
                          延床面積合計：{(
                            (parseFloat(cFloor1Area) || 0) +
                            (parseFloat(cFloor2Area) || 0) +
                            (parseFloat(cFloor3Area) || 0)
                          ).toFixed(2)} ㎡
                        </span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* ── Section 4: 工事完了報告写真 ───────────────── */}
                <SectionLabel>④ 工事完了報告用写真（最大6枚）</SectionLabel>
                <Card>
                  {siteImages.length === 0 ? (
                    <div className="py-6 text-center" style={{ color: C.muted }}>
                      <Camera size={24} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                      <p className="text-sm">現場写真がまだアップロードされていません</p>
                      <p className="text-sm mt-1">現場編集の「現場環境・リスク」タブから写真を追加できます</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm mb-3" style={{ color: C.muted }}>
                        報告書に掲載する写真を選択してください（最大6枚）
                        <span className="ml-2 font-bold" style={{ color: C.amberDk }}>
                          {selectedPhotoIds.length}/6 選択中
                        </span>
                      </p>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                        {siteImages.map(img => {
                          const selected = selectedPhotoIds.includes(img.id);
                          return (
                            <button
                              key={img.id}
                              onClick={() => togglePhotoId(img.id)}
                              className="relative aspect-square rounded-xl overflow-hidden transition-all"
                              style={{
                                border: selected ? `3px solid ${C.amber}` : `2px solid ${C.border}`,
                                opacity: !selected && selectedPhotoIds.length >= 6 ? 0.4 : 1,
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              {selected && (
                                <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: C.amber }}>
                                  <Check size={13} color="#fff" />
                                </div>
                              )}
                              {img.reportType && (
                                <div className="absolute bottom-0 left-0 right-0 py-0.5 text-center" style={{ background: "rgba(0,0,0,0.5)", fontSize: 9, color: "#fff" }}>
                                  {img.reportType}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </Card>

                {/* ── PDF Preview / Download buttons ─────────────── */}
                <SectionLabel>📄 帳票プレビュー・PDF出力</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: "estimate",   label: "見積書",         emoji: "📋", missing: !cClientName ? "顧客名が未入力です" : null },
                    { type: "invoice",    label: "請求書",         emoji: "💴", missing: !cClientName ? "顧客名が未入力です" : null },
                    { type: "demolition", label: "建物滅失証明書", emoji: "🏚", missing: !cLandAddress ? "所在地（登記）が未入力です" : null },
                    { type: "completion", label: "工事完了報告書", emoji: "✅", missing: null },
                  ].map(({ type, label, emoji, missing }) => (
                    <div key={type} className="relative group">
                      <button
                        onClick={() => !missing && window.open(`/kaitai/docs/preview?type=${type}&site=${id}`, "_blank")}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all"
                        style={missing
                          ? { background: C.bg, color: C.muted, border: `1.5px solid ${C.border}`, cursor: "not-allowed" }
                          : { background: T.primaryLt, color: C.amberDk, border: `1.5px solid #E5E7EB`, cursor: "pointer" }
                        }
                      >
                        <span style={{ fontSize: 18 }}>{emoji}</span>
                        <span className="flex-1 text-left">{label}</span>
                        {missing
                          ? <AlertCircle size={15} style={{ color: "#F59E0B", flexShrink: 0 }} />
                          : <ExternalLink size={14} style={{ flexShrink: 0 }} />
                        }
                      </button>
                      {missing && (
                        <div className="absolute bottom-full left-0 mb-1.5 px-3 py-2 rounded-lg text-sm font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          style={{ background: T.text, color: T.bg, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                          ⚠️ {missing}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Floating save */}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleContractSave}
                    disabled={contractSaving}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                    style={contractSaved
                      ? { background: "#16A34A", color: "#fff" }
                      : { background: contractSaving ? C.bg : C.amber, color: contractSaving ? C.muted : "#fff" }
                    }
                  >
                    {contractSaved ? <Check size={16} /> : <Save size={16} />}
                    {contractSaved ? "保存しました" : contractSaving ? "保存中..." : "帳票データを保存する"}
                  </button>
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              style={{ background: T.surface, border: "1.5px solid #E2E8F0", color: T.text,
 minHeight: 48 }}
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
            style={{ background: C.card,
 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: T.primaryLt }}>
                <Edit3 size={18} style={{ color: C.amber }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: C.text }}>変更理由を記録</p>
                <p className="text-sm" style={{ color: C.muted }}>{pendingChange.field}を変更しました</p>
              </div>
            </div>

            <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <div className="flex-1 text-center">
                <p className="text-sm mb-0.5" style={{ color: C.muted }}>変更前</p>
                <p className="text-sm font-bold line-through" style={{ color: C.red }}>{pendingChange.before}</p>
              </div>
              <ChevronRight size={16} style={{ color: "#CBD5E1" }} />
              <div className="flex-1 text-center">
                <p className="text-sm mb-0.5" style={{ color: C.muted }}>変更後</p>
                <p className="text-sm font-bold" style={{ color: C.green }}>{pendingChange.after}</p>
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
