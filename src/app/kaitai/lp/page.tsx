import Link from "next/link";
import { OperatorLoginButton } from "./operator-login-button";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bgDark:    "#080F1A",
  bgCard:    "#0F1928",
  bgCard2:   "#1A2535",
  border:    "#2D3E54",
  orange:    "#F97316",
  orangeL:   "#FB923C",
  textPri:   "#F1F5F9",
  textMuted: "#64748B",
  textSub:   "#94A3B8",
  green:     "#4ADE80",
} as const;

// ─── Reusable style fragments ─────────────────────────────────────────────────
const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: C.orange,
  textTransform: "uppercase",
  marginBottom: 12,
};

const h2Style: React.CSSProperties = {
  fontSize: "clamp(24px, 4vw, 40px)",
  fontWeight: 800,
  color: C.textPri,
  marginBottom: 16,
  lineHeight: 1.25,
};

const sectionWrap = (bg: string): React.CSSProperties => ({
  background: bg,
  padding: "80px 24px",
});

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function KaitaiLpPage() {
  return (
    <div style={{ background: C.bgDark, color: C.textPri, fontFamily: "'Noto Sans JP', sans-serif", overflowX: "hidden" }}>

      {/* ── 1. Fixed nav ───────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(8,15,26,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 60,
      }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: C.orange, letterSpacing: "-0.02em" }}>
          解体LINK
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/kaitai/login" style={{
            border: `1.5px solid ${C.border}`,
            color: C.textSub,
            padding: "7px 18px", borderRadius: 8,
            fontWeight: 700, fontSize: 14, textDecoration: "none",
            whiteSpace: "nowrap",
            background: "transparent",
          }}>
            ログイン
          </Link>
          <Link href="/kaitai/demo" style={{
            background: C.orange, color: "#fff",
            padding: "8px 20px", borderRadius: 8,
            fontWeight: 700, fontSize: 14, textDecoration: "none",
            whiteSpace: "nowrap",
          }}>
            デモを試す
          </Link>
        </div>
      </nav>

      {/* ── 2. Hero ────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100dvh",
        background: `radial-gradient(ellipse 80% 60% at 50% 20%, rgba(249,115,22,0.12) 0%, transparent 70%), ${C.bgDark}`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "100px 24px 60px",
        textAlign: "center",
      }}>
        {/* Badge */}
        <span style={{
          display: "inline-block",
          background: "rgba(249,115,22,0.15)",
          border: `1px solid rgba(249,115,22,0.35)`,
          color: C.orangeL,
          fontSize: 13, fontWeight: 700,
          padding: "5px 14px", borderRadius: 99,
          marginBottom: 28, letterSpacing: "0.02em",
        }}>
          🏗 解体工事専用 SaaS
        </span>

        {/* H1 */}
        <h1 style={{
          fontSize: "clamp(32px, 7vw, 72px)",
          fontWeight: 900, lineHeight: 1.15,
          color: C.textPri, marginBottom: 28, letterSpacing: "-0.03em",
          maxWidth: 780,
        }}>
          解体現場の管理を、<br />
          <span style={{
            background: `linear-gradient(90deg, ${C.orange}, ${C.orangeL})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            スマホ1台で完結。
          </span>
        </h1>

        {/* Subtext */}
        <p style={{
          fontSize: "clamp(15px, 2vw, 18px)",
          color: C.textSub, maxWidth: 560,
          lineHeight: 1.8, marginBottom: 40,
        }}>
          勤怠報告・帳票出力・機材管理・収支分析をすべてデジタル化。<br />
          現場も事務所もリアルタイムでつながる。
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 56 }}>
          <Link href="/kaitai/demo" style={{
            background: `linear-gradient(135deg, ${C.orange}, ${C.orangeL})`,
            color: "#fff",
            padding: "16px 36px", borderRadius: 12,
            fontWeight: 800, fontSize: 17, textDecoration: "none",
            boxShadow: `0 8px 32px rgba(249,115,22,0.4)`,
            letterSpacing: "-0.01em",
          }}>
            デモを体験する（ログイン不要）
          </Link>
          <Link href="/kaitai/login" style={{
            border: `1.5px solid rgba(255,255,255,0.2)`,
            color: C.textPri,
            padding: "16px 32px", borderRadius: 12,
            fontWeight: 700, fontSize: 17, textDecoration: "none",
            background: "rgba(255,255,255,0.06)",
            letterSpacing: "-0.01em",
          }}>
            ログインする →
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", gap: 40, flexWrap: "wrap",
          justifyContent: "center", marginBottom: 60,
        }}>
          {[
            ["導入企業", "300社+"],
            ["帳票作成", "90%削減"],
            ["月額", "0円〜"],
          ].map(([label, val]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, color: C.textPri, letterSpacing: "-0.03em" }}>{val}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Mock phone UI */}
        <div style={{
          width: 280,
          background: C.bgCard,
          borderRadius: 24,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
          boxShadow: `0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)`,
        }}>
          {/* Phone top bar */}
          <div style={{
            background: C.bgCard2,
            padding: "12px 16px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textPri }}>現場状況</span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              background: "rgba(74,222,128,0.15)",
              color: C.green,
              padding: "2px 8px", borderRadius: 99,
            }}>3件稼働中</span>
          </div>
          {/* Site rows */}
          {[
            { name: "山田邸解体工事", pct: 68, color: C.orange },
            { name: "田中ビル解体", pct: 42, color: "#38BDF8" },
            { name: "鈴木倉庫撤去", pct: 91, color: C.green },
          ].map((s) => (
            <div key={s.name} style={{
              padding: "11px 16px",
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textPri }}>{s.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.pct}%</span>
              </div>
              <div style={{ height: 4, background: C.bgDark, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${s.pct}%`, height: "100%", background: s.color, borderRadius: 99 }} />
              </div>
            </div>
          ))}
          {/* Bottom nav */}
          <div style={{
            padding: "10px 0 12px",
            display: "flex", justifyContent: "space-around",
            background: C.bgCard2,
          }}>
            {["🏗", "📝", "🚛", "👷", "☰"].map((icon) => (
              <span key={icon} style={{ fontSize: 18 }}>{icon}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Pain points ─────────────────────────────────────────────────── */}
      <section style={sectionWrap(C.bgDark)} id="problem">
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>PROBLEM</p>
          <h2 style={h2Style}>こんな課題、ありませんか？</h2>
          <p style={{ color: C.textSub, marginBottom: 48, fontSize: 16 }}>
            解体業の現場では、こんな非効率が毎日起きています。
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            textAlign: "left",
          }}>
            {[
              { emoji: "📋", title: "日報管理がバラバラ", desc: "紙・LINE・メモアプリが混在。集計に毎朝1時間かかる。" },
              { emoji: "📄", title: "帳票作成が手作業", desc: "見積書・請求書をExcelで一から作成。記入ミスも多い。" },
              { emoji: "🔧", title: "機材の状況が不明", desc: "どの現場に何がある？リース返却期限はいつ？誰もわからない。" },
              { emoji: "💰", title: "現場ごとの利益が見えない", desc: "案件が終わるまで黒字か赤字かわからない。" },
            ].map((c) => (
              <div key={c.title} style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: "28px 24px",
              }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{c.emoji}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.textPri, marginBottom: 10 }}>{c.title}</div>
                <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Solution ────────────────────────────────────────────────────── */}
      <section style={sectionWrap(C.bgCard)} id="solution">
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>SOLUTION</p>
          <h2 style={h2Style}>解体LINKが、すべて解決します</h2>
          <p style={{ color: C.textSub, marginBottom: 48, fontSize: 16 }}>
            現場管理に必要な機能をすべてひとつのアプリに集約。
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            textAlign: "left",
          }}>
            {[
              { icon: "✅", before: "バラバラな日報", after: "ワンタップ報告", detail: "勤怠・作業が自動集計。リアルタイムで事務所に届く。" },
              { icon: "📋", before: "Excelで手作業", after: "自動帳票生成", detail: "見積書/請求書/完了報告書をPDF出力。ミスゼロ。" },
              { icon: "🚛", before: "機材の行方不明", after: "機材台帳", detail: "リース返却期限アラート付き一元管理。" },
              { icon: "📊", before: "赤字かも不明", after: "リアルタイム収支", detail: "現場ごとの粗利を瞬時に把握。" },
            ].map((s) => (
              <div key={s.after} style={{
                background: C.bgCard2,
                borderRadius: 16,
                borderLeft: `4px solid ${C.orange}`,
                padding: "24px 22px",
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, textDecoration: "line-through" }}>{s.before}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.textPri, marginBottom: 8 }}>→ {s.after}</div>
                <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.65 }}>{s.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Features ────────────────────────────────────────────────────── */}
      <section style={sectionWrap(C.bgDark)} id="features">
        <div style={{ maxWidth: 1060, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>FEATURES</p>
          <h2 style={h2Style}>主な機能</h2>
          <p style={{ color: C.textSub, marginBottom: 48, fontSize: 16 }}>
            解体業に特化した6つのコア機能。
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
            textAlign: "left",
          }}>
            {[
              { emoji: "🏗", name: "現場状況ダッシュボード", desc: "進捗率・原価・担当者をひと目で。複数現場を同時管理。" },
              { emoji: "📝", name: "5種類のワンタップ報告", desc: "勤務開始〜終了報告・経費・イレギュラー。写真添付可。" },
              { emoji: "📋", name: "帳票自動出力", desc: "見積書・請求書・領収書・完了報告書をPDF生成。" },
              { emoji: "🚛", name: "機材・車両管理", desc: "リース期限アラート・現場アサイン・給油記録。" },
              { emoji: "👷", name: "メンバー評価", desc: "経験年数・資格・レーダーチャートで可視化。" },
              { emoji: "📈", name: "収支・経営分析", desc: "月次・案件別の売上・原価・粗利を自動計算。" },
            ].map((f) => (
              <div key={f.name} style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: "28px 24px",
                transition: "border-color 0.2s",
              }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{f.emoji}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.textPri, marginBottom: 8 }}>{f.name}</div>
                <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Pricing ─────────────────────────────────────────────────────── */}
      <section style={sectionWrap(C.bgCard)} id="pricing">
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>PRICING</p>
          <h2 style={h2Style}>シンプルな料金体系</h2>
          <p style={{ color: C.textSub, marginBottom: 48, fontSize: 16 }}>
            チームの規模に合わせて選べる3プラン。
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            marginBottom: 24,
          }}>
            {/* Free */}
            <div style={{
              background: C.bgCard2,
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              padding: "36px 28px",
              textAlign: "left",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.textSub, marginBottom: 12 }}>フリー</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: C.textPri, letterSpacing: "-0.04em", marginBottom: 4 }}>¥0<span style={{ fontSize: 16, fontWeight: 500, color: C.textMuted }}>/月</span></div>
              <div style={{ fontSize: 14, color: C.textSub, marginBottom: 24, lineHeight: 1.6 }}>現場3件・メンバー5名</div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 28 }}>
                {["現場管理（3件まで）", "ワンタップ報告", "帳票出力（月3件）"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ color: C.green, fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 14, color: C.textSub }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/kaitai/demo" style={{
                display: "block", textAlign: "center",
                border: `1.5px solid ${C.border}`, color: C.textSub,
                padding: "13px", borderRadius: 10,
                fontWeight: 700, fontSize: 15, textDecoration: "none",
              }}>
                無料で始める
              </Link>
            </div>

            {/* Standard — recommended */}
            <div style={{
              background: C.bgCard2,
              border: `2px solid ${C.orange}`,
              borderRadius: 20,
              padding: "36px 28px",
              textAlign: "left",
              position: "relative",
              boxShadow: `0 0 40px rgba(249,115,22,0.18)`,
            }}>
              <div style={{
                position: "absolute", top: -13, left: "50%",
                transform: "translateX(-50%)",
                background: `linear-gradient(90deg, ${C.orange}, ${C.orangeL})`,
                color: "#fff", fontSize: 11, fontWeight: 800,
                padding: "4px 16px", borderRadius: 99,
                whiteSpace: "nowrap", letterSpacing: "0.05em",
              }}>
                おすすめ
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.orange, marginBottom: 12 }}>スタンダード</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: C.textPri, letterSpacing: "-0.04em", marginBottom: 4 }}>¥9,800<span style={{ fontSize: 16, fontWeight: 500, color: C.textMuted }}>/月</span></div>
              <div style={{ fontSize: 14, color: C.textSub, marginBottom: 24, lineHeight: 1.6 }}>現場20件・メンバー30名</div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 28 }}>
                {["現場管理（20件まで）", "ワンタップ報告（無制限）", "帳票出力（無制限）", "機材・車両管理", "収支・経営分析"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ color: C.orange, fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 14, color: C.textSub }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/kaitai/demo" style={{
                display: "block", textAlign: "center",
                background: `linear-gradient(135deg, ${C.orange}, ${C.orangeL})`,
                color: "#fff",
                padding: "13px", borderRadius: 10,
                fontWeight: 700, fontSize: 15, textDecoration: "none",
                boxShadow: `0 4px 20px rgba(249,115,22,0.3)`,
              }}>
                14日間無料トライアル
              </Link>
            </div>

            {/* Pro */}
            <div style={{
              background: C.bgCard2,
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              padding: "36px 28px",
              textAlign: "left",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.textSub, marginBottom: 12 }}>プロ</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: C.textPri, letterSpacing: "-0.04em", marginBottom: 4 }}>¥29,800<span style={{ fontSize: 16, fontWeight: 500, color: C.textMuted }}>/月</span></div>
              <div style={{ fontSize: 14, color: C.textSub, marginBottom: 24, lineHeight: 1.6 }}>無制限</div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 28 }}>
                {["現場・メンバー無制限", "スタンダードの全機能", "API連携・外部出力", "専任サポート担当", "カスタム帳票テンプレート"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ color: C.green, fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 14, color: C.textSub }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="mailto:info@kaitailink.jp" style={{
                display: "block", textAlign: "center",
                border: `1.5px solid ${C.border}`, color: C.textSub,
                padding: "13px", borderRadius: 10,
                fontWeight: 700, fontSize: 15, textDecoration: "none",
              }}>
                お問い合わせ
              </a>
            </div>
          </div>

          <p style={{ fontSize: 13, color: C.textMuted, marginTop: 16 }}>
            ※ 全プランに帳票出力・機材管理・収支分析が含まれます
          </p>
        </div>
      </section>

      {/* ── 7. How it works ────────────────────────────────────────────────── */}
      <section style={sectionWrap(C.bgDark)} id="how">
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>HOW IT WORKS</p>
          <h2 style={h2Style}>3ステップで始められます</h2>
          <p style={{ color: C.textSub, marginBottom: 48, fontSize: 16 }}>
            最短5分でセットアップ完了。
          </p>
          <div style={{
            display: "flex", gap: 0,
            flexWrap: "wrap", justifyContent: "center",
          }}>
            {[
              { num: "01", title: "会社情報を登録", sub: "5分で完了", detail: "会社名・住所・担当者を入力するだけ。" },
              { num: "02", title: "現場・メンバーを登録", sub: "すぐ使える", detail: "現場情報と作業員を追加して準備完了。" },
              { num: "03", title: "報告・管理スタート", sub: "即日稼働", detail: "翌日から現場もオフィスもつながります。" },
            ].map((s, i) => (
              <div key={s.num} style={{ display: "flex", alignItems: "stretch", flex: "1 1 220px", minWidth: 200 }}>
                <div style={{
                  flex: 1,
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: "36px 24px",
                  margin: "0 8px 16px",
                  textAlign: "center",
                  position: "relative",
                }}>
                  {/* Step number */}
                  <div style={{
                    fontSize: 48, fontWeight: 900,
                    color: "rgba(249,115,22,0.15)",
                    lineHeight: 1,
                    marginBottom: 16,
                    letterSpacing: "-0.04em",
                  }}>{s.num}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.textPri, marginBottom: 6 }}>{s.title}</div>
                  <div style={{
                    display: "inline-block",
                    fontSize: 11, fontWeight: 700,
                    color: C.orange,
                    background: "rgba(249,115,22,0.12)",
                    padding: "2px 10px", borderRadius: 99,
                    marginBottom: 12,
                  }}>{s.sub}</div>
                  <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.65 }}>{s.detail}</div>

                  {/* Arrow connector (not on last) */}
                  {i < 2 && (
                    <div style={{
                      position: "absolute",
                      right: -20, top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 20, color: C.textMuted,
                      zIndex: 2,
                      display: "none",  /* hidden on mobile, shown via media query workaround */
                    }}>→</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Demo CTA ────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, #C2410C 0%, ${C.orange} 50%, ${C.orangeL} 100%)`,
        padding: "80px 24px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(26px, 5vw, 44px)",
            fontWeight: 900, color: "#fff",
            marginBottom: 20, letterSpacing: "-0.03em",
            lineHeight: 1.2,
          }}>
            まず、触ってみてください。
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.85)", marginBottom: 36, lineHeight: 1.7 }}>
            ログイン不要のデモ環境で、すべての機能を体験できます。
          </p>
          <Link href="/kaitai/demo" style={{
            display: "inline-block",
            background: "#fff", color: C.orange,
            padding: "18px 44px", borderRadius: 14,
            fontWeight: 800, fontSize: 18, textDecoration: "none",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            letterSpacing: "-0.01em",
          }}>
            デモを体験する →
          </Link>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 18 }}>
            クレジットカード不要 · 登録不要 · 全機能開放
          </p>
        </div>
      </section>

      {/* ── 9. Footer ──────────────────────────────────────────────────────── */}
      <footer style={{
        background: "#030810",
        borderTop: `1px solid ${C.border}`,
        padding: "48px 24px 32px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{
            display: "flex", flexWrap: "wrap",
            justifyContent: "space-between", alignItems: "flex-start",
            gap: 32, marginBottom: 40,
          }}>
            {/* Logo & tagline */}
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.orange, marginBottom: 8 }}>解体LINK</div>
              <div style={{ fontSize: 13, color: C.textMuted, maxWidth: 240, lineHeight: 1.6 }}>
                解体業専用の現場管理SaaS。<br />
                現場と事務所をつなぐプラットフォーム。
              </div>
            </div>
            {/* Links */}
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              {[
                { label: "機能", href: "#features" },
                { label: "料金", href: "#pricing" },
                { label: "デモ", href: "/kaitai/demo" },
                { label: "お問い合わせ", href: "mailto:info@kaitailink.jp" },
              ].map((l) => (
                <a key={l.label} href={l.href} style={{
                  fontSize: 14, color: C.textMuted,
                  textDecoration: "none", lineHeight: 2,
                }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: 24,
            display: "flex", flexWrap: "wrap",
            justifyContent: "space-between", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>© 2026 解体LINK. All rights reserved.</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>解体LINKは現場管理を効率化するSaaSツールです。</span>
              <OperatorLoginButton />
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
