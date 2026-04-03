"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Delete, MapPin } from "lucide-react";
import { useAppContext, countActiveStaff } from "../lib/app-context";
import { T } from "../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: T.sub,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
};

// ─── Mock sites ───────────────────────────────────────────────────────────────

const SITES = [
  { id: "s1", name: "山田邸解体工事",   address: "東京都世田谷区豪徳寺2-14-5",    color: T.primary, active: true },
  { id: "s2", name: "旧田中倉庫解体",   address: "神奈川県川崎市幸区堀川町580",    color: "#3B82F6", active: true },
  { id: "s3", name: "松本アパート解体", address: "埼玉県さいたま市浦和区常盤6-4-21", color: "#8B5CF6", active: false },
];

const CORRECT_PIN = "1234";

type Step = "site" | "pin" | "action";

const PAD_KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"] as const;

// ─── Action tile ──────────────────────────────────────────────────────────────

function ActionTile({
  emoji, label, sub, bg, border, textColor, onClick, wide = false, disabled = false, onDisabledTap,
}: {
  emoji: string; label: string; sub: string; bg: string; border: string; textColor: string;
  onClick: () => void; wide?: boolean; disabled?: boolean; onDisabledTap?: () => void;
}) {
  const handleClick = () => {
    if (disabled) { onDisabledTap?.(); return; }
    onClick();
  };
  return (
    <button
      onClick={handleClick}
      className={`${wide ? "col-span-2" : ""} flex ${wide ? "flex-row items-center gap-5 px-6" : "flex-col items-center justify-center gap-2 py-6"} rounded-2xl transition-transform`}
      style={{
        background: disabled ? T.bg : bg,
        border: disabled ? "1.5px solid #E2E8F0" : border,
        borderRadius: 16,
        minHeight: wide ? 80 : 120,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span style={{ fontSize: wide ? 32 : 40, filter: disabled ? "grayscale(1)" : "none" }}>{emoji}</span>
      <div className={wide ? "text-left flex-1" : "text-center"}>
        <p style={{ fontSize: 18, fontWeight: 700, color: disabled ? T.muted : textColor }}>{label}</p>
        <p style={{ fontSize: 14, color: disabled ? T.muted : textColor, opacity: 0.75, marginTop: 3 }}>{sub}</p>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();
  const { setAuthSiteId, attendanceLogs } = useAppContext();

  const [step, setStep] = useState<Step>("site");
  const [selectedSite, setSelectedSite] = useState<typeof SITES[0] | null>(null);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [snackbar, setSnackbar] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const activeCount = selectedSite
    ? countActiveStaff(attendanceLogs, selectedSite.id, today)
    : 0;

  function showSnackbar(msg: string) {
    setSnackbar(msg);
    setTimeout(() => setSnackbar(""), 2500);
  }

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
          <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>報告する現場を選択してください</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
          {SITES.map(site => (
            <button
              key={site.id}
              onClick={() => { if (site.active) { setSelectedSite(site); setStep("pin"); } }}
              className="flex items-center gap-4 text-left active:scale-[0.98] transition-all cursor-pointer"
              style={{
                background: C.card,
                border: `1.5px solid ${site.active ? `${site.color}40` : C.border}`,
                borderRadius: 16,
                boxShadow: site.active ? `0 2px 12px ${site.color}12` : "0 2px 4px rgba(0,0,0,0.06)",
                padding: "20px",
                opacity: site.active ? 1 : 0.55,
                minHeight: 120,
              }}
              onMouseEnter={(e) => {
                if (site.active) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = T.primary;
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 15px rgba(0,0,0,0.1)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = site.active ? `${site.color}40` : C.border;
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = site.active ? `0 2px 12px ${site.color}12` : "0 2px 4px rgba(0,0,0,0.06)";
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0 rounded-xl"
                style={{ width: 48, height: 48, background: site.active ? `${site.color}12` : T.bg }}
              >
                <MapPin size={22} style={{ color: site.active ? site.color : C.muted }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{site.name}</p>
                <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>{site.address}</p>
                {!site.active && (
                  <span style={{ display: "inline-block", marginTop: 8, fontSize: 14, fontWeight: 600, padding: "5px 12px", borderRadius: 20, background: T.bg, color: C.muted, border: `1px solid ${C.border}` }}>
                    着工前
                  </span>
                )}
              </div>
              {site.active && (
                <div
                  className="rounded-full flex-shrink-0"
                  style={{ width: 10, height: 10, background: site.color }}
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
            className="flex items-center justify-center rounded-2xl"
            style={{ width: 44, height: 44, background: "rgba(255,255,255,0.1)" }}
          >
            <ChevronLeft size={22} color={T.surface} />
          </button>
          <div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>報告先</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: T.surface }}>{selectedSite?.name}</p>
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
                  color: T.surface,
                }}
              >
                {isBack ? <Delete size={26} color={T.surface} /> : key}
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
          className="flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
          style={{ width: 44, height: 44, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}
        >
          <ChevronLeft size={20} style={{ color: C.sub }} />
        </button>
        <div>
          <p style={{ fontSize: 14, color: C.muted }}>認証済み</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{selectedSite?.name}</p>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>何を報告しますか？</h2>
        <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>作業内容を選択してください</p>
      </div>

      {/* Active staff indicator */}
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: activeCount > 0 ? "#10B981" : T.muted }}
        />
        <span style={{ fontSize: 14, color: activeCount > 0 ? "#166534" : T.muted, fontWeight: 600 }}>
          現在 出勤中: {activeCount}名
        </span>
      </div>

      {/* Action grid */}
      <div className="grid grid-cols-2 gap-5 max-w-2xl">
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
          disabled={activeCount === 0}
          onDisabledTap={() => showSnackbar("現在、出勤中のスタッフがいません")}
          onClick={() => router.push(`/kaitai/report/break?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
        />
        <ActionTile
          emoji="🚪"
          label="退勤"
          sub="退勤を記録"
          bg={T.primaryLt}
          border="1.5px solid #E5E7EB"
          textColor={T.primaryDk}
          disabled={activeCount === 0}
          onDisabledTap={() => showSnackbar("現在、出勤中のスタッフがいません")}
          onClick={() => router.push(`/kaitai/report/clockout?site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`)}
        />
        <ActionTile
          emoji="🚚"
          label="終了報告"
          sub="廃材・経費入力"
          bg={T.bg}
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

      {/* Snackbar */}
      {snackbar && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl z-50 pointer-events-none"
          style={{
            background: T.text,
            color: T.surface,
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          ⚠️ {snackbar}
        </div>
      )}
    </div>
  );
}
