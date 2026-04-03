"use client";

import { useState, useEffect } from "react";
import {
  Check, ExternalLink, CreditCard, Zap, Shield,
  RefreshCw, Download, Clock, AlertCircle, CheckCircle2,
  Lock, Wifi, WifiOff, ChevronRight, X, Plus,
} from "lucide-react";
import { useAppContext, PlanId, PLAN_LIMITS } from "../lib/app-context";
import { T } from "../lib/design-tokens";

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS: {
  id: PlanId;
  name: string;
  price: number;
  priceStr: string;
  color: string;
  accent: string;
  features: string[];
  stripePrice?: string;
  popular?: boolean;
}[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceStr: "¥0",
    color: T.sub,
    accent: T.bg,
    features: [
      "現場2件まで",
      "メンバー8名まで",
      "機材・車両管理",
      "経営分析ダッシュボード",
      "元請け管理",
      "データ保存90日",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 9800,
    priceStr: "¥9,800",
    color: "#FF9800",
    accent: "${T.primaryLt}",
    features: [
      "現場10件まで",
      "メンバー30名まで",
      "機材・車両管理",
      "経営分析ダッシュボード",
      "元請け管理",
      "データ保存1年",
      "チャットサポート",
    ],
    stripePrice: "price_standard_monthly",
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: 29800,
    priceStr: "¥29,800",
    color: "#3B82F6",
    accent: "#EFF6FF",
    features: [
      "現場30件まで",
      "メンバー80名まで",
      "機材・車両管理",
      "経営分析ダッシュボード",
      "元請け管理",
      "データ保存2年",
      "優先チャット・メールサポート",
    ],
    stripePrice: "price_business_monthly",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0,
    priceStr: "要相談",
    color: "#7C3AED",
    accent: "#F5F0FF",
    features: [
      "現場・メンバー無制限",
      "全機能利用可能",
      "専任担当者アサイン",
      "電話サポート",
      "データ無期限保存",
      "カスタム連携対応",
    ],
  },
];

// ─── Mock invoice data ────────────────────────────────────────────────────────

const MOCK_INVOICES: { id: string; date: string; amount: number; status: string; period: string }[] = [];

// ─── Stripe mock state ────────────────────────────────────────────────────────

type CardInfo = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

type StripeStatus = "connected" | "disconnected" | "loading";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-bold tracking-widest uppercase mb-3 px-1" style={{ color: T.primary }}>
      {children}
    </p>
  );
}

function CardBrandIcon({ brand }: { brand: string }) {
  const map: Record<string, string> = { visa: "💳", mastercard: "💳", amex: "💳" };
  return <span>{map[brand] ?? "💳"}</span>;
}

// ─── Add Card Modal ───────────────────────────────────────────────────────────

function AddCardModal({ onClose, onAdd }: { onClose: () => void; onAdd: (card: CardInfo) => void }) {
  const [number,  setNumber]  = useState("");
  const [expiry,  setExpiry]  = useState("");
  const [cvc,     setCvc]     = useState("");
  const [name,    setName]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  function formatNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0,2)} / ${d.slice(2)}` : d;
  }

  function submit() {
    const raw = number.replace(/\s/g, "");
    if (raw.length < 16) { setError("カード番号を正しく入力してください"); return; }
    if (!expiry.includes("/")) { setError("有効期限を MM / YY 形式で入力してください"); return; }
    if (cvc.length < 3) { setError("セキュリティコードを入力してください"); return; }
    setLoading(true);
    setTimeout(() => {
      const [mm, yy] = expiry.split("/").map(s => parseInt(s.trim(), 10));
      onAdd({ brand: "visa", last4: raw.slice(-4), expMonth: mm, expYear: 2000 + yy });
    }, 1600);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl flex flex-col"
        style={{ background: T.surface, maxWidth: 560 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#635BFF" }}>
              <span style={{ fontSize: 14 }}>S</span>
            </div>
            <div>
              <p className="font-black text-sm" style={{ color: "#111" }}>Stripe セキュア決済</p>
              <div className="flex items-center gap-1">
                <Lock size={9} color="#4ADE80" />
                <span style={{ fontSize: 14, color: T.sub }}>SSL/TLS 暗号化</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ background: "#F3F4F6" }}>
            <X size={18} color={T.sub} />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">

          {/* Card number */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
              カード番号
            </label>
            <div className="relative">
              <input
                value={number}
                onChange={e => { setNumber(formatNumber(e.target.value)); setError(""); }}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                className="w-full rounded-xl px-4 outline-none"
                style={{ height: 52, fontSize: 18, letterSpacing: 2, background: T.bg, border: "1.5px solid #E5E7EB", color: "#111" }}
              />
              <CreditCard size={18} color={T.muted} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }} />
            </div>
          </div>

          {/* Expiry + CVC */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 14, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>有効期限</label>
              <input
                value={expiry}
                onChange={e => { setExpiry(formatExpiry(e.target.value)); setError(""); }}
                placeholder="MM / YY"
                inputMode="numeric"
                className="w-full rounded-xl px-4 outline-none"
                style={{ height: 52, fontSize: 16, background: T.bg, border: "1.5px solid #E5E7EB", color: "#111" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>セキュリティコード</label>
              <input
                value={cvc}
                onChange={e => { setCvc(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }}
                placeholder="CVC"
                inputMode="numeric"
                type="password"
                className="w-full rounded-xl px-4 outline-none"
                style={{ height: 52, fontSize: 16, background: T.bg, border: "1.5px solid #E5E7EB", color: "#111" }}
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>カード名義人</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="TARO YAMADA"
              className="w-full rounded-xl px-4 outline-none"
              style={{ height: 52, fontSize: 16, background: T.bg, border: "1.5px solid #E5E7EB", color: "#111" }}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "#FEF2F2" }}>
              <AlertCircle size={14} color="#EF4444" />
              <p style={{ fontSize: 14, color: "#EF4444" }}>{error}</p>
            </div>
          )}

          {/* Security note */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: "#F0FDF4" }}>
            <Shield size={13} color="#16A34A" style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontSize: 14, color: "#15803D" }}>
              カード情報は Stripe が直接処理します。解体LINK のサーバーには保存されません。
            </p>
          </div>

        </div>

        {/* Submit */}
        <div className="px-5 pb-6 pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
          <button
            onClick={submit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl font-black"
            style={{ height: 60, fontSize: 17, background: loading ? T.muted : "#635BFF", color: "#FFF" }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
                Stripe に送信中...
              </>
            ) : (
              <>
                <Lock size={16} />
                カードを登録する
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────

function CheckoutModal({
  plan,
  card,
  onClose,
  onConfirm,
}: {
  plan: typeof PLANS[number];
  card: CardInfo | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  function pay() {
    if (!card) return;
    setLoading(true);
    setTimeout(() => { setDone(true); setTimeout(onConfirm, 1200); }, 2000);
  }

  const tax = Math.floor(plan.price * 0.1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl flex flex-col"
        style={{ background: T.surface, maxWidth: 480 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Stripe header */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#635BFF" }}>
            <span style={{ fontSize: 14, color: "#fff", fontWeight: 900 }}>S</span>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 900, color: "#111" }}>Stripe Checkout</p>
            <div className="flex items-center gap-1">
              <Lock size={9} color="#4ADE80" />
              <span style={{ fontSize: 14, color: T.sub }}>セキュアな決済</span>
            </div>
          </div>
          <button onClick={onClose} className="ml-auto w-9 h-9 flex items-center justify-center rounded-xl" style={{ background: "#F3F4F6" }}>
            <X size={18} color={T.sub} />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">

          {done ? (
            <div className="flex flex-col items-center py-6 gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#F0FDF4" }}>
                <CheckCircle2 size={48} color="#16A34A" />
              </div>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#111" }}>決済完了！</p>
              <p style={{ fontSize: 14, color: T.sub }}>{plan.name} プランへ変更しました</p>
            </div>
          ) : (
            <>
              {/* Plan summary */}
              <div className="rounded-2xl p-5" style={{ background: `${plan.color}10`, border: `1.5px solid ${plan.color}40` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: 14, color: T.sub }}>プラン変更</p>
                    <p style={{ fontSize: 20, fontWeight: 900, color: plan.color }}>{plan.name}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontSize: 22, fontWeight: 900, color: "#111" }}>{plan.priceStr}</p>
                    <p style={{ fontSize: 14, color: T.sub }}>/月（税別）</p>
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: T.bg }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 4 }}>お支払い内容</p>
                {[
                  { label: `${plan.name} プラン（月額）`, value: `¥${plan.price.toLocaleString()}` },
                  { label: "消費税（10%）",             value: `¥${tax.toLocaleString()}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ fontSize: 14, color: T.sub }}>{label}</span>
                    <span style={{ fontSize: 14, color: "#111", fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2" style={{ borderTop: "1px solid #E5E7EB" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>合計（税込）</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "#111" }}>¥{(plan.price + tax).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment method */}
              {card ? (
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: T.bg, border: "1.5px solid #E5E7EB" }}>
                  <CardBrandIcon brand={card.brand} />
                  <div className="flex-1">
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>•••• •••• •••• {card.last4}</p>
                    <p style={{ fontSize: 14, color: T.sub }}>有効期限 {card.expMonth}/{card.expYear}</p>
                  </div>
                  <CheckCircle2 size={16} color="#16A34A" />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: "#FEF2F2", border: "1.5px solid #FECACA" }}>
                  <AlertCircle size={16} color="#EF4444" />
                  <p style={{ fontSize: 14, color: "#EF4444", fontWeight: 600 }}>先にカードを登録してください</p>
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={pay}
                disabled={!card || loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl font-black"
                style={{
                  height: 64, fontSize: 18,
                  background: (!card || loading) ? T.muted : "#635BFF",
                  color: "#FFF",
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
                    処理中...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    ¥{(plan.price + tax).toLocaleString()} を支払う
                  </>
                )}
              </button>

              <p style={{ fontSize: 14, color: T.muted, textAlign: "center" }}>
                お支払いは Stripe Inc. が処理します。カード情報は暗号化され安全に管理されます。
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { company, plan: currentPlan, setCompany, addLog } = useAppContext();

  const [stripeStatus,  setStripeStatus]  = useState<StripeStatus>("loading");
  const [card,          setCard]          = useState<CardInfo | null>(null);
  const [showAddCard,   setShowAddCard]   = useState(false);
  const [checkoutPlan,  setCheckoutPlan]  = useState<typeof PLANS[number] | null>(null);
  const [activeTab,     setActiveTab]     = useState<"plan" | "payment" | "invoices">("plan");

  // Simulate Stripe connection check
  useEffect(() => {
    addLog("billing_view", company?.adminName ?? "管理者");
    setTimeout(() => {
      setStripeStatus(company?.stripeCustomerId ? "connected" : "disconnected");
      // Mock: pre-fill card if connected
      if (company?.stripeCustomerId) {
        setCard({ brand: "visa", last4: "4242", expMonth: 12, expYear: 2028 });
      }
    }, 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAddCard(info: CardInfo) {
    setCard(info);
    setShowAddCard(false);
    addLog("stripe_card_added", company?.adminName ?? "管理者");
  }

  function handleCheckoutConfirm() {
    if (!checkoutPlan || !company) return;
    setCompany({ ...company, plan: checkoutPlan.id });
    addLog(`plan_upgraded_to_${checkoutPlan.id}`, company.adminName);
    setCheckoutPlan(null);
  }

  const cp = PLANS.find(p => p.id === currentPlan) ?? PLANS[0];
  const limits = PLAN_LIMITS[currentPlan];
  const nextBillingDate = (() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(1);
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  })();

  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh", background: T.bg }}>

      {/* ── Header ── */}
      <header className="px-4 md:px-8 pt-8 pb-4" style={{ background: T.surface, borderBottom: "1px solid #F3F4F6" }}>
        <div className="mb-4">
          <h1 className="font-black" style={{ fontSize: 24, color: "#111827" }}>請求・プラン管理</h1>
          <p style={{ fontSize: 14, color: T.muted, marginTop: 2 }}>Stripe 決済連携</p>
        </div>

        {/* Stripe connection status */}
        <div
          className="inline-flex items-center gap-3 rounded-2xl px-4 py-2.5 mb-4"
          style={{
            background: stripeStatus === "connected" ? "#F0FDF4" : stripeStatus === "loading" ? T.bg : "${T.primaryLt}",
            border: `1.5px solid ${stripeStatus === "connected" ? "#A7F3D0" : stripeStatus === "loading" ? T.border : "#FED7AA"}`,
          }}
        >
          {stripeStatus === "loading" ? (
            <RefreshCw size={15} color={T.muted} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
          ) : stripeStatus === "connected" ? (
            <Wifi size={15} color="#16A34A" style={{ flexShrink: 0 }} />
          ) : (
            <WifiOff size={15} color={T.primary} style={{ flexShrink: 0 }} />
          )}
          <p style={{ fontSize: 14, fontWeight: 700, color: stripeStatus === "connected" ? "#15803D" : stripeStatus === "loading" ? T.sub : "#C2410C" }}>
            {stripeStatus === "loading" ? "Stripe に接続中..." : stripeStatus === "connected" ? "Stripe 接続済み" : "Stripe 未接続"}
          </p>
          {company?.stripeCustomerId && (
            <p style={{ fontSize: 14, color: T.sub, fontFamily: "monospace" }}>
              {company.stripeCustomerId}
            </p>
          )}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: stripeStatus === "connected" ? "#22C55E" : stripeStatus === "loading" ? T.muted : T.primary,
              boxShadow: stripeStatus === "connected" ? "0 0 6px #22C55E" : "none",
            }}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 max-w-xl">
          {([
            { key: "plan",     label: "プラン" },
            { key: "payment",  label: "お支払い" },
            { key: "invoices", label: "請求履歴" },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="flex-1 h-10 rounded-xl text-sm font-bold"
              style={activeTab === t.key
                ? { background: "#111827", color: T.surface }
                : { background: "#F3F4F6", color: T.sub }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 md:px-8 py-6 pb-24 md:pb-8 flex flex-col gap-5">

        {/* ══ Tab: Plan ══════════════════════════════════════════════ */}
        {activeTab === "plan" && (
          <>
            {/* Current plan hero */}
            <div
              className="max-w-2xl rounded-3xl p-5"
              style={{ background: `linear-gradient(135deg, ${cp.color}18 0%, ${cp.color}08 100%)`, border: `2px solid ${cp.color}50` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.sub, marginBottom: 2 }}>現在のプラン</p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: cp.color }}>{cp.name}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>
                    {cp.priceStr}{cp.price > 0 && <span style={{ fontSize: 14, color: T.muted }}>/月（税別）</span>}
                  </p>
                </div>
                <div
                  className="px-3 py-1.5 rounded-xl text-sm font-black"
                  style={{ background: cp.color, color: "#fff" }}
                >
                  利用中
                </div>
              </div>

              {/* Usage meters */}
              <div className="flex flex-col gap-2 mb-3">
                {[
                  { label: "現場",   used: 4, limit: limits.sites   },
                  { label: "メンバー", used: 7, limit: limits.members },
                ].map(({ label, used, limit }) => {
                  const pct = limit === Infinity ? 20 : Math.min(Math.round((used / limit) * 100), 100);
                  const warn = limit !== Infinity && pct >= 80;
                  return (
                    <div key={label}>
                      <div className="flex justify-between mb-1" style={{ fontSize: 14 }}>
                        <span style={{ color: T.sub, fontWeight: 600 }}>{label}</span>
                        <span style={{ color: warn ? "#EF4444" : "#111", fontWeight: 700 }}>
                          {used} / {limit === Infinity ? "∞" : limit}
                        </span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: T.border }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: warn ? "#EF4444" : cp.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {cp.price > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.7)" }}>
                  <Clock size={12} color={T.sub} />
                  <p style={{ fontSize: 14, color: T.sub }}>
                    次回請求日: <span style={{ fontWeight: 700, color: "#111" }}>{nextBillingDate}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Feature notice */}
            <div className="max-w-2xl flex items-start gap-3 rounded-2xl px-4 py-3" style={{ background: "#ECFDF5", border: "1.5px solid #A7F3D0" }}>
              <CheckCircle2 size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 14, color: "#15803D" }}>
                <strong>全プラン共通</strong>: 機材管理・経営分析・元請け管理・帳票出力をすべてのプランでご利用いただけます。規模でのみ課金します。
              </p>
            </div>

            {/* Plan cards */}
            <section>
              <SectionLabel>プランを変更</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {PLANS.map(p => {
                  const isCurrent = p.id === currentPlan;
                  return (
                    <div
                      key={p.id}
                      className="rounded-2xl p-4 flex flex-col"
                      style={{
                        background: isCurrent ? `${p.color}10` : T.surface,
                        border: isCurrent ? `2px solid ${p.color}70` : "1.5px solid #E5E7EB",
                      }}
                    >
                      {/* Plan name + badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: 17, fontWeight: 900, color: p.color }}>{p.name}</span>
                        {p.popular && !isCurrent && (
                          <span className="text-sm font-black px-2 py-0.5 rounded-full" style={{ background: p.color, color: "#fff" }}>人気</span>
                        )}
                        {isCurrent && (
                          <span className="text-sm font-black px-2 py-0.5 rounded-full" style={{ background: p.color, color: "#fff" }}>利用中</span>
                        )}
                      </div>

                      {/* Price */}
                      <p style={{ fontSize: 16, fontWeight: 900, color: "#111111", marginBottom: 12 }}>
                        {p.priceStr}
                        {p.price > 0 && <span style={{ fontSize: 14, fontWeight: 400, color: T.muted }}>/月</span>}
                      </p>

                      {/* Features */}
                      <div className="flex flex-col gap-1 flex-1 mb-4">
                        {p.features.map(f => (
                          <div key={f} className="flex items-center gap-2">
                            <Check size={11} style={{ color: p.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 14, color: T.sub }}>{f}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action button */}
                      {!isCurrent && p.id !== "enterprise" && (
                        <button
                          onClick={() => setCheckoutPlan(p)}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold"
                          style={{ background: p.color, color: T.surface, fontSize: 14 }}
                        >
                          <Zap size={13} />
                          {p.price > (cp.price) ? "アップグレード" : "変更"}
                        </button>
                      )}
                      {!isCurrent && p.id === "enterprise" && (
                        <button
                          className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl font-bold"
                          style={{ background: "#F5F0FF", color: "#7C3AED", fontSize: 14 }}
                        >
                          お問い合わせ
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Stripe Customer Portal */}
            <button
              className="w-full max-w-xs flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold"
              style={{ background: T.surface, border: "1.5px solid #E5E7EB", color: "#635BFF", fontSize: 14 }}
            >
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#635BFF" }}>
                <span style={{ fontSize: 14, color: "#fff", fontWeight: 900 }}>S</span>
              </div>
              Stripe カスタマーポータルを開く
              <ExternalLink size={13} />
            </button>
          </>
        )}

        {/* ══ Tab: Payment ══════════════════════════════════════════ */}
        {activeTab === "payment" && (
          <>
            <section className="max-w-xl">
              <SectionLabel>登録カード</SectionLabel>
              {card ? (
                <div className="rounded-2xl p-5" style={{ background: T.surface, border: "1.5px solid #E5E7EB" }}>
                  {/* Card visual */}
                  <div
                    className="rounded-2xl p-5 mb-4 relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)",
                      minHeight: 140,
                    }}
                  >
                    {/* Chip */}
                    <div className="w-10 h-7 rounded-md mb-4" style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }} />
                    <p style={{ fontSize: 18, letterSpacing: 3, color: "#fff", fontFamily: "monospace", fontWeight: 700 }}>
                      •••• •••• •••• {card.last4}
                    </p>
                    <div className="flex items-end justify-between mt-3">
                      <div>
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>VALID THRU</p>
                        <p style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}>
                          {String(card.expMonth).padStart(2,"0")}/{card.expYear}
                        </p>
                      </div>
                      <p style={{ fontSize: 14, color: "#fff", fontWeight: 900, fontStyle: "italic" }}>VISA</p>
                    </div>
                    {/* Decorative circles */}
                    <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                    <div style={{ position: "absolute", top: 10, right: 10, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                  </div>

                  {/* Card info row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Visa •••• {card.last4}</p>
                      <p style={{ fontSize: 14, color: T.muted }}>有効期限 {String(card.expMonth).padStart(2,"0")}/{card.expYear}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddCard(true)}
                        className="px-3 py-1.5 rounded-xl text-sm font-bold"
                        style={{ background: "#F3F4F6", color: "#374151" }}
                      >
                        変更
                      </button>
                      <button
                        onClick={() => setCard(null)}
                        className="px-3 py-1.5 rounded-xl text-sm font-bold"
                        style={{ background: "#FEF2F2", color: "#EF4444" }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddCard(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl"
                  style={{ height: 80, background: T.surface, border: "2px dashed #D1D5DB", color: T.sub, fontSize: 14, fontWeight: 700 }}
                >
                  <Plus size={18} />
                  カードを追加する
                </button>
              )}
            </section>

            {/* Security info */}
            <section className="max-w-xl">
              <SectionLabel>セキュリティ</SectionLabel>
              <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: "1.5px solid #E5E7EB" }}>
                {[
                  { icon: Lock,     label: "SSL/TLS 暗号化",    sub: "全通信を暗号化して保護" },
                  { icon: Shield,   label: "PCI DSS 準拠",      sub: "カード情報は Stripe が管理" },
                  { icon: RefreshCw,label: "自動更新",           sub: "次回請求日に自動で引き落とし" },
                ].map(({ icon: Icon, label, sub }, i) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : undefined }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F0FDF4" }}>
                      <Icon size={16} color="#16A34A" />
                    </div>
                    <div className="flex-1">
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{label}</p>
                      <p style={{ fontSize: 14, color: T.muted }}>{sub}</p>
                    </div>
                    <CheckCircle2 size={15} color="#22C55E" />
                  </div>
                ))}
              </div>
            </section>

            {/* Add card button */}
            {card && (
              <button
                onClick={() => setShowAddCard(true)}
                className="max-w-xl w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold"
                style={{ background: T.surface, border: "1.5px solid #E5E7EB", color: "#374151", fontSize: 14 }}
              >
                <Plus size={16} />
                別のカードを追加
              </button>
            )}
          </>
        )}

        {/* ══ Tab: Invoices ══════════════════════════════════════════ */}
        {activeTab === "invoices" && (
          <>
            <section className="max-w-2xl">
              <SectionLabel>請求履歴</SectionLabel>
              {currentPlan === "free" ? (
                <div className="rounded-2xl py-10 text-center" style={{ background: T.surface, border: "1.5px solid #E5E7EB" }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📄</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>Freeプランは無料です</p>
                  <p style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>有料プランへ変更すると請求履歴が表示されます</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: "1.5px solid #E5E7EB" }}>
                  {MOCK_INVOICES.map((inv, i) => (
                    <div
                      key={inv.id}
                      className="px-4 py-3.5 flex items-center gap-3"
                      style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : undefined }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: inv.status === "paid" ? "#F0FDF4" : "#FEF2F2" }}
                      >
                        {inv.status === "paid"
                          ? <CheckCircle2 size={16} color="#16A34A" />
                          : <AlertCircle size={16} color="#EF4444" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{inv.period}</p>
                        <p style={{ fontSize: 14, color: T.muted }}>
                          {new Date(inv.date).toLocaleDateString("ja-JP")} · {inv.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>¥{inv.amount.toLocaleString()}</span>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-xl"
                          style={{ background: "#F3F4F6" }}
                        >
                          <Download size={14} color={T.sub} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {currentPlan !== "free" && (
              <button
                className="max-w-2xl w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold"
                style={{ background: T.surface, border: "1.5px solid #E5E7EB", color: "#635BFF", fontSize: 14 }}
              >
                <ExternalLink size={13} />
                Stripe ですべての請求書を表示
              </button>
            )}

            {/* Next billing */}
            {currentPlan !== "free" && (
              <div
                className="max-w-2xl flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: T.surface, border: "1.5px solid #E5E7EB" }}
              >
                <Clock size={16} color={T.sub} />
                <div>
                  <p style={{ fontSize: 14, color: T.muted }}>次回請求予定</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>
                    {nextBillingDate} · ¥{((cp.price + Math.floor(cp.price * 0.1))).toLocaleString()}（税込）
                  </p>
                </div>
                <ChevronRight size={15} color={T.border} style={{ marginLeft: "auto" }} />
              </div>
            )}
          </>
        )}

      </div>

      {/* ── Modals ── */}
      {showAddCard && (
        <AddCardModal onClose={() => setShowAddCard(false)} onAdd={handleAddCard} />
      )}
      {checkoutPlan && (
        <CheckoutModal
          plan={checkoutPlan}
          card={card}
          onClose={() => setCheckoutPlan(null)}
          onConfirm={handleCheckoutConfirm}
        />
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
