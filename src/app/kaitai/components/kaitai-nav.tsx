"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, MoreHorizontal,
  HardHat, BarChart2, Database, X,
  Calendar, ClipboardList, Settings,
  TrendingUp, Wrench, Building2, CreditCard,
  LogOut,
} from "lucide-react";
import { useAppContext } from "../lib/app-context";

// ─── Suppress routes ──────────────────────────────────────────────────────────
const SUPPRESS_ROUTES = [
  "/kaitai/login", "/kaitai/signup", "/kaitai/dev",
  "/kaitai/clients", "/kaitai/billing", "/kaitai/docs",
  "/kaitai/equipment", "/kaitai/lp", "/kaitai/demo",
];

// ─── PC Sidebar ───────────────────────────────────────────────────────────────

const ADMIN_SIDEBAR_TABS = [
  { href: "/kaitai",         label: "現場管理",   sub: "進捗・原価を確認", icon: HardHat },
  { href: "/kaitai/members", label: "メンバー",   sub: "スタッフ管理",     icon: Users },
  { href: "/kaitai/work",    label: "作業報告",   sub: "日報・報告一覧",   icon: ClipboardList },
  { href: "/kaitai/admin",   label: "経営分析",   sub: "収支・KPI",        icon: TrendingUp },
  { href: "/kaitai/master",  label: "マスタ設定", sub: "機材・顧客",       icon: Settings },
] as const;

const WORKER_SIDEBAR_TABS = [
  { href: "/kaitai",          label: "現場状況", sub: "現場一覧",     icon: Home },
  { href: "/kaitai/schedule", label: "全体予定", sub: "スケジュール", icon: Calendar },
  { href: "/kaitai/report",   label: "作業報告", sub: "報告・入力",   icon: ClipboardList },
  { href: "/kaitai/members",  label: "メンバー", sub: "スタッフ確認", icon: Users },
  { href: "/kaitai/menu",     label: "メニュー", sub: "設定・その他", icon: MoreHorizontal },
] as const;

function PCSidebar({ pathname, adminMode }: { pathname: string; adminMode: boolean }) {
  const { setAdminMode, company } = useAppContext();
  const tabs = adminMode ? ADMIN_SIDEBAR_TABS : WORKER_SIDEBAR_TABS;

  return (
    <>
      {/* ── Full sidebar (lg+) ─────────────────────────────── */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-50"
        style={{
          background: "linear-gradient(180deg, #0D1E30 0%, #0A1929 100%)",
          borderRight: "1px solid rgba(45,62,84,0.8)",
          boxShadow: "2px 0 20px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo */}
        <div className="px-6 pt-6 pb-5 border-b border-[#1E3045]">
          <div style={{ color: "#F97316", fontWeight: 900, fontSize: 22, letterSpacing: "-0.5px" }}>
            解体LINK
          </div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 3 }}>
            解体業務管理システム
          </div>
        </div>

        {/* Admin mode banner */}
        {adminMode && (
          <div
            className="mx-3 mt-3 px-3 py-2 rounded-xl flex items-center justify-between"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <span style={{ color: "#F87171", fontSize: 11, fontWeight: 700 }}>
              🔴 管理者モード
            </span>
            <button
              onClick={() => setAdminMode(false)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: "rgba(239,68,68,0.15)", color: "#F87171", fontSize: 10, fontWeight: 700 }}
            >
              <X size={9} />終了
            </button>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {tabs.map(({ href, label, sub, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/kaitai" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
                style={{
                  background: active ? "rgba(249,115,22,0.15)" : "transparent",
                  border: `1px solid ${active ? "rgba(249,115,22,0.3)" : "transparent"}`,
                }}
              >
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: 36, height: 36,
                    background: active ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)",
                  }}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 2}
                    style={{ color: active ? "#F97316" : "#64748B" }}
                  />
                </div>
                <div className="min-w-0">
                  <div style={{ fontSize: 13, fontWeight: active ? 800 : 600, color: active ? "#F1F5F9" : "#94A3B8" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{sub}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 border-t border-[#1E3045] pt-3 flex flex-col gap-2">
          {/* Billing link */}
          <Link
            href="/kaitai/billing"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
            style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}
          >
            <CreditCard size={14} style={{ color: "#F97316" }} />
            <div>
              <div style={{ fontSize: 11, color: "#F97316", fontWeight: 700 }}>
                {company?.plan ? company.plan.charAt(0).toUpperCase() + company.plan.slice(1) : "Free"} プラン
              </div>
              <div style={{ fontSize: 9, color: "#64748B" }}>プランを管理</div>
            </div>
          </Link>
          {/* Company name */}
          {company?.name && (
            <div className="px-4 py-2">
              <div style={{ fontSize: 10, color: "#475569" }}>ログイン中</div>
              <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }} className="truncate">
                {company.name}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Icon-only sidebar (md / tablet) ────────────────── */}
      <aside
        className="hidden md:flex lg:hidden fixed left-0 top-0 h-full w-16 flex-col z-50"
        style={{
          background: "linear-gradient(180deg, #0D1E30 0%, #0A1929 100%)",
          borderRight: "1px solid rgba(45,62,84,0.8)",
        }}
      >
        {/* Logo icon */}
        <div className="flex items-center justify-center h-14 border-b border-[#1E3045]">
          <div style={{ color: "#F97316", fontWeight: 900, fontSize: 16 }}>KL</div>
        </div>

        <nav className="flex-1 flex flex-col items-center py-3 gap-1 overflow-y-auto">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/kaitai" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
                style={{
                  background: active ? "rgba(249,115,22,0.2)" : "transparent",
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                  style={{ color: active ? "#F97316" : "#64748B" }}
                />
              </Link>
            );
          })}
        </nav>

        {/* Bottom icon */}
        <div className="flex items-center justify-center h-12 border-t border-[#1E3045]">
          <Link href="/kaitai/billing" title="プラン" className="flex items-center justify-center w-10 h-10 rounded-xl">
            <CreditCard size={18} style={{ color: "#475569" }} />
          </Link>
        </div>
      </aside>
    </>
  );
}

// ─── PC Top Header ─────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  "/kaitai":           "現場管理",
  "/kaitai/members":   "メンバー管理",
  "/kaitai/work":      "作業報告",
  "/kaitai/admin":     "経営分析ダッシュボード",
  "/kaitai/master":    "マスタ設定",
  "/kaitai/schedule":  "全体予定",
  "/kaitai/report":    "作業報告入力",
  "/kaitai/menu":      "メニュー",
};

function PCTopBar({ pathname }: { pathname: string }) {
  const { company, adminMode, setAdminMode } = useAppContext();

  const title =
    Object.entries(PAGE_TITLES)
      .reverse()
      .find(([key]) => pathname === key || pathname.startsWith(key + "/"))?.[1]
    ?? "解体LINK";

  return (
    <header
      className="hidden md:flex items-center justify-between px-6 py-3 sticky top-0 z-30"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #E8EBF0",
        minHeight: 56,
      }}
    >
      <h1 style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{title}</h1>

      <div className="flex items-center gap-3">
        {adminMode ? (
          <button
            onClick={() => setAdminMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <X size={12} /> 管理者モード終了
          </button>
        ) : (
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: "#F1F5F9", color: "#64748B" }}
          >
            現場スタッフ
          </span>
        )}
        {company?.name && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "#F8FAFC" }}>
            <Building2 size={14} style={{ color: "#94A3B8" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }} className="max-w-[160px] truncate">
              {company.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Admin nav (mobile dark) ──────────────────────────────────────────────────

const ADMIN_TABS = [
  { href: "/kaitai",          label: "現場",    icon: HardHat },
  { href: "/kaitai/members",  label: "メンバー", icon: Users },
  { href: "/kaitai/work",     label: "作業報告", icon: ClipboardList },
  { href: "/kaitai/admin",    label: "収支管理", icon: BarChart2 },
  { href: "/kaitai/master",   label: "マスタ",   icon: Database },
] as const;

function AdminNav({ pathname }: { pathname: string }) {
  const { setAdminMode } = useAppContext();
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 flex flex-col z-40 w-full md:hidden"
      style={{
        maxWidth: 480,
        background: "rgba(15,25,40,0.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid #2D3E54",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-1.5"
        style={{ background: "rgba(239,68,68,0.12)", borderBottom: "1px solid rgba(239,68,68,0.2)" }}
      >
        <span className="text-[10px] font-bold tracking-widest" style={{ color: "#F87171" }}>
          🔴 管理者モード
        </span>
        <button
          onClick={() => setAdminMode(false)}
          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"
          style={{ background: "rgba(239,68,68,0.15)", color: "#F87171" }}
        >
          <X size={9} />終了
        </button>
      </div>
      <div className="flex">
        {ADMIN_TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/kaitai" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5"
            >
              <div
                className="rounded-xl px-2.5 py-1 transition-all"
                style={active ? { background: "rgba(249,115,22,0.15)" } : {}}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? "#F97316" : "#64748B" }}
                />
              </div>
              <span className="text-[9px] font-bold tracking-wide" style={{ color: active ? "#F97316" : "#64748B" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Worker nav (mobile light) ────────────────────────────────────────────────

const NAV_H = 80;

function WorkerNav({ pathname }: { pathname: string }) {
  const isHome     = pathname === "/kaitai";
  const isSchedule = pathname.startsWith("/kaitai/schedule");
  const isReport   = pathname.startsWith("/kaitai/report");
  const isMember   = pathname.startsWith("/kaitai/members");
  const isMenu     = pathname.startsWith("/kaitai/menu");

  type TabDef = { href: string; label: string; icon: React.ElementType; active: boolean; center?: boolean };

  const tabs: TabDef[] = [
    { href: "/kaitai",           label: "現場状況", icon: Home,           active: isHome },
    { href: "/kaitai/schedule",  label: "全体予定", icon: Calendar,       active: isSchedule },
    { href: "/kaitai/report",    label: "報告",     icon: ClipboardList,  active: isReport, center: true },
    { href: "/kaitai/members",   label: "メンバー", icon: Users,          active: isMember },
    { href: "/kaitai/menu",      label: "メニュー", icon: MoreHorizontal, active: isMenu },
  ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 flex items-stretch w-full md:hidden"
      style={{
        maxWidth: 480,
        background: "#FFFFFF",
        borderTop: "2px solid #EEEEEE",
        boxShadow: "0 -2px 16px rgba(0,0,0,0.07)",
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
                className="flex items-center justify-center rounded-full transition-all active:scale-95"
                style={{
                  width: 52, height: 52,
                  background: "linear-gradient(135deg, #FF9800, #F44336)",
                  boxShadow: "0 4px 16px rgba(255,152,0,0.45)",
                  marginBottom: -2,
                }}
              >
                <Icon size={26} color="#FFFFFF" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#FF9800", lineHeight: 1 }}>{label}</span>
            </>
          ) : (
            <>
              <div
                className="flex items-center justify-center rounded-2xl transition-all"
                style={{ width: 52, height: 36, background: active ? "rgba(255,152,0,0.13)" : "transparent" }}
              >
                <Icon
                  size={active ? 26 : 23}
                  strokeWidth={active ? 2.5 : 2}
                  fill={active ? "rgba(255,152,0,0.2)" : "none"}
                  style={{ color: active ? "#FF9800" : "#555555" }}
                />
              </div>
              <span style={{ fontSize: 11, fontWeight: active ? 800 : 600, color: active ? "#FF9800" : "#666666", lineHeight: 1 }}>
                {label}
              </span>
            </>
          )}
        </Link>
      ))}
    </nav>
  );
}

// ─── Unified nav ──────────────────────────────────────────────────────────────

export function KaitaiNav() {
  const pathname = usePathname();
  const { adminMode } = useAppContext();

  if (SUPPRESS_ROUTES.some(r => pathname.startsWith(r))) return null;

  return (
    <>
      {/* PC / Tablet sidebar (md+) */}
      <PCSidebar pathname={pathname} adminMode={adminMode} />

      {/* PC / Tablet top header bar (md+) */}
      <PCTopBar pathname={pathname} />

      {/* Mobile bottom nav (hidden on md+) */}
      {adminMode
        ? <AdminNav pathname={pathname} />
        : <WorkerNav pathname={pathname} />
      }
    </>
  );
}
