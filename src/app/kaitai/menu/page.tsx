"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, BarChart2, Database, Users, ChevronRight,
  HardHat, LogOut, Bell, Info, Lock, CreditCard, Building2, FileText, Truck, Star,
} from "lucide-react";
import { useAppContext } from "../lib/app-context";
import { PinPad } from "../components/pin-pad";
import { PLAN_LIMITS } from "../lib/app-context";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: "#1E293B", sub: "#64748B", muted: "#94A3B8",
  border: "#E2E8F0", card: "#FFFFFF",
  amber: "#F59E0B", amberDk: "#D97706",
  red: "#EF4444",
};

// ─── Plan badge styles ────────────────────────────────────────────────────────

const PLAN_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  free:       { bg: "#F1F5F9", fg: "#475569", label: "Free" },
  standard:   { bg: "#FFFBEB", fg: "#D97706", label: "Standard" },
  business:   { bg: "#EFF6FF", fg: "#2563EB", label: "Business" },
  enterprise: { bg: "#F5F3FF", fg: "#7C3AED", label: "Enterprise" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const router = useRouter();
  const { adminMode, setAdminMode, authLevel, setAuthLevel, company, plan, addLog } = useAppContext();

  const [showPinModal, setShowPinModal] = useState(false);

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function startPress() {
    pressTimer.current = setTimeout(() => router.push("/kaitai/dev"), 1500);
  }
  function cancelPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  const isAdmin = authLevel === "admin" || authLevel === "dev";
  const planStyle = PLAN_STYLE[plan] ?? PLAN_STYLE.free;
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
    <div className="py-6 pb-28 md:pb-8">
      <div className="max-w-xl mx-auto lg:mx-0 flex flex-col gap-5">

        {/* ── Page header ── */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>メニュー</h1>
          <p className="text-sm mt-1" style={{ color: C.sub }}>設定・権限管理</p>
        </div>

        {/* ── Profile card ── */}
        <div
          className="rounded-xl px-5 py-4 flex items-center gap-4"
          style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: "#FFFBEB", color: C.amber }}
          >
            {company?.adminName?.charAt(0) ?? "田"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate" style={{ color: C.text }}>{company?.adminName ?? "田中 義雄"}</p>
            <p className="text-xs mt-0.5" style={{ color: C.sub }}>{company?.name ?? "解体工業株式会社"}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: planStyle.bg, color: planStyle.fg }}>
              {planStyle.label}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={isAdmin
                ? { background: "#FEF2F2", color: C.red }
                : { background: "#F1F5F9", color: C.sub }}
            >
              {isAdmin ? "管理者モード" : "作業員モード"}
            </span>
          </div>
        </div>

        {/* ── Plan info strip ── */}
        <div
          className="rounded-xl px-5 py-3.5 flex items-center justify-between"
          style={{ background: planStyle.bg, border: `1px solid ${planStyle.fg}30` }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: planStyle.fg }}>現在のプラン: {planStyle.label}</p>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>
              現場 {limits.sites === Infinity ? "無制限" : `${limits.sites}件`} · メンバー {limits.members === Infinity ? "無制限" : `${limits.members}名`}
            </p>
          </div>
          {isAdmin && (
            <Link href="/kaitai/billing">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: planStyle.fg, color: "#FFFFFF" }}>
                <CreditCard size={11} />
                変更
              </div>
            </Link>
          )}
        </div>

        {/* ── Quick actions ── */}
        <section>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-2.5 px-1" style={{ color: C.sub }}>
            クイックアクション
          </p>
          <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <Link href="/kaitai/evaluation">
              <div className="px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FFFBEB" }}>
                  <Star size={16} style={{ color: C.amber }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: C.text }}>評価入力</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>本日の現場メンバーを評価する</p>
                </div>
                <div className="flex items-center justify-center w-7 h-7 rounded-full" style={{ background: "#FFF8E6", color: "#F59E0B" }}><ChevronRight size={13} /></div>
              </div>
            </Link>
          </div>
        </section>

        {/* ── Admin section ── */}
        <section>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-2.5 px-1" style={{ color: C.amber }}>
            管理者機能
          </p>
          <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>

            {/* Toggle row */}
            <div className="px-5 py-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: isAdmin ? "#FEF2F2" : "#F1F5F9" }}
              >
                <Shield size={18} style={{ color: isAdmin ? C.red : C.sub }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: C.text }}>管理者モード</p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                  {isAdmin ? "認証済み — 全機能解放中" : "第二パスワードで認証"}
                </p>
              </div>
              <button
                onClick={() => isAdmin ? exitAdminMode() : setShowPinModal(true)}
                className="relative flex-shrink-0 transition-all"
                style={{
                  width: 48, height: 28, borderRadius: 14,
                  background: isAdmin ? "#EF4444" : "#E2E8F0",
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
              <div style={{ borderTop: `1px solid ${C.border}` }}>
                {[
                  { href: "/kaitai/admin",            icon: BarChart2,  label: "収支・経営分析",     sub: "売上・原価・粗利の分析レポート" },
                  { href: "/kaitai/admin/evaluation", icon: Star,       label: "評価ダッシュボード",  sub: "作業員パフォーマンス分析（非公開）" },
                  { href: "/kaitai/equipment", icon: Truck,      label: "機材・車両管理",  sub: "重機・リース品・給油ログの管理" },
                  { href: "/kaitai/docs",      icon: FileText,   label: "帳票出力",         sub: "見積書・請求書・報告書などを出力" },
                  { href: "/kaitai/clients",   icon: Building2,  label: "元請け管理",       sub: "発注元・元請け会社の登録・管理" },
                  { href: "/kaitai/master",    icon: Database,   label: "マスタ管理",       sub: "単価・現場・労務費の登録・編集" },
                  { href: "/kaitai/members",   icon: Users,      label: "メンバー評価",     sub: "勤怠統計・パフォーマンス管理" },
                  { href: "/kaitai/billing",   icon: CreditCard, label: "請求・プラン管理", sub: `現在: ${planStyle.label} プラン` },
                ].map(({ href, icon: Icon, label, sub }, i) => (
                  <Link key={href} href={href}>
                    <div
                      className="px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                      style={{ borderTop: i > 0 ? `1px solid #F8FAFC` : undefined }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "#FEF2F2" }}
                      >
                        <Icon size={16} style={{ color: C.red }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: C.text }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: C.muted }}>{sub}</p>
                      </div>
                      <div className="flex items-center justify-center w-7 h-7 rounded-full" style={{ background: "#FFF8E6", color: "#F59E0B" }}><ChevronRight size={13} /></div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── General settings ── */}
        <section>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-2.5 px-1" style={{ color: C.muted }}>
            一般設定
          </p>
          <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            {[
              { icon: Bell,    label: "通知設定",     sub: "作業開始・終了のリマインダー" },
              { icon: Lock,    label: "PINコード変更", sub: "現場報告の認証コード" },
              { icon: HardHat, label: "現場選択",     sub: "作業中の現場を設定" },
            ].map(({ icon: Icon, label, sub }, i) => (
              <button
                key={label}
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                style={{ borderTop: i > 0 ? `1px solid #F8FAFC` : undefined }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F1F5F9" }}>
                  <Icon size={16} style={{ color: C.sub }} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold" style={{ color: C.text }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>{sub}</p>
                </div>
                <div className="flex items-center justify-center w-7 h-7 rounded-full" style={{ background: "#FFF8E6", color: "#F59E0B" }}><ChevronRight size={13} /></div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Logout ── */}
        <button
          onClick={() => { setAuthLevel("worker"); addLog("logout", company?.adminName ?? "—"); router.push("/kaitai/login"); }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors hover:bg-red-50"
          style={{ background: C.card, border: `1px solid #FECACA`, color: C.red }}
        >
          <LogOut size={16} />
          ログアウト
        </button>

        {/* ── Hidden dev link ── */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            onPointerDown={startPress}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            style={{ fontSize: 11, color: C.border, userSelect: "none" }}
          >
            <Info size={10} style={{ display: "inline", marginRight: 4 }} />
            解体LINK v1.0.0
          </button>
        </div>

      </div>
    </div>
  );
}
