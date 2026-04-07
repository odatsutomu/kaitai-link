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
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
  red: "#EF4444",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcessorPrice {
  id?:        string;
  wasteType:  string;
  unit:       string;
  unitPrice:  number;
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

// ─── Default waste types ──────────────────────────────────────────────────────

const DEFAULT_WASTE_TYPES = [
  "解体木材",
  "コンクリートガラ",
  "金属くず",
  "廃プラスチック",
  "石膏ボード",
  "混合廃棄物",
  "アスベスト含有材",
  "その他",
];

const UNIT_OPTIONS = ["kg", "ton", "m³", "袋", "台"];

// ─── Processor Modal ──────────────────────────────────────────────────────────

const EMPTY_PRICE = (): ProcessorPrice => ({ wasteType: "", unit: "kg", unitPrice: 0 });

function ProcessorModal({
  initial, onSave, onClose,
}: {
  initial?: Processor | null;
  onSave:   (data: { name: string; address: string; lat: number | null; lng: number | null; notes: string; prices: ProcessorPrice[] }) => void;
  onClose:  () => void;
}) {
  const [name,    setName]    = useState(initial?.name    ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [mapPos,  setMapPos]  = useState<LatLng | null>(
    initial?.lat != null && initial?.lng != null ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [notes,   setNotes]   = useState(initial?.notes   ?? "");
  const [prices,  setPrices]  = useState<ProcessorPrice[]>(
    initial?.prices?.length ? initial.prices : [EMPTY_PRICE()]
  );
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  function addRow() {
    setPrices(prev => [...prev, EMPTY_PRICE()]);
  }

  function removeRow(i: number) {
    setPrices(prev => prev.filter((_, idx) => idx !== i));
  }

  function setRow<K extends keyof ProcessorPrice>(i: number, k: K, v: ProcessorPrice[K]) {
    setPrices(prev => prev.map((p, idx) => idx === i ? { ...p, [k]: v } : p));
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

  const inputCls  = "w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all";
  const inputStyle = { border: `1.5px solid ${C.border}`, background: T.bg, color: C.text };
  const labelCls  = "block text-sm font-bold mb-1.5 uppercase tracking-wide";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl flex flex-col"
        style={{ maxWidth: 680, background: C.card, maxHeight: "90dvh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
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
              placeholder="例：大阪府大阪市〇〇区〇〇1-2-3"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          {/* 地図ピン */}
          <div>
            <label className={labelCls} style={{ color: C.muted }}>地図上の位置</label>
            <MapPicker
              address={address}
              value={mapPos}
              onChange={setMapPos}
            />
          </div>

          {/* 廃材ごとの処理単価 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls} style={{ color: C.muted, marginBottom: 0 }}>
                廃材ごとの処理単価
              </label>
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{ background: T.primaryLt, color: C.amberDk, border: `1px solid ${T.primaryMd}` }}
              >
                <Plus size={12} /> 追加
              </button>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              {/* Table header */}
              <div
                className="grid px-4 py-2.5 text-sm font-bold uppercase tracking-wide"
                style={{ gridTemplateColumns: "2.5fr 80px 130px 40px", background: T.bg, color: C.muted, borderBottom: `1px solid ${C.border}` }}
              >
                <span>廃材の種類</span>
                <span>単位</span>
                <span className="text-right">単価（円）</span>
                <span />
              </div>

              {prices.length === 0 && (
                <div className="py-6 text-center text-sm" style={{ color: C.muted }}>
                  「追加」ボタンで廃材単価を設定
                </div>
              )}

              {prices.map((p, i) => (
                <div
                  key={i}
                  className="grid items-center gap-2 px-4 py-2.5"
                  style={{
                    gridTemplateColumns: "2.5fr 80px 130px 40px",
                    borderBottom: i < prices.length - 1 ? `1px solid ${C.border}` : undefined,
                  }}
                >
                  {/* 廃材種類 (datalist) */}
                  <div className="relative">
                    <input
                      list={`waste-types-${i}`}
                      className="w-full px-2.5 py-1.5 rounded-lg text-sm outline-none"
                      style={{ border: `1.5px solid ${C.border}`, background: T.bg, color: C.text }}
                      placeholder="廃材を選択または入力"
                      value={p.wasteType}
                      onChange={e => setRow(i, "wasteType", e.target.value)}
                    />
                    <datalist id={`waste-types-${i}`}>
                      {DEFAULT_WASTE_TYPES.map(t => <option key={t} value={t} />)}
                    </datalist>
                  </div>

                  {/* 単位 */}
                  <select
                    className="w-full px-2 py-1.5 rounded-lg text-sm outline-none"
                    style={{ border: `1.5px solid ${C.border}`, background: T.bg, color: C.text }}
                    value={p.unit}
                    onChange={e => setRow(i, "unit", e.target.value)}
                  >
                    {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>

                  {/* 単価 */}
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: C.muted }}>¥</span>
                    <input
                      type="number"
                      className="w-full pl-6 pr-2.5 py-1.5 rounded-lg text-sm outline-none text-right"
                      style={{ border: `1.5px solid ${C.border}`, background: T.bg, color: C.text }}
                      placeholder="0"
                      value={p.unitPrice || ""}
                      onChange={e => setRow(i, "unitPrice", Number(e.target.value))}
                    />
                  </div>

                  {/* 削除 */}
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50"
                    style={{ color: C.muted }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className={labelCls} style={{ color: C.muted }}>メモ</label>
            <textarea
              className={inputCls}
              style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
              placeholder="特記事項・備考"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-5" style={{ borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50"
            style={{ border: `1.5px solid ${C.border}`, color: C.sub }}
          >
            キャンセル
          </button>
          <button
            onClick={submit}
            className="px-8 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90"
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

  function handleSave(data: { name: string; address: string; lat: number | null; lng: number | null; notes: string; prices: ProcessorPrice[] }) {
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
      const res = await fetch("/api/kaitai/seed-processors", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data?.ok) {
        // Reload processors
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

  return (
    <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>処理場管理</h1>
          <p className="text-sm mt-1" style={{ color: C.sub }}>産廃処理場の登録・廃材処理単価の管理</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSeedProcessors}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm hover:opacity-90"
            style={{ background: T.bg, color: C.sub, border: `1.5px solid ${C.border}` }}
            title="テスト用処理場データ4件を一括登録（既存データは削除されます）"
          >
            <Database size={15} />
            {seeding ? "登録中..." : "テストデータ投入"}
          </button>
          <button
            onClick={() => setModalTarget("new")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-white hover:opacity-90"
            style={{ background: C.amber }}
          >
            <Plus size={16} />
            処理場を追加
          </button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "登録処理場数", value: processors.length,                                                       note: "総登録数" },
          { label: "廃材種類数",   value: processors.reduce((s, p) => s + p.prices.length, 0),                    note: "単価設定済み" },
          { label: "平均単価",     value: (() => {
            const all = processors.flatMap(p => p.prices);
            return all.length ? `¥${Math.round(all.reduce((s, p) => s + p.unitPrice, 0) / all.length).toLocaleString()}` : "—";
          })(),                                                                                                      note: "廃材単価平均" },
        ].map(({ label, value, note }) => (
          <div key={label} className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <p className="text-sm mb-1" style={{ color: C.sub }}>{label}</p>
            <p className="text-2xl font-bold font-numeric" style={{ color: C.text }}>{value}</p>
            <p className="text-sm mt-1" style={{ color: C.muted }}>{note}</p>
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
              <div className="flex items-start justify-between gap-4 px-5 py-4" style={{ borderBottom: proc.prices.length ? `1px solid ${C.border}` : undefined }}>
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
                    className="grid px-5 py-2.5 text-sm font-bold uppercase tracking-wide"
                    style={{ gridTemplateColumns: "2fr 80px 1fr", background: T.bg, color: C.muted }}
                  >
                    <span>廃材の種類</span>
                    <span>単位</span>
                    <span className="text-right">処理単価</span>
                  </div>
                  {proc.prices.map((p, i) => (
                    <div
                      key={p.id ?? i}
                      className="grid items-center px-5 py-3"
                      style={{
                        gridTemplateColumns: "2fr 80px 1fr",
                        borderTop: `1px solid #F1F5F9`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Truck size={11} style={{ color: C.muted }} />
                        <span className="text-sm font-medium" style={{ color: C.text }}>{p.wasteType}</span>
                      </div>
                      <span className="text-sm" style={{ color: C.sub }}>{p.unit}</span>
                      <span className="text-sm font-bold text-right font-numeric" style={{ color: C.amberDk }}>
                        ¥{p.unitPrice.toLocaleString()}<span className="text-sm font-normal" style={{ color: C.muted }}>/{p.unit}</span>
                      </span>
                    </div>
                  ))}
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
