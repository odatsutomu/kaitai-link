"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, MoreHorizontal,
  HardHat, BarChart2, Database, X,
  Calendar, ClipboardList,
} from "lucide-react";
import { useAppContext } from "../lib/app-context";

// ─── Admin nav (dark) ─────────────────────────────────────────────────────────

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
      {/* Admin mode banner */}
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
          <X size={9} />
          終了
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
              <span
                className="text-[9px] font-bold tracking-wide"
                style={{ color: active ? "#F97316" : "#64748B" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Worker nav (light, senior-friendly, 5 tabs) ──────────────────────────────

const NAV_H = 80;

function WorkerNav({ pathname }: { pathname: string }) {
  const isHome     = pathname === "/kaitai";
  const isSchedule = pathname.startsWith("/kaitai/schedule");
  const isReport   = pathname.startsWith("/kaitai/report");
  const isMember   = pathname.startsWith("/kaitai/members");
  const isMenu     = pathname.startsWith("/kaitai/menu");

  type TabDef = {
    href: string;
    label: string;
    icon: React.ElementType;
    active: boolean;
    center?: boolean;
  };

  const tabs: TabDef[] = [
    { href: "/kaitai",           label: "現場状況", icon: Home,          active: isHome },
    { href: "/kaitai/schedule",  label: "全体予定", icon: Calendar,      active: isSchedule },
    { href: "/kaitai/report",    label: "報告",    icon: ClipboardList, active: isReport, center: true },
    { href: "/kaitai/members",   label: "メンバー", icon: Users,         active: isMember },
    { href: "/kaitai/menu",      label: "メニュー", icon: MoreHorizontal, active: isMenu },
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
            /* Center 報告 — elevated orange circle */
            <>
              <div
                className="flex items-center justify-center rounded-full transition-all active:scale-95"
                style={{
                  width: 52, height: 52,
                  background: active
                    ? "linear-gradient(135deg, #FF9800, #F44336)"
                    : "linear-gradient(135deg, #FF9800, #F44336)",
                  boxShadow: "0 4px 16px rgba(255,152,0,0.45)",
                  marginBottom: -2,
                }}
              >
                <Icon size={26} color="#FFFFFF" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#FF9800", lineHeight: 1 }}>
                {label}
              </span>
            </>
          ) : (
            /* Regular tab */
            <>
              <div
                className="flex items-center justify-center rounded-2xl transition-all"
                style={{
                  width: 52, height: 36,
                  background: active ? "rgba(255,152,0,0.13)" : "transparent",
                }}
              >
                <Icon
                  size={active ? 26 : 23}
                  strokeWidth={active ? 2.5 : 2}
                  fill={active ? "rgba(255,152,0,0.2)" : "none"}
                  style={{ color: active ? "#FF9800" : "#555555" }}
                />
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: active ? 800 : 600,
                color: active ? "#FF9800" : "#666666",
                lineHeight: 1,
              }}>
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

const SUPPRESS_ROUTES = ["/kaitai/login", "/kaitai/signup", "/kaitai/dev", "/kaitai/clients", "/kaitai/billing", "/kaitai/docs", "/kaitai/equipment", "/kaitai/lp", "/kaitai/demo"];

export function KaitaiNav() {
  const pathname = usePathname();
  const { adminMode } = useAppContext();

  if (SUPPRESS_ROUTES.some(r => pathname.startsWith(r))) return null;

  return adminMode
    ? <AdminNav pathname={pathname} />
    : <WorkerNav pathname={pathname} />;
}
