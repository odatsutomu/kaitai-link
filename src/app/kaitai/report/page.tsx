"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Delete, MapPin } from "lucide-react";
import { useAppContext } from "../lib/app-context";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: "#1E293B", sub: "#64748B", muted: "#94A3B8",
  border: "#E2E8F0", card: "#FFFFFF",
  amber: "#F59E0B", amberDk: "#D97706",
};

// ─── Mock sites ───────────────────────────────────────────────────────────────

const SITES = [
  { id: "s1", name: "山田邸解体工事",   address: "東京都世田谷区豪徳寺2-14-5",    color: "#F59E0B", active: true },
  { id: "s2", name: "旧田中倉庫解体",   address: "神奈川県川崎市幸区堀川町580",    color: "#3B82F6", active: true },
  { id: "s3", name: "松本アパート解体", address: "埼玉県さいたま市浦和区常盤6-4-21", color: "#8B5CF6", active: false },
];

const CORRECT_PIN = "1234";

type Step = "site" | "pin" | "action";

const PAD_KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"] as const;

// ─── Action tile ──────────────────────────────────────────────────────────────

function ActionTile({
  emoji,
  label,
  sub,
  bg,
  border,
  textColor,
  onClick,
  wide = false,
}: {
  emoji: string;
  label: string;
  sub: string;
  bg: string;
  border: string;
  textColor: string;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`${wide ? "col-span-2" : ""} flex ${wide ? "flex-row items-center gap-5 px-6" : "flex-col items-center justify-center gap-2 py-6"} rounded-2xl active:scale-[0.97] transition-transform`}
      style={{
        background: bg,
        border,
        minHeight: wide ? 80 : 110,
      }}
    >
      <span style={{ fontSize: wide ? 32 : 40 }}>{emoji}</span>
      <div className={wide ? "text-left flex-1" : "text-center"}>
        <p className="font-bold" style={{ fontSize: wide ? 18 : 17, color: textColor }}>{label}</p>
        <p style={{ fontSize: 11, color: textColor, opacity: 0.75, marginTop: 2 }}>{sub}</p>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();
  const { setAuthSiteId } = useAppContext();

  const [step, setStep] = useState<Step>("site");
  const [selectedSite, setSelectedSite] = useState<typeof SITES[0] | null>(null);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
      <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>作業報告</h1>
          <p className="text-sm mt-1" style={{ color: C.sub }}>報告する現場を選択してください</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
          {SITES.map(site => (
            <button
              key={site.id}
              onClick={() => { if (site.active) { setSelectedSite(site); setStep("pin"); } }}
              className="flex items-center gap-4 rounded-xl text-left active:scale-[0.98] transition-all hover:shadow-md"
              style={{
                background: C.card,
                border: `1.5px solid ${site.active ? `${site.color}40` : C.border}`,
                boxShadow: site.active ? `0 2px 12px ${site.color}12` : "none",
                padding: "20px",
                opacity: site.active ? 1 : 0.55,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: site.active ? `${site.color}12` : "#F8FAFC" }}
              >
                <MapPin size={20} style={{ color: site.active ? site.color : C.muted }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold" style={{ color: C.text, lineHeight: 1.3 }}>{site.name}</p>
                <p className="text-xs mt-1" style={{ color: C.muted }}>{site.address}</p>
                {!site.active && (
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F8FAFC", color: C.muted, border: `1px solid ${C.border}` }}>
                    着工前
                  </span>
                )}
              </div>
              {site.active && (
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: site.color }}
                />
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
        className="max-w-sm mx-auto flex flex-col"
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
        <div className="flex flex-col items-center pt-8 pb-4">
          <p style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>
            パスワードを入力
          </p>

          <div
            className="flex gap-5"
            style={{ animation: shake ? "shake 0.45s ease" : "none" }}
          >
            {[0,1,2,3].map(i => (
              <div
                key={i}
                style={{
                  width: 20, height: 20, borderRadius: 10,
                  background: i < pin.length
                    ? (errorMsg ? "#EF4444" : C.amber)
                    : "rgba(255,255,255,0.2)",
                  border: i < pin.length ? "none" : "2px solid rgba(255,255,255,0.35)",
                  transition: "background 0.15s",
                }}
              />
            ))}
          </div>

          <p style={{
            fontSize: 14, fontWeight: 700,
            color: "#EF4444",
            marginTop: 20,
            minHeight: 20,
            opacity: errorMsg ? 1 : 0,
            transition: "opacity 0.2s",
          }}>
            {errorMsg || "　"}
          </p>
        </div>

        {/* Numpad */}
        <div
          className="flex-1 grid grid-cols-3 px-6 pb-8"
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
    <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setStep("site"); setPin(""); }}
          className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <ChevronLeft size={18} style={{ color: C.sub }} />
        </button>
        <div>
          <p className="text-xs" style={{ color: C.muted }}>認証済み</p>
          <p className="text-lg font-bold" style={{ color: C.text }}>{selectedSite?.name}</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>何を報告しますか？</h2>
        <p className="text-sm mt-1" style={{ color: C.sub }}>作業内容を選択してください</p>
      </div>

      {/* Action grid */}
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <ActionTile
          emoji="🏁"
          label="勤務開始"
          sub="出勤を記録"
          bg="#F0FDF4"
          border="1.5px solid #BBF7D0"
          textColor="#166534"
          onClick={() => router.push(`/kaitai/report/start?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
        />
        <ActionTile
          emoji="☕️"
          label="休憩"
          sub="入り・戻り"
          bg="#EFF6FF"
          border="1.5px solid #BFDBFE"
          textColor="#1E40AF"
          onClick={() => router.push(`/kaitai/report/break?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
        />
        <ActionTile
          emoji="🚪"
          label="退勤"
          sub="退勤を記録"
          bg="#FFFBEB"
          border="1.5px solid #FDE68A"
          textColor="#92400E"
          onClick={() => router.push(`/kaitai/report/clockout?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
        />
        <ActionTile
          emoji="🚚"
          label="終了報告"
          sub="廃材・経費入力"
          bg="#F8FAFC"
          border={`1.5px solid ${C.border}`}
          textColor={C.text}
          onClick={() => router.push(`/kaitai/report/finish?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
        />

        {/* Wide tiles */}
        <ActionTile
          emoji="⚠️"
          label="イレギュラー報告"
          sub="事故・設備破損・クレームなど"
          bg="#FEF2F2"
          border="1.5px solid #FECACA"
          textColor="#991B1B"
          onClick={() => router.push(`/kaitai/report/irregular?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
          wide
        />
        <ActionTile
          emoji="💴"
          label="経費報告"
          sub="燃料・工具・資材・交通費などを報告"
          bg="#F0FDF4"
          border="1.5px solid #BBF7D0"
          textColor="#166534"
          onClick={() => router.push(`/kaitai/report/expense?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
          wide
        />
      </div>
    </div>
  );
}
