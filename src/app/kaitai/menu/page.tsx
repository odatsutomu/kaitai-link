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
import { T } from "../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: T.sub,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
  red: "#EF4444",
};

// ─── Plan badge styles ────────────────────────────────────────────────────────

const PLAN_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  free:       { bg: T.bg, fg: "#475569", label: "Free" },
  standard:   { bg: T.primaryLt, fg: T.primaryDk, label: "Standard" },
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
          <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>設定・権限管理</p>
        </div>

        {/* ── Profile card ── */}
        <div
          className="rounded-2xl px-5 py-5 flex items-center gap-4"
          style={{ background: C.card, border: `1px solid ${C.border}`,
 borderRadius: 16 }}
        >
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-2xl font-bold"
            style={{ width: 56, height: 56, background: T.primaryLt, color: C.amber, fontSize: 22, borderRadius: 14 }}
          >
            {company?.adminName?.charAt(0) ?? "田"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-bold" style={{ fontSize: 20, color: C.text }}>{company?.adminName ?? "田中 義雄"}</p>
            <p style={{ fontSize: 16, marginTop: 2, color: C.sub }}>{company?.name ?? "解体工業株式会社"}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span style={{ fontSize: 14, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: planStyle.bg, color: planStyle.fg }}>
              {planStyle.label}
            </span>
            <span
              style={{
                fontSize: 14, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                ...(isAdmin
                  ? { background: "#FEF2F2", color: C.red }
                  : { background: T.bg, color: C.muted })
              }}
            >
              {isAdmin ? "管理者モード" : "作業員モード"}
            </span>
          </div>
        </div>

        {/* ── Plan info strip ── */}
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{ background: planStyle.bg, border: `1px solid ${planStyle.fg}30`, borderRadius: 16 }}
        >
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: planStyle.fg }}>現在のプラン: {planStyle.label}</p>
            <p style={{ fontSize: 14, marginTop: 2, color: C.muted }}>
              現場 {limits.sites === Infinity ? "無制限" : `${limits.sites}件`} · メンバー {limits.members === Infinity ? "無制限" : `${limits.members}名`}
            </p>
          </div>
          {isAdmin && (
            <Link href="/kaitai/billing">
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl" style={{ fontSize: 14, fontWeight: 700, background: planStyle.fg, color: T.surface, borderRadius: 12 }}>
                <CreditCard size={14} />
                変更
              </div>
            </Link>
          )}
        </div>

        {/* ── Quick actions ── */}
        <section>
          <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, paddingLeft: 4, color: C.sub }}>
            クイックアクション
          </p>
          <div className="overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`,
 borderRadius: 16 }}>
            <Link href="/kaitai/evaluation">
              <div className="px-5 flex items-center gap-3 hover:bg-gray-50 transition-colors" style={{ minHeight: 72 }}>
                <div className="flex items-center justify-center flex-shrink-0 rounded-xl" style={{ width: 44, height: 44, background: T.primaryLt }}>
                  <Star size={20} style={{ color: C.amber }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 16, fontWeight: 600, color: C.text }}>評価入力</p>
                  <p style={{ fontSize: 14, marginTop: 2, color: C.muted }}>本日の現場メンバーを評価する</p>
                </div>
                <div className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: "#FFF8E6", color: C.amber }}><ChevronRight size={18} /></div>
              </div>
            </Link>
          </div>
        </section>

        {/* ── Admin section ── */}
        <section>
          <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, paddingLeft: 4, color: C.amber }}>
            管理者機能
          </p>
          <div className="overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`,
 borderRadius: 16 }}>

            {/* Toggle row */}
            <div className="px-5 flex items-center gap-3" style={{ minHeight: 72 }}>
              <div
                className="flex items-center justify-center flex-shrink-0 rounded-xl"
                style={{ width: 44, height: 44, background: isAdmin ? "#FEF2F2" : T.bg }}
              >
                <Shield size={22} style={{ color: isAdmin ? C.red : C.muted }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 16, fontWeight: 600, color: C.text }}>管理者モード</p>
                <p style={{ fontSize: 14, marginTop: 2, color: C.muted }}>
                  {isAdmin ? "認証済み — 全機能解放中" : "第二パスワードで認証"}
                </p>
              </div>
              <button
                onClick={() => isAdmin ? exitAdminMode() : setShowPinModal(true)}
                className="relative flex-shrink-0 transition-all"
                style={{
                  width: 48, height: 28, borderRadius: 14,
                  background: isAdmin ? "#EF4444" : T.border,
                }}
              >
                <div
                  className="absolute top-1 transition-all rounded-full"
                  style={{ width: 20, height: 20, background: T.surface,
 left: isAdmin ? 26 : 4 }}
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
                      className="px-5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                      style={{ minHeight: 72, borderTop: i > 0 ? `1px solid #F8FAFC` : undefined }}
                    >
                      <div
                        className="flex items-center justify-center flex-shrink-0 rounded-xl"
                        style={{ width: 44, height: 44, background: "#FEF2F2" }}
                      >
                        <Icon size={20} style={{ color: C.red }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{label}</p>
                        <p style={{ fontSize: 14, marginTop: 2, color: C.muted }}>{sub}</p>
                      </div>
                      <div className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: "#FFF8E6", color: C.amber }}><ChevronRight size={18} /></div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── General settings ── */}
        <section>
          <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, paddingLeft: 4, color: C.muted }}>
            一般設定
          </p>
          <div className="overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`,
 borderRadius: 16 }}>
            {[
              { icon: Bell,    label: "通知設定",     sub: "作業開始・終了のリマインダー" },
              { icon: Lock,    label: "PINコード変更", sub: "現場報告の認証コード" },
              { icon: HardHat, label: "現場選択",     sub: "作業中の現場を設定" },
            ].map(({ icon: Icon, label, sub }, i) => (
              <button
                key={label}
                className="w-full px-5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                style={{ minHeight: 72, borderTop: i > 0 ? `1px solid #F8FAFC` : undefined }}
              >
                <div className="flex items-center justify-center flex-shrink-0 rounded-xl" style={{ width: 44, height: 44, background: T.bg }}>
                  <Icon size={22} style={{ color: C.muted }} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{label}</p>
                  <p style={{ fontSize: 14, marginTop: 2, color: C.muted }}>{sub}</p>
                </div>
                <div className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: "#FFF8E6", color: C.amber }}><ChevronRight size={22} /></div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Logout ── */}
        <button
          onClick={() => { setAuthLevel("worker"); addLog("logout", company?.adminName ?? "—"); router.push("/kaitai/login"); }}
          className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors hover:bg-red-50"
          style={{ background: C.card, border: `1px solid #FECACA`, color: C.red, fontSize: 15, fontWeight: 600, padding: "14px 20px", borderRadius: 12 }}
        >
          <LogOut size={18} />
          ログアウト
        </button>

        {/* ── Hidden dev link ── */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            onPointerDown={startPress}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            style={{ fontSize: 14, color: C.border, userSelect: "none" }}
          >
            <Info size={12} style={{ display: "inline", marginRight: 4 }} />
            解体LINK v1.0.0
          </button>
        </div>

      </div>
    </div>
  );
}
