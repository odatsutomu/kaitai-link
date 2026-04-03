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
  rustMd:    "#B45309",
  rustLt:    "rgba(154,52,18,0.08)",
  text:      "#111827",
  sub:       "#6B7280",
  muted:     "#9CA3AF",
  green:     "#059669",
} as const;

// ─── Feature card data ────────────────────────────────────────────────────────
const features = [
  {
    emoji: "🏗",
    name: "現場状況を確認する",
    desc: "稼働中の現場と進捗・原価をリアルタイムで確認",
    href: "/kaitai",
    note: null,
    adminRequired: false,
  },
  {
    emoji: "📝",
    name: "作業を報告する",
    desc: "勤務開始・終了・経費・イレギュラーをワンタップ報告",
    href: "/kaitai/report",
    note: null,
    adminRequired: false,
  },
  {
    emoji: "📋",
    name: "帳票を出力する",
    desc: "見積書・請求書・完了報告書をPDF生成",
    href: "/kaitai/docs",
    note: "管理者モードON後にアクセス（メニューから設定）",
    adminRequired: true,
  },
  {
    emoji: "🚛",
    name: "機材・車両を管理する",
    desc: "重機・リース品の稼働状況と返却期限を管理",
    href: "/kaitai/equipment",
    note: null,
    adminRequired: false,
  },
  {
    emoji: "👷",
    name: "メンバーを確認する",
    desc: "作業員のスキル・資格・勤怠をレーダーチャートで把握",
    href: "/kaitai/members",
    note: null,
    adminRequired: false,
  },
  {
    emoji: "📈",
    name: "収支・経営を分析する",
    desc: "売上・原価・粗利を月次・年次・案件別で分析",
    href: "/kaitai/admin",
    note: "管理者モードON後にアクセス",
    adminRequired: true,
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
        {/* Left: back link */}
        <Link href="/kaitai/lp" style={{
          fontSize: 13, color: C.muted,
          textDecoration: "none", fontWeight: 500,
          display: "flex", alignItems: "center", gap: 4,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          ← 解体LINK
        </Link>

        {/* Center: badge */}
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

        {/* Right: CTA */}
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
              {/* Emoji + admin badge */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 36 }}>{f.emoji}</span>
                {f.adminRequired && (
                  <span style={{
                    fontSize: 10, fontWeight: 800,
                    color: C.rust,
                    background: C.rustLt,
                    border: `1px solid ${C.rustBdr}`,
                    padding: "2px 8px", borderRadius: 99,
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                  }}>
                    管理者
                  </span>
                )}
              </div>

              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6, lineHeight: 1.3 }}>
                {f.name}
              </div>
              <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.65, marginBottom: f.note ? 10 : 20 }}>
                {f.desc}
              </div>

              {f.note && (
                <div style={{
                  fontSize: 12, color: C.rust,
                  background: C.rustLt,
                  border: `1px solid ${C.rustBdr}`,
                  borderRadius: 8,
                  padding: "7px 11px",
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}>
                  ⚠ {f.note}
                </div>
              )}

              <div style={{ marginTop: "auto" }}>
                <Link href={f.href} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: f.adminRequired ? C.rustLt : C.rust,
                  color: f.adminRequired ? C.rust : "#fff",
                  border: f.adminRequired ? `1.5px solid ${C.rustBdr}` : "none",
                  padding: "12px 20px", borderRadius: 8,
                  fontWeight: 700, fontSize: 14, textDecoration: "none",
                }}>
                  試してみる →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Admin mode guide */}
        <div style={{
          background: C.bgCard,
          border: `2px solid ${C.rust}`,
          borderRadius: 12,
          padding: "24px 20px",
          marginBottom: 40,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 20 }}>📌</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
              管理者モードについて
            </span>
          </div>
          <p style={{ fontSize: 14, color: C.sub, marginBottom: 20, lineHeight: 1.65 }}>
            帳票出力・収支分析・機材管理は管理者モードONが必要です
          </p>

          <div style={{
            background: C.bgMuted,
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>
              管理者モードの有効化手順
            </div>
            {[
              "下部ナビ「メニュー」タブをタップ",
              "管理者モードをONにする",
              "パスワード: 0000 を入力",
            ].map((step, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                marginBottom: i < 2 ? 10 : 0,
              }}>
                <span style={{
                  flexShrink: 0,
                  width: 22, height: 22,
                  background: C.rust,
                  color: "#fff",
                  borderRadius: "50%",
                  fontSize: 12, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, paddingTop: 2 }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <Link href="/kaitai/menu" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: C.rust,
            color: "#fff",
            padding: "14px 24px", borderRadius: 8,
            fontWeight: 700, fontSize: 15, textDecoration: "none",
          }}>
            管理者モードを有効にする →
          </Link>
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
            解体LINKの本番環境では自社の情報で管理できます。
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
