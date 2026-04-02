"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, MoreHorizontal,
  HardHat, BarChart2, Database, X,
  Calendar, ClipboardList, TrendingUp,
  Settings, CreditCard, Building2, ChevronRight,
} from "lucide-react";
import { useAppContext } from "../lib/app-context";

// ─── 定数 ─────────────────────────────────────────────────────────────────────

const SUPPRESS_ROUTES = [
  "/kaitai/login", "/kaitai/signup", "/kaitai/dev",
  "/kaitai/clients", "/kaitai/billing", "/kaitai/docs",
  "/kaitai/equipment", "/kaitai/lp", "/kaitai/demo",
];

const ADMIN_TABS = [
  { href: "/kaitai",         label: "現場管理",   sub: "進捗・原価を確認",   icon: HardHat },
  { href: "/kaitai/members", label: "メンバー",   sub: "スタッフ管理",       icon: Users },
  { href: "/kaitai/work",    label: "作業報告",   sub: "日報・報告一覧",     icon: ClipboardList },
  { href: "/kaitai/admin",   label: "経営分析",   sub: "収支・KPI",          icon: TrendingUp },
  { href: "/kaitai/master",  label: "マスタ設定", sub: "機材・顧客",         icon: Settings },
] as const;

const WORKER_TABS = [
  { href: "/kaitai",          label: "現場状況",  sub: "現場一覧",      icon: Home },
  { href: "/kaitai/schedule", label: "全体予定",  sub: "スケジュール",  icon: Calendar },
  { href: "/kaitai/report",   label: "作業報告",  sub: "報告・入力",    icon: ClipboardList },
  { href: "/kaitai/members",  label: "メンバー",  sub: "スタッフ確認",  icon: Users },
  { href: "/kaitai/menu",     label: "メニュー",  sub: "設定・その他",  icon: MoreHorizontal },
] as const;

function isActive(href: string, pathname: string) {
  return pathname === href || (href !== "/kaitai" && pathname.startsWith(href));
}

// ─── PC サイドバー ─────────────────────────────────────────────────────────────

export function KaitaiSidebar() {
  const pathname = usePathname();
  const { adminMode, setAdminMode, company } = useAppContext();

  if (SUPPRESS_ROUTES.some((r) => pathname.startsWith(r))) return null;

  const tabs = adminMode ? ADMIN_TABS : WORKER_TABS;

  return (
    <>
      {/* ── Full sidebar (lg+) ─────────────────────────── */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-50"
        style={{
          background: "#111827",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* ロゴ */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ color: "#F59E0B", fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>
            解体LINK
          </div>
          <div style={{ color: "#4B5563", fontSize: 11, marginTop: 3 }}>
            解体業務管理システム
          </div>
        </div>

        {/* 管理者モードバナー */}
        {adminMode && (
          <div
            className="mx-3 mt-3 px-3 py-2 rounded-lg flex items-center justify-between"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span style={{ color: "#F87171", fontSize: 11, fontWeight: 600 }}>管理者モード</span>
            </div>
            <button
              onClick={() => setAdminMode(false)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
              style={{ background: "rgba(239,68,68,0.15)", color: "#F87171" }}
            >
              <X size={9} />終了
            </button>
          </div>
        )}

        {/* ナビ */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
          {tabs.map(({ href, label, sub, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                style={{
                  background: active ? "rgba(245,158,11,0.1)" : "transparent",
                  borderLeft: `2px solid ${active ? "#F59E0B" : "transparent"}`,
                }}
              >
                <Icon
                  size={16}
                  strokeWidth={active ? 2 : 1.75}
                  style={{ color: active ? "#F59E0B" : "#6B7280", flexShrink: 0 }}
                />
                <div className="min-w-0">
                  <div style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "#F3F4F6" : "#9CA3AF" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 10, color: "#4B5563", marginTop: 0.5 }}>{sub}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* ボトム */}
        <div className="px-3 pb-4 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link
            href="/kaitai/billing"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg"
            style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.12)" }}
          >
            <div className="flex items-center gap-2">
              <CreditCard size={13} style={{ color: "#F59E0B" }} />
              <div>
                <div style={{ fontSize: 11, color: "#D97706", fontWeight: 600 }}>
                  {company?.plan
                    ? company.plan.charAt(0).toUpperCase() + company.plan.slice(1)
                    : "Free"} プラン
                </div>
                <div style={{ fontSize: 9, color: "#6B7280" }}>プランを管理</div>
              </div>
            </div>
            <ChevronRight size={12} style={{ color: "#6B7280" }} />
          </Link>
          {company?.name && (
            <div className="flex items-center gap-2 px-3 pt-3">
              <Building2 size={12} style={{ color: "#4B5563" }} />
              <span style={{ fontSize: 11, color: "#6B7280" }} className="truncate">
                {company.name}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* ── アイコンのみ (md only) ──────────────────────── */}
      <aside
        className="hidden md:flex lg:hidden fixed left-0 top-0 h-full w-16 flex-col z-50"
        style={{ background: "#111827", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-center h-14" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ color: "#F59E0B", fontWeight: 700, fontSize: 13 }}>KL</span>
        </div>
        <nav className="flex-1 flex flex-col items-center py-3 gap-1">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link key={href} href={href} title={label}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
                style={{ background: active ? "rgba(245,158,11,0.12)" : "transparent" }}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.75}
                  style={{ color: active ? "#F59E0B" : "#6B7280" }} />
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-center h-12" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/kaitai/billing" title="プラン管理">
            <CreditCard size={16} style={{ color: "#6B7280" }} />
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
  "/kaitai/work":     "作業報告一覧",
  "/kaitai/admin":    "経営分析",
  "/kaitai/master":   "マスタ設定",
  "/kaitai/schedule": "全体予定",
  "/kaitai/report":   "作業報告入力",
  "/kaitai/menu":     "メニュー",
};

export function KaitaiTopBar() {
  const pathname = usePathname();
  const { company, adminMode, setAdminMode } = useAppContext();

  if (SUPPRESS_ROUTES.some((r) => pathname.startsWith(r))) return null;

  const title =
    Object.entries(PAGE_TITLES)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([key]) => pathname === key || pathname.startsWith(key + "/"))?.[1]
    ?? "解体LINK";

  return (
    <header
      className="hidden md:flex items-center justify-between px-8 sticky top-0 z-30 flex-shrink-0"
      style={{
        height: 52,
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E9EF",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <h1 style={{ fontSize: 14, fontWeight: 600, color: "#1A202C", letterSpacing: "-0.2px" }}>
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {adminMode ? (
          <button
            onClick={() => setAdminMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
          >
            <X size={11} /> 管理者モード終了
          </button>
        ) : (
          <span className="px-2.5 py-1 rounded-md text-xs font-medium"
            style={{ background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0" }}>
            現場スタッフ
          </span>
        )}
        {company?.name && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <Building2 size={12} style={{ color: "#94A3B8" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#374151" }} className="max-w-[180px] truncate">
              {company.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── モバイルナビ ─────────────────────────────────────────────────────────────

function AdminMobileNav({ pathname }: { pathname: string }) {
  const { setAdminMode } = useAppContext();
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 flex flex-col z-40 w-full"
      style={{
        maxWidth: 480,
        background: "#111827",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
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
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5">
              <Icon size={18} strokeWidth={active ? 2 : 1.75}
                style={{ color: active ? "#F59E0B" : "#6B7280" }} />
              <span style={{ fontSize: 9, fontWeight: active ? 600 : 500, color: active ? "#F59E0B" : "#6B7280" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const NAV_H = 72;

function WorkerMobileNav({ pathname }: { pathname: string }) {
  const tabs = [
    { href: "/kaitai",          label: "現場状況", icon: Home,           active: pathname === "/kaitai",                   center: false },
    { href: "/kaitai/schedule", label: "全体予定", icon: Calendar,       active: pathname.startsWith("/kaitai/schedule"),  center: false },
    { href: "/kaitai/report",   label: "報告",     icon: ClipboardList,  active: pathname.startsWith("/kaitai/report"),    center: true },
    { href: "/kaitai/members",  label: "メンバー", icon: Users,          active: pathname.startsWith("/kaitai/members"),   center: false },
    { href: "/kaitai/menu",     label: "メニュー", icon: MoreHorizontal, active: pathname.startsWith("/kaitai/menu"),      center: false },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 flex items-stretch w-full"
      style={{
        maxWidth: 480,
        background: "#FFFFFF",
        borderTop: "1px solid #E5E9EF",
        boxShadow: "0 -1px 8px rgba(0,0,0,0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
        height: `calc(${NAV_H}px + env(safe-area-inset-bottom))`,
      }}
    >
      {tabs.map(({ href, label, icon: Icon, active, center }) => (
        <Link key={href} href={href}
          className="flex-1 flex flex-col items-center justify-center gap-1"
          style={{ minHeight: NAV_H }}>
          {center ? (
            <>
              <div className="flex items-center justify-center rounded-full"
                style={{
                  width: 46, height: 46,
                  background: "#D97706",
                  boxShadow: "0 2px 10px rgba(217,119,6,0.4)",
                  marginBottom: -2,
                }}>
                <Icon size={22} color="#FFFFFF" strokeWidth={2} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#D97706", lineHeight: 1 }}>{label}</span>
            </>
          ) : (
            <>
              <Icon size={active ? 22 : 20} strokeWidth={active ? 2 : 1.75}
                style={{ color: active ? "#D97706" : "#9CA3AF" }} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 500, color: active ? "#D97706" : "#9CA3AF", lineHeight: 1 }}>
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
    <div className="md:hidden">
      {adminMode ? <AdminMobileNav pathname={pathname} /> : <WorkerMobileNav pathname={pathname} />}
    </div>
  );
}
