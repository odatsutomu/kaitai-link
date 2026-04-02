"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronRight, Building2 } from "lucide-react";
import Link from "next/link";
import { KaitaiLogo } from "../components/kaitai-logo";
import { useAppContext } from "../lib/app-context";
import type { Company } from "../lib/app-context";

// ─── Mock company registry ────────────────────────────────────────────────────
// 実際のシステムではDBから取得する

const COMPANY_REGISTRY: Record<string, Company & { loginId: string }> = {
  "kaitai-demo": {
    loginId: "kaitai-demo",
    id: "demo",
    name: "解体工業株式会社",
    address: "東京都世田谷区1-1-1",
    phone: "03-1234-5678",
    adminName: "田中 義雄",
    adminEmail: "tanaka@kaitai.jp",
    password1: "kaitai2026",
    password2: "0000",
    plan: "standard",
    stripeCustomerId: "cus_mock_DEMO00001",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  "yamada-const": {
    loginId: "yamada-const",
    id: "yamada001",
    name: "山田建設株式会社",
    address: "大阪府大阪市北区2-3-4",
    phone: "06-2345-6789",
    adminName: "山田 一郎",
    adminEmail: "yamada@yamada-const.jp",
    password1: "yamada123",
    password2: "1111",
    plan: "business",
    stripeCustomerId: "cus_mock_YAMADA001",
    createdAt: "2026-02-01T00:00:00.000Z",
  },
  "suzuki-kai": {
    loginId: "suzuki-kai",
    id: "suzuki001",
    name: "鈴木解体工業",
    address: "愛知県名古屋市中区3-5-6",
    phone: "052-345-6789",
    adminName: "鈴木 健二",
    adminEmail: "suzuki@suzuki-kai.jp",
    password1: "suzuki456",
    password2: "2222",
    plan: "free",
    stripeCustomerId: "",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { setAuthLevel, setCompany, addLog } = useAppContext();

  const [loginId,  setLoginId]  = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  function handleLogin() {
    if (!loginId.trim()) { setError("会社IDを入力してください"); return; }
    if (!password)       { setError("パスワードを入力してください"); return; }
    setLoading(true);
    setTimeout(() => {
      const entry = COMPANY_REGISTRY[loginId.trim().toLowerCase()];
      if (!entry) {
        setError("会社IDが見つかりません");
        setLoading(false);
        return;
      }
      if (password !== entry.password1) {
        setError("パスワードが違います");
        setPassword("");
        setLoading(false);
        return;
      }
      // ログイン成功
      const { loginId: _lid, ...company } = entry;
      setCompany(company);
      setAuthLevel("worker");
      addLog("login_worker", company.adminName);
      router.push("/kaitai");
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
            会社IDとパスワードを入力してください
          </p>

          {/* Company ID input */}
          <div className="relative mb-3">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Building2 size={18} color="#AAAAAA" />
            </div>
            <input
              type="text"
              value={loginId}
              onChange={e => { setLoginId(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="会社ID（例: kaitai-demo）"
              className="w-full rounded-2xl pl-11 pr-5 outline-none"
              style={{
                height: 56,
                fontSize: 15,
                fontWeight: 600,
                background: "#F9FAFB",
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
              height: 60, fontSize: 18,
              background: loading ? "#CCCCCC" : "#111111",
              color: "#FFFFFF",
            }}
          >
            {loading ? "確認中..." : <>ログイン <ChevronRight size={22} /></>}
          </button>

          {/* Demo hint */}
          <div className="mt-4 rounded-2xl p-4" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
            <p style={{ fontSize: 11, color: "#B45309", fontWeight: 700, marginBottom: 6 }}>デモ用アカウント</p>
            <div className="flex flex-col gap-1">
              {[
                { id: "kaitai-demo", pw: "kaitai2026", company: "解体工業株式会社" },
                { id: "yamada-const", pw: "yamada123",  company: "山田建設株式会社" },
                { id: "suzuki-kai",   pw: "suzuki456",  company: "鈴木解体工業" },
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => { setLoginId(d.id); setPassword(d.pw); setError(""); }}
                  className="text-left rounded-xl px-3 py-2 transition-colors hover:bg-orange-100"
                  style={{ background: "rgba(255,255,255,0.6)" }}
                >
                  <p style={{ fontSize: 12, color: "#92400E", fontWeight: 700 }}>{d.company}</p>
                  <p style={{ fontSize: 11, color: "#B45309" }}>
                    ID: <strong>{d.id}</strong>  PW: <strong>{d.pw}</strong>
                  </p>
                </button>
              ))}
            </div>
          </div>
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
        <p style={{ fontSize: 13, color: "#888888" }}>
          アカウントをお持ちでない方は{" "}
          <Link href="/kaitai/signup" style={{ color: "#F59E0B", fontWeight: 700 }}>
            新規会社登録
          </Link>
        </p>
      </div>

    </div>
  );
}
