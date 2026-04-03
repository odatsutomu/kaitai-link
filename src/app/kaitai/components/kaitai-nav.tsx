"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, MoreHorizontal,
  Calendar, ClipboardList, Plus, LogOut,
  Building2,
} from "lucide-react";
import Image from "next/image";
import { useAppContext } from "../lib/app-context";
import { T } from "../lib/design-tokens";

// ─── 定数 ─────────────────────────────────────────────────────────────────────
const SUPPRESS_ROUTES = [
  "/kaitai/login", "/kaitai/signup", "/kaitai/dev",
  "/kaitai/clients", "/kaitai/billing", "/kaitai/docs",
  "/kaitai/equipment", "/kaitai/lp", "/kaitai/demo",
  "/kaitai/admin",
];

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
  const { company } = useAppContext();
  if (SUPPRESS_ROUTES.some((r) => pathname.startsWith(r))) return null;

  return (
    <header
      className="hidden lg:block sticky top-0 z-50 flex-shrink-0 w-full"
      style={{
        height: 80,
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
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
          {WORKER_TABS.map(({ href, label }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex items-center transition-colors"
                style={{
                  fontSize: 15,
                  fontWeight: active ? 700 : 500,
                  color: active ? T.primary : "#64748B",
                  paddingBottom: 4,
                  borderBottom: `2px solid ${active ? T.primary : "transparent"}`,
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
                background: T.primary,
                color: "#FFFFFF",
                fontSize: 14,
              }}
            >
              <Plus size={14} />
              新規現場
            </div>
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
                  background: T.primary,
                  marginTop: -8,
                }}
              >
                <Icon size={22} color="#FFF" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.primary, lineHeight: 1, marginTop: 2 }}>
                {label}
              </span>
            </>
          ) : (
            <>
              <div
                className="flex items-center justify-center rounded-xl transition-colors"
                style={{ width: 40, height: 32, background: active ? T.primaryLt : "transparent" }}
              >
                <Icon size={active ? 22 : 20} strokeWidth={active ? 2.5 : 2} style={{ color: active ? T.primary : "#94A3B8" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: active ? 700 : 400, color: active ? T.primary : "#94A3B8", lineHeight: 1 }}>
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
  if (SUPPRESS_ROUTES.some((r) => pathname.startsWith(r))) return null;
  return (
    <div className="lg:hidden">
      <WorkerMobileNav pathname={pathname} />
    </div>
  );
}
