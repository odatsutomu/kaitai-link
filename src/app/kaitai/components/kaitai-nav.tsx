"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, MoreHorizontal, HardHat, TrendingUp, Settings,
  Calendar, ClipboardList, X, CreditCard, Plus, LogOut,
  Building2, ChevronRight,
} from "lucide-react";
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

// ─── PC フルサイドバー ─────────────────────────────────────────────────────────
export function KaitaiSidebar() {
  const pathname = usePathname();
  const { adminMode, setAdminMode, company } = useAppContext();
  if (SUPPRESS_ROUTES.some((r) => pathname.startsWith(r))) return null;

  const tabs = adminMode ? ADMIN_TABS : WORKER_TABS;

  return (
    <>
      {/* ── lg+ フルサイドバー (w-64) ──────────────── */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-50"
        style={{ background: "#1E293B" }}
      >
        {/* ロゴ */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            {/* オレンジのアイコンボックス */}
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "#F59E0B" }}>
              <HardHat size={18} color="#FFFFFF" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 16, letterSpacing: "-0.2px" }}>
                解体LINK
              </div>
              <div className="truncate max-w-[140px]" style={{ color: "#64748B", fontSize: 10, marginTop: 1 }}>
                {company?.name || "解体工業株式会社"}
              </div>
            </div>
          </div>
        </div>

        {/* 管理者バナー */}
        {adminMode && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg flex items-center justify-between"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#EF4444" }} />
              <span style={{ color: "#F87171", fontSize: 11, fontWeight: 600 }}>管理者モード</span>
            </div>
            <button onClick={() => setAdminMode(false)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
              style={{ background: "rgba(239,68,68,0.15)", color: "#F87171" }}>
              <X size={9} />終了
            </button>
          </div>
        )}

        {/* ナビ */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                style={{
                  background: active ? "rgba(245,158,11,0.1)" : "transparent",
                  borderLeft: `3px solid ${active ? "#F59E0B" : "transparent"}`,
                  paddingLeft: active ? "calc(0.75rem - 3px)" : "0.75rem",
                }}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2}
                  style={{ color: active ? "#F59E0B" : "#94A3B8" }} />
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#F1F5F9" : "#94A3B8" }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ボトムセクション */}
        <div className="px-3 pb-5 flex flex-col gap-1" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {/* 新規現場登録ボタン */}
          <Link href="/kaitai/sites/new">
            <div className="flex items-center justify-center gap-2 mt-3 mb-2 py-2.5 rounded-lg font-semibold text-sm text-white transition-all"
              style={{ background: "#F59E0B", boxShadow: "0 2px 8px rgba(245,158,11,0.4)" }}>
              <Plus size={15} />
              新規現場登録
            </div>
          </Link>
          <Link href="/kaitai/master"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
            style={{ color: "#94A3B8" }}>
            <Settings size={15} />
            <span style={{ fontSize: 13 }}>設定</span>
          </Link>
          <Link href="/kaitai/login"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
            style={{ color: "#64748B" }}>
            <LogOut size={15} />
            <span style={{ fontSize: 13 }}>ログアウト</span>
          </Link>
        </div>
      </aside>

      {/* ── md only アイコンサイドバー (w-16) ─────── */}
      <aside
        className="hidden md:flex lg:hidden fixed left-0 top-0 h-full w-16 flex-col z-50"
        style={{ background: "#1E293B" }}
      >
        <div className="flex items-center justify-center h-14" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F59E0B" }}>
            <HardHat size={16} color="#FFF" strokeWidth={2.5} />
          </div>
        </div>
        <nav className="flex-1 flex flex-col items-center py-3 gap-1">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link key={href} href={href} title={label}
                className="flex items-center justify-center w-10 h-10 rounded-lg"
                style={{ background: active ? "rgba(245,158,11,0.12)" : "transparent" }}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2}
                  style={{ color: active ? "#F59E0B" : "#94A3B8" }} />
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-center h-12" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <Link href="/kaitai/master" title="設定">
            <Settings size={16} style={{ color: "#64748B" }} />
          </Link>
        </div>
      </aside>
    </>
  );
}

// ─── PC トップバー ─────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  "/kaitai":          "現場管理",
  "/kaitai/members":  "メンバー管理",
  "/kaitai/work":     "作業報告",
  "/kaitai/admin":    "収支分析",
  "/kaitai/master":   "マスタ設定",
  "/kaitai/schedule": "全体予定",
  "/kaitai/report":   "作業報告入力",
  "/kaitai/menu":     "メニュー",
};

export function KaitaiTopBar() {
  const pathname = usePathname();
  const { company, adminMode, setAdminMode } = useAppContext();
  if (SUPPRESS_ROUTES.some((r) => pathname.startsWith(r))) return null;

  const title = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([k]) => pathname === k || pathname.startsWith(k + "/"))?.[1] ?? "解体LINK";

  return (
    <header
      className="hidden md:flex items-center justify-between px-6 sticky top-0 z-30 flex-shrink-0"
      style={{
        height: 52,
        background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>{title}</span>
      <div className="flex items-center gap-2">
        {adminMode ? (
          <button onClick={() => setAdminMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
            <X size={11} />管理者モード終了
          </button>
        ) : (
          <span className="px-2.5 py-1 rounded-md text-xs font-medium"
            style={{ background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0" }}>
            現場スタッフ
          </span>
        )}
        {company?.name && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <Building2 size={12} style={{ color: "#94A3B8" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#334155" }} className="max-w-[160px] truncate">
              {company.name}
            </span>
          </div>
        )}
        {/* プラン */}
        <Link href="/kaitai/billing"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <CreditCard size={12} style={{ color: "#F59E0B" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#D97706" }}>
            {company?.plan ? company.plan.charAt(0).toUpperCase() + company.plan.slice(1) : "Free"}
          </span>
        </Link>
      </div>
    </header>
  );
}

// ─── モバイルナビ ─────────────────────────────────────────────────────────────
function AdminMobileNav({ pathname }: { pathname: string }) {
  const { setAdminMode } = useAppContext();
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 flex flex-col z-40 w-full"
      style={{ maxWidth: 480, background: "#1E293B", borderTop: "1px solid rgba(255,255,255,0.08)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-between px-4 py-1.5"
        style={{ background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.18)" }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span style={{ color: "#F87171", fontSize: 11, fontWeight: 600 }}>管理者モード</span>
        </div>
        <button onClick={() => setAdminMode(false)}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-medium"
          style={{ background: "rgba(239,68,68,0.15)", color: "#F87171" }}>
          <X size={9} />終了
        </button>
      </div>
      <div className="flex">
        {ADMIN_TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5">
              <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ color: active ? "#F59E0B" : "#64748B" }} />
              <span style={{ fontSize: 9, fontWeight: active ? 600 : 400, color: active ? "#F59E0B" : "#64748B" }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const NAV_H = 68;
function WorkerMobileNav({ pathname }: { pathname: string }) {
  const tabs = [
    { href: "/kaitai",          label: "現場状況", icon: Home,           active: pathname === "/kaitai",                  center: false },
    { href: "/kaitai/schedule", label: "全体予定", icon: Calendar,       active: pathname.startsWith("/kaitai/schedule"), center: false },
    { href: "/kaitai/report",   label: "報告",     icon: ClipboardList,  active: pathname.startsWith("/kaitai/report"),   center: true },
    { href: "/kaitai/members",  label: "メンバー", icon: Users,          active: pathname.startsWith("/kaitai/members"),  center: false },
    { href: "/kaitai/menu",     label: "メニュー", icon: MoreHorizontal, active: pathname.startsWith("/kaitai/menu"),     center: false },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 flex items-stretch w-full"
      style={{ maxWidth: 480, background: "#FFFFFF", borderTop: "1px solid #E2E8F0", boxShadow: "0 -1px 8px rgba(0,0,0,0.06)", paddingBottom: "env(safe-area-inset-bottom)", height: `calc(${NAV_H}px + env(safe-area-inset-bottom))` }}>
      {tabs.map(({ href, label, icon: Icon, active, center }) => (
        <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center gap-0.5" style={{ minHeight: NAV_H }}>
          {center ? (
            <>
              <div className="flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: "#F59E0B", boxShadow: "0 2px 8px rgba(245,158,11,0.4)", marginBottom: -2 }}>
                <Icon size={20} color="#FFF" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#F59E0B", lineHeight: 1 }}>{label}</span>
            </>
          ) : (
            <>
              <Icon size={active ? 21 : 19} strokeWidth={active ? 2.5 : 2} style={{ color: active ? "#F59E0B" : "#94A3B8" }} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? "#F59E0B" : "#94A3B8", lineHeight: 1 }}>{label}</span>
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
    <div className="md:hidden">
      {adminMode ? <AdminMobileNav pathname={pathname} /> : <WorkerMobileNav pathname={pathname} />}
    </div>
  );
}
