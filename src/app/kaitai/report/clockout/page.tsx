"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, CheckCircle } from "lucide-react";
import { useAppContext } from "../../lib/app-context";

const MEMBERS = [
  { id: "m1", name: "田中 義雄", role: "職長" },
  { id: "m2", name: "鈴木 健太", role: "作業員" },
  { id: "m3", name: "山本 大輔", role: "作業員" },
  { id: "m4", name: "佐藤 翔",   role: "作業員" },
  { id: "m5", name: "渡辺 誠",   role: "作業員" },
  { id: "m6", name: "伊藤 拓也", role: "補助" },
];

export default function ClockOutPage() {
  const router = useRouter();
  const params = useSearchParams();
  const siteName = params.get("name") ?? "現場";
  const { addLog, company } = useAppContext();

  const [selected, setSelected] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function confirm() {
    if (selected.length === 0) return;
    const names = selected.map(id => MEMBERS.find(m => m.id === id)?.name ?? id).join("、");
    addLog(`clockout: ${siteName} / ${names} [${company?.stripeCustomerId ?? "—"}]`, names);
    setDone(true);
    setTimeout(() => router.push("/kaitai"), 1800);
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center" style={{ minHeight: "100dvh", background: "#FFF8E1" }}>
        <CheckCircle size={96} color="#E65100" strokeWidth={1.5} />
        <p style={{ fontSize: 28, fontWeight: 900, color: "#E65100", marginTop: 24 }}>退勤 記録完了</p>
        <p style={{ fontSize: 15, color: "#F57C00", marginTop: 8 }}>{siteName}</p>
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
        <p style={{ fontSize: 26, fontWeight: 900, color: "#E65100" }}>🚪 退勤</p>
        <p style={{ fontSize: 14, color: "#666", marginTop: 4 }}>退勤するメンバーを選択してください</p>
      </header>

      <div className="px-4 pt-5 flex flex-col gap-3 flex-1">
        {MEMBERS.map(m => {
          const on = selected.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className="w-full flex items-center gap-4 rounded-2xl px-5 transition-all active:scale-[0.98]"
              style={{
                minHeight: 72,
                background: on ? "#FFF8E1" : "#FFFFFF",
                border: on ? "2.5px solid #FFA726" : "2px solid #EEEEEE",
              }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                style={{ background: on ? "#FFA726" : "#F5F5F5", color: on ? "#FFF" : "#888" }}>
                {m.name.charAt(0)}
              </div>
              <div className="flex-1 text-left">
                <p style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>{m.name}</p>
                <p style={{ fontSize: 12, color: "#888" }}>{m.role}</p>
              </div>
              {on && <CheckCircle size={22} color="#FFA726" />}
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-4">
        <button
          onClick={confirm}
          disabled={selected.length === 0}
          className="w-full flex items-center justify-center gap-2 rounded-3xl font-black transition-all"
          style={{
            height: 68, fontSize: 20,
            background: selected.length > 0 ? "#E65100" : "#E0E0E0",
            color: selected.length > 0 ? "#FFF" : "#AAA",
          }}
        >
          {selected.length > 0 ? `${selected.length}名 退勤を記録` : "メンバーを選択"}
        </button>
      </div>
    </div>
  );
}
