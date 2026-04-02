"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, MoreHorizontal,
  HardHat, BarChart2, Database, X,
  Calendar, ClipboardList, TrendingUp,
  Settings, CreditCard, Building2,
} from "lucide-react";
import { useAppContext } from "../lib/app-context";

// ─── Suppress routes ──────────────────────────────────────────────────────────
const SUPPRESS_ROUTES = [
  "/kaitai/login", "/kaitai/signup", "/kaitai/dev",
  "/kaitai/clients", "/kaitai/billing", "/kaitai/docs",
  "/kaitai/equipment", "/kaitai/lp", "/kaitai/demo",
];

// ─── Tab definitions ──────────────────────────────────────────────────────────

const ADMIN_TABS = [
  { href: "/kaitai",         label: "現場管理",   sub: "進捗・原価を確認",  icon: HardHat },
  { href: "/kaitai/members", label: "メンバー",   sub: "スタッフ管理",      icon: Users },
  { href: "/kaitai/work",    label: "作業報告",   sub: "日報・報告一覧",    icon: ClipboardList },
  { href: "/kaitai/admin",   label: "経営分析",   sub: "収支・KPIダッシュ", icon: TrendingUp },
  { href: "/kaitai/master",  label: "マスタ設定", sub: "機材・顧客・設定",  icon: Settings },
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

// ─── PC / Tablet Sidebar (fixed) ─────────────────────────────────────────────

export function KaitaiSidebar() {
  const pathname = usePathname();
  const { adminMode, setAdminMode, company } = useAppContext();

  if (SUPPRESS_ROUTES.some((r) => pathname.startsWith(r))) return null;

  const tabs = adminMode ? ADMIN_TABS : WORKER_TABS;

  return (
    <>
      {/* ── Full sidebar (lg+, 256px) ────────────────────────── */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-50"
        style={{
          background: "linear-gradient(180deg, #0C1A2E 0%, #091525 100%)",
          borderRight: "1px solid rgba(45,62,84,0.7)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
        }}
      >
        {/* Logo */}
        <div className="px-6 pt-7 pb-6">
          <div style={{ color: "#F97316", fontWeight: 900, fontSize: 24, letterSpacing: "-0.5px" }}>
            解体LINK
          </div>
          <div style={{ color: "#3D5A7A", fontSize: 11, marginTop: 2, fontWeight: 600 }}>
            解体業務管理システム
          </div>
        </div>

        {/* Admin mode banner */}
        {adminMode && (
          <div
            className="mx-4 mb-2 px-3 py-2 rounded-xl flex items-center justify-between"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <span style={{ color: "#F87171", fontSize: 11, fontWeight: 700 }}>🔴 管理者モード</span>
            <button
              onClick={() => setAdminMode(false)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: "rgba(239,68,68,0.15)", color: "#F87171" }}
            >
              <X size={9} />終了
            </button>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {tabs.map(({ href, label, sub, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                style={{
                  background: active ? "rgba(249,115,22,0.14)" : "transparent",
                  border: `1px solid ${active ? "rgba(249,115,22,0.28)" : "transparent"}`,
                }}
              >
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: 36, height: 36,
                    background: active ? "rgba(249,115,22,0.22)" : "rgba(255,255,255,0.04)",
                  }}
                >
                  <Icon
                    size={17}
                    strokeWidth={active ? 2.5 : 2}
                    style={{ color: active ? "#F97316" : "#4A6280" }}
                  />
                </div>
                <div className="min-w-0">
                  <div style={{ fontSize: 13, fontWeight: active ? 800 : 600, color: active ? "#F1F5F9" : "#8AA0B8" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 10, color: "#3D5A7A", marginTop: 1 }}>{sub}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 pb-5 pt-3 border-t border-[#1A2E45] flex flex-col gap-2">
          <Link
            href="/kaitai/billing"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}
          >
            <CreditCard size={14} style={{ color: "#F97316" }} />
            <div>
              <div style={{ fontSize: 11, color: "#F97316", fontWeight: 700 }}>
                {company?.plan
                  ? company.plan.charAt(0).toUpperCase() + company.plan.slice(1)
                  : "Free"} プラン
              </div>
              <div style={{ fontSize: 9, color: "#3D5A7A" }}>プランを管理</div>
            </div>
          </Link>
          {company?.name && (
            <div className="flex items-center gap-2 px-3 py-2">
              <Building2 size={13} style={{ color: "#3D5A7A" }} />
              <span style={{ fontSize: 11, color: "#8AA0B8", fontWeight: 600 }} className="truncate">
                {company.name}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* ── Icon-only sidebar (md only, 64px) ────────────────── */}
      <aside
        className="hidden md:flex lg:hidden fixed left-0 top-0 h-full w-16 flex-col z-50"
        style={{
          background: "linear-gradient(180deg, #0C1A2E 0%, #091525 100%)",
          borderRight: "1px solid rgba(45,62,84,0.7)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-14 border-b border-[#1A2E45]">
          <span style={{ color: "#F97316", fontWeight: 900, fontSize: 14 }}>KL</span>
        </div>

        <nav className="flex-1 flex flex-col items-center py-3 gap-1">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
                style={{ background: active ? "rgba(249,115,22,0.2)" : "transparent" }}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                  style={{ color: active ? "#F97316" : "#4A6280" }}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-center h-12 border-t border-[#1A2E45]">
          <Link href="/kaitai/billing" title="プラン管理">
            <CreditCard size={18} style={{ color: "#4A6280" }} />
          </Link>
        </div>
      </aside>
    </>
  );
}

// ─── PC Top Header Bar ────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  "/kaitai":          "現場管理",
  "/kaitai/members":  "メンバー管理",
  "/kaitai/work":     "作業報告一覧",
  "/kaitai/admin":    "経営分析ダッシュボード",
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
      className="hidden md:flex items-center justify-between px-6 sticky top-0 z-30 flex-shrink-0"
      style={{
        height: 56,
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #E8EBF0",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      }}
    >
      <h1 style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{title}</h1>

      <div className="flex items-center gap-2">
        {adminMode ? (
          <button
            onClick={() => setAdminMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{ background: "rgba(239,68,68,0.09)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.22)" }}
          >
            <X size={11} />管理者モード終了
          </button>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: "#F1F5F9", color: "#64748B" }}>
            現場スタッフ
          </span>
        )}
        {company?.name && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
          >
            <Building2 size={13} style={{ color: "#94A3B8" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }} className="max-w-[180px] truncate">
              {company.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Admin nav (mobile only, dark) ────────────────────────────────────────────

function AdminMobileNav({ pathname }: { pathname: string }) {
  const { setAdminMode } = useAppContext();
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 flex flex-col z-40 w-full"
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
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: "rgba(239,68,68,0.15)", color: "#F87171" }}
        >
          <X size={9} />終了
        </button>
      </div>
      <div className="flex">
        {ADMIN_TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5">
              <div
                className="rounded-xl px-2.5 py-1"
                style={active ? { background: "rgba(249,115,22,0.15)" } : {}}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} style={{ color: active ? "#F97316" : "#64748B" }} />
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

// ─── Worker nav (mobile only, light) ─────────────────────────────────────────

const NAV_H = 80;

function WorkerMobileNav({ pathname }: { pathname: string }) {
  const tabs = [
    { href: "/kaitai",          label: "現場状況", icon: Home,           active: pathname === "/kaitai", center: false },
    { href: "/kaitai/schedule", label: "全体予定", icon: Calendar,       active: pathname.startsWith("/kaitai/schedule"), center: false },
    { href: "/kaitai/report",   label: "報告",     icon: ClipboardList,  active: pathname.startsWith("/kaitai/report"), center: true },
    { href: "/kaitai/members",  label: "メンバー", icon: Users,          active: pathname.startsWith("/kaitai/members"), center: false },
    { href: "/kaitai/menu",     label: "メニュー", icon: MoreHorizontal, active: pathname.startsWith("/kaitai/menu"), center: false },
  ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 flex items-stretch w-full"
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
                className="flex items-center justify-center rounded-full active:scale-95 transition-all"
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

// ─── Mobile nav (shown only on mobile, hidden md+) ────────────────────────────

export function KaitaiMobileNav() {
  const pathname = usePathname();
  const { adminMode } = useAppContext();

  if (SUPPRESS_ROUTES.some((r) => pathname.startsWith(r))) return null;

  return (
    <div className="md:hidden">
      {adminMode
        ? <AdminMobileNav pathname={pathname} />
        : <WorkerMobileNav pathname={pathname} />
      }
    </div>
  );
}
