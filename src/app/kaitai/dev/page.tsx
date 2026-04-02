"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Send, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useAppContext, Company } from "../lib/app-context";
import { PinPad } from "../components/pin-pad";

// ─── Mock companies (seeded data) ─────────────────────────────────────────────

const SEED_COMPANIES: Company[] = [
  {
    id: "c001",
    name: "東京解体工業株式会社",
    address: "東京都大田区蒲田3-1-1",
    phone: "03-5555-1001",
    adminName: "佐藤 健一",
    adminEmail: "sato@tokyokaitai.jp",
    password1: "tokyo2026",
    password2: "admin01",
    plan: "pro",
    stripeCustomerId: "cus_mock_TKY001PRO",
    createdAt: "2025-10-01T00:00:00.000Z",
  },
  {
    id: "c002",
    name: "関西解体サービス",
    address: "大阪府大阪市西淀川区2-5-8",
    phone: "06-6666-2002",
    adminName: "山田 太郎",
    adminEmail: "yamada@kansai-ks.jp",
    password1: "osaka2026",
    password2: "admin02",
    plan: "standard",
    stripeCustomerId: "cus_mock_OSK002STD",
    createdAt: "2025-11-15T00:00:00.000Z",
  },
  {
    id: "c003",
    name: "北海道解体工務店",
    address: "北海道札幌市北区北21条西4-1-1",
    phone: "011-777-3003",
    adminName: "鈴木 一郎",
    adminEmail: "suzuki@hokkaido-k.jp",
    password1: "sapporo26",
    password2: "admin03",
    plan: "free",
    stripeCustomerId: null as unknown as string,
    createdAt: "2026-01-10T00:00:00.000Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_COLOR = { free: "#64748B", standard: "#FF9800", pro: "#7C3AED" };
const PLAN_LABEL = { free: "Free", standard: "Standard", pro: "Pro" };

function StatusBadge({ hasStripe }: { hasStripe: boolean }) {
  if (hasStripe) return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)" }}>
      <CheckCircle size={10} style={{ color: "#4ADE80" }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80" }}>有効</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)" }}>
      <XCircle size={10} style={{ color: "#F87171" }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: "#F87171" }}>未設定</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DevPage() {
  const { authLevel, setAuthLevel, company: contextCompany, operationLog, addLog } = useAppContext();

  const [authed,   setAuthed]   = useState(false);
  const [tab,      setTab]      = useState<"companies" | "logs" | "broadcast">("companies");
  const [broadcast, setBroadcast] = useState("");
  const [sent, setSent] = useState(false);

  // Merge context company with seed data
  const allCompanies = [
    ...(contextCompany && contextCompany.id !== "demo" ? [contextCompany] : []),
    ...SEED_COMPANIES,
    ...(contextCompany?.id === "demo" ? [contextCompany] : []),
  ];

  useEffect(() => {
    if (authed) {
      addLog("dev_dashboard_open", "dev");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  // ── PIN gate ──
  if (!authed) {
    return (
      <PinPad
        title="Dev Dashboard"
        subtitle="開発者パスワードを入力"
        correctPin="9999"
        onSuccess={() => { setAuthed(true); setAuthLevel("dev"); }}
        dark={true}
      />
    );
  }

  // ── Dashboard ──
  return (
    <div className="max-w-md mx-auto flex flex-col pb-8" style={{ minHeight: "100dvh", background: "#080F1A" }}>

      {/* Header */}
      <header className="px-5 pt-10 pb-4" style={{ borderBottom: "1px solid #1E2D3D" }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Shield size={18} style={{ color: "#F97316" }} />
            <span style={{ fontSize: 16, fontWeight: 900, color: "#F1F5F9" }}>Dev Dashboard</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <AlertTriangle size={10} style={{ color: "#F87171" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#F87171" }}>Internal Only</span>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "#475569" }}>解体LINK SaaS 運営ダッシュボード</p>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "総会社数",    value: allCompanies.length },
            { label: "Pro契約",    value: allCompanies.filter(c => c.plan === "pro").length },
            { label: "Stripe未設定", value: allCompanies.filter(c => !c.stripeCustomerId).length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-2 text-center" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#F1F5F9" }}>{value}</p>
              <p style={{ fontSize: 9, color: "#475569" }}>{label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-2">
        {(["companies", "logs", "broadcast"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-xl text-[11px] font-bold"
            style={tab === t
              ? { background: "#F97316", color: "#FFFFFF" }
              : { background: "#1A2535", color: "#64748B", border: "1px solid #2D3E54" }}
          >
            {{ companies: "会社一覧", logs: "操作ログ", broadcast: "一斉通知" }[t]}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">

        {/* ── Tab: companies ── */}
        {tab === "companies" && allCompanies.map(c => (
          <div key={c.id} className="rounded-2xl p-4" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
            {/* Row 1: name + plan + status */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9" }} className="truncate">{c.name}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${PLAN_COLOR[c.plan]}20`, color: PLAN_COLOR[c.plan] }}>
                  {PLAN_LABEL[c.plan]}
                </span>
                <StatusBadge hasStripe={!!c.stripeCustomerId} />
              </div>
            </div>

            {/* Row 2: contact */}
            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 2 }}>{c.address}</p>
            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 6 }}>{c.phone} · {c.adminEmail}</p>

            {/* Row 3: Stripe ID */}
            <div className="rounded-xl px-3 py-2" style={{ background: "#0F1928" }}>
              <p style={{ fontSize: 9, color: "#475569", marginBottom: 1 }}>Stripe Customer ID</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: c.stripeCustomerId ? "#4ADE80" : "#F87171", fontFamily: "monospace" }}>
                {c.stripeCustomerId || "— 未連携 —"}
              </p>
            </div>

            {/* Row 4: meta */}
            <div className="flex items-center justify-between mt-2">
              <p style={{ fontSize: 10, color: "#475569" }}>
                登録: {new Date(c.createdAt).toLocaleDateString("ja-JP")}
              </p>
              <p style={{ fontSize: 10, color: "#475569" }}>
                管理者: {c.adminName}
              </p>
            </div>
          </div>
        ))}

        {/* ── Tab: logs ── */}
        {tab === "logs" && (
          <>
            <div className="flex items-center justify-between">
              <p style={{ fontSize: 11, color: "#64748B" }}>{operationLog.length} 件のログ</p>
              <button className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: "#1A2535", color: "#64748B", border: "1px solid #2D3E54" }}>
                <RefreshCw size={10} /> 更新
              </button>
            </div>
            {operationLog.length === 0 && (
              <div className="py-8 text-center" style={{ color: "#475569", fontSize: 13 }}>
                ログがありません
              </div>
            )}
            {operationLog.map(log => (
              <div key={log.id} className="rounded-xl px-3 py-2.5" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{log.action}</span>
                  <span style={{ fontSize: 10, color: "#475569" }}>{new Date(log.timestamp).toLocaleTimeString("ja-JP")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 10, color: "#64748B" }}>👤 {log.user}</span>
                  <span style={{ fontSize: 10, color: "#475569" }}>· {new Date(log.timestamp).toLocaleDateString("ja-JP")}</span>
                </div>
                <p style={{ fontSize: 9, color: "#334155", marginTop: 2 }} className="truncate">{log.device}</p>
              </div>
            ))}
          </>
        )}

        {/* ── Tab: broadcast ── */}
        {tab === "broadcast" && (
          <>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 12 }}>
                全 {allCompanies.length} 社への一斉通知を配信します
              </p>
              <textarea
                value={broadcast}
                onChange={e => { setBroadcast(e.target.value); setSent(false); }}
                placeholder="通知メッセージを入力..."
                className="w-full rounded-2xl px-4 py-3 outline-none resize-none"
                style={{
                  minHeight: 120, fontSize: 14,
                  background: "#1A2535", border: "1px solid #2D3E54",
                  color: "#F1F5F9",
                }}
              />
            </div>
            <div className="rounded-2xl p-3" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
              <p style={{ fontSize: 11, color: "#F97316", fontWeight: 700, marginBottom: 2 }}>実装予定</p>
              <p style={{ fontSize: 11, color: "#64748B" }}>
                本番環境では Firebase Cloud Messaging または SendGrid を使用して、全ログインユーザーへプッシュ通知・メールを一斉配信します。
              </p>
            </div>
            <button
              onClick={() => {
                if (!broadcast.trim()) return;
                addLog(`broadcast: ${broadcast.slice(0, 40)}`, "dev");
                setSent(true);
                setBroadcast("");
              }}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold"
              style={{ background: sent ? "#1A2535" : "#F97316", color: sent ? "#4ADE80" : "#FFFFFF", fontSize: 15, border: sent ? "1px solid #4ADE80" : "none" }}
            >
              {sent
                ? <><CheckCircle size={18} /> 配信完了（ログに記録）</>
                : <><Send size={16} /> 一斉配信（モック）</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
