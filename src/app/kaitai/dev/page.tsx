"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Send, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useAppContext, Company } from "../lib/app-context";
import { PinPad } from "../components/pin-pad";
import { T } from "../lib/design-tokens";

// ─── Mock companies (seeded data) ─────────────────────────────────────────────

const SEED_COMPANIES: Company[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_COLOR = { free: T.sub, standard: "#FF9800", business: "#3B82F6", enterprise: "#7C3AED" };
const PLAN_LABEL = { free: "Free", standard: "Standard", business: "Business", enterprise: "Enterprise" };

function StatusBadge({ hasStripe }: { hasStripe: boolean }) {
  if (hasStripe) return (
    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)" }}>
      <CheckCircle size={10} style={{ color: "#4ADE80" }} />
      <span style={{ fontSize: 14, fontWeight: 700, color: "#4ADE80" }}>有効</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)" }}>
      <XCircle size={10} style={{ color: "#F87171" }} />
      <span style={{ fontSize: 14, fontWeight: 700, color: "#F87171" }}>未設定</span>
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
            <Shield size={18} style={{ color: T.primary }} />
            <span style={{ fontSize: 16, fontWeight: 900, color: T.bg }}>Dev Dashboard</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <AlertTriangle size={10} style={{ color: "#F87171" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#F87171" }}>Internal Only</span>
          </div>
        </div>
        <p style={{ fontSize: 14, color: "#475569" }}>解体LINK SaaS 運営ダッシュボード</p>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "総会社数",    value: allCompanies.length },
            { label: "有料契約",    value: allCompanies.filter(c => c.plan !== "free").length },
            { label: "Stripe未設定", value: allCompanies.filter(c => !c.stripeCustomerId).length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-2 text-center" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: T.bg }}>{value}</p>
              <p style={{ fontSize: 14, color: "#475569" }}>{label}</p>
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
            className="flex-1 py-2 rounded-xl text-sm font-bold"
            style={tab === t
              ? { background: T.primary, color: T.surface }
              : { background: "#1A2535", color: T.sub, border: "1px solid #2D3E54" }}
          >
            {{ companies: "会社一覧", logs: "操作ログ", broadcast: "一斉通知" }[t]}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">

        {/* ── Tab: companies ── */}
        {tab === "companies" && allCompanies.map(c => (
          <div key={c.id} className="rounded-2xl p-5" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
            {/* Row 1: name + plan + status */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span style={{ fontSize: 14, fontWeight: 800, color: T.bg }} className="truncate">{c.name}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="px-2 py-0.5 rounded-full text-sm font-bold" style={{ background: `${PLAN_COLOR[c.plan]}20`, color: PLAN_COLOR[c.plan] }}>
                  {PLAN_LABEL[c.plan]}
                </span>
                <StatusBadge hasStripe={!!c.stripeCustomerId} />
              </div>
            </div>

            {/* Row 2: contact */}
            <p style={{ fontSize: 14, color: T.sub, marginBottom: 2 }}>{c.address}</p>
            <p style={{ fontSize: 14, color: T.sub, marginBottom: 6 }}>{c.phone} · {c.adminEmail}</p>

            {/* Row 3: Stripe ID */}
            <div className="rounded-xl px-3 py-2" style={{ background: "#0F1928" }}>
              <p style={{ fontSize: 14, color: "#475569", marginBottom: 1 }}>Stripe Customer ID</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: c.stripeCustomerId ? "#4ADE80" : "#F87171", fontFamily: "monospace" }}>
                {c.stripeCustomerId || "— 未連携 —"}
              </p>
            </div>

            {/* Row 4: meta */}
            <div className="flex items-center justify-between mt-2">
              <p style={{ fontSize: 14, color: "#475569" }}>
                登録: {c.createdAt ? new Date(c.createdAt).toLocaleDateString("ja-JP") : "—"}
              </p>
              <p style={{ fontSize: 14, color: "#475569" }}>
                管理者: {c.adminName}
              </p>
            </div>
          </div>
        ))}

        {/* ── Tab: logs ── */}
        {tab === "logs" && (
          <>
            <div className="flex items-center justify-between">
              <p style={{ fontSize: 14, color: T.sub }}>{operationLog.length} 件のログ</p>
              <button className="flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg" style={{ background: "#1A2535", color: T.sub, border: "1px solid #2D3E54" }}>
                <RefreshCw size={10} /> 更新
              </button>
            </div>
            {operationLog.length === 0 && (
              <div className="py-8 text-center" style={{ color: "#475569", fontSize: 14 }}>
                ログがありません
              </div>
            )}
            {operationLog.map(log => (
              <div key={log.id} className="rounded-xl px-3 py-2.5" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.bg }}>{log.action}</span>
                  <span style={{ fontSize: 14, color: "#475569" }}>{new Date(log.timestamp).toLocaleTimeString("ja-JP")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 14, color: T.sub }}>👤 {log.user}</span>
                  <span style={{ fontSize: 14, color: "#475569" }}>· {new Date(log.timestamp).toLocaleDateString("ja-JP")}</span>
                </div>
                <p style={{ fontSize: 14, color: T.text, marginTop: 2 }} className="truncate">{log.device}</p>
              </div>
            ))}
          </>
        )}

        {/* ── Tab: broadcast ── */}
        {tab === "broadcast" && (
          <>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.muted, marginBottom: 12 }}>
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
                  color: T.bg,
                }}
              />
            </div>
            <div className="rounded-2xl p-3" style={{ background: T.primaryLt, border: `1px solid ${T.primaryMd}` }}>
              <p style={{ fontSize: 14, color: T.primary, fontWeight: 700, marginBottom: 2 }}>実装予定</p>
              <p style={{ fontSize: 14, color: T.sub }}>
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
              style={{ background: sent ? "#1A2535" : T.primary, color: sent ? "#4ADE80" : T.surface, fontSize: 15, border: sent ? "1px solid #4ADE80" : "none" }}
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
