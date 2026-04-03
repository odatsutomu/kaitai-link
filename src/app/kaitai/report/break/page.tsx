"use client";

import { useState, Suspense } from "react";
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

function BreakPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const siteId   = params.get("site") ?? "";
  const siteName = params.get("name") ?? "現場";
  const { addLog, company } = useAppContext();

  const [breakType, setBreakType] = useState<"in" | "back">("in");
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
    const label = breakType === "in" ? "休憩入り" : "休憩戻り";
    addLog(`break_${breakType}: ${siteName} / ${names} [${company?.stripeCustomerId ?? "—"}]`, names);
    setDone(true);
    setTimeout(() => router.push("/kaitai"), 1800);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ background: "#E3F2FD", borderRadius: 16, padding: "64px 32px" }}>
        <CheckCircle size={96} color="#1565C0" strokeWidth={1.5} />
        <p style={{ fontSize: 28, fontWeight: 900, color: "#0D47A1", marginTop: 24 }}>
          {breakType === "in" ? "休憩入り" : "休憩戻り"} 記録完了
        </p>
        <p style={{ fontSize: 15, color: "#1565C0", marginTop: 8 }}>{siteName}</p>
      </div>
    );
  }

  return (
    <div className="py-6 pb-28 md:pb-8 flex flex-col gap-5">
      <header className="flex flex-col gap-2" style={{ borderBottom: "2px solid #EEEEEE", paddingBottom: 20 }}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-2xl" style={{ background: "#F5F5F5" }}>
            <ChevronLeft size={20} style={{ color: "#444" }} />
          </button>
          <span style={{ fontSize: 14, color: "#888" }}>{siteName}</span>
        </div>
        <p style={{ fontSize: 26, fontWeight: 900, color: "#0D47A1" }}>☕️ 休憩</p>
        <p style={{ fontSize: 14, color: "#666", marginTop: 4 }}>休憩の種類とメンバーを選択</p>
      </header>

      <div className="flex flex-col gap-5">
        {/* Toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl p-1" style={{ background: "#F3F4F6" }}>
          {(["in", "back"] as const).map(t => (
            <button
              key={t}
              onClick={() => setBreakType(t)}
              className="rounded-xl py-3 font-bold text-base transition-all"
              style={breakType === t
                ? { background: "#1565C0", color: "#FFF" }
                : { background: "transparent", color: "#888" }}
            >
              {t === "in" ? "☕️ 休憩入り" : "🔙 休憩戻り"}
            </button>
          ))}
        </div>

        {/* Members */}
        <div className="flex flex-col gap-3">
          {MEMBERS.map(m => {
            const on = selected.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className="w-full flex items-center gap-4 rounded-2xl px-5 transition-all active:scale-[0.98]"
                style={{
                  minHeight: 72,
                  background: on ? "#E3F2FD" : "#FFFFFF",
                  border: on ? "2.5px solid #1565C0" : "2px solid #EEEEEE",
                }}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                  style={{ background: on ? "#1565C0" : "#F5F5F5", color: on ? "#FFF" : "#888" }}>
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <p style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>{m.name}</p>
                  <p style={{ fontSize: 14, color: "#888" }}>{m.role}</p>
                </div>
                {on && <CheckCircle size={22} color="#1565C0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={confirm}
          disabled={selected.length === 0}
          className="w-full flex items-center justify-center gap-2 rounded-3xl font-black transition-all"
          style={{
            height: 68, fontSize: 20,
            background: selected.length > 0 ? "#1565C0" : "#E0E0E0",
            color: selected.length > 0 ? "#FFF" : "#AAA",
          }}
        >
          {selected.length > 0
            ? `${selected.length}名 ${breakType === "in" ? "休憩入り" : "休憩戻り"}を記録`
            : "メンバーを選択"}
        </button>
      </div>
    </div>
  );
}

export default function BreakPage() {
  return (
    <Suspense fallback={null}>
      <BreakPageInner />
    </Suspense>
  );
}
