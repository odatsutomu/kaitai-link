"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, MapPin, Truck, Database, ChevronRight, Package } from "lucide-react";
import { T } from "../lib/design-tokens";

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
  onSave: (data: { name: string; address: string }) => void;
  onClose: () => void;
}) {
  const [name,    setName]    = useState("");
  const [address, setAddress] = useState("");
  const [error,   setError]   = useState("");

  function submit() {
    if (!name.trim()) { setError("処理場名は必須です"); return; }
    onSave({ name: name.trim(), address: address.trim() });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl flex flex-col"
        style={{ maxWidth: 480, background: C.card }}
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
        <div className="px-6 py-6 flex flex-col gap-5">
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
  const [processors,   setProcessors]   = useState<Processor[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Processor | null>(null);
  const [seeding,      setSeeding]      = useState(false);

  useEffect(() => {
    fetch("/api/kaitai/processors", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.processors) setProcessors(data.processors); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleAdd(data: { name: string; address: string }) {
    fetch("/api/kaitai/processors", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.processor) {
          setProcessors(prev => [res.processor, ...prev]);
          // 登録後に詳細編集ページへ遷移
          router.push(`/kaitai/processors/${res.processor.id}`);
        }
      })
      .catch(() => {});
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
            onClick={() => setShowAddModal(true)}
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
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  {/* Left info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ background: T.primaryLt }}
                    >
                      <Truck size={18} style={{ color: C.amber }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate" style={{ color: C.text }}>{proc.name}</p>
                      {proc.address && (
                        <p className="text-sm mt-0.5 flex items-center gap-1 truncate" style={{ color: C.sub }}>
                          <MapPin size={11} className="flex-shrink-0" />
                          {proc.address}
                        </p>
                      )}
                      {/* 品目サマリー */}
                      <div className="flex items-center gap-3 mt-1">
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
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => router.push(`/kaitai/processors/${proc.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
                      style={{ background: T.primaryLt, color: C.amberDk, border: `1px solid ${T.primaryMd}` }}
                    >
                      詳細編集
                      <ChevronRight size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(proc); }}
                      className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50"
                      style={{ border: "1.5px solid #E5E7EB", color: C.muted }}
                    >
                      <Trash2 size={14} />
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
