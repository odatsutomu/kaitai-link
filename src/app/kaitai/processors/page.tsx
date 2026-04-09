"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, Trash2, X, MapPin, Truck, Database, ChevronRight, Package } from "lucide-react";
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

// ─── Add Processor Modal (シンプル: 名前+住所のみ) ───────────────────────────

function AddProcessorModal({
  onSave,
  onClose,
}: {
  onSave: (data: { name: string; address: string; lat: number | null; lng: number | null }) => void;
  onClose: () => void;
}) {
  const [name,    setName]    = useState("");
  const [address, setAddress] = useState("");
  const [mapPos,  setMapPos]  = useState<LatLng | null>(null);
  const [error,   setError]   = useState("");

  function submit() {
    if (!name.trim()) { setError("処理場名は必須です"); return; }
    onSave({
      name:    name.trim(),
      address: address.trim(),
      lat:     mapPos?.lat ?? null,
      lng:     mapPos?.lng ?? null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl flex flex-col"
        style={{ maxWidth: 600, background: C.card, maxHeight: "92dvh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 className="text-lg font-bold" style={{ color: C.text }}>処理場を追加</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ color: C.muted }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: C.muted }}>
              処理場名 <span style={{ color: C.red }}>*</span>
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: `1.5px solid ${error ? C.red : C.border}`, background: T.bg, color: C.text }}
              placeholder="例：○○産業廃棄物処理場"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              autoFocus
            />
            {error && <p className="text-sm mt-1" style={{ color: C.red }}>{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: C.muted }}>住所</label>
            <input
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: `1.5px solid ${C.border}`, background: T.bg, color: C.text }}
              placeholder="例：岡山県岡山市南区〇〇1-2-3"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          {/* 地図ピン */}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: C.muted }}>地図上の位置</label>
            <MapPicker address={address} value={mapPos} onChange={setMapPos} />
          </div>

          <p className="text-xs" style={{ color: C.muted }}>
            品目・単価・メモなどの詳細は、登録後に「詳細編集」から設定できます。
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-5" style={{ borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-sm"
            style={{ border: `1.5px solid ${C.border}`, color: C.sub }}
          >
            キャンセル
          </button>
          <button
            onClick={submit}
            className="px-8 py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: C.amber, minWidth: 140 }}
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
            className="flex-1 py-3 rounded-xl font-semibold text-sm"
            style={{ border: `1.5px solid ${C.border}`, color: C.sub }}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
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
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/kaitai/admin");
  const basePath = isAdmin ? "/kaitai/admin/processors" : "/kaitai/processors";
  const [processors,   setProcessors]   = useState<Processor[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Processor | null>(null);
  const [seeding,      setSeeding]      = useState(false);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    fetch("/api/kaitai/processors", { credentials: "include" })
      .then(r => {
        if (!r.ok) throw new Error(r.status === 401 ? "認証エラー：ログインし直してください" : "データ取得に失敗しました");
        return r.json();
      })
      .then(data => { if (data?.processors) setProcessors(data.processors); })
      .catch(e => setFetchError(e.message || "通信エラー"))
      .finally(() => setLoading(false));
  }, []);

  function handleAdd(data: { name: string; address: string; lat: number | null; lng: number | null }) {
    setSaving(true);
    fetch("/api/kaitai/processors", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(r => {
        if (!r.ok) throw new Error(r.status === 401 ? "認証エラー" : "保存に失敗しました");
        return r.json();
      })
      .then(res => {
        if (res?.processor) {
          setProcessors(prev => [res.processor, ...prev]);
          router.push(`${basePath}/${res.processor.id}`);
        }
      })
      .catch(e => alert(e.message || "保存に失敗しました"))
      .finally(() => setSaving(false));
    setShowAddModal(false);
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
    <div className="py-4 flex flex-col gap-4 pb-4">

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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-white hover:opacity-90 transition-opacity"
            style={{ background: C.amber }}
          >
            <Plus size={16} />
            処理場を追加
          </button>
        </div>
      </div>

      {/* ── KPI badges (compact) ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "登録",   value: processors.length,    unit: "件" },
          { label: "品目",   value: allPrices.length,     unit: "件" },
          { label: "費用",   value: costPrices.length,    unit: "件", color: C.red },
          { label: "買取",   value: buybackPrices.length, unit: "件", color: C.green },
        ].map(({ label, value, unit, color }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <span className="text-xs" style={{ color: C.muted }}>{label}</span>
            <span className="text-sm font-bold font-numeric" style={{ color: color ?? C.text }}>{value}</span>
            <span className="text-xs" style={{ color: C.muted }}>{unit}</span>
          </div>
        ))}
      </div>

      {/* ── Processor list ── */}
      {fetchError && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>
          {fetchError}
          <button
            onClick={() => window.location.reload()}
            className="ml-3 underline font-bold"
          >
            再読み込み
          </button>
        </div>
      )}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-xl h-28 animate-pulse" style={{ background: C.border }} />
          ))}
        </div>
      ) : !fetchError && processors.length === 0 ? (
        <div
          className="rounded-xl py-20 flex flex-col items-center justify-center gap-3"
          style={{ background: C.card, border: `1.5px dashed ${C.border}` }}
        >
          <Truck size={32} style={{ color: C.border }} />
          <p className="text-sm font-medium" style={{ color: C.muted }}>処理場がまだ登録されていません</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-white mt-1 hover:opacity-90"
            style={{ background: C.amber }}
          >
            <Plus size={14} /> 処理場を追加
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {processors.map(proc => {
            const priceCount = proc.prices.length;
            const costCount    = proc.prices.filter(p => p.direction !== "buyback").length;
            const buybackCount = proc.prices.filter(p => p.direction === "buyback").length;

            return (
              <div
                key={proc.id}
                className="rounded-xl overflow-hidden"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                {/* 上段: 名前・住所 */}
                <div className="flex items-start gap-3 px-4 pt-4 pb-2">
                  <div
                    className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: T.primaryLt }}
                  >
                    <Truck size={15} style={{ color: C.amber }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-base" style={{ color: C.text }}>{proc.name}</p>
                    {proc.address && (
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: C.sub }}>
                        <MapPin size={10} className="flex-shrink-0" />
                        {proc.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* 下段: 品目サマリー + アクション */}
                <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-1">
                  <div className="flex items-center gap-2">
                    {priceCount > 0 ? (
                      <>
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.sub }}>
                          <Package size={10} /> {priceCount}品目
                        </span>
                        {costCount > 0 && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: C.redLt, color: C.red }}>
                            費用{costCount}
                          </span>
                        )}
                        {buybackCount > 0 && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: C.greenLt, color: C.green }}>
                            買取{buybackCount}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: C.muted }}>品目未設定</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => router.push(`${basePath}/${proc.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all hover:opacity-80"
                      style={{ background: T.primaryLt, color: C.amberDk, border: `1px solid ${T.primaryMd}` }}
                    >
                      詳細編集
                      <ChevronRight size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(proc); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50"
                      style={{ border: "1.5px solid #E5E7EB", color: C.muted }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddProcessorModal
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
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
