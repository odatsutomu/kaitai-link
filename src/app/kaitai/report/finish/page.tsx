"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, CheckCircle, Plus, Minus, Camera } from "lucide-react";
import { useAppContext } from "../../lib/app-context";

const WASTE_ITEMS = [
  { id: "w1", label: "コンクリートガラ", unit: "㎥" },
  { id: "w2", label: "木材廃材",         unit: "㎥" },
  { id: "w3", label: "金属スクラップ",   unit: "kg" },
  { id: "w4", label: "アスベスト含有",   unit: "袋" },
  { id: "w5", label: "その他混合廃棄",   unit: "㎥" },
];

export default function FinishPage() {
  const router = useRouter();
  const params = useSearchParams();
  const siteName = params.get("name") ?? "現場";
  const { addLog, company } = useAppContext();

  const [waste, setWaste] = useState<Record<string, number>>(
    Object.fromEntries(WASTE_ITEMS.map(w => [w.id, 0]))
  );
  const [expenses, setExpenses] = useState("");
  const [memo, setMemo] = useState("");
  const [done, setDone] = useState(false);

  function changeWaste(id: string, delta: number) {
    setWaste(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
  }

  function confirm() {
    const wasteStr = WASTE_ITEMS
      .filter(w => waste[w.id] > 0)
      .map(w => `${w.label}:${waste[w.id]}${w.unit}`)
      .join("、") || "廃材なし";
    addLog(
      `finish: ${siteName} / 廃材[${wasteStr}] 経費¥${expenses || 0} [${company?.stripeCustomerId ?? "—"}]`,
      company?.adminName ?? "作業員"
    );
    setDone(true);
    setTimeout(() => router.push("/kaitai"), 1800);
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center" style={{ minHeight: "100dvh", background: "#F5F5F5" }}>
        <CheckCircle size={96} color="#212121" strokeWidth={1.5} />
        <p style={{ fontSize: 28, fontWeight: 900, color: "#212121", marginTop: 24 }}>終了報告 送信完了</p>
        <p style={{ fontSize: 15, color: "#616161", marginTop: 8 }}>{siteName}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto flex flex-col pb-8" style={{ minHeight: "100dvh" }}>
      <header className="px-5 pt-10 pb-5" style={{ borderBottom: "2px solid #EEEEEE" }}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-2xl" style={{ background: "#F5F5F5" }}>
            <ChevronLeft size={20} style={{ color: "#444" }} />
          </button>
          <span style={{ fontSize: 13, color: "#888" }}>{siteName}</span>
        </div>
        <p style={{ fontSize: 26, fontWeight: 900, color: "#212121" }}>🚚 終了報告</p>
        <p style={{ fontSize: 14, color: "#666", marginTop: 4 }}>廃材数量・経費を入力してください</p>
      </header>

      <div className="px-4 pt-5 flex flex-col gap-5">

        {/* Waste items */}
        <section>
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#9CA3AF" }}>廃材数量</p>
          <div className="flex flex-col gap-2">
            {WASTE_ITEMS.map(w => (
              <div key={w.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "#FFFFFF", border: "1.5px solid #EEEEEE" }}>
                <p className="flex-1 font-semibold" style={{ fontSize: 15, color: "#222" }}>{w.label}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => changeWaste(w.id, -1)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "#F5F5F5" }}
                  >
                    <Minus size={16} color="#666" />
                  </button>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#111", minWidth: 48, textAlign: "center" }}>
                    {waste[w.id]}<span style={{ fontSize: 11, color: "#999", marginLeft: 2 }}>{w.unit}</span>
                  </span>
                  <button
                    onClick={() => changeWaste(w.id, 1)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "#212121" }}
                  >
                    <Plus size={16} color="#FFF" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Expenses */}
        <section>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#9CA3AF" }}>経費（円）</p>
          <input
            type="number"
            inputMode="numeric"
            value={expenses}
            onChange={e => setExpenses(e.target.value)}
            placeholder="0"
            className="w-full rounded-2xl px-5 outline-none"
            style={{ height: 60, fontSize: 22, fontWeight: 700, background: "#FFF", border: "2px solid #EEEEEE", color: "#111" }}
          />
        </section>

        {/* Photo placeholder */}
        <section>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#9CA3AF" }}>現場写真</p>
          <button
            className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl"
            style={{ height: 100, background: "#F9FAFB", border: "2px dashed #DDDDDD" }}
          >
            <Camera size={28} color="#BBBBBB" />
            <span style={{ fontSize: 13, color: "#BBBBBB" }}>タップして写真を追加（実装予定）</span>
          </button>
        </section>

        {/* Memo */}
        <section>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#9CA3AF" }}>備考</p>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="特記事項があれば入力..."
            className="w-full rounded-2xl px-4 py-3 outline-none resize-none"
            style={{ minHeight: 80, fontSize: 14, background: "#FFF", border: "2px solid #EEEEEE", color: "#111" }}
          />
        </section>

      </div>

      <div className="px-4 pt-4">
        <button
          onClick={confirm}
          className="w-full flex items-center justify-center gap-2 rounded-3xl font-black transition-all active:scale-[0.98]"
          style={{ height: 68, fontSize: 20, background: "#212121", color: "#FFF" }}
        >
          終了報告を送信
        </button>
      </div>
    </div>
  );
}
