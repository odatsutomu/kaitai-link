"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Delete } from "lucide-react";

interface PinPadProps {
  title: string;
  subtitle?: string;
  correctPin: string;
  onSuccess: () => void;
  onBack?: () => void;
  dark?: boolean;
}

const KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"] as const;

export function PinPad({ title, subtitle, correctPin, onSuccess, onBack, dark = true }: PinPadProps) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");

  const bg    = dark ? "#111111" : "#F5F5F5";
  const keyBg = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";
  const keyBo = dark ? "1.5px solid rgba(255,255,255,0.1)" : "1.5px solid rgba(0,0,0,0.08)";
  const fg    = dark ? "#FFFFFF" : "#111111";
  const dim   = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)";

  useEffect(() => {
    if (pin.length < 4) return;
    if (pin === correctPin) {
      setTimeout(onSuccess, 120);
    } else {
      setShake(true);
      setError("パスワードが違います");
      setTimeout(() => { setShake(false); setPin(""); setError(""); }, 700);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function press(k: string) {
    if (k === "⌫") { setPin(p => p.slice(0, -1)); setError(""); }
    else if (pin.length < 4) setPin(p => p + k);
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh", background: bg }}>
      {/* Back */}
      {onBack && (
        <div className="px-5 pt-10 pb-2">
          <button
            onClick={onBack}
            className="w-11 h-11 flex items-center justify-center rounded-2xl"
            style={{ background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)" }}
          >
            <ChevronLeft size={22} style={{ color: fg }} />
          </button>
        </div>
      )}

      {/* Title + dots */}
      <div className="flex flex-col items-center pt-12 pb-4">
        <p style={{ fontSize: 18, fontWeight: 700, color: dim, marginBottom: 6 }}>{title}</p>
        {subtitle && <p style={{ fontSize: 14, color: dim, marginBottom: 20 }}>{subtitle}</p>}

        <div style={{ animation: shake ? "shake 0.45s ease" : "none", display: "flex", gap: 20 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 20, height: 20, borderRadius: 10,
              background: i < pin.length ? (error ? "#EF5350" : "#FF9800") : (dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"),
              border: i < pin.length ? "none" : `2px solid ${dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)"}`,
              transition: "background 0.15s",
            }} />
          ))}
        </div>

        <p style={{ fontSize: 14, fontWeight: 700, color: "#EF5350", marginTop: 14, minHeight: 18, opacity: error ? 1 : 0, transition: "opacity 0.2s" }}>
          {error || "　"}
        </p>
      </div>

      {/* Numpad */}
      <div className="flex-1 grid grid-cols-3 px-6 pb-6 max-w-sm mx-auto w-full" style={{ gap: 12, alignContent: "center" }}>
        {KEYS.map((k, i) => {
          if (k === "") return <div key={i} />;
          return (
            <button
              key={i}
              onClick={() => press(k)}
              className="flex items-center justify-center rounded-3xl active:scale-95 transition-transform select-none"
              style={{ height: 76, background: keyBg, border: keyBo }}
            >
              {k === "⌫"
                ? <Delete size={24} style={{ color: fg }} />
                : <span style={{ fontSize: 30, fontWeight: 700, color: fg }}>{k}</span>
              }
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
