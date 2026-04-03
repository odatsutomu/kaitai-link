"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft, CheckCircle, Camera,
  Fuel, Wrench, ShoppingCart, Car, Coffee, MoreHorizontal,
} from "lucide-react";
import { useAppContext } from "../../lib/app-context";
import type { ExpenseCategory } from "../../lib/app-context";
import { T } from "../../lib/design-tokens";

// ─── Category definitions ─────────────────────────────────────────────────────

const CATEGORIES: {
  key: ExpenseCategory;
  label: string;
  icon: React.ElementType;
  emoji: string;
  bg: string;
  border: string;
  color: string;
  hint: string;
}[] = [
  {
    key: "燃料費",
    label: "燃料費",
    icon: Fuel,
    emoji: "⛽",
    bg: "${T.primaryLt}",
    border: "#FED7AA",
    color: T.primaryDk,
    hint: "重機・車両への給油",
  },
  {
    key: "工具・消耗品",
    label: "工具・消耗品",
    icon: Wrench,
    emoji: "🔧",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    color: "#2563EB",
    hint: "買い出し工具・刃物・手袋など",
  },
  {
    key: "資材購入",
    label: "資材購入",
    icon: ShoppingCart,
    emoji: "🛒",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    color: "#16A34A",
    hint: "養生材・ボルト・シートなど",
  },
  {
    key: "交通費",
    label: "交通費",
    icon: Car,
    emoji: "🚗",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    color: "#7C3AED",
    hint: "高速・駐車・電車・タクシー",
  },
  {
    key: "食費・雑費",
    label: "食費・雑費",
    icon: Coffee,
    emoji: "🍱",
    bg: T.primaryLt,
    border: T.primaryMd,
    color: T.primaryDk,
    hint: "現場弁当・飲料・雑費",
  },
  {
    key: "その他",
    label: "その他",
    icon: MoreHorizontal,
    emoji: "📋",
    bg: T.bg,
    border: T.border,
    color: "#475569",
    hint: "上記に当てはまらない支出",
  },
];

// ─── Main content ─────────────────────────────────────────────────────────────

function ExpenseContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { equipment, assignments, addExpenseLog, addFuelLog, company } = useAppContext();

  const siteId   = params.get("site") ?? "s1";
  const siteName = params.get("name") ?? "現場";

  // Equipment assigned to this site (for fuel category)
  const siteEquipment = equipment.filter(eq =>
    assignments.some(a => a.equipmentId === eq.id && a.siteId === siteId)
  );

  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [amount,   setAmount]   = useState("");
  const [desc,     setDesc]     = useState("");
  const [memo,     setMemo]     = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);

  // Fuel-specific
  const [selectedEqId, setSelectedEqId] = useState(siteEquipment[0]?.id ?? "");
  const [liters,       setLiters]       = useState("");
  const [pricePerL,    setPricePerL]    = useState("155");

  const [done, setDone] = useState(false);

  const cat       = CATEGORIES.find(c => c.key === category);
  const amountNum = parseFloat(amount.replace(/,/g, "")) || 0;
  const litersNum = parseFloat(liters) || 0;
  const priceNum  = parseFloat(pricePerL) || 155;

  // Auto-calculate fuel amount from liters × price
  const fuelTotal = Math.round(litersNum * priceNum);
  const displayAmount = category === "燃料費" && litersNum > 0 ? fuelTotal : amountNum;

  const canSubmit = category !== null && (
    category === "燃料費"
      ? litersNum > 0
      : amountNum > 0
  );

  function handleSubmit() {
    if (!canSubmit || !category) return;

    if (category === "燃料費") {
      const eq = equipment.find(e => e.id === selectedEqId);
      addFuelLog({
        equipmentId: selectedEqId,
        equipmentName: eq?.name ?? "",
        siteId,
        date: new Date().toISOString().slice(0, 10),
        liters: litersNum,
        pricePerLiter: priceNum,
        reporter: company?.adminName ?? "作業員",
        memo,
      });
    }

    addExpenseLog({
      category,
      siteId,
      siteName,
      date: new Date().toISOString().slice(0, 10),
      amount: displayAmount,
      description: desc || (category === "燃料費" && selectedEqId
        ? `${equipment.find(e => e.id === selectedEqId)?.name ?? ""}への給油 ${litersNum}L`
        : ""),
      reporter: company?.adminName ?? "作業員",
      memo,
      ...(category === "燃料費" ? {
        equipmentId: selectedEqId,
        equipmentName: equipment.find(e => e.id === selectedEqId)?.name ?? "",
        liters: litersNum,
        pricePerLiter: priceNum,
      } : {}),
    });

    setDone(true);
    setTimeout(() => router.push("/kaitai"), 2000);
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-5"
        style={{ background: "#F0FDF4" }}
      >
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: "#DCFCE7" }}
        >
          <CheckCircle size={52} style={{ color: "#16A34A" }} />
        </div>
        <p className="text-2xl font-black" style={{ color: "#15803D" }}>経費を報告しました</p>
        <div
          className="px-6 py-3 rounded-2xl flex flex-col items-center gap-1"
          style={{ background: T.surface, border: "1.5px solid #BBF7D0" }}
        >
          <p className="text-sm font-bold" style={{ color: "#475569" }}>{cat?.emoji} {category}</p>
          <p className="text-2xl font-black" style={{ color: "#15803D" }}>
            ¥{displayAmount.toLocaleString()}
          </p>
          <p className="text-sm" style={{ color: T.muted }}>{siteName}</p>
        </div>
        <p className="text-sm" style={{ color: "#86EFAC" }}>現場トップに戻ります…</p>
      </div>
    );
  }

  return (
    <div className="py-6 pb-28 md:pb-8 flex flex-col gap-5">

      {/* ── Header ── */}
      <header
        className="flex flex-col gap-2"
        style={{ paddingBottom: 20, borderBottom: "1px solid #F3F4F6" }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm mb-3"
          style={{ color: T.muted }}
        >
          <ChevronLeft size={17} /> 戻る
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "#111827" }}>経費報告</h1>
            <p className="text-sm" style={{ color: T.muted }}>{siteName}</p>
          </div>
          {category && cat && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: cat.bg, border: `1.5px solid ${cat.border}` }}
            >
              <span style={{ fontSize: 20 }}>{cat.emoji}</span>
              <span className="text-sm font-bold" style={{ color: cat.color }}>{category}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-5">

        {/* ── Step 1: Category selection ── */}
        <div>
          <p className="text-sm font-bold mb-3 px-1" style={{ color: "#475569" }}>
            経費の種類を選択
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => { setCategory(c.key); setAmount(""); setDesc(""); }}
                className="flex flex-col items-center justify-center rounded-3xl transition-all active:scale-[0.97]"
                style={{
                  minHeight: 110,
                  background: category === c.key ? c.bg : T.surface,
                  border: `2px solid ${category === c.key ? c.color : "#F3F4F6"}`,
                  boxShadow: category === c.key ? `0 4px 16px ${c.border}` : "none",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 34 }}>{c.emoji}</span>
                <p className="font-black" style={{ fontSize: 15, color: category === c.key ? c.color : "#374151" }}>
                  {c.label}
                </p>
                <p style={{ fontSize: 14, color: category === c.key ? c.color : T.muted }}>
                  {c.hint}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Step 2: Details (shown after category selected) ── */}
        {category && (
          <>
            {/* 燃料費: 機材 + リッター数 */}
            {category === "燃料費" && (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold px-1" style={{ color: "#475569" }}>給油した機材・車両</p>
                {siteEquipment.length === 0 ? (
                  <div
                    className="py-4 rounded-2xl text-center text-sm"
                    style={{ background: "#F3F4F6", color: T.muted }}
                  >
                    この現場にアサインされた機材がありません
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {siteEquipment.map(eq => (
                      <button
                        key={eq.id}
                        onClick={() => setSelectedEqId(eq.id)}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                        style={
                          selectedEqId === eq.id
                            ? { background: "${T.primaryLt}", border: "2px solid #92400E" }
                            : { background: T.surface, border: "1.5px solid #F3F4F6" }
                        }
                      >
                        <span style={{ fontSize: 22 }}>
                          {eq.type === "重機" ? "🦾" : eq.type === "車両" ? "🚚" : "🔩"}
                        </span>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-bold" style={{ color: "#111827" }}>{eq.name}</p>
                          <p className="text-sm" style={{ color: T.muted }}>{eq.supplier}</p>
                        </div>
                        {selectedEqId === eq.id && (
                          <CheckCircle size={18} style={{ color: T.primaryDk }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* リッター数 + 単価 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-bold mb-1.5 px-1" style={{ color: "#475569" }}>給油量</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={liters}
                        onChange={e => setLiters(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-4 rounded-2xl text-xl font-bold text-center outline-none"
                        style={{ background: T.surface, border: "1.5px solid #E5E7EB", color: "#111827" }}
                      />
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                        style={{ color: T.muted }}
                      >L</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-1.5 px-1" style={{ color: "#475569" }}>単価（円/L）</p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: T.muted }}>¥</span>
                      <input
                        type="number"
                        value={pricePerL}
                        onChange={e => setPricePerL(e.target.value)}
                        className="w-full pl-7 pr-3 py-4 rounded-2xl text-lg font-bold outline-none"
                        style={{ background: T.surface, border: "1.5px solid #E5E7EB", color: "#111827" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Fuel total preview */}
                {litersNum > 0 && (
                  <div
                    className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
                    style={{ background: "${T.primaryLt}", border: "1.5px solid #FED7AA" }}
                  >
                    <span className="text-sm" style={{ color: T.muted }}>燃料費合計</span>
                    <span className="text-2xl font-black" style={{ color: T.primaryDk }}>
                      ¥{fuelTotal.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 燃料費以外: 金額 + 内容 */}
            {category !== "燃料費" && (
              <div className="flex flex-col gap-3">
                {/* 金額 */}
                <div>
                  <p className="text-sm font-bold mb-1.5 px-1" style={{ color: "#475569" }}>金額</p>
                  <div
                    className="relative rounded-3xl overflow-hidden"
                    style={{ background: T.surface, border: `2px solid ${cat?.border ?? T.border}` }}
                  >
                    <span
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black"
                      style={{ color: cat?.color ?? T.muted }}
                    >¥</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pl-12 pr-5 py-5 text-3xl font-black outline-none"
                      style={{
                        background: "transparent",
                        color: "#111827",
                        fontFeatureSettings: "'tnum'",
                      }}
                    />
                  </div>
                </div>

                {/* 内容 */}
                <div>
                  <p className="text-sm font-bold mb-1.5 px-1" style={{ color: "#475569" }}>内容・品名</p>
                  <input
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    placeholder={
                      category === "工具・消耗品" ? "例：替え刃3枚、手袋2双"
                      : category === "資材購入" ? "例：養生シート×2、結束バンド"
                      : category === "交通費" ? "例：首都高速 往復"
                      : category === "食費・雑費" ? "例：現場弁当 5人分"
                      : "内容を入力"
                    }
                    className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none"
                    style={{
                      background: T.surface,
                      border: "1.5px solid #E5E7EB",
                      color: "#111827",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
            )}

            {/* メモ */}
            <div>
              <p className="text-sm font-bold mb-1.5 px-1" style={{ color: "#475569" }}>メモ（任意）</p>
              <textarea
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="補足・理由など"
                rows={2}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                style={{
                  background: T.surface,
                  border: "1.5px solid #E5E7EB",
                  color: "#111827",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* レシート写真 */}
            <button
              onClick={() => setHasPhoto(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all active:scale-[0.98]"
              style={
                hasPhoto
                  ? { background: "#F0FDF4", border: "1.5px solid #86EFAC" }
                  : { background: T.surface, border: "1.5px dashed #E5E7EB" }
              }
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: hasPhoto ? "#DCFCE7" : "#F3F4F6" }}
              >
                <Camera size={18} style={{ color: hasPhoto ? "#16A34A" : T.muted }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: hasPhoto ? "#15803D" : "#374151" }}>
                  {hasPhoto ? "レシート添付済み ✓" : "レシート・領収書を撮影"}
                </p>
                <p className="text-sm" style={{ color: T.muted }}>
                  {hasPhoto ? "タップで取り直し" : "任意 — 後で精算に使用"}
                </p>
              </div>
            </button>
          </>
        )}

      </div>

      {/* ── Submit button ── */}
      <div className="pt-2">
        {!category && (
          <p className="text-center text-sm pb-1" style={{ color: T.border }}>
            経費の種類を選んでください
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-5 rounded-3xl font-black text-lg transition-all active:scale-[0.98]"
          style={{
            background: canSubmit
              ? (cat ? `linear-gradient(135deg, ${cat.color}, ${cat.color}CC)` : "linear-gradient(135deg, #B45309, #92400E)")
              : T.border,
            color: canSubmit ? T.surface : T.muted,
            boxShadow: canSubmit ? `0 8px 24px ${cat?.border ?? "#FED7AA"}` : "none",
          }}
        >
          {canSubmit
            ? `💴 ¥${displayAmount.toLocaleString()} を報告する`
            : "経費を報告する"}
        </button>
      </div>

    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function ExpensePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: T.bg }} />}>
      <ExpenseContent />
    </Suspense>
  );
}
