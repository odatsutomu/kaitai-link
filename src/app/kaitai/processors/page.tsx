"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, Edit3, Trash2, X, MapPin, Truck, Database } from "lucide-react";
import { T } from "../lib/design-tokens";
import type { LatLng } from "../lib/geocode";

const MapPicker = dynamic(
  () => import("../components/map-picker").then(m => m.MapPicker),
  { ssr: false, loading: () => <div style={{ height: 280, background: T.bg, borderRadius: 12, border: `1.5px solid ${T.border}` }} /> }
);

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text:    T.text,
  sub:     T.sub,
  muted:   T.muted,
  border:  T.border,
  card:    T.surface,
  amber:   T.primary,
  amberDk: T.primaryDk,
  red:     "#EF4444",
  redLt:   "#FEF2F2",
  green:   "#10B981",
  greenLt: "#ECFDF5",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface WasteCategory {
  id:        string;
  name:      string;
  isDefault: boolean;
  sortOrder: number;
}

interface ProcessorPrice {
  id?:       string;
  wasteType: string;
  unit:      string;
  unitPrice: number;
  direction: "cost" | "buyback";
}

interface Processor {
  id:        string;
  name:      string;
  address:   string;
  lat:       number | null;
  lng:       number | null;
  notes:     string;
  createdAt: string;
  prices:    ProcessorPrice[];
}

const UNIT_OPTIONS = ["t", "㎥", "kg", "枚", "台", "式"];

// ─── Processor Modal ──────────────────────────────────────────────────────────

function ProcessorModal({
  initial, onSave, onClose,
}: {
  initial?: Processor | null;
  onSave:   (data: { name: string; address: string; lat: number | null; lng: number | null; notes: string; prices: ProcessorPrice[] }) => void;
  onClose:  () => void;
}) {
  const [name,       setName]       = useState(initial?.name    ?? "");
  const [address,    setAddress]    = useState(initial?.address ?? "");
  const [mapPos,     setMapPos]     = useState<LatLng | null>(
    initial?.lat != null && initial?.lng != null ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [notes,      setNotes]      = useState(initial?.notes   ?? "");
  const [prices,     setPrices]     = useState<ProcessorPrice[]>(
    initial?.prices?.map(p => ({
      id:        p.id,
      wasteType: p.wasteType,
      unit:      p.unit ?? "t",
      unitPrice: p.unitPrice ?? 0,
      direction: (p.direction as "cost" | "buyback") ?? "cost",
    })) ?? []
  );
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat,  setAddingCat]  = useState(false);

  useEffect(() => {
    fetch("/api/kaitai/waste-categories", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.categories) setCategories(data.categories); })
      .catch(() => {});
  }, []);

  const selectedTypes = new Set(prices.map(p => p.wasteType));

  function toggleCategory(name: string) {
    if (selectedTypes.has(name)) {
      setPrices(prev => prev.filter(p => p.wasteType !== name));
    } else {
      setPrices(prev => [...prev, { wasteType: name, unit: "t", unitPrice: 0, direction: "cost" }]);
    }
  }

  function setRow<K extends keyof ProcessorPrice>(wasteType: string, k: K, v: ProcessorPrice[K]) {
    setPrices(prev => prev.map(p => p.wasteType === wasteType ? { ...p, [k]: v } : p));
  }

  async function addCustomCategory() {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const res = await fetch("/api/kaitai/waste-categories", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();
      if (data?.category) {
        setCategories(prev => [...prev, data.category]);
        setPrices(prev => [...prev, { wasteType: data.category.name, unit: "t", unitPrice: 0, direction: "cost" }]);
        setNewCatName("");
      }
    } finally {
      setAddingCat(false);
    }
  }

  function submit() {
    if (!name.trim()) { setErrors({ name: "処理場名は必須です" }); return; }
    onSave({
      name:    name.trim(),
      address: address.trim(),
      lat:     mapPos?.lat ?? null,
      lng:     mapPos?.lng ?? null,
      notes:   notes.trim(),
      prices:  prices.filter(p => p.wasteType.trim()),
    });
  }

  const inputCls   = "w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all";
  const inputStyle = { border: `1.5px solid ${C.border}`, background: T.bg, color: C.text };
  const labelCls   = "block text-xs font-bold mb-2 uppercase tracking-wide";

  const previewPrices = prices.filter(p => p.unitPrice > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl flex flex-col"
        style={{ maxWidth: 720, background: C.card, maxHeight: "92dvh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 className="text-lg font-bold" style={{ color: C.text }}>
            {initial ? "処理場を編集" : "処理場を追加"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100"
            style={{ color: C.muted }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">

          {/* 処理場名 */}
          <div>
            <label className={labelCls} style={{ color: C.muted }}>
              処理場名 <span style={{ color: C.red }}>*</span>
            </label>
            <input
              className={inputCls}
              style={{ ...inputStyle, borderColor: errors.name ? C.red : C.border }}
              placeholder="例：○○産業廃棄物処理場"
              value={name}
              onChange={e => { setName(e.target.value); setErrors({}); }}
            />
            {errors.name && <p className="text-sm mt-1" style={{ color: C.red }}>{errors.name}</p>}
          </div>

          {/* 住所 */}
          <div>
            <label className={labelCls} style={{ color: C.muted }}>住所</label>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="例：岡山県岡山市南区〇〇1-2-3"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          {/* 地図ピン */}
          <div>
            <label className={labelCls} style={{ color: C.muted }}>地図上の位置</label>
            <MapPicker address={address} value={mapPos} onChange={setMapPos} />
          </div>

          {/* 廃材品目の選択 */}
          <div>
            <label className={labelCls} style={{ color: C.muted }}>対応している廃材品目</label>
            <p className="text-xs mb-3" style={{ color: C.muted }}>品目をタップして処理場が対応している廃材を選択</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const selected = selectedTypes.has(cat.name);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className="px-3 py-1.5 rounded-full text-sm transition-all"
                    style={{
                      background: selected ? C.amber : T.bg,
                      color:      selected ? "#fff"  : C.sub,
                      border:     `1.5px solid ${selected ? C.amber : C.border}`,
                      fontWeight: selected ? 700 : 500,
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* + 新しい品目を追加 */}
            <div className="flex items-center gap-2 mt-3">
              <input
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: `1.5px solid ${C.border}`, background: T.bg, color: C.text }}
                placeholder="新しい品目名（例：建設混合廃棄物）"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomCategory(); } }}
              />
              <button
                type="button"
                onClick={addCustomCategory}
                disabled={addingCat || !newCatName.trim()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
                style={{
                  background: T.primaryLt,
                  color:      C.amberDk,
                  border:     `1px solid ${T.primaryMd}`,
                  opacity:    (!newCatName.trim() || addingCat) ? 0.4 : 1,
                }}
              >
                <Plus size={12} /> 品目を追加
              </button>
            </div>
          </div>

          {/* 廃材ごとの処理単価 */}
          {prices.length > 0 && (
            <div>
              <label className={labelCls} style={{ color: C.muted }}>廃材ごとの処理単価</label>

              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                {/* Table header */}
                <div
                  className="grid px-4 py-2.5 text-xs font-bold uppercase tracking-wide"
                  style={{
                    gridTemplateColumns: "1fr 130px 90px 140px 36px",
                    background: T.bg,
                    color: C.muted,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <span>廃材の種類</span>
                  <span>収支</span>
                  <span>単位</span>
                  <span className="text-right">単価（円）</span>
                  <span />
                </div>

                {prices.map((p, i) => (
                  <div
                    key={p.wasteType}
                    className="grid items-center gap-2 px-4 py-2.5"
                    style={{
                      gridTemplateColumns: "1fr 130px 90px 140px 36px",
                      borderBottom: i < prices.length - 1 ? `1px solid ${C.border}` : undefined,
                    }}
                  >
                    {/* 廃材名 */}
                    <span className="text-sm font-medium truncate pr-1" style={{ color: C.text }}>
                      {p.wasteType}
                    </span>

                    {/* 収支トグル */}
                    <div
                      className="flex rounded-lg overflow-hidden"
                      style={{ border: `1.5px solid ${C.border}` }}
                    >
                      <button
                        type="button"
                        onClick={() => setRow(p.wasteType, "direction", "cost")}
                        className="flex-1 py-1.5 text-xs font-bold transition-all"
                        style={{
                          background: p.direction === "cost" ? C.redLt   : "transparent",
                          color:      p.direction === "cost" ? C.red     : C.muted,
                        }}
                      >
                        ー費用
                      </button>
                      <button
                        type="button"
                        onClick={() => setRow(p.wasteType, "direction", "buyback")}
                        className="flex-1 py-1.5 text-xs font-bold transition-all"
                        style={{
                          background: p.direction === "buyback" ? C.greenLt : "transparent",
                          color:      p.direction === "buyback" ? C.green   : C.muted,
                        }}
                      >
                        ＋買取
                      </button>
                    </div>

                    {/* 単位 */}
                    <select
                      className="w-full px-2 py-1.5 rounded-lg text-sm outline-none"
                      style={{ border: `1.5px solid ${C.border}`, background: T.bg, color: C.text }}
                      value={p.unit}
                      onChange={e => setRow(p.wasteType, "unit", e.target.value)}
                    >
                      {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>

                    {/* 単価 */}
                    <div className="relative">
                      <span
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                        style={{ color: C.muted }}
                      >¥</span>
                      <input
                        type="number"
                        min={0}
                        className="w-full pl-6 pr-2 py-1.5 rounded-lg text-sm outline-none text-right"
                        style={{ border: `1.5px solid ${C.border}`, background: T.bg, color: C.text }}
                        placeholder="0"
                        value={p.unitPrice || ""}
                        onChange={e => setRow(p.wasteType, "unitPrice", Math.abs(Number(e.target.value)))}
                      />
                    </div>

                    {/* 削除（選択解除） */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(p.wasteType)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50"
                      style={{ color: C.muted }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Real-time summary */}
              <div
                className="mt-3 rounded-xl p-4"
                style={{ background: T.bg, border: `1px solid ${C.border}` }}
              >
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.muted }}>
                  単価プレビュー
                </p>
                {previewPrices.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {previewPrices.map(p => (
                      <div key={p.wasteType} className="flex items-center justify-between text-sm gap-2">
                        <span className="truncate" style={{ color: C.sub }}>{p.wasteType}</span>
                        <span
                          className="font-bold font-numeric whitespace-nowrap"
                          style={{ color: p.direction === "buyback" ? C.green : C.red }}
                        >
                          {p.direction === "buyback" ? "＋" : "ー"} ¥{p.unitPrice.toLocaleString()} / {p.unit}
                          <span className="text-xs font-normal ml-1.5" style={{ color: C.muted }}>
                            ({p.direction === "buyback" ? "買取" : "費用"})
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: C.muted }}>単価を入力するとここにプレビューが表示されます</p>
                )}
              </div>
            </div>
          )}

          {/* メモ */}
          <div>
            <label className={labelCls} style={{ color: C.muted }}>メモ</label>
            <textarea
              className={inputCls}
              style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
              placeholder="特記事項・受入条件・営業時間など"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 px-6 py-5" style={{ borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
            style={{ border: `1.5px solid ${C.border}`, color: C.sub }}
          >
            キャンセル
          </button>
          <button
            onClick={submit}
            className="px-8 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
            style={{ background: C.amber, minWidth: 160 }}
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl p-6"
        style={{ maxWidth: 400, background: C.card }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-2" style={{ color: C.text }}>処理場を削除しますか？</h2>
        <p className="text-sm mb-6" style={{ color: C.sub }}>
          「{name}」を削除します。この操作は取り消せません。
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50"
            style={{ border: `1.5px solid ${C.border}`, color: C.sub }}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90"
            style={{ background: C.red }}
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProcessorsPage() {
  const [processors,   setProcessors]   = useState<Processor[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modalTarget,  setModalTarget]  = useState<Processor | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Processor | null>(null);
  const [seeding,      setSeeding]      = useState(false);

  useEffect(() => {
    fetch("/api/kaitai/processors", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.processors) setProcessors(data.processors); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSave(data: {
    name: string; address: string; lat: number | null; lng: number | null; notes: string; prices: ProcessorPrice[];
  }) {
    const target = modalTarget;
    if (target === "new") {
      fetch("/api/kaitai/processors", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(r => r.ok ? r.json() : null)
        .then(res => { if (res?.processor) setProcessors(prev => [res.processor, ...prev]); })
        .catch(() => {});
    } else if (target && typeof target === "object") {
      fetch("/api/kaitai/processors", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: target.id, ...data }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(res => {
          if (res?.processor) {
            setProcessors(prev => prev.map(p => p.id === target.id ? res.processor : p));
          }
        })
        .catch(() => {});
    }
    setModalTarget(null);
  }

  async function handleSeedProcessors() {
    if (!confirm("テスト用処理場データ（4件）を投入します。既存の処理場データはすべて削除されます。よろしいですか？")) return;
    setSeeding(true);
    try {
      const res  = await fetch("/api/kaitai/seed-processors", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data?.ok) {
        const updated = await fetch("/api/kaitai/processors", { credentials: "include" }).then(r => r.json());
        if (updated?.processors) setProcessors(updated.processors);
        alert(data.message);
      } else {
        alert("シードに失敗しました: " + (data?.error ?? "不明なエラー"));
      }
    } finally {
      setSeeding(false);
    }
  }

  function handleDelete(id: string) {
    fetch(`/api/kaitai/processors?id=${id}`, { method: "DELETE", credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(res => { if (res?.ok) setProcessors(prev => prev.filter(p => p.id !== id)); })
      .catch(() => {});
    setDeleteTarget(null);
  }

  // KPI helpers
  const allPrices     = processors.flatMap(p => p.prices);
  const costPrices    = allPrices.filter(p => p.direction !== "buyback");
  const buybackPrices = allPrices.filter(p => p.direction === "buyback");

  return (
    <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>処理場管理</h1>
          <p className="text-sm mt-1" style={{ color: C.sub }}>産廃処理場の登録・廃材処理単価の管理</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSeedProcessors}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm hover:opacity-80 transition-opacity"
            style={{ background: T.bg, color: C.sub, border: `1.5px solid ${C.border}` }}
            title="テスト用処理場データ4件を一括登録（既存データは削除されます）"
          >
            <Database size={15} />
            {seeding ? "登録中..." : "テストデータ投入"}
          </button>
          <button
            onClick={() => setModalTarget("new")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-white hover:opacity-90 transition-opacity"
            style={{ background: C.amber }}
          >
            <Plus size={16} />
            処理場を追加
          </button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "登録処理場数",   value: processors.length,   note: "総登録数" },
          { label: "廃材品目数",     value: allPrices.length,    note: "単価設定済み" },
          { label: "費用品目",       value: costPrices.length,   note: "処理費用（支出）" },
          { label: "買取品目",       value: buybackPrices.length, note: "買取（収入）" },
        ].map(({ label, value, note }) => (
          <div key={label} className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <p className="text-sm mb-1" style={{ color: C.sub }}>{label}</p>
            <p className="text-2xl font-bold font-numeric" style={{ color: C.text }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: C.muted }}>{note}</p>
          </div>
        ))}
      </div>

      {/* ── Processor list ── */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-xl h-28 animate-pulse" style={{ background: C.border }} />
          ))}
        </div>
      ) : processors.length === 0 ? (
        <div
          className="rounded-xl py-20 flex flex-col items-center justify-center gap-3"
          style={{ background: C.card, border: `1.5px dashed ${C.border}` }}
        >
          <Truck size={32} style={{ color: C.border }} />
          <p className="text-sm font-medium" style={{ color: C.muted }}>処理場がまだ登録されていません</p>
          <button
            onClick={() => setModalTarget("new")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-white mt-1 hover:opacity-90"
            style={{ background: C.amber }}
          >
            <Plus size={14} /> 処理場を追加
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {processors.map(proc => (
            <div
              key={proc.id}
              className="rounded-xl overflow-hidden"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              {/* Header row */}
              <div
                className="flex items-start justify-between gap-4 px-5 py-4"
                style={{ borderBottom: proc.prices.length ? `1px solid ${C.border}` : undefined }}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: T.primaryLt }}
                  >
                    <Truck size={18} style={{ color: C.amber }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate" style={{ color: C.text }}>{proc.name}</p>
                    {proc.address && (
                      <p className="text-sm mt-0.5 flex items-center gap-1 flex-wrap" style={{ color: C.sub }}>
                        <MapPin size={11} />
                        {proc.address}
                        {proc.lat != null && proc.lng != null && (
                          <span className="text-xs font-mono" style={{ color: C.muted }}>
                            ({proc.lat.toFixed(4)}, {proc.lng.toFixed(4)})
                          </span>
                        )}
                      </p>
                    )}
                    {proc.notes && (
                      <p className="text-sm mt-0.5" style={{ color: C.muted }}>{proc.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setModalTarget(proc)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:bg-gray-50"
                    style={{ background: T.surface, border: "1.5px solid #E5E7EB", color: C.text }}
                  >
                    <Edit3 size={12} />
                    編集
                  </button>
                  <button
                    onClick={() => setDeleteTarget(proc)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50"
                    style={{ border: "1.5px solid #E5E7EB", color: C.muted }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Price table */}
              {proc.prices.length > 0 && (
                <div>
                  <div
                    className="grid px-5 py-2.5 text-xs font-bold uppercase tracking-wide"
                    style={{
                      gridTemplateColumns: "2fr 70px 80px 1fr",
                      background: T.bg,
                      color: C.muted,
                    }}
                  >
                    <span>廃材の種類</span>
                    <span>収支</span>
                    <span>単位</span>
                    <span className="text-right">処理単価</span>
                  </div>
                  {proc.prices.map((p, i) => {
                    const isBuyback = (p.direction as string) === "buyback";
                    return (
                      <div
                        key={p.id ?? i}
                        className="grid items-center px-5 py-3"
                        style={{
                          gridTemplateColumns: "2fr 70px 80px 1fr",
                          borderTop: `1px solid #F1F5F9`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Truck size={11} style={{ color: C.muted }} />
                          <span className="text-sm font-medium" style={{ color: C.text }}>{p.wasteType}</span>
                        </div>
                        <span
                          className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full w-fit"
                          style={{
                            background: isBuyback ? C.greenLt : C.redLt,
                            color:      isBuyback ? C.green   : C.red,
                          }}
                        >
                          {isBuyback ? "＋買取" : "ー費用"}
                        </span>
                        <span className="text-sm" style={{ color: C.sub }}>{p.unit}</span>
                        <span
                          className="text-sm font-bold text-right font-numeric"
                          style={{ color: isBuyback ? C.green : C.amberDk }}
                        >
                          {isBuyback ? "+" : ""}¥{p.unitPrice.toLocaleString()}
                          <span className="text-xs font-normal ml-0.5" style={{ color: C.muted }}>/{p.unit}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {proc.prices.length === 0 && (
                <div className="px-5 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
                  <p className="text-sm" style={{ color: C.muted }}>廃材単価が未設定です</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modalTarget !== null && (
        <ProcessorModal
          initial={modalTarget === "new" ? null : modalTarget}
          onSave={handleSave}
          onClose={() => setModalTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
