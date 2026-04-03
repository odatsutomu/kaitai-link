"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp, Star, Users, Truck, Settings, Delete,
  LogOut, ChevronRight, LayoutDashboard, Shield, BarChart2,
} from "lucide-react";
import { useAppContext } from "../lib/app-context";
import Image from "next/image";
import { TDark } from "../lib/design-tokens";

// ─── Admin nav items ──────────────────────────────────────────────────────────

const ADMIN_NAV = [
  { href: "/kaitai/admin",            label: "経営分析",       icon: TrendingUp, exact: true  },
  { href: "/kaitai/admin/projects",   label: "プロジェクト収支", icon: BarChart2,  exact: false },
  { href: "/kaitai/admin/evaluation", label: "作業評価",       icon: Star,       exact: false },
] as const;

const EXTERNAL_NAV = [
  { href: "/kaitai/admin/members",  label: "従業員管理", icon: Users    },
  { href: "/kaitai/equipment",      label: "機材管理",   icon: Truck    },
  { href: "/kaitai/docs",           label: "帳票出力",   icon: LayoutDashboard },
  { href: "/kaitai/clients",        label: "元請け管理", icon: Settings },
  { href: "/kaitai/master",         label: "設定・権限", icon: Settings },
] as const;

const PAD_KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"] as const;

function isActive(href: string, pathname: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({
  onSuccess,
  companyName,
}: {
  onSuccess: () => void;
  companyName: string;
}) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const verifyPin = useCallback(async (pinValue: string) => {
    setVerifying(true);
    try {
      const res = await fetch("/api/kaitai/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pin: pinValue }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        setShake(true);
        setError("パスワードが違います");
        setTimeout(() => { setShake(false); setPin(""); setError(""); }, 700);
      }
    } catch {
      setShake(true);
      setError("通信エラー");
      setTimeout(() => { setShake(false); setPin(""); setError(""); }, 700);
    } finally {
      setVerifying(false);
    }
  }, [onSuccess]);

  const handleKey = useCallback((key: string) => {
    if (verifying) return;
    if (key === "⌫") { setPin(p => p.slice(0, -1)); setError(""); return; }
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) {
      verifyPin(next);
    }
  }, [pin, verifying, verifyPin]);

  return (
    <div
      className="flex flex-col items-center justify-between"
      style={{ background: "#0F172A", minHeight: "100vh", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Top */}
      <div className="pt-16 flex flex-col items-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: TDark.primaryLt }}>
          <Shield size={32} style={{ color: TDark.primary }} />
        </div>
        <div className="text-center">
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{companyName}</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF" }}>管理者ページ</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>管理者パスワードを入力してください</p>
        </div>
      </div>

      {/* Dots */}
      <div className="flex flex-col items-center gap-6 mt-8">
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
                  ? (error ? "#EF4444" : TDark.primary)
                  : "rgba(255,255,255,0.15)",
                border: i < pin.length ? "none" : "2px solid rgba(255,255,255,0.3)",
                transition: "background 0.15s",
              }}
            />
          ))}
        </div>
        <p style={{
          fontSize: 14, fontWeight: 700, color: "#EF4444",
          minHeight: 20, opacity: error ? 1 : 0, transition: "opacity 0.2s",
        }}>
          {error || "　"}
        </p>
      </div>

      {/* Numpad */}
      <div
        className="w-full max-w-xs grid grid-cols-3 mb-8"
        style={{ gap: 12, padding: "0 24px" }}
      >
        {PAD_KEYS.map((key, idx) => {
          if (key === "") return <div key={idx} />;
          const isBack = key === "⌫";
          return (
            <button
              key={idx}
              onClick={() => handleKey(key)}
              className="flex items-center justify-center rounded-2xl active:scale-95 transition-transform select-none"
              style={{
                height: 72,
                background: isBack ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.08)",
                border: "1.5px solid rgba(255,255,255,0.08)",
                fontSize: isBack ? 22 : 30,
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              {isBack ? <Delete size={24} color="#FFFFFF" /> : key}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          15%{transform:translateX(-12px)}30%{transform:translateX(12px)}
          45%{transform:translateX(-10px)}60%{transform:translateX(10px)}
          75%{transform:translateX(-6px)}90%{transform:translateX(6px)}
        }
      `}</style>
    </div>
  );
}

// ─── Admin Shell ──────────────────────────────────────────────────────────────

const HEADER_H = 64;
const SIDEBAR_W = 240;

function AdminHeader({ companyName, onExit }: { companyName: string; onExit: () => void }) {
  return (
    <header
      className="flex items-center gap-4 flex-shrink-0"
      style={{
        height: HEADER_H,
        background: "#1E293B",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 24px",
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <Link href="/kaitai/admin" className="flex-shrink-0">
        <Image
          src="/logo.png"
          alt="解体LINK"
          width={120}
          height={34}
          style={{ objectFit: "contain", height: 34, width: "auto", filter: "brightness(0) invert(1)" }}
          priority
        />
      </Link>

      {/* Admin badge */}
      <div
        className="flex items-center gap-1.5 rounded-lg px-3 py-1"
        style={{ background: TDark.primaryLt, border: `1px solid ${TDark.primaryMd}` }}
      >
        <Shield size={12} style={{ color: TDark.primary }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: TDark.primary }}>管理者ダッシュボード</span>
      </div>

      {/* Company */}
      <span
        className="hidden md:block truncate"
        style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", flex: 1 }}
      >
        {companyName}
      </span>

      {/* Exit button */}
      <button
        onClick={onExit}
        className="flex items-center gap-2 rounded-xl font-bold transition-all"
        style={{
          height: 36, padding: "0 16px",
          background: "#EF4444",
          color: "#FFFFFF",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">一般画面へ戻る</span>
        <span className="sm:hidden">退出</span>
      </button>
    </header>
  );
}

function AdminSidebar({ pathname }: { pathname: string }) {
  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0"
      style={{
        width: SIDEBAR_W,
        background: "#0F172A",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        overflowY: "auto",
      }}
    >
      <div className="px-4 pt-6 pb-4">
        {/* Section: 分析 */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", marginBottom: 8 }}>
          分析・レポート
        </p>
        <nav className="flex flex-col gap-1 mb-6">
          {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, pathname, exact);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                style={{
                  background: active ? TDark.primaryLt : "transparent",
                  border: active ? `1px solid ${TDark.primaryMd}` : "1px solid transparent",
                  color: active ? TDark.primary : "rgba(255,255,255,0.6)",
                }}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                <span style={{ fontSize: 14, fontWeight: active ? 700 : 500 }}>{label}</span>
                {active && <ChevronRight size={13} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Section: 管理 */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", marginBottom: 8 }}>
          管理機能
        </p>
        <nav className="flex flex-col gap-1">
          {EXTERNAL_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors group"
              style={{ color: "rgba(255,255,255,0.55)", border: "1px solid transparent" }}
            >
              <Icon size={17} strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
              <span
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}
              >
                ↗
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom: version */}
      <div className="mt-auto px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>解体LINK 管理者ページ</p>
      </div>
    </aside>
  );
}

function AdminMobileNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="lg:hidden flex-shrink-0"
      style={{
        background: "#1E293B",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Admin indicator bar */}
      <div
        className="flex items-center justify-center gap-1.5 py-1"
        style={{ background: TDark.primaryLt, borderBottom: `1px solid ${TDark.primaryMd}` }}
      >
        <Shield size={10} style={{ color: TDark.primary }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: TDark.primary }}>管理者ダッシュボード</span>
      </div>
      <div className="flex">
        {[...ADMIN_NAV, ...EXTERNAL_NAV.slice(0, 3)].map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/kaitai/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ color: active ? TDark.primary : "#64748B" }} />
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? TDark.primary : "#64748B" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { company, setAdminMode } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const isAuth = typeof sessionStorage !== "undefined"
      && sessionStorage.getItem("kaitai_auth_level") === "admin";
    setAuthed(isAuth);
    if (isAuth) setAdminMode(true);
    setLoading(false);
  }, [setAdminMode]);

  const handleSuccess = useCallback(() => {
    setAdminMode(true); // setAdminMode already writes kaitai_auth_level="admin" to sessionStorage
    setAuthed(true);
  }, [setAdminMode]);

  const handleExit = useCallback(() => {
    setAdminMode(false); // clears kaitai_auth_level="worker" in sessionStorage
    setAuthed(false);
    router.push("/kaitai");
  }, [router, setAdminMode]);

  if (loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {!authed ? (
        <LoginScreen
          onSuccess={handleSuccess}
          companyName={company?.name ?? ""}
        />
      ) : (
        <>
          <AdminHeader companyName={company?.name ?? ""} onExit={handleExit} />

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            <AdminSidebar pathname={pathname} />

            {/* Main content */}
            <main
              className="flex-1 overflow-y-auto"
              style={{ background: "#F1F5F9" }}
            >
              <div
                style={{
                  maxWidth: 1200,
                  marginLeft: "auto",
                  marginRight: "auto",
                  padding: "0 32px",
                }}
              >
                {children}
              </div>
            </main>
          </div>

          <AdminMobileNav pathname={pathname} />
        </>
      )}
    </div>
  );
}
