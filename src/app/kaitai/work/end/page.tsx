"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, StopCircle, MapPin, Clock,
  Camera, CheckSquare, Square, Plus, Minus,
  Upload, CheckCircle2, Truck,
} from "lucide-react";

// ─── Mock ──────────────────────────────────────────────────────────────────────

const siteNames: Record<string, string> = {
  s1: "山田邸解体工事",
  s2: "旧田中倉庫解体",
};

const workItems = [
  { id: "interior",   label: "内装解体" },
  { id: "electric",   label: "電気設備撤去" },
  { id: "sorting",    label: "分別・積込み" },
];

type WasteItem = {
  id: string;
  label: string;
  unit: string;
  unitPrice: number;
  step: number;
};

const wasteItems: WasteItem[] = [
  { id: "concrete", label: "コンクリートガラ", unit: "㎥",  unitPrice: 8_000,  step: 0.5 },
  { id: "wood",     label: "木くず",           unit: "㎥",  unitPrice: 12_000, step: 0.5 },
  { id: "metal",    label: "金属くず",          unit: "kg", unitPrice: 15,     step: 50 },
  { id: "plastic",  label: "廃プラスチック",    unit: "kg", unitPrice: 25,     step: 50 },
  { id: "gypsum",   label: "廃石膏ボード",      unit: "枚", unitPrice: 200,    step: 5 },
  { id: "tile",     label: "瓦",               unit: "ton", unitPrice: 6_000,  step: 0.5 },
  { id: "mixed",    label: "混合廃棄物",        unit: "㎥",  unitPrice: 18_000, step: 0.5 },
];

// 搬出先の選択肢
const destinations = [
  "〇〇産廃（株）",
  "△△リサイクルセンター",
  "□□処理場",
  "その他",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkEndPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  const { site } = use(searchParams);
  const siteId   = site ?? "s1";
  const siteName = siteNames[siteId] ?? "現場";

  const [doneItems, setDoneItems] = useState<Set<string>>(new Set(["interior", "electric"]));
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(wasteItems.map((w) => [w.id, 0]))
  );
  const [destinations_, setDestinations] = useState<Record<string, string>>(
    Object.fromEntries(wasteItems.map((w) => [w.id, ""]))
  );
  const [photos, setPhotos] = useState<Record<string, number>>(
    Object.fromEntries(wasteItems.map((w) => [w.id, 0]))
  );
  const [submitted, setSubmitted] = useState(false);

  const now     = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  function toggleDone(id: string) {
    setDoneItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function adjustQty(id: string, delta: number) {
    const item = wasteItems.find((w) => w.id === id)!;
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, parseFloat(((prev[id] ?? 0) + delta).toFixed(1))),
    }));
  }

  const totalWasteCost = wasteItems.reduce((sum, w) => sum + quantities[w.id] * w.unitPrice, 0);
  const activeWaste    = wasteItems.filter((w) => quantities[w.id] > 0);
  const canSubmit      = doneItems.size > 0 || activeWaste.length > 0;

  if (submitted) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #4ADE80" }}
        >
          <CheckCircle2 size={36} style={{ color: "#4ADE80" }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#F1F5F9" }}>
          作業終了を記録しました
        </h2>
        <p className="text-sm mb-1" style={{ color: "#94A3B8" }}>{siteName}</p>
        <p className="text-3xl font-bold mb-3" style={{ color: "#4ADE80" }}>{timeStr}</p>
        <div
          className="px-4 py-2 rounded-2xl mb-2"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}
        >
          <p className="text-sm" style={{ color: "#94A3B8" }}>
            産廃処分費（概算）：
            <span className="font-bold text-lg" style={{ color: "#F87171" }}>
              　¥{totalWasteCost.toLocaleString()}
            </span>
          </p>
        </div>
        <p className="text-xs mb-8" style={{ color: "#64748B" }}>
          産廃 {activeWaste.length}品目 · 写真 {Object.values(photos).reduce((a, b) => a + b, 0)}枚
        </p>
        <Link href="/kaitai">
          <button
            className="rounded-2xl px-8 py-4 font-bold text-base"
            style={{ background: "#1A2535", border: "1px solid #2D3E54", color: "#F1F5F9" }}
          >
            現場一覧へ戻る
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto flex flex-col gap-5 pb-8">

      {/* ── Header ── */}
      <section className="px-5 pt-12 pb-5" style={{ borderBottom: "1px solid #2D3E54" }}>
        <Link href="/kaitai/work" className="inline-flex items-center gap-1.5 mb-4 text-sm" style={{ color: "#64748B" }}>
          <ArrowLeft size={15} /> 作業報告
        </Link>
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}
          >
            <StopCircle size={20} style={{ color: "#F87171" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#F1F5F9" }}>作業終了・産廃入力</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={11} style={{ color: "#64748B" }} />
              <p className="text-sm" style={{ color: "#94A3B8" }}>{siteName}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
            <Clock size={14} style={{ color: "#F87171" }} />
            <span className="text-lg font-bold" style={{ color: "#F87171" }}>{timeStr}</span>
          </div>
        </div>

        {/* Running cost summary */}
        {totalWasteCost > 0 && (
          <div
            className="rounded-2xl px-4 py-2.5 flex items-center justify-between"
            style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            <span className="text-xs" style={{ color: "#94A3B8" }}>産廃処分費（概算）</span>
            <span className="text-lg font-bold" style={{ color: "#F87171" }}>
              ¥{totalWasteCost.toLocaleString()}
            </span>
          </div>
        )}
      </section>

      <div className="px-4 flex flex-col gap-6">

        {/* ══════════════════════════════════════════════
            作業実績チェック
        ══════════════════════════════════════════════ */}
        <section>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: "#F97316" }}>
            本日の作業実績
          </p>
          <div className="flex flex-col gap-2">
            {workItems.map((item) => {
              const done = doneItems.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleDone(item.id)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl active:scale-[0.98] transition-all"
                  style={{
                    background: done ? "rgba(34,197,94,0.08)" : "#1A2535",
                    border: done ? "1.5px solid rgba(34,197,94,0.4)" : "1px solid #2D3E54",
                  }}
                >
                  {done ? (
                    <CheckSquare size={20} style={{ color: "#4ADE80" }} />
                  ) : (
                    <Square size={20} style={{ color: "#475569" }} />
                  )}
                  <span className="text-sm font-semibold" style={{ color: done ? "#4ADE80" : "#94A3B8" }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            産廃排出記録（最重要）
        ══════════════════════════════════════════════ */}
        <section>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: "#F97316" }}>
            産廃排出記録（品目・数量・搬出先・写真）
          </p>

          <div className="flex flex-col gap-3">
            {wasteItems.map((item) => {
              const qty  = quantities[item.id];
              const cost = qty * item.unitPrice;
              const dest = destinations_[item.id];
              const ph   = photos[item.id];
              const active = qty > 0;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: active ? "rgba(249,115,22,0.06)" : "#1A2535",
                    border: active ? "1.5px solid rgba(249,115,22,0.3)" : "1px solid #2D3E54",
                  }}
                >
                  {/* Row 1: label + counter */}
                  <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                    <Truck size={14} style={{ color: active ? "#F97316" : "#475569" }} className="flex-shrink-0" />
                    <p className="flex-1 text-sm font-semibold" style={{ color: active ? "#F1F5F9" : "#94A3B8" }}>
                      {item.label}
                    </p>
                    {/* +/- counter */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustQty(item.id, -item.step)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                        style={{ background: "#0F1928", border: "1px solid #2D3E54" }}
                      >
                        <Minus size={14} style={{ color: active ? "#F97316" : "#475569" }} />
                      </button>
                      <div className="text-center" style={{ minWidth: 52 }}>
                        <span className="text-base font-bold" style={{ color: active ? "#F97316" : "#475569" }}>
                          {qty}
                        </span>
                        <span className="text-[10px] ml-0.5" style={{ color: "#64748B" }}>
                          {item.unit}
                        </span>
                      </div>
                      <button
                        onClick={() => adjustQty(item.id, item.step)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                        style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)" }}
                      >
                        <Plus size={14} style={{ color: "#F97316" }} />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: cost + destination + photo (show only when active) */}
                  {active && (
                    <div className="px-4 pb-3 flex flex-col gap-2">
                      {/* Cost chip */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: "#64748B" }}>
                          概算費：¥{item.unitPrice.toLocaleString()}/{item.unit}
                        </span>
                        <span className="text-sm font-bold" style={{ color: "#F87171" }}>
                          ¥{cost.toLocaleString()}
                        </span>
                      </div>

                      {/* Destination selector */}
                      <div>
                        <p className="text-[10px] mb-1" style={{ color: "#64748B" }}>搬出先</p>
                        <div className="flex flex-wrap gap-1.5">
                          {destinations.map((d) => (
                            <button
                              key={d}
                              onClick={() => setDestinations((prev) => ({ ...prev, [item.id]: d }))}
                              className="text-xs px-2.5 py-1 rounded-xl font-medium transition-all"
                              style={
                                dest === d
                                  ? { background: "rgba(249,115,22,0.2)", color: "#F97316", border: "1px solid rgba(249,115,22,0.4)" }
                                  : { background: "#0F1928", color: "#64748B", border: "1px solid #2D3E54" }
                              }
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Photo for this waste item */}
                      <button
                        onClick={() => setPhotos((prev) => ({ ...prev, [item.id]: prev[item.id] + 1 }))}
                        className="flex items-center gap-2 py-2 rounded-xl active:scale-[0.98] transition-transform"
                        style={{
                          background: ph > 0 ? "rgba(249,115,22,0.08)" : "#0F1928",
                          border: `1px dashed ${ph > 0 ? "rgba(249,115,22,0.4)" : "#2D3E54"}`,
                          paddingLeft: 12, paddingRight: 12,
                        }}
                      >
                        <Camera size={14} style={{ color: ph > 0 ? "#F97316" : "#475569" }} />
                        <span className="text-xs font-medium" style={{ color: ph > 0 ? "#F97316" : "#64748B" }}>
                          {ph > 0 ? `${ph}枚 添付済み` : "積載写真を添付"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            送信ボタン
        ══════════════════════════════════════════════ */}
        <button
          onClick={() => canSubmit && setSubmitted(true)}
          className="w-full rounded-2xl py-5 flex items-center justify-center gap-3 font-bold text-lg active:scale-[0.98] transition-transform"
          style={
            canSubmit
              ? {
                  background: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)",
                  boxShadow: "0 6px 28px rgba(239,68,68,0.3)",
                  color: "#fff",
                }
              : { background: "#1A2535", border: "1px solid #2D3E54", color: "#475569" }
          }
        >
          <Upload size={20} />
          作業終了を報告する
        </button>

        {!canSubmit && (
          <p className="text-center text-xs -mt-3" style={{ color: "#64748B" }}>
            作業実績または産廃記録を入力してください
          </p>
        )}
      </div>
    </div>
  );
}
