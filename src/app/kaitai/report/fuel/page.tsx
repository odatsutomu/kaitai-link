"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Fuel, CheckCircle } from "lucide-react";
import { useAppContext } from "../../lib/app-context";
import { Suspense } from "react";

const PRICE_PER_LITER = 155; // デフォルト単価

const SITES = [
  { id: "s1", name: "山田邸解体工事" },
  { id: "s2", name: "旧田中倉庫解体" },
  { id: "s3", name: "松本アパート解体" },
];

function FuelContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { equipment, assignments, addFuelLog, company } = useAppContext();

  const siteId   = params.get("site") ?? "";
  const siteName = params.get("name") ?? SITES.find(s => s.id === siteId)?.name ?? "現場";

  // Equipment assigned to this site
  const siteEquipment = equipment.filter(eq =>
    assignments.some(a => a.equipmentId === eq.id && a.siteId === siteId)
  );

  const [selectedEqId, setSelectedEqId] = useState<string>(siteEquipment[0]?.id ?? "");
  const [liters, setLiters]             = useState("");
  const [price, setPrice]               = useState(String(PRICE_PER_LITER));
  const [memo, setMemo]                 = useState("");
  const [done, setDone]                 = useState(false);

  const litersNum = parseFloat(liters) || 0;
  const priceNum  = parseFloat(price)  || PRICE_PER_LITER;
  const totalCost = Math.round(litersNum * priceNum);

  const selectedEq = equipment.find(e => e.id === selectedEqId);

  function handleSubmit() {
    if (!selectedEqId || litersNum <= 0) return;
    addFuelLog({
      equipmentId:   selectedEqId,
      equipmentName: selectedEq?.name ?? "",
      siteId,
      date:          new Date().toISOString().slice(0, 10),
      liters:        litersNum,
      pricePerLiter: priceNum,
      reporter:      company?.adminName ?? "作業員",
      memo,
    });
    setDone(true);
    setTimeout(() => router.push("/kaitai"), 1800);
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: "#1A3A2A" }}
      >
        <CheckCircle size={64} style={{ color: "#4ADE80" }} />
        <p className="text-2xl font-bold" style={{ color: "#4ADE80" }}>給油記録を送信しました</p>
        <p className="text-sm" style={{ color: "#94A3B8" }}>
          {selectedEq?.name} / {litersNum}L / ¥{totalCost.toLocaleString()}
        </p>
        <p className="text-sm" style={{ color: "#475569" }}>現場トップに戻ります…</p>
      </div>
    );
  }

  return (
    <div className="py-6 pb-28 md:pb-8 flex flex-col gap-5">

      {/* Header */}
      <header className="flex flex-col gap-2" style={{ paddingBottom: 20, borderBottom: "1px solid #F3F4F6" }}>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm mb-3"
          style={{ color: "#9CA3AF" }}
        >
          <ChevronLeft size={18} /> 戻る
        </button>
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(249,115,22,0.1)" }}
          >
            <Fuel size={20} style={{ color: "#F97316" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#111827" }}>給油報告</h1>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>{siteName}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-5">

        {/* 機材選択 */}
        <div>
          <p className="text-sm font-bold mb-2" style={{ color: "#475569" }}>給油した機材・車両</p>
          <div className="flex flex-col gap-2">
            {siteEquipment.length === 0 ? (
              <p className="text-sm py-4 text-center rounded-2xl" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>
                この現場にアサインされた機材がありません
              </p>
            ) : (
              siteEquipment.map(eq => (
                <button
                  key={eq.id}
                  onClick={() => setSelectedEqId(eq.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                  style={
                    selectedEqId === eq.id
                      ? { background: "#FFF7ED", border: "2px solid #F97316" }
                      : { background: "#FFFFFF", border: "1.5px solid #F3F4F6" }
                  }
                >
                  <span style={{ fontSize: 24 }}>
                    {eq.type === "重機" ? "🦾" : eq.type === "車両" ? "🚚" : eq.type === "アタッチメント" ? "🔩" : "📦"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "#111827" }}>{eq.name}</p>
                    <p className="text-sm" style={{ color: "#9CA3AF" }}>{eq.supplier}</p>
                  </div>
                  {selectedEqId === eq.id && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "#F97316" }}
                    >
                      <CheckCircle size={12} style={{ color: "#fff" }} />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* 給油量 */}
        <div>
          <p className="text-sm font-bold mb-2" style={{ color: "#475569" }}>給油量（リットル）</p>
          <div className="relative">
            <input
              type="number"
              value={liters}
              onChange={e => setLiters(e.target.value)}
              placeholder="例：45"
              className="w-full px-4 py-4 rounded-2xl text-2xl font-bold outline-none text-center"
              style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", color: "#111827" }}
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: "#9CA3AF" }}
            >
              L
            </span>
          </div>
        </div>

        {/* 単価 */}
        <div>
          <p className="text-sm font-bold mb-2" style={{ color: "#475569" }}>燃料単価（円/L）</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#9CA3AF" }}>¥</span>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full pl-8 pr-4 py-3 rounded-2xl text-sm outline-none"
              style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", color: "#111827" }}
            />
          </div>
        </div>

        {/* Cost preview */}
        {litersNum > 0 && (
          <div
            className="flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}
          >
            <span className="text-sm" style={{ color: "#9CA3AF" }}>燃料費（自動加算）</span>
            <span className="text-lg font-bold" style={{ color: "#F97316" }}>
              ¥{totalCost.toLocaleString()}
            </span>
          </div>
        )}

        {/* メモ */}
        <div>
          <p className="text-sm font-bold mb-2" style={{ color: "#475569" }}>メモ（任意）</p>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="気になる点など"
            rows={3}
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
            style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", color: "#111827", fontFamily: "inherit" }}
          />
        </div>

      </div>

      {/* Submit button */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={!selectedEqId || litersNum <= 0}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all"
          style={{
            background: selectedEqId && litersNum > 0
              ? "linear-gradient(135deg, #F97316, #EA580C)"
              : "#E5E7EB",
            color: selectedEqId && litersNum > 0 ? "#FFFFFF" : "#9CA3AF",
          }}
        >
          <Fuel size={16} style={{ display: "inline", marginRight: 8 }} />
          給油記録を送信
        </button>
      </div>

    </div>
  );
}

export default function FuelPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#F9FAFB" }} />}>
      <FuelContent />
    </Suspense>
  );
}
