"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Users, Menu, X,
  Calendar, ClipboardList, Plus, LogOut,
  Building2, ClipboardCheck, Shield, ChevronRight,
  Bell, Lock, HardHat,
} from "lucide-react";
import Image from "next/image";
import { useAppContext } from "../lib/app-context";
import { T } from "../lib/design-tokens";

function LogoutButton() {
  const router = useRouter();
  const { setAuthLevel, setCompany } = useAppContext();
  return (
    <button
      onClick={async () => {
        try { await fetch("/api/kaitai/auth/logout", { method: "POST", credentials: "include" }); } catch {}
        setAuthLevel("worker");
        setCompany(null);
        try { localStorage.removeItem("kaitai_company"); sessionStorage.removeItem("kaitai_auth_level"); } catch {}
        router.push("/kaitai/login");
      }}
      className="flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
      title="ログアウト"
      style={{ width: 36, height: 36 }}
    >
      <LogOut size={16} style={{ color: "#94A3B8" }} />
    </button>
  );
}

// ─── 定数 ─────────────────────────────────────────────────────────────────────
const SUPPRESS_ROUTES = [
  "/kaitai/login", "/kaitai/signup", "/kaitai/dev",
  "/kaitai/clients", "/kaitai/billing", "/kaitai/docs",
  "/kaitai/equipment", "/kaitai/lp", "/kaitai/demo",
  "/kaitai/admin",
];

const WORKER_TABS = [
  { href: "/kaitai",              label: "現場状況",  icon: Home },
  { href: "/kaitai/schedule",     label: "全体予定",  icon: Calendar },
  { href: "/kaitai/report",       label: "報告",      icon: ClipboardList },
  { href: "/kaitai/skill-matrix", label: "スキル",    icon: ClipboardCheck },
  { href: "/kaitai/members",      label: "メンバー",  icon: Users },
  { href: "/kaitai/menu",         label: "メニュー",  icon: Menu },
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

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

// ─── ハンバーガーメニュードロワー ─────────────────────────────────────────────

function HamburgerDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { company, setAuthLevel, setCompany } = useAppContext();

  // ESCキーで閉じる
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // bodyスクロール無効化
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const C = {
    text: T.text, sub: T.sub, muted: T.muted,
    border: T.border, card: T.surface,
    amber: T.primary, amberDk: T.primaryDk,
    red: "#EF4444",
  };

  return (
    <div
      className="fixed inset-0 z-[999]"
      style={{ background: "rgba(0,0,0,0.4)", transition: "opacity 0.2s" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="absolute top-0 right-0 h-full overflow-y-auto"
        style={{
          width: "min(320px, 85vw)",
          background: "#FFFFFF",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
          animation: "slideInRight 0.25s ease-out",
        }}
      >
        {/* ヘッダー */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <span style={{ fontSize: 17, fontWeight: 800, color: C.text }}>メニュー</span>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: "#F3F4F6" }}
          >
            <X size={18} style={{ color: "#666" }} />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {/* ── プロフィール ── */}
          <div
            className="rounded-2xl px-4 py-4 flex items-center gap-3"
            style={{ background: "#F8FAFC", border: `1px solid ${C.border}` }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0 rounded-xl font-bold"
              style={{
                width: 44, height: 44,
                background: T.primaryLt, color: C.amber,
                fontSize: 18, borderRadius: 12,
              }}
            >
              {company?.adminName?.charAt(0) ?? "田"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-bold" style={{ fontSize: 16, color: C.text }}>
                {company?.adminName ?? "田中 義雄"}
              </p>
              <p className="truncate" style={{ fontSize: 13, color: C.sub, marginTop: 1 }}>
                {company?.name ?? "解体工業株式会社"}
              </p>
            </div>
          </div>

          {/* ── 管理者 ── */}
          <section>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", marginBottom: 8, paddingLeft: 2,
              color: C.amber,
            }}>
              管理者
            </p>
            <Link
              href="/kaitai/admin"
              onClick={onClose}
              className="flex items-center gap-3 px-4 rounded-xl hover:bg-gray-50 transition-colors"
              style={{
                minHeight: 56,
                background: C.card,
                border: `1px solid ${C.border}`,
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0 rounded-lg"
                style={{ width: 36, height: 36, background: "#FEF2F2" }}
              >
                <Shield size={18} style={{ color: C.red }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>管理者ページ</p>
                <p style={{ fontSize: 12, color: C.muted }}>収支分析・帳票・メンバー管理</p>
              </div>
              <ChevronRight size={16} style={{ color: C.muted }} />
            </Link>
          </section>

          {/* ── 設定 ── */}
          <section>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", marginBottom: 8, paddingLeft: 2,
              color: C.muted,
            }}>
              設定
            </p>
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              {[
                { icon: Bell, label: "通知設定", sub: "リマインダー" },
                { icon: Lock, label: "PINコード変更", sub: "認証コード" },
                { icon: HardHat, label: "現場選択", sub: "作業中の現場" },
              ].map(({ icon: Icon, label, sub }, i) => (
                <button
                  key={label}
                  className="w-full px-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  style={{
                    minHeight: 52,
                    borderTop: i > 0 ? `1px solid #F1F5F9` : undefined,
                  }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0 rounded-lg"
                    style={{ width: 32, height: 32, background: T.bg }}
                  >
                    <Icon size={16} style={{ color: C.muted }} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</p>
                    <p style={{ fontSize: 11, color: C.muted }}>{sub}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: C.muted }} />
                </button>
              ))}
            </div>
          </section>

          {/* ── ログアウト ── */}
          <button
            onClick={async () => {
              try { await fetch("/api/kaitai/auth/logout", { method: "POST", credentials: "include" }); } catch {}
              setAuthLevel("worker");
              setCompany(null);
              try { localStorage.removeItem("kaitai_company"); sessionStorage.removeItem("kaitai_auth_level"); } catch {}
              onClose();
              router.push("/kaitai/login");
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors hover:bg-red-50"
            style={{
              background: C.card, border: `1px solid #FECACA`,
              color: C.red, fontSize: 14, fontWeight: 600,
              padding: "12px 20px", borderRadius: 12,
            }}
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </div>

      {/* アニメーション */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── モバイルナビ (<1024px) ───────────────────────────────────────────────────

const NAV_H = 72;

function WorkerMobileNav({ pathname }: { pathname: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // パス変更でドロワーを閉じる
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // モバイルボトムナビ: 5タブ（「その他」をハンバーガーに移動）
  const tabs = [
    { href: "/kaitai",              label: "現場",     icon: Home,           active: pathname === "/kaitai",                       center: false },
    { href: "/kaitai/schedule",     label: "予定",     icon: Calendar,       active: pathname.startsWith("/kaitai/schedule"),      center: false },
    { href: "/kaitai/report",       label: "報告",     icon: ClipboardList,  active: pathname.startsWith("/kaitai/report"),        center: true  },
    { href: "/kaitai/skill-matrix", label: "スキル",   icon: ClipboardCheck, active: pathname.startsWith("/kaitai/skill-matrix"), center: false },
    { href: "/kaitai/members",      label: "メンバー", icon: Users,          active: pathname.startsWith("/kaitai/members"),       center: false },
  ];

  return (
    <>
      {/* ── トップバー：ハンバーガーボタン（モバイルのみ） ── */}
      <div
        className="fixed top-0 right-0 z-50 md:hidden"
        style={{ padding: "env(safe-area-inset-top, 12px) 12px 0 0" }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center rounded-xl transition-all active:scale-95"
          style={{
            width: 40, height: 40,
            background: "rgba(255,255,255,0.92)",
            border: "1.5px solid #E5E7EB",
            backdropFilter: "blur(8px)",
            marginTop: 8,
          }}
        >
          <Menu size={20} style={{ color: "#475569" }} />
        </button>
      </div>

      {/* ── ドロワー ── */}
      <HamburgerDrawer open={drawerOpen} onClose={closeDrawer} />

      {/* ── ボトムナビ ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch w-full"
        style={{
          background: "#FFFFFF",
          borderTop: "1.5px solid #E2E8F0",
          paddingBottom: "env(safe-area-inset-bottom)",
          height: `calc(${NAV_H}px + env(safe-area-inset-bottom))`,
        }}
      >
        {tabs.map(({ href, label, icon: Icon, active, center }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
            style={{ minHeight: NAV_H }}
          >
            {center ? (
              <>
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 48, height: 48,
                    background: T.primary,
                    marginTop: -10,
                  }}
                >
                  <Icon size={22} color="#FFF" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.primary, lineHeight: 1, marginTop: 2 }}>
                  {label}
                </span>
              </>
            ) : (
              <>
                <div
                  className="flex items-center justify-center rounded-xl transition-colors"
                  style={{ width: 36, height: 30, background: active ? T.primaryLt : "transparent" }}
                >
                  <Icon size={active ? 20 : 19} strokeWidth={active ? 2.5 : 2} style={{ color: active ? T.primary : "#94A3B8" }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? T.primary : "#94A3B8", lineHeight: 1 }}>
                  {label}
                </span>
              </>
            )}
          </Link>
        ))}
      </nav>
    </>
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
