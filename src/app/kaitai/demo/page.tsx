"use client";

import Link from "next/link";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        "#F9FAFB",
  bgCard:    "#FFFFFF",
  bgMuted:   "#F3F4F6",
  border:    "#E5E7EB",
  rustBdr:   "rgba(154,52,18,0.2)",
  rust:      "#9A3412",
  rustLt:    "rgba(154,52,18,0.08)",
  text:      "#111827",
  sub:       "#6B7280",
  muted:     "#9CA3AF",
} as const;

// ─── Feature card data ────────────────────────────────────────────────────────
const features = [
  {
    emoji: "🏗",
    name: "現場状況を確認する",
    desc: "稼働中の現場と進捗・原価をリアルタイムで確認",
    href: "/kaitai",
  },
  {
    emoji: "📝",
    name: "作業を報告する",
    desc: "勤務開始・終了・経費・イレギュラーをワンタップ報告",
    href: "/kaitai/report",
  },
  {
    emoji: "🚛",
    name: "機材・車両を管理する",
    desc: "重機・リース品の稼働状況と返却期限を管理",
    href: "/kaitai/equipment",
  },
  {
    emoji: "👷",
    name: "メンバーを確認する",
    desc: "作業員のスキル・資格・勤怠をレーダーチャートで把握",
    href: "/kaitai/members",
  },
  {
    emoji: "📊",
    name: "管理者ページを見る",
    desc: "収支分析・帳票出力・評価ダッシュボードなど管理者向け機能",
    href: "/kaitai/admin",
  },
];

export default function DemoPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100dvh", fontFamily: "'Noto Sans JP', sans-serif", color: C.text }}>

      {/* ── Fixed Header ──────────────────────────────────────────────────── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "#FFFFFF",
        borderBottom: `1px solid ${C.border}`,
        height: 56,
        display: "flex", alignItems: "center",
        padding: "0 20px",
        gap: 12,
      }}>
        <Link href="/kaitai/lp" style={{
          fontSize: 13, color: C.muted,
          textDecoration: "none", fontWeight: 500,
          display: "flex", alignItems: "center", gap: 4,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          ← 解体LINK
        </Link>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <span style={{
            background: C.rustLt,
            border: `1px solid ${C.rustBdr}`,
            color: C.rust,
            fontSize: 12, fontWeight: 800,
            padding: "4px 14px", borderRadius: 99,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}>
            🎮 デモモード
          </span>
        </div>

        <Link href="/kaitai/signup" style={{
          fontSize: 12, fontWeight: 700,
          color: "#fff",
          background: C.rust,
          padding: "7px 14px", borderRadius: 8,
          textDecoration: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          無料で試してみる
        </Link>
      </header>

      {/* ── Demo notice bar ────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 56,
        background: "#F3F4F6",
        borderBottom: `1px solid ${C.border}`,
        padding: "12px 24px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>
          これはデモ環境です。すべての機能を自由にお試しいただけます。データはリセットされません。
        </p>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "40px 20px 60px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{
            fontSize: "clamp(24px, 5vw, 36px)",
            fontWeight: 900, color: C.text,
            marginBottom: 14, letterSpacing: "-0.03em",
            lineHeight: 1.2,
          }}>
            解体LINKを体験する
          </h1>
          <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.7 }}>
            現場報告から帳票出力まで、実際に触って確かめてください。
          </p>
        </div>

        {/* Feature tour cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}>
          {features.map((f) => (
            <div key={f.href} style={{
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "24px 20px",
              display: "flex", flexDirection: "column",
              gap: 0,
            }}>
              <span style={{ fontSize: 36, marginBottom: 12 }}>{f.emoji}</span>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6, lineHeight: 1.3 }}>
                {f.name}
              </div>
              <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.65, marginBottom: 20 }}>
                {f.desc}
              </div>
              <div style={{ marginTop: "auto" }}>
                <Link href={f.href} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: C.rust,
                  color: "#fff",
                  padding: "12px 20px", borderRadius: 8,
                  fontWeight: 700, fontSize: 14, textDecoration: "none",
                }}>
                  試してみる →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{
          textAlign: "center",
          paddingTop: 24,
          borderTop: `1px solid ${C.border}`,
        }}>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 6, lineHeight: 1.7 }}>
            デモデータは架空の会社・現場情報です。
          </p>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.7 }}>
            管理者ページ（収支分析・帳票出力など）はパスワード「0000」でアクセスできます。
          </p>
          <Link href="/kaitai/signup" style={{
            display: "inline-block",
            background: C.rust, color: "#fff",
            padding: "12px 28px", borderRadius: 8,
            fontWeight: 700, fontSize: 14, textDecoration: "none",
            marginBottom: 16,
          }}>
            無料で試してみる →
          </Link>
          <div>
            <Link href="/kaitai/lp" style={{
              fontSize: 13, color: C.muted,
              textDecoration: "none", fontWeight: 500,
            }}>
              ← ランディングページに戻る
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
