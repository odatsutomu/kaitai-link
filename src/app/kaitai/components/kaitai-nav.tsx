"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, MoreHorizontal, HardHat, TrendingUp, Settings,
  Calendar, ClipboardList, X, CreditCard, Plus, LogOut,
  Building2,
} from "lucide-react";
import Image from "next/image";
import { useAppContext } from "../lib/app-context";

// ─── 定数 ─────────────────────────────────────────────────────────────────────
const SUPPRESS_ROUTES = [
  "/kaitai/login", "/kaitai/signup", "/kaitai/dev",
  "/kaitai/clients", "/kaitai/billing", "/kaitai/docs",
  "/kaitai/equipment", "/kaitai/lp", "/kaitai/demo",
];

const ADMIN_TABS = [
  { href: "/kaitai",         label: "現場状況",   icon: HardHat },
  { href: "/kaitai/members", label: "メンバー",   icon: Users },
  { href: "/kaitai/work",    label: "作業報告",   icon: ClipboardList },
  { href: "/kaitai/admin",   label: "収支管理",   icon: TrendingUp },
  { href: "/kaitai/master",  label: "設定",       icon: Settings },
] as const;

const WORKER_TABS = [
  { href: "/kaitai",          label: "現場状況",  icon: Home },
  { href: "/kaitai/schedule", label: "全体予定",  icon: Calendar },
  { href: "/kaitai/report",   label: "作業報告",  icon: ClipboardList },
  { href: "/kaitai/members",  label: "メンバー",  icon: Users },
  { href: "/kaitai/menu",     label: "メニュー",  icon: MoreHorizontal },
] as const;

function isActive(href: string, p: string) {
  return p === href || (href !== "/kaitai" && p.startsWith(href));
}

// ─── PC ヘッダー (≥1024px) ──────────────────────────────────────────────────
export function KaitaiPCHeader() {
  const pathname = usePathname();
  const { adminMode, setAdminMode, company, plan } = useAppContext();
  if (SUPPRESS_ROUTES.some((r) => pathname.startsWith(r))) return null;

  const tabs = adminMode ? ADMIN_TABS : WORKER_TABS;
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Free";

  return (
    <header
      className="hidden lg:block sticky top-0 z-50 flex-shrink-0 w-full"
      style={{
        height: 80,
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* 最大幅コンテナ */}
      <div
        className="flex items-center h-full px-10"
        style={{ maxWidth: 1280, marginLeft: "auto", marginRight: "auto" }}
      >
        {/* ── 左：ロゴ ── */}
        <Link href="/kaitai" className="flex-shrink-0 mr-10">
          <Image
            src="/logo.png"
            alt="解体LINK"
            width={144}
            height={40}
            style={{ objectFit: "contain", height: 40, width: "auto" }}
            priority
          />
        </Link>

        {/* ── 中央：メインナビタブ ── */}
        <nav className="flex items-center flex-1" style={{ gap: 32 }}>
          {tabs.map(({ href, label }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex items-center transition-colors"
                style={{
                  fontSize: 15,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#F59E0B" : "#64748B",
                  paddingBottom: 4,
                  borderBottom: `2px solid ${active ? "#F59E0B" : "transparent"}`,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* ── 右：アクション群 ── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* 新規現場ボタン */}
          <Link href="/kaitai/sites/new">
            <div
              className="flex items-center gap-1.5 rounded-xl font-bold transition-all"
              style={{
                height: 40,
                padding: "0 16px",
                background: "#F59E0B",
                color: "#FFFFFF",
                fontSize: 14,
                boxShadow: "0 2px 8px rgba(245,158,11,0.4)",
              }}
            >
              <Plus size={14} />
              新規現場
            </div>
          </Link>

          {/* 管理者モードバッジ／終了 */}
          {adminMode ? (
            <button
              onClick={() => setAdminMode(false)}
              className="flex items-center gap-1.5 rounded-xl font-medium"
              style={{
                height: 36,
                padding: "0 14px",
                background: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FECACA",
                fontSize: 14,
              }}
            >
              <X size={12} />
              管理者モード終了
            </button>
          ) : (
            <span
              className="flex items-center rounded-lg"
              style={{
                height: 32,
                padding: "0 10px",
                background: "#F1F5F9",
                color: "#64748B",
                fontSize: 14,
                fontWeight: 600,
                border: "1px solid #E2E8F0",
              }}
            >
              現場スタッフ
            </span>
          )}

          {/* プランバッジ */}
          <Link
            href="/kaitai/billing"
            className="flex items-center gap-1.5 rounded-lg"
            style={{
              height: 32,
              padding: "0 10px",
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <CreditCard size={12} style={{ color: "#F59E0B" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#D97706" }}>
              {planLabel}
            </span>
          </Link>

          {/* 会社名チップ */}
          {company?.name && (
            <div
              className="flex items-center gap-1.5 rounded-lg"
              style={{
                height: 36,
                padding: "0 12px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
              }}
            >
              <Building2 size={13} style={{ color: "#94A3B8" }} />
              <span
                className="max-w-[160px] truncate"
                style={{ fontSize: 14, fontWeight: 500, color: "#334155" }}
              >
                {company.name}
              </span>
            </div>
          )}

          {/* ログアウト */}
          <Link
            href="/kaitai/login"
            className="flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            title="ログアウト"
            style={{ width: 36, height: 36 }}
          >
            <LogOut size={16} style={{ color: "#94A3B8" }} />
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── モバイルナビ (<1024px) ───────────────────────────────────────────────────
function AdminMobileNav({ pathname }: { pathname: string }) {
  const { setAdminMode } = useAppContext();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex flex-col z-40 w-full"
      style={{
        background: "#1E293B",
        borderTop: "2px solid rgba(255,255,255,0.12)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.25)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-1.5"
        style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.2)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span style={{ color: "#F87171", fontSize: 14, fontWeight: 700 }}>管理者モード</span>
        </div>
        <button
          onClick={() => setAdminMode(false)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold"
          style={{ background: "rgba(239,68,68,0.18)", color: "#F87171" }}
        >
          <X size={10} />終了
        </button>
      </div>
      <div className="flex">
        {ADMIN_TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3"
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} style={{ color: active ? "#F59E0B" : "#64748B" }} />
              <span style={{ fontSize: 14, fontWeight: active ? 700 : 400, color: active ? "#F59E0B" : "#64748B" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const NAV_H = 76;
function WorkerMobileNav({ pathname }: { pathname: string }) {
  const tabs = [
    { href: "/kaitai",          label: "現場状況", icon: Home,           active: pathname === "/kaitai",                  center: false },
    { href: "/kaitai/schedule", label: "全体予定", icon: Calendar,       active: pathname.startsWith("/kaitai/schedule"), center: false },
    { href: "/kaitai/report",   label: "報告",     icon: ClipboardList,  active: pathname.startsWith("/kaitai/report"),   center: true  },
    { href: "/kaitai/members",  label: "メンバー", icon: Users,          active: pathname.startsWith("/kaitai/members"),  center: false },
    { href: "/kaitai/menu",     label: "メニュー", icon: MoreHorizontal, active: pathname.startsWith("/kaitai/menu"),     center: false },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch w-full"
      style={{
        background: "#FFFFFF",
        borderTop: "2px solid #E2E8F0",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.10)",
        paddingBottom: "env(safe-area-inset-bottom)",
        height: `calc(${NAV_H}px + env(safe-area-inset-bottom))`,
      }}
    >
      {tabs.map(({ href, label, icon: Icon, active, center }) => (
        <Link
          key={href}
          href={href}
          className="flex-1 flex flex-col items-center justify-center gap-1"
          style={{ minHeight: NAV_H }}
        >
          {center ? (
            <>
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 48, height: 48,
                  background: "#F59E0B",
                  boxShadow: "0 4px 12px rgba(245,158,11,0.45)",
                  marginTop: -8,
                }}
              >
                <Icon size={22} color="#FFF" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#F59E0B", lineHeight: 1, marginTop: 2 }}>
                {label}
              </span>
            </>
          ) : (
            <>
              <div
                className="flex items-center justify-center rounded-xl transition-colors"
                style={{ width: 40, height: 32, background: active ? "rgba(245,158,11,0.1)" : "transparent" }}
              >
                <Icon size={active ? 22 : 20} strokeWidth={active ? 2.5 : 2} style={{ color: active ? "#F59E0B" : "#94A3B8" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: active ? 700 : 400, color: active ? "#F59E0B" : "#94A3B8", lineHeight: 1 }}>
                {label}
              </span>
            </>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function KaitaiMobileNav() {
  const pathname = usePathname();
  const { adminMode } = useAppContext();
  if (SUPPRESS_ROUTES.some((r) => pathname.startsWith(r))) return null;
  return (
    <div className="lg:hidden">
      {adminMode ? <AdminMobileNav pathname={pathname} /> : <WorkerMobileNav pathname={pathname} />}
    </div>
  );
}
