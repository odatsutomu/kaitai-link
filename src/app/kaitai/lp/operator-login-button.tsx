"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, X, Eye, EyeOff } from "lucide-react";

const OPERATOR_PIN = "9999";

export function OperatorLoginButton() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [pin,       setPin]       = useState("");
  const [showPin,   setShowPin]   = useState(false);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);

  function handleLogin() {
    if (!pin) { setError("パスワードを入力してください"); return; }
    setLoading(true);
    setTimeout(() => {
      if (pin === OPERATOR_PIN) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("kaitai_operator_auth", "true");
        }
        router.push("/operator");
      } else {
        setError("パスワードが違います");
        setPin("");
        setLoading(false);
      }
    }, 400);
  }

  function handleClose() {
    setShowModal(false);
    setPin("");
    setError("");
    setLoading(false);
  }

  return (
    <>
      {/* Subtle footer link */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          fontSize: 11,
          color: "#475569",
          opacity: 0.45,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: 6,
          transition: "opacity 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "0.45")}
      >
        <Lock size={10} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
        運営者ログイン
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={handleClose}
        >
          <div
            className="w-full rounded-2xl"
            style={{
              maxWidth: 380,
              background: "#0F1928",
              border: "1px solid #2D3E54",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid #2D3E54" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(245,158,11,0.12)" }}
                >
                  <Lock size={15} style={{ color: "#F59E0B" }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9" }}>運営者ログイン</p>
                  <p style={{ fontSize: 10, color: "#475569" }}>解体LINK 管理ダッシュボード</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ background: "#1A2535" }}
              >
                <X size={16} style={{ color: "#64748B" }} />
              </button>
            </div>

            {/* Form */}
            <div className="px-5 py-5 flex flex-col gap-3">
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={e => { setPin(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="運営者パスワード"
                  autoFocus
                  className="w-full rounded-xl px-4 pr-12 outline-none"
                  style={{
                    height: 52,
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 2,
                    background: "#1A2535",
                    border: error ? "1.5px solid #EF4444" : "1.5px solid #2D3E54",
                    color: "#F1F5F9",
                  }}
                />
                <button
                  onClick={() => setShowPin(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#475569" }}
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <p style={{ fontSize: 12, color: "#EF4444" }}>{error}</p>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl font-black transition-all"
                style={{
                  height: 48,
                  fontSize: 15,
                  background: loading ? "#2D3E54" : "#F59E0B",
                  color: loading ? "#64748B" : "#111111",
                }}
              >
                {loading ? "確認中..." : (
                  <>
                    <Lock size={15} />
                    ダッシュボードへ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
