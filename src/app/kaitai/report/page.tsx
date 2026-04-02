"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Delete } from "lucide-react";
import { useAppContext } from "../lib/app-context";

// ─── Mock sites ───────────────────────────────────────────────────────────────

const SITES = [
  { id: "s1", name: "山田邸解体工事",   address: "東京都世田谷区豪徳寺2-14-5",    color: "#FF9800", active: true },
  { id: "s2", name: "旧田中倉庫解体",   address: "神奈川県川崎市幸区堀川町580",    color: "#1565C0", active: true },
  { id: "s3", name: "松本アパート解体", address: "埼玉県さいたま市浦和区常盤6-4-21", color: "#7B1FA2", active: false },
];

const CORRECT_PIN = "1234";

type Step = "site" | "pin" | "action";

// ─── Numpad keys ──────────────────────────────────────────────────────────────

const PAD_KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();
  const { setAuthSiteId } = useAppContext();

  const [step, setStep] = useState<Step>("site");
  const [selectedSite, setSelectedSite] = useState<typeof SITES[0] | null>(null);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ── PIN auto-check when 4 digits entered ─────────────────────────────────
  useEffect(() => {
    if (pin.length < 4) return;
    if (pin === CORRECT_PIN) {
      setAuthSiteId(selectedSite?.id ?? null);
      setTimeout(() => setStep("action"), 150);
    } else {
      setShake(true);
      setErrorMsg("パスワードが違います");
      setTimeout(() => {
        setShake(false);
        setPin("");
        setErrorMsg("");
      }, 700);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function handleKey(key: string) {
    if (key === "⌫") {
      setPin(p => p.slice(0, -1));
      setErrorMsg("");
    } else if (pin.length < 4) {
      setPin(p => p + key);
    }
  }

  // ── Step: site selection ─────────────────────────────────────────────────
  if (step === "site") {
    return (
      <div className="max-w-md mx-auto flex flex-col pb-4">
        <header className="px-5 pt-10 pb-5" style={{ borderBottom: "2px solid #EEEEEE" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#888888", marginBottom: 4 }}>報告する現場を選択</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: "#111111" }}>どの現場ですか？</p>
        </header>

        <div className="px-4 pt-5 flex flex-col gap-3">
          {SITES.map(site => (
            <button
              key={site.id}
              onClick={() => { setSelectedSite(site); setStep("pin"); }}
              className="w-full flex items-center gap-4 rounded-3xl text-left active:scale-[0.98] transition-transform"
              style={{
                background: "#FFFFFF",
                border: `2px solid ${site.active ? site.color + "50" : "#E0E0E0"}`,
                boxShadow: site.active ? `0 4px 16px ${site.color}18` : "none",
                minHeight: 88,
                padding: "0 20px",
                opacity: site.active ? 1 : 0.55,
              }}
            >
              {/* Color indicator */}
              <div style={{
                width: 10,
                height: 48,
                borderRadius: 5,
                background: site.active ? site.color : "#CCCCCC",
                flexShrink: 0,
              }} />
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 19, fontWeight: 900, color: "#111111", lineHeight: 1.2 }}>{site.name}</p>
                <p style={{ fontSize: 13, color: "#888888", marginTop: 3 }}>{site.address}</p>
              </div>
              {!site.active && (
                <span
                  className="px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ fontSize: 11, fontWeight: 700, background: "#F5F5F5", color: "#AAAAAA", border: "1px solid #E0E0E0" }}
                >
                  着工前
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step: PIN entry ──────────────────────────────────────────────────────
  if (step === "pin") {
    return (
      <div
        className="max-w-md mx-auto flex flex-col"
        style={{ minHeight: "100dvh", background: "#111111" }}
      >
        {/* Back */}
        <div className="px-5 pt-10 pb-2 flex items-center gap-3">
          <button
            onClick={() => { setStep("site"); setPin(""); setErrorMsg(""); }}
            className="w-11 h-11 flex items-center justify-center rounded-2xl"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </button>
          <div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>報告先</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF" }}>{selectedSite?.name}</p>
          </div>
        </div>

        {/* Title + dots */}
        <div className="flex flex-col items-center pt-6 pb-4">
          <p style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 28 }}>
            パスワードを入力
          </p>

          {/* 4-dot indicator */}
          <div
            className="flex gap-5"
            style={{
              animation: shake ? "shake 0.45s ease" : "none",
            }}
          >
            {[0,1,2,3].map(i => (
              <div
                key={i}
                style={{
                  width: 20, height: 20,
                  borderRadius: 10,
                  background: i < pin.length
                    ? (errorMsg ? "#EF5350" : "#FF9800")
                    : "rgba(255,255,255,0.2)",
                  border: i < pin.length
                    ? "none"
                    : "2px solid rgba(255,255,255,0.35)",
                  transition: "background 0.15s",
                }}
              />
            ))}
          </div>

          {/* Error message */}
          <p style={{
            fontSize: 14, fontWeight: 700,
            color: "#EF5350",
            marginTop: 16,
            minHeight: 20,
            opacity: errorMsg ? 1 : 0,
            transition: "opacity 0.2s",
          }}>
            {errorMsg || "　"}
          </p>
        </div>

        {/* Numpad */}
        <div
          className="flex-1 grid grid-cols-3 px-6 pb-6"
          style={{ gap: 12, alignContent: "center" }}
        >
          {PAD_KEYS.map((key, idx) => {
            if (key === "") return <div key={idx} />;
            const isBack = key === "⌫";
            return (
              <button
                key={idx}
                onClick={() => handleKey(key)}
                className="flex items-center justify-center rounded-3xl active:scale-95 transition-transform select-none"
                style={{
                  height: 76,
                  background: isBack ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.12)",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  fontSize: isBack ? 22 : 32,
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                {isBack ? <Delete size={26} color="#FFFFFF" /> : key}
              </button>
            );
          })}
        </div>

        {/* Shake keyframe */}
        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            15%{transform:translateX(-12px)}
            30%{transform:translateX(12px)}
            45%{transform:translateX(-10px)}
            60%{transform:translateX(10px)}
            75%{transform:translateX(-6px)}
            90%{transform:translateX(6px)}
          }
        `}</style>
      </div>
    );
  }

  // ── Step: action selection ────────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto flex flex-col pb-6">
      <header className="px-5 pt-10 pb-5" style={{ borderBottom: "2px solid #EEEEEE" }}>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => { setStep("site"); setPin(""); }}
            className="w-10 h-10 flex items-center justify-center rounded-2xl"
            style={{ background: "#F5F5F5" }}
          >
            <ChevronLeft size={20} style={{ color: "#444" }} />
          </button>
          <div>
            <p style={{ fontSize: 12, color: "#888888" }}>認証済み</p>
            <p style={{ fontSize: 17, fontWeight: 900, color: "#111111" }}>{selectedSite?.name}</p>
          </div>
        </div>
        <p style={{ fontSize: 22, fontWeight: 900, color: "#111111" }}>何を報告しますか？</p>
      </header>

      <div className="px-4 pt-5 flex flex-col gap-3">

        {/* Row 1: 勤務開始 + 休憩 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push(`/kaitai/report/start?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
            className="flex flex-col items-center justify-center rounded-3xl active:scale-[0.97] transition-transform"
            style={{ background: "#E8F5E9", border: "2px solid #66BB6A", minHeight: 120, gap: 8 }}
          >
            <span style={{ fontSize: 36 }}>🏁</span>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#1B5E20" }}>勤務開始</p>
            <p style={{ fontSize: 11, color: "#388E3C" }}>出勤を記録</p>
          </button>

          <button
            onClick={() => router.push(`/kaitai/report/break?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
            className="flex flex-col items-center justify-center rounded-3xl active:scale-[0.97] transition-transform"
            style={{ background: "#E3F2FD", border: "2px solid #42A5F5", minHeight: 120, gap: 8 }}
          >
            <span style={{ fontSize: 36 }}>☕️</span>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#0D47A1" }}>休憩</p>
            <p style={{ fontSize: 11, color: "#1565C0" }}>入り・戻り</p>
          </button>
        </div>

        {/* Row 2: 退勤 + 終了報告 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push(`/kaitai/report/clockout?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
            className="flex flex-col items-center justify-center rounded-3xl active:scale-[0.97] transition-transform"
            style={{ background: "#FFF8E1", border: "2px solid #FFA726", minHeight: 120, gap: 8 }}
          >
            <span style={{ fontSize: 36 }}>🚪</span>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#E65100" }}>退勤</p>
            <p style={{ fontSize: 11, color: "#F57C00" }}>退勤を記録</p>
          </button>

          <button
            onClick={() => router.push(`/kaitai/report/finish?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
            className="flex flex-col items-center justify-center rounded-3xl active:scale-[0.97] transition-transform"
            style={{ background: "#F5F5F5", border: "2px solid #9E9E9E", minHeight: 120, gap: 8 }}
          >
            <span style={{ fontSize: 36 }}>🚚</span>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#212121" }}>終了報告</p>
            <p style={{ fontSize: 11, color: "#616161" }}>廃材・経費入力</p>
          </button>
        </div>

        {/* Row 3: イレギュラー（full width） */}
        <button
          onClick={() => router.push(`/kaitai/report/irregular?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
          className="w-full flex items-center gap-4 rounded-3xl active:scale-[0.98] transition-transform"
          style={{ background: "#FFF0F0", border: "2px solid #EF5350", minHeight: 76, padding: "0 24px" }}
        >
          <span style={{ fontSize: 32 }}>⚠️</span>
          <div className="text-left">
            <p style={{ fontSize: 20, fontWeight: 900, color: "#B71C1C" }}>イレギュラー報告</p>
            <p style={{ fontSize: 11, color: "#C62828" }}>事故・設備破損・クレームなど</p>
          </div>
        </button>

        {/* Row 4: 経費報告（full width, large） */}
        <button
          onClick={() => router.push(`/kaitai/report/expense?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
          className="w-full flex items-center gap-4 rounded-3xl active:scale-[0.98] transition-transform"
          style={{
            background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
            border: "2px solid #86EFAC",
            minHeight: 100,
            padding: "0 24px",
          }}
        >
          <span style={{ fontSize: 40 }}>💴</span>
          <div className="text-left flex-1">
            <p style={{ fontSize: 22, fontWeight: 900, color: "#15803D" }}>経費報告</p>
            <p style={{ fontSize: 12, color: "#4ADE80", marginTop: 2 }}>
              燃料・工具・資材・交通費などを報告
            </p>
          </div>
          <div
            className="flex flex-wrap gap-1 justify-end"
            style={{ maxWidth: 120 }}
          >
            {["⛽", "🔧", "🛒", "🚗", "🍱"].map(e => (
              <span key={e} style={{ fontSize: 18 }}>{e}</span>
            ))}
          </div>
        </button>

      </div>
    </div>
  );
}
