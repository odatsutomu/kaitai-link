"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Plus, X, Save, Truck, MapPin, Check } from "lucide-react";
import { T } from "../../lib/design-tokens";
import type { LatLng } from "../../lib/geocode";

const MapPicker = dynamic(
  () => import("../../components/map-picker").then(m => m.MapPicker),
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

const UNIT_OPTIONS = ["t", "㎥", "kg", "枚", "台", "式"];

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

// ─── Detail Page ──────────────────────────────────────────────────────────────

export default function ProcessorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/kaitai/admin");
  const listPath = isAdmin ? "/kaitai/admin/processors" : "/kaitai/processors";
  const processorId = params.id as string;

  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState("");

  // Form state
  const [name,       setName]       = useState("");
  const [address,    setAddress]    = useState("");
  const [mapPos,     setMapPos]     = useState<LatLng | null>(null);
  const [notes,      setNotes]      = useState("");
  const [prices,     setPrices]     = useState<ProcessorPrice[]>([]);

  // Waste categories
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat,  setAddingCat]  = useState(false);

  // Load processor + categories
  useEffect(() => {
    Promise.all([
      fetch(`/api/kaitai/processors?id=${processorId}`, { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/waste-categories", { credentials: "include" }).then(r => r.ok ? r.json() : null),
    ]).then(([procData, catData]) => {
      if (procData?.processor) {
        const p = procData.processor as Processor;
        setName(p.name ?? "");
        setAddress(p.address ?? "");
        setMapPos(p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null);
        setNotes(p.notes ?? "");
        setPrices(
          p.prices?.map(pr => ({
            id:        pr.id,
            wasteType: pr.wasteType,
            unit:      pr.unit ?? "t",
            unitPrice: pr.unitPrice ?? 0,
            direction: (pr.direction as "cost" | "buyback") ?? "cost",
          })) ?? []
        );
      }
      if (catData?.categories) setCategories(catData.categories);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [processorId]);

  const selectedTypes = new Set(prices.map(p => p.wasteType));

  function toggleCategory(catName: string) {
    if (selectedTypes.has(catName)) {
      setPrices(prev => prev.filter(p => p.wasteType !== catName));
    } else {
      setPrices(prev => [...prev, { wasteType: catName, unit: "t", unitPrice: 0, direction: "cost" }]);
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

  const handleSave = useCallback(async () => {
    if (!name.trim()) { setError("処理場名は必須です"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/kaitai/processors", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: processorId,
          name:    name.trim(),
          address: address.trim(),
          lat:     mapPos?.lat ?? null,
          lng:     mapPos?.lng ?? null,
          notes:   notes.trim(),
          prices:  prices.filter(p => p.wasteType.trim()),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data?.error ?? "保存に失敗しました");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [processorId, name, address, mapPos, notes, prices]);

  const previewPrices = prices.filter(p => p.unitPrice > 0);

  const inputStyle = { border: `1.5px solid ${C.border}`, background: T.bg, color: C.text };
  const labelCls   = "block text-xs font-bold mb-2 uppercase tracking-wide";

  if (loading) {
    return (
      <div className="py-6 flex flex-col gap-4">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: C.border }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ background: C.border }} />
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(listPath)}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:opacity-80"
            style={{ background: T.bg, border: `1.5px solid ${C.border}`, color: C.sub }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: C.text }}>{name || "処理場詳細"}</h1>
            <p className="text-sm" style={{ color: C.sub }}>処理場の詳細情報を編集</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: saved ? C.green : C.amber, minWidth: 120 }}
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? "保存中..." : saved ? "保存しました" : "保存する"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: C.redLt, color: C.red }}>
          {error}
        </div>
      )}

      {/* ── 基本情報 ── */}
      <section className="rounded-xl p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h2 className="text-base font-bold mb-5 flex items-center gap-2" style={{ color: C.text }}>
          <Truck size={16} style={{ color: C.amber }} />
          基本情報
        </h2>

        <div className="flex flex-col gap-5">
          {/* 処理場名 */}
          <div>
            <label className={labelCls} style={{ color: C.muted }}>
              処理場名 <span style={{ color: C.red }}>*</span>
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
              placeholder="例：○○産業廃棄物処理場"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* 住所 */}
          <div>
            <label className={labelCls} style={{ color: C.muted }}>住所</label>
            <input
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
              placeholder="例：岡山県岡山市南区〇〇1-2-3"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          {/* 地図 */}
          <div>
            <label className={labelCls} style={{ color: C.muted }}>地図上の位置</label>
            <MapPicker address={address} value={mapPos} onChange={setMapPos} />
          </div>
        </div>
      </section>

      {/* ── 対応品目・単価 ── */}
      <section className="rounded-xl p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h2 className="text-base font-bold mb-2 flex items-center gap-2" style={{ color: C.text }}>
          <MapPin size={16} style={{ color: C.amber }} />
          対応品目・処理単価
        </h2>
        <p className="text-xs mb-5" style={{ color: C.muted }}>品目をタップして処理場が対応している廃材を選択し、単価を設定してください</p>

        {/* 品目チップ */}
        <div className="flex flex-wrap gap-2 mb-4">
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
        <div className="flex items-center gap-2 mb-5">
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

        {/* 単価テーブル */}
        {prices.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            {/* Header */}
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
                <div className="flex rounded-lg overflow-hidden" style={{ border: `1.5px solid ${C.border}` }}>
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

                {/* 削除 */}
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
        )}

        {/* 単価プレビュー */}
        {previewPrices.length > 0 && (
          <div className="mt-4 rounded-xl p-4" style={{ background: T.bg, border: `1px solid ${C.border}` }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.muted }}>
              単価プレビュー
            </p>
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
          </div>
        )}

        {prices.length === 0 && (
          <div className="rounded-xl py-10 flex flex-col items-center justify-center gap-2" style={{ background: T.bg, border: `1.5px dashed ${C.border}` }}>
            <p className="text-sm" style={{ color: C.muted }}>上の品目をタップして対応廃材を選択してください</p>
          </div>
        )}
      </section>

      {/* ── メモ ── */}
      <section className="rounded-xl p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h2 className="text-base font-bold mb-4" style={{ color: C.text }}>メモ</h2>
        <textarea
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ ...inputStyle, minHeight: 100, resize: "vertical", fontFamily: "inherit" }}
          placeholder="特記事項・受入条件・営業時間など"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </section>

      {/* ── 下部の保存ボタン ── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: saved ? C.green : C.amber, minWidth: 160 }}
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? "保存中..." : saved ? "保存しました" : "保存する"}
        </button>
      </div>
    </div>
  );
}
