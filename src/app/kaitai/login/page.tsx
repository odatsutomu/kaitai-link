"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronRight } from "lucide-react";
import Link from "next/link";
import { KaitaiLogo } from "../components/kaitai-logo";
import { useAppContext } from "../lib/app-context";

export default function LoginPage() {
  const router = useRouter();
  const { company, setAuthLevel, addLog } = useAppContext();

  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  function handleLogin() {
    if (!password) { setError("パスワードを入力してください"); return; }
    setLoading(true);
    setTimeout(() => {
      const correct = company?.password1 ?? "kaitai2026";
      if (password === correct) {
        setAuthLevel("worker");
        addLog("login_worker", company?.adminName ?? "—");
        router.push("/kaitai");
      } else {
        setError("パスワードが違います");
        setPassword("");
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div className="max-w-md mx-auto flex flex-col min-h-screen" style={{ background: "#FFFFFF" }}>

      {/* Top area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
        <div className="mb-10">
          <KaitaiLogo iconSize={56} textSize={32} />
        </div>

        <div className="w-full">
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#111111", marginBottom: 6 }}>ログイン</h2>
          <p style={{ fontSize: 14, color: "#888888", marginBottom: 28 }}>
            {company?.name ?? "解体LINK"} の共有パスワードを入力
          </p>

          {/* Password input */}
          <div className="relative mb-3">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="共有パスワード"
              className="w-full rounded-2xl px-5 pr-14 outline-none"
              style={{
                height: 64,
                fontSize: 18,
                fontWeight: 700,
                background: "#F9FAFB",
                border: error ? "2px solid #EF4444" : "2px solid #EEEEEE",
                color: "#111111",
              }}
            />
            <button
              onClick={() => setShowPw(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: "#AAAAAA" }}
            >
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && <p style={{ fontSize: 13, color: "#EF4444", marginBottom: 8 }}>{error}</p>}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-3xl font-black transition-all active:scale-[0.98] mt-2"
            style={{
              height: 64, fontSize: 18,
              background: loading ? "#CCCCCC" : "#111111",
              color: "#FFFFFF",
            }}
          >
            {loading ? "確認中..." : <>ログイン <ChevronRight size={22} /></>}
          </button>

          {/* Hint for demo */}
          <div className="mt-4 rounded-2xl p-3" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
            <p style={{ fontSize: 11, color: "#B45309", fontWeight: 700 }}>デモ用パスワード</p>
            <p style={{ fontSize: 12, color: "#92400E" }}>共有パスワード: <strong>kaitai2026</strong></p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-10 flex flex-col items-center gap-3">
        <p style={{ fontSize: 13, color: "#888888" }}>
          アカウントをお持ちでない方は
        </p>
        <Link href="/kaitai/signup">
          <div
            className="px-6 py-3 rounded-2xl font-bold"
            style={{ background: "#F5F5F5", color: "#333333", fontSize: 14, border: "1.5px solid #E0E0E0" }}
          >
            新規会社登録はこちら →
          </div>
        </Link>
      </div>

    </div>
  );
}
