"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronRight, Mail } from "lucide-react";
import Link from "next/link";
import { KaitaiLogo } from "../components/kaitai-logo";
import { useAppContext } from "../lib/app-context";
import type { Company, PlanId } from "../lib/app-context";
import { T } from "../lib/design-tokens";

export default function LoginPage() {
  const router = useRouter();
  const { setAuthLevel, setCompany, addLog } = useAppContext();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!email.trim())  { setError("メールアドレスを入力してください"); return; }
    if (!password)      { setError("パスワードを入力してください"); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/kaitai/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "ログインに失敗しました");
        if (res.status === 401) setPassword("");
        setLoading(false);
        return;
      }

      // ログイン成功 — セッション cookie は自動セット済み
      const company: Company = {
        id:               data.company.id,
        name:             data.company.name,
        adminName:        data.company.adminName,
        adminEmail:       data.company.adminEmail,
        plan:             (data.company.plan ?? "free") as PlanId,
        stripeCustomerId: data.company.stripeCustomerId,
      };
      setCompany(company);
      setAuthLevel(data.authLevel ?? "worker");
      addLog(`login_${data.authLevel}`, company.adminName);
      router.push("/kaitai");
    } catch {
      setError("通信エラーが発生しました");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto flex flex-col min-h-screen" style={{ background: T.surface }}>

      {/* Top area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
        <div className="mb-10">
          <KaitaiLogo iconSize={56} textSize={32} />
        </div>

        <div className="w-full">
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#111111", marginBottom: 6 }}>ログイン</h2>
          <p style={{ fontSize: 14, color: "#888888", marginBottom: 28 }}>
            メールアドレスとパスワードを入力してください
          </p>

          {/* Email input */}
          <div className="relative mb-3">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Mail size={18} color="#AAAAAA" />
            </div>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="メールアドレス"
              className="w-full rounded-2xl pl-11 pr-5 outline-none"
              style={{
                height: 56,
                fontSize: 15,
                fontWeight: 600,
                background: T.bg,
                border: error ? "2px solid #EF4444" : "2px solid #EEEEEE",
                color: "#111111",
              }}
            />
          </div>

          {/* Password input */}
          <div className="relative mb-3">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="パスワード"
              className="w-full rounded-2xl px-5 pr-14 outline-none"
              style={{
                height: 56,
                fontSize: 16,
                fontWeight: 700,
                background: T.bg,
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

          {error && <p style={{ fontSize: 14, color: "#EF4444", marginBottom: 8 }}>{error}</p>}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-3xl font-black transition-all active:scale-[0.98] mt-2"
            style={{
              height: 60, fontSize: 18,
              background: loading ? "#CCCCCC" : "#111111",
              color: T.surface,
            }}
          >
            {loading ? "確認中..." : <>ログイン <ChevronRight size={22} /></>}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-10 flex flex-col items-center gap-3">
        <Link href="/kaitai/lp">
          <div
            className="px-6 py-3 rounded-2xl font-bold transition-colors hover:bg-gray-100"
            style={{ background: "#F5F5F5", color: "#333333", fontSize: 14, border: "1.5px solid #E0E0E0" }}
          >
            解体LINKについて →
          </div>
        </Link>
        <p style={{ fontSize: 14, color: "#888888" }}>
          アカウントをお持ちでない方は{" "}
          <Link href="/kaitai/signup" style={{ color: T.primary, fontWeight: 700 }}>
            新規会社登録
          </Link>
        </p>
      </div>

    </div>
  );
}
