"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Users, TrendingUp, CreditCard, LogOut,
  Lock, Eye, EyeOff, BarChart2, CheckCircle2,
  AlertCircle, Clock, ChevronRight, X,
} from "lucide-react";

// ─── Auth guard ───────────────────────────────────────────────────────────────
const OPERATOR_PIN = "9999";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_COMPANIES = [
  {
    id: "demo",
    name: "解体工業株式会社",
    loginId: "kaitai-demo",
    adminName: "田中 義雄",
    plan: "standard" as const,
    mrr: 9_800,
    status: "active" as const,
    joinedAt: "2026-01-01",
    lastLogin: "2026-04-03",
    sites: 4,
    members: 7,
  },
  {
    id: "yamada001",
    name: "山田建設株式会社",
    loginId: "yamada-const",
    adminName: "山田 一郎",
    plan: "business" as const,
    mrr: 29_800,
    status: "active" as const,
    joinedAt: "2026-02-01",
    lastLogin: "2026-04-02",
    sites: 12,
    members: 35,
  },
  {
    id: "suzuki001",
    name: "鈴木解体工業",
    loginId: "suzuki-kai",
    adminName: "鈴木 健二",
    plan: "free" as const,
    mrr: 0,
    status: "active" as const,
    joinedAt: "2026-03-01",
    lastLogin: "2026-03-28",
    sites: 1,
    members: 3,
  },
  {
    id: "tanaka002",
    name: "田中産業株式会社",
    loginId: "tanaka-ind",
    adminName: "田中 剛",
    plan: "standard" as const,
    mrr: 9_800,
    status: "trial" as const,
    joinedAt: "2026-03-20",
    lastLogin: "2026-04-01",
    sites: 2,
    members: 8,
  },
  {
    id: "matsu003",
    name: "松本工務店",
    loginId: "matsu-komu",
    adminName: "松本 悠斗",
    plan: "free" as const,
    mrr: 0,
    status: "inactive" as const,
    joinedAt: "2026-02-15",
    lastLogin: "2026-03-01",
    sites: 0,
    members: 1,
  },
];

const RECENT_SIGNUPS = [
  { name: "田中産業株式会社", plan: "standard", date: "2026-03-20", adminName: "田中 剛" },
  { name: "鈴木解体工業",     plan: "free",     date: "2026-03-01", adminName: "鈴木 健二" },
  { name: "山田建設株式会社", plan: "business", date: "2026-02-01", adminName: "山田 一郎" },
];

const PLAN_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  free:       { bg: "#F1F5F9", fg: "#475569", label: "Free" },
  standard:   { bg: "#FFFBEB", fg: "#D97706", label: "Standard" },
  business:   { bg: "#EFF6FF", fg: "#2563EB", label: "Business" },
  enterprise: { bg: "#F5F3FF", fg: "#7C3AED", label: "Enterprise" },
};

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  active:   { bg: "#F0FDF4", fg: "#16A34A", label: "利用中" },
  trial:    { bg: "#FFFBEB", fg: "#D97706", label: "トライアル" },
  inactive: { bg: "#F8FAFC", fg: "#94A3B8", label: "非アクティブ" },
};

// ─── Login screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const router = useRouter();
  const [pin,     setPin]     = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    if (!pin) { setError("パスワードを入力してください"); return; }
    setLoading(true);
    setTimeout(() => {
      if (pin === OPERATOR_PIN) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("kaitai_operator_auth", "true");
        }
        onAuth();
      } else {
        setError("パスワードが違います");
        setPin("");
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#080F1A" }}
    >
      <div className="w-full" style={{ maxWidth: 380 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}
          >
            <Lock size={28} style={{ color: "#F59E0B" }} />
          </div>
          <p style={{ fontSize: 22, fontWeight: 900, color: "#F1F5F9" }}>解体LINK 運営ダッシュボード</p>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>運営者専用アクセス</p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: "#0F1928", border: "1px solid #2D3E54" }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16 }}>運営者パスワード</p>

          <div className="relative mb-3">
            <input
              type={showPin ? "text" : "password"}
              value={pin}
              onChange={e => { setPin(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="パスワードを入力"
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

          {error && <p style={{ fontSize: 12, color: "#EF4444", marginBottom: 8 }}>{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl font-black"
            style={{
              height: 48,
              fontSize: 15,
              background: loading ? "#2D3E54" : "#F59E0B",
              color: loading ? "#64748B" : "#111111",
            }}
          >
            {loading ? "認証中..." : "ログイン"}
          </button>
        </div>

        <button
          onClick={() => router.push("/kaitai/lp")}
          className="mt-4 w-full text-center text-sm"
          style={{ color: "#475569" }}
        >
          ← LP に戻る
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const totalMrr   = MOCK_COMPANIES.reduce((s, c) => s + c.mrr, 0);
  const activeCount = MOCK_COMPANIES.filter(c => c.status === "active").length;
  const paidCount   = MOCK_COMPANIES.filter(c => c.plan !== "free").length;

  const planBreakdown = {
    free:       MOCK_COMPANIES.filter(c => c.plan === "free").length,
    standard:   MOCK_COMPANIES.filter(c => c.plan === "standard").length,
    business:   MOCK_COMPANIES.filter(c => c.plan === "business").length,
    enterprise: MOCK_COMPANIES.filter(c => (c.plan as string) === "enterprise").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Noto Sans JP', sans-serif" }}>

      {/* Top bar */}
      <header
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 10 }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "#FFFBEB" }}
          >
            <Lock size={16} style={{ color: "#F59E0B" }} />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 900, color: "#1E293B" }}>解体LINK 運営ダッシュボード</p>
            <p style={{ fontSize: 11, color: "#94A3B8" }}>SaaS管理・会社一覧・収益レポート</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
          style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}
        >
          <LogOut size={14} />
          ログアウト
        </button>
      </header>

      <div className="px-6 py-6" style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "月次収益（MRR）",     value: `¥${totalMrr.toLocaleString()}`, sub: "税別", icon: TrendingUp, color: "#10B981", bg: "#F0FDF4" },
            { label: "登録会社数",           value: MOCK_COMPANIES.length,            sub: `アクティブ ${activeCount}社`, icon: Building2, color: "#3B82F6", bg: "#EFF6FF" },
            { label: "有料契約",             value: `${paidCount}社`,                 sub: `転換率 ${Math.round((paidCount/MOCK_COMPANIES.length)*100)}%`, icon: CreditCard, color: "#F59E0B", bg: "#FFFBEB" },
            { label: "総ユーザー",           value: MOCK_COMPANIES.reduce((s,c) => s+c.members, 0), sub: "全会社合計", icon: Users, color: "#8B5CF6", bg: "#F5F3FF" },
          ].map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={16} style={{ color }} />
                </div>
              </div>
              <p style={{ fontSize: 26, fontWeight: 900, color: "#1E293B" }}>{value}</p>
              <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{sub}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Main: company table ── */}
          <div className="flex-1 min-w-0">
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1E293B" }}>登録会社一覧</h2>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>{MOCK_COMPANIES.length}社</span>
              </div>

              {/* Table header */}
              <div
                className="grid px-5 py-2.5"
                style={{
                  gridTemplateColumns: "2fr 100px 90px 80px 100px 90px",
                  background: "#F8FAFC",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                {["会社名", "プラン", "MRR", "現場数", "ステータス", "最終ログイン"].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</p>
                ))}
              </div>

              {/* Table rows */}
              {MOCK_COMPANIES.map((c, i) => {
                const ps = PLAN_STYLE[c.plan];
                const ss = STATUS_STYLE[c.status];
                return (
                  <div
                    key={c.id}
                    className="grid px-5 py-3.5 items-center hover:bg-gray-50 transition-colors"
                    style={{
                      gridTemplateColumns: "2fr 100px 90px 80px 100px 90px",
                      borderTop: i > 0 ? "1px solid #F8FAFC" : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{ background: "#FFFBEB", color: "#D97706" }}
                      >
                        {c.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "#1E293B" }}>{c.name}</p>
                        <p style={{ fontSize: 10, color: "#94A3B8" }}>{c.loginId} · {c.adminName}</p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit"
                      style={{ background: ps.bg, color: ps.fg }}
                    >
                      {ps.label}
                    </span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: c.mrr > 0 ? "#10B981" : "#94A3B8" }}>
                      {c.mrr > 0 ? `¥${c.mrr.toLocaleString()}` : "—"}
                    </p>
                    <p style={{ fontSize: 13, color: "#64748B" }}>{c.sites}件</p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit"
                      style={{ background: ss.bg, color: ss.fg }}
                    >
                      {ss.label}
                    </span>
                    <p style={{ fontSize: 11, color: "#94A3B8" }}>{c.lastLogin}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="lg:w-72 flex-shrink-0 flex flex-col gap-4">

            {/* Plan breakdown */}
            <div
              className="rounded-xl p-5"
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <p style={{ fontSize: 12, fontWeight: 800, color: "#1E293B", marginBottom: 16 }}>プラン別内訳</p>
              {Object.entries(planBreakdown).map(([plan, count]) => {
                const ps = PLAN_STYLE[plan];
                const pct = Math.round((count / MOCK_COMPANIES.length) * 100);
                return (
                  <div key={plan} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: 12, fontWeight: 700, color: ps.fg }}>{ps.label}</span>
                      <span style={{ fontSize: 12, color: "#64748B" }}>{count}社</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "#F1F5F9" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: ps.fg, opacity: 0.7 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent signups */}
            <div
              className="rounded-xl"
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #E2E8F0" }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#1E293B" }}>最近の登録</p>
              </div>
              {RECENT_SIGNUPS.map((s, i) => {
                const ps = PLAN_STYLE[s.plan];
                return (
                  <div
                    key={s.name}
                    className="px-4 py-3 flex items-center gap-3"
                    style={{ borderTop: i > 0 ? "1px solid #F8FAFC" : undefined }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: "#FFFBEB", color: "#D97706" }}
                    >
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: "#1E293B" }}>{s.name}</p>
                      <p style={{ fontSize: 10, color: "#94A3B8" }}>{s.date}</p>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: ps.bg, color: ps.fg }}
                    >
                      {ps.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* MRR trend (mock) */}
            <div
              className="rounded-xl p-5"
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <p style={{ fontSize: 12, fontWeight: 800, color: "#1E293B", marginBottom: 12 }}>MRR推移</p>
              {[
                { month: "1月", mrr: 9_800 },
                { month: "2月", mrr: 39_600 },
                { month: "3月", mrr: 39_600 },
                { month: "4月", mrr: 49_400 },
              ].map(({ month, mrr }) => {
                const max = 49_400;
                const pct = Math.round((mrr / max) * 100);
                return (
                  <div key={month} className="flex items-center gap-3 mb-2">
                    <span style={{ fontSize: 11, color: "#94A3B8", width: 24 }}>{month}</span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: "#F1F5F9" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#10B981" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1E293B", width: 64, textAlign: "right" }}>
                      ¥{mrr.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────

export default function OperatorPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = sessionStorage.getItem("kaitai_operator_auth") === "true";
    setAuthed(ok);
  }, []);

  function handleAuth() { setAuthed(true); }
  function handleLogout() {
    sessionStorage.removeItem("kaitai_operator_auth");
    setAuthed(false);
  }

  // SSR/hydration guard
  if (authed === null) return null;

  if (!authed) return <LoginScreen onAuth={handleAuth} />;
  return <Dashboard onLogout={handleLogout} />;
}
