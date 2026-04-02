"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, BarChart2, Database, Users, ChevronRight,
  HardHat, LogOut, Bell, Info, Lock, CreditCard, Building2, FileText, Truck,
} from "lucide-react";
import { useAppContext } from "../lib/app-context";
import { PinPad } from "../components/pin-pad";
import { PLAN_LIMITS } from "../lib/app-context";

// ─── Plan badge colors ────────────────────────────────────────────────────────

const PLAN_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  free:       { bg: "#F1F5F9", fg: "#475569", label: "Free" },
  standard:   { bg: "#FFF7ED", fg: "#FF9800", label: "Standard" },
  business:   { bg: "#EFF6FF", fg: "#3B82F6", label: "Business" },
  enterprise: { bg: "#F5F0FF", fg: "#7C3AED", label: "Enterprise" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const router = useRouter();
  const { adminMode, setAdminMode, authLevel, setAuthLevel, company, plan, addLog } = useAppContext();

  const [showPinModal, setShowPinModal] = useState(false);

  // Hidden dev link: long-press on version text
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function startPress() {
    pressTimer.current = setTimeout(() => router.push("/kaitai/dev"), 1500);
  }
  function cancelPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  const isAdmin = authLevel === "admin" || authLevel === "dev";
  const planStyle = PLAN_STYLE[plan];
  const limits = PLAN_LIMITS[plan];

  function onAdminPinSuccess() {
    setShowPinModal(false);
    setAuthLevel("admin");
    addLog("admin_login", company?.adminName ?? "管理者");
  }

  function exitAdminMode() {
    setAdminMode(false);
    addLog("admin_logout", company?.adminName ?? "管理者");
  }

  // ── PIN modal overlay ──
  if (showPinModal) {
    return (
      <PinPad
        title="管理者パスワード"
        subtitle="第二パスワードを入力してください"
        correctPin={company?.password2 ?? "0000"}
        onSuccess={onAdminPinSuccess}
        onBack={() => setShowPinModal(false)}
        dark={true}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen pb-28" style={{ background: "#F9FAFB" }}>

      {/* ── Header ── */}
      <header className="px-5 pt-12 pb-5" style={{ background: "#FFFFFF", borderBottom: "1px solid #F3F4F6" }}>
        <h1 className="text-xl font-bold" style={{ color: "#111827" }}>メニュー</h1>
        <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>設定・権限管理</p>
      </header>

      <div className="px-4 py-5 flex flex-col gap-4">

        {/* ── Profile ── */}
        <div className="rounded-2xl px-4 py-4 flex items-center gap-3" style={{ background: "#FFFFFF", border: "1px solid #F3F4F6" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ background: "#FFF7ED", color: "#FF9800" }}>
            {company?.adminName?.charAt(0) ?? "田"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate" style={{ color: "#111827" }}>{company?.adminName ?? "田中 義雄"}</p>
            <p className="text-xs" style={{ color: "#6B7280" }}>{company?.name ?? "解体工業株式会社"}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: planStyle.bg, color: planStyle.fg }}
            >
              {planStyle.label}
            </div>
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={isAdmin
                ? { background: "rgba(239,68,68,0.1)", color: "#EF4444" }
                : { background: "#F3F4F6", color: "#6B7280" }}
            >
              {isAdmin ? "管理者モード" : "作業員モード"}
            </div>
          </div>
        </div>

        {/* ── Plan info strip ── */}
        <div className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: planStyle.bg, border: `1.5px solid ${planStyle.fg}30` }}>
          <div>
            <p className="text-xs font-bold" style={{ color: planStyle.fg }}>現在のプラン: {planStyle.label}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#888888" }}>
              現場 {limits.sites === Infinity ? "無制限" : `${limits.sites}件`} · メンバー {limits.members === Infinity ? "無制限" : `${limits.members}名`}
            </p>
          </div>
          {isAdmin && (
            <Link href="/kaitai/billing">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold" style={{ background: planStyle.fg, color: "#FFFFFF" }}>
                <CreditCard size={11} />
                変更
              </div>
            </Link>
          )}
        </div>

        {/* ── Admin mode section ── */}
        <section>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-2 px-1" style={{ color: "#FF9800" }}>
            管理者機能
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #F3F4F6" }}>

            {/* Toggle row */}
            <div className="px-4 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: isAdmin ? "rgba(239,68,68,0.1)" : "#F3F4F6" }}>
                <Shield size={18} style={{ color: isAdmin ? "#EF4444" : "#6B7280" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: "#111827" }}>管理者モード</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  {isAdmin ? "認証済み — 全機能解放中" : "第二パスワードで認証"}
                </p>
              </div>
              <button
                onClick={() => isAdmin ? exitAdminMode() : setShowPinModal(true)}
                className="relative flex-shrink-0 transition-all"
                style={{
                  width: 48, height: 28, borderRadius: 14,
                  background: isAdmin ? "linear-gradient(135deg, #EF4444, #F97316)" : "#E5E7EB",
                }}
              >
                <div
                  className="absolute top-1 transition-all rounded-full"
                  style={{ width: 20, height: 20, background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", left: isAdmin ? 26 : 4 }}
                />
              </button>
            </div>

            {/* Admin links */}
            {isAdmin && (
              <div style={{ borderTop: "1px solid #F3F4F6" }}>
                {[
                  { href: "/kaitai/admin",     icon: BarChart2,  label: "収支・経営分析",  sub: "売上・原価・粗利の分析レポート" },
                  { href: "/kaitai/equipment", icon: Truck,      label: "機材・車両管理",  sub: "重機・リース品・給油ログの管理" },
                  { href: "/kaitai/docs",      icon: FileText,   label: "帳票出力",         sub: "見積書・請求書・報告書などを出力" },
                  { href: "/kaitai/clients",   icon: Building2,  label: "元請け管理",       sub: "発注元・元請け会社の登録・管理" },
                  { href: "/kaitai/master",    icon: Database,   label: "マスタ管理",       sub: "単価・現場・労務費の登録・編集" },
                  { href: "/kaitai/members",   icon: Users,      label: "メンバー評価",     sub: "勤怠統計・パフォーマンス管理" },
                  { href: "/kaitai/billing",   icon: CreditCard, label: "請求・プラン管理", sub: `現在: ${planStyle.label} プラン` },
                ].map(({ href, icon: Icon, label, sub }, i) => (
                  <Link key={href} href={href}>
                    <div
                      className="px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors"
                      style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : undefined }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.08)" }}>
                        <Icon size={16} style={{ color: "#EF4444" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "#111827" }}>{label}</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>{sub}</p>
                      </div>
                      <ChevronRight size={15} style={{ color: "#D1D5DB" }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── General settings ── */}
        <section>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-2 px-1" style={{ color: "#9CA3AF" }}>
            一般設定
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #F3F4F6" }}>
            {[
              { icon: Bell,  label: "通知設定",     sub: "作業開始・終了のリマインダー" },
              { icon: Lock,  label: "PINコード変更", sub: "現場報告の認証コード" },
              { icon: HardHat, label: "現場選択",   sub: "作業中の現場を設定" },
            ].map(({ icon: Icon, label, sub }, i) => (
              <button key={label} className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors" style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : undefined }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F3F4F6" }}>
                  <Icon size={16} style={{ color: "#6B7280" }} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>{label}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{sub}</p>
                </div>
                <ChevronRight size={15} style={{ color: "#D1D5DB" }} />
              </button>
            ))}
          </div>
        </section>

        {/* ── Logout ── */}
        <button
          onClick={() => { setAuthLevel("worker"); addLog("logout", company?.adminName ?? "—"); router.push("/kaitai/login"); }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm"
          style={{ background: "#FFFFFF", border: "1px solid #FEE2E2", color: "#EF4444" }}
        >
          <LogOut size={16} />
          ログアウト
        </button>

        {/* ── Hidden dev link ── */}
        <div className="flex flex-col items-center gap-1 pt-2">
          <button
            onPointerDown={startPress}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            style={{ fontSize: 11, color: "#CCCCCC", userSelect: "none" }}
          >
            <Info size={10} style={{ display: "inline", marginRight: 4 }} />
            解体LINK v1.0.0
          </button>
        </div>

      </div>
    </div>
  );
}
