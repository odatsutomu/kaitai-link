"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, CheckCircle, Plus, Minus, ArrowRight, MapPin } from "lucide-react";
import { useAppContext } from "../../lib/app-context";
import { T } from "../../lib/design-tokens";

// ─── 廃材品目 ─────────────────────────────────────────────────────────────────
const WASTE_ITEMS = [
  { id: "concrete", label: "コンクリートガラ", unit: "t",  step: 0.5, emoji: "🪨" },
  { id: "wood",     label: "木くず",           unit: "t",  step: 0.5, emoji: "🪵" },
  { id: "metal",    label: "金属スクラップ",   unit: "kg", step: 50,  emoji: "🔩" },
  { id: "gypsum",   label: "石膏ボード",       unit: "t",  step: 0.5, emoji: "📦" },
  { id: "plastic",  label: "廃プラスチック",   unit: "t",  step: 0.5, emoji: "♻️" },
  { id: "mixed",    label: "混合廃棄物",       unit: "t",  step: 0.5, emoji: "🗑️" },
  { id: "asbestos", label: "アスベスト含有",   unit: "袋", step: 1,   emoji: "⚠️" },
  { id: "tile",     label: "瓦・タイル",       unit: "t",  step: 0.5, emoji: "🏗" },
];

type Step = "input" | "compare" | "done";

type Processor = {
  id: string;
  name: string;
  address: string | null;
  prices: { wasteType: string; unitPrice: number; direction: string; unit: string }[];
};

type ComparisonItem = {
  processor: Processor;
  totalCost: number;
  direction: string;
  breakdown: { wasteType: string; label: string; qty: number; unit: string; unitPrice: number; subtotal: number; direction: string }[];
};

function WastePageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const siteId   = params.get("site") ?? "";
  const siteName = params.get("name") ?? "現場";
  const { company, addLog } = useAppContext();

  const [step, setStep] = useState<Step>("input");
  const [quantities, setQuantities] = useState<Record<string, string>>(
    Object.fromEntries(WASTE_ITEMS.map(w => [w.id, "0"]))
  );
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [selectedProcessor, setSelectedProcessor] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 処理場マスター読み込み
  useEffect(() => {
    fetch("/api/kaitai/processors")
      .then(r => r.json())
      .then(d => { if (d.ok) setProcessors(d.processors ?? []); })
      .catch(() => {});
  }, []);

  function changeQty(id: string, dir: 1 | -1) {
    const item = WASTE_ITEMS.find(w => w.id === id)!;
    const cur = parseFloat(quantities[id] || "0");
    const next = Math.max(0, Math.round((cur + dir * item.step) * 100) / 100);
    setQuantities(prev => ({ ...prev, [id]: String(next) }));
  }

  function handleInput(id: string, val: string) {
    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
      setQuantities(prev => ({ ...prev, [id]: val }));
    }
  }

  // 入力された廃材のみフィルター
  const activeWaste = useMemo(() =>
    WASTE_ITEMS.filter(w => parseFloat(quantities[w.id] || "0") > 0)
      .map(w => ({ ...w, qty: parseFloat(quantities[w.id]) })),
    [quantities]
  );

  // コスト比較計算
  const comparisons = useMemo<ComparisonItem[]>(() => {
    if (activeWaste.length === 0) return [];
    return processors.map(proc => {
      const breakdown = activeWaste.map(w => {
        const price = proc.prices.find(p => p.wasteType === w.id || p.wasteType === w.label);
        const unitPrice = price?.unitPrice ?? 0;
        const direction = price?.direction ?? "cost";
        const subtotal = direction === "buyback"
          ? -(w.qty * unitPrice)
          : w.qty * unitPrice;
        return { wasteType: w.id, label: w.label, qty: w.qty, unit: w.unit, unitPrice, subtotal, direction };
      });
      const totalCost = breakdown.reduce((sum, b) => sum + b.subtotal, 0);
      const hasBuyback = breakdown.some(b => b.direction === "buyback");
      return { processor: proc, totalCost, direction: hasBuyback ? "mixed" : "cost", breakdown };
    }).sort((a, b) => a.totalCost - b.totalCost);
  }, [activeWaste, processors]);

  async function submitDispatch() {
    if (!selectedProcessor || submitting) return;
    setSubmitting(true);

    const proc = processors.find(p => p.id === selectedProcessor);
    const comp = comparisons.find(c => c.processor.id === selectedProcessor);

    try {
      for (const w of activeWaste) {
        const bd = comp?.breakdown.find(b => b.wasteType === w.id);
        await fetch("/api/kaitai/waste-dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId,
            siteName,
            wasteType: w.label,
            quantity: w.qty,
            unit: w.unit,
            processorId: proc?.id,
            processorName: proc?.name,
            cost: Math.abs(bd?.subtotal ?? 0),
            direction: bd?.direction ?? "cost",
            reporter: company?.adminName ?? "作業員",
          }),
        });
      }

      addLog(
        `waste_dispatch: ${siteName} → ${proc?.name} / ${activeWaste.map(w => `${w.label}:${w.qty}${w.unit}`).join("、")}`,
        company?.adminName ?? "作業員"
      );
      setStep("done");
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  function yen(n: number) { return (n < 0 ? "-" : "") + "¥" + Math.abs(n).toLocaleString("ja-JP"); }

  // ── 完了画面 ──────────────────────────────────────────────────────────────
  if (step === "done") {
    const proc = processors.find(p => p.id === selectedProcessor);
    return (
      <div className="flex flex-col items-center justify-center py-16"
        style={{ background: "#F5F5F5", borderRadius: 16, padding: "64px 32px" }}>
        <CheckCircle size={96} color="#212121" strokeWidth={1.5} />
        <p style={{ fontSize: 28, fontWeight: 900, color: "#212121", marginTop: 24 }}>廃材記録 完了</p>
        <p style={{ fontSize: 15, color: "#616161", marginTop: 8 }}>
          {proc?.name} へ出発
        </p>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          {activeWaste.map(w => (
            <span key={w.id} style={{ fontSize: 14, color: "#444" }}>
              {w.emoji} {w.label}: {w.qty}{w.unit}
            </span>
          ))}
        </div>
        <button
          onClick={() => router.push("/kaitai/report")}
          style={{
            marginTop: 32, height: 56, padding: "0 36px",
            background: T.primary, color: "#FFFFFF",
            fontSize: 16, fontWeight: 700, borderRadius: 16,
            border: "none", cursor: "pointer",
          }}
        >
          ← 報告画面に戻る
        </button>
      </div>
    );
  }

  // ── コスト比較画面 ────────────────────────────────────────────────────────
  if (step === "compare") {
    return (
      <div className="py-6 pb-28 md:pb-8 flex flex-col gap-6">
        <header className="flex flex-col gap-2" style={{ borderBottom: "2px solid #EEEEEE", paddingBottom: 20 }}>
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setStep("input")}
              className="w-10 h-10 flex items-center justify-center rounded-2xl"
              style={{ background: "#F5F5F5" }}>
              <ChevronLeft size={20} style={{ color: "#444" }} />
            </button>
            <span style={{ fontSize: 14, color: "#888" }}>{siteName}</span>
          </div>
          <p style={{ fontSize: 26, fontWeight: 900, color: "#212121" }}>🚛 処理場を選択</p>
          <p style={{ fontSize: 14, color: "#666", marginTop: 4 }}>費用が安い順に表示しています</p>
        </header>

        {/* 今回の廃材まとめ */}
        <div className="rounded-2xl px-4 py-3" style={{ background: "#FEF3C7", border: "1.5px solid #FDE68A" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>今回の廃材</p>
          <div className="flex flex-wrap gap-2">
            {activeWaste.map(w => (
              <span key={w.id} style={{
                fontSize: 13, fontWeight: 600, padding: "4px 10px", borderRadius: 8,
                background: "#FFF", border: "1px solid #FDE68A", color: "#78350F",
              }}>
                {w.emoji} {w.label} {w.qty}{w.unit}
              </span>
            ))}
          </div>
        </div>

        {/* 処理場リスト */}
        {comparisons.length === 0 ? (
          <div className="flex items-center justify-center py-12 rounded-2xl"
            style={{ background: T.bg, border: `1.5px solid ${T.border}` }}>
            <p style={{ fontSize: 14, color: T.muted }}>登録された処理場がありません</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {comparisons.map((comp, idx) => {
              const isSelected = selectedProcessor === comp.processor.id;
              const isCheapest = idx === 0;
              return (
                <button
                  key={comp.processor.id}
                  onClick={() => setSelectedProcessor(comp.processor.id)}
                  className="w-full text-left rounded-2xl transition-all"
                  style={{
                    background: isSelected ? T.primaryLt : T.surface,
                    border: isSelected ? `2px solid ${T.primary}` : `1.5px solid ${T.border}`,
                    padding: "16px 20px",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isCheapest && (
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99,
                            background: "#DCFCE7", color: "#166534",
                          }}>最安</span>
                        )}
                        <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{comp.processor.name}</span>
                      </div>
                      {comp.processor.address && (
                        <div className="flex items-center gap-1 mb-2">
                          <MapPin size={11} style={{ color: T.muted }} />
                          <span style={{ fontSize: 12, color: T.sub }}>{comp.processor.address}</span>
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        {comp.breakdown.map(b => (
                          <div key={b.wasteType} className="flex items-center justify-between" style={{ fontSize: 12, color: T.sub }}>
                            <span>{b.label} {b.qty}{b.unit} × ¥{b.unitPrice.toLocaleString()}</span>
                            <span style={{
                              fontWeight: 700,
                              color: b.direction === "buyback" ? "#10B981" : T.text,
                            }}>
                              {b.direction === "buyback" ? `買取 ${yen(Math.abs(b.subtotal))}` : yen(b.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span style={{
                        fontSize: 24, fontWeight: 900,
                        color: comp.totalCost < 0 ? "#10B981" : T.primaryDk,
                      }}>
                        {comp.totalCost < 0 ? `+${yen(Math.abs(comp.totalCost))}` : yen(comp.totalCost)}
                      </span>
                      <span style={{ fontSize: 11, color: T.muted }}>
                        {comp.totalCost < 0 ? "買取収入" : "処理費用"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 決定ボタン */}
        <div className="pt-2">
          <button
            onClick={submitDispatch}
            disabled={!selectedProcessor || submitting}
            className="w-full flex items-center justify-center gap-2 rounded-3xl font-black transition-all active:scale-[0.98]"
            style={{
              height: 68, fontSize: 20,
              background: selectedProcessor ? "#212121" : "#D1D5DB",
              color: "#FFF",
              cursor: selectedProcessor ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "送信中..." : "決定 — この処理場へ出発"}
            {!submitting && <ArrowRight size={22} />}
          </button>
        </div>
      </div>
    );
  }

  // ── 廃材入力画面 ──────────────────────────────────────────────────────────
  return (
    <div className="py-6 pb-28 md:pb-8 flex flex-col gap-6">
      <header className="flex flex-col gap-2" style={{ borderBottom: "2px solid #EEEEEE", paddingBottom: 20 }}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-2xl"
            style={{ background: "#F5F5F5" }}>
            <ChevronLeft size={20} style={{ color: "#444" }} />
          </button>
          <span style={{ fontSize: 14, color: "#888" }}>{siteName}</span>
        </div>
        <p style={{ fontSize: 26, fontWeight: 900, color: "#212121" }}>🚛 廃材入力</p>
        <p style={{ fontSize: 14, color: "#666", marginTop: 4 }}>処理場へ向かう前に、廃材の品目と量を入力してください</p>
      </header>

      <section>
        <div className="flex flex-col gap-2">
          {WASTE_ITEMS.map(w => {
            const qty = parseFloat(quantities[w.id] || "0");
            return (
              <div
                key={w.id}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: qty > 0 ? "#FFFBEB" : T.surface,
                  border: qty > 0 ? "1.5px solid #FDE68A" : "1.5px solid #EEEEEE",
                }}
              >
                <span style={{ fontSize: 24 }}>{w.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ fontSize: 14, color: "#222" }}>{w.label}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => changeQty(w.id, -1)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "#F5F5F5" }}
                  >
                    <Minus size={16} color="#666" />
                  </button>
                  <div className="flex items-center gap-1" style={{ minWidth: 80 }}>
                    <input
                      type="number"
                      min="0"
                      step={w.step}
                      value={quantities[w.id]}
                      onChange={e => handleInput(w.id, e.target.value)}
                      className="rounded-lg text-center outline-none"
                      style={{
                        width: 60, height: 36,
                        fontSize: 18, fontWeight: 800, color: "#111",
                        background: "#F9FAFB", border: "1.5px solid #E5E7EB",
                      }}
                    />
                    <span style={{ fontSize: 12, color: "#999" }}>{w.unit}</span>
                  </div>
                  <button
                    onClick={() => changeQty(w.id, 1)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "#212121" }}
                  >
                    <Plus size={16} color="#FFF" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 次へボタン */}
      <div className="pt-2">
        <button
          onClick={() => setStep("compare")}
          disabled={activeWaste.length === 0}
          className="w-full flex items-center justify-center gap-2 rounded-3xl font-black transition-all active:scale-[0.98]"
          style={{
            height: 68, fontSize: 20,
            background: activeWaste.length > 0 ? "#212121" : "#D1D5DB",
            color: "#FFF",
            cursor: activeWaste.length > 0 ? "pointer" : "not-allowed",
          }}
        >
          処理場を比較する
          <ArrowRight size={22} />
        </button>
      </div>
    </div>
  );
}

export default function WastePage() {
  return (
    <Suspense fallback={null}>
      <WastePageInner />
    </Suspense>
  );
}
