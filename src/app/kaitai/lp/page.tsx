import Link from "next/link";
import Image from "next/image";
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

export default function KaitaiLpPage() {
  return (
    <div style={{ background: C.bgDark, color: C.textPri, fontFamily: "'Noto Sans JP', sans-serif", overflowX: "hidden" }}>

      {/* ── 1. Fixed nav ───────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(8,15,26,0.9)",
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
            デモ画面を見る
          </Link>
        </div>
      </nav>

      {/* ── 2. Hero image ─────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 60 }}>
        <Image
          src="/kaitai.png"
          alt="解体LINK — 解体現場の管理を、感覚からデータへ"
          width={1280}
          height={720}
          priority
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </section>

      {/* ── 3. Hero text ───────────────────────────────────────────────────── */}
      <section style={{
        background: C.bgDark,
        display: "flex", flexDirection: "column",
        alignItems: "center",
        padding: "64px 24px 72px",
        textAlign: "center",
      }}>
        {/* H1 */}
        <h1 style={{
          fontSize: "clamp(28px, 6vw, 60px)",
          fontWeight: 900, lineHeight: 1.15,
          color: C.textPri, marginBottom: 24, letterSpacing: "-0.03em",
          maxWidth: 780,
        }}>
          解体現場の管理を、<br />
          <span style={{
            background: `linear-gradient(90deg, ${C.orange}, ${C.orangeL})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            感覚からデータへ。
          </span>
        </h1>

        {/* Subtext */}
        <p style={{
          fontSize: "clamp(15px, 2vw, 17px)",
          color: C.textSub, maxWidth: 560,
          lineHeight: 1.85, marginBottom: 40,
        }}>
          出勤状況から現場のトラブル、明日の引き継ぎまで。<br />
          現場の「今」をリアルタイムに共有し、<br />
          管理業務をスマートにする解体業専用ツール。
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/kaitai/demo" style={{
            background: `linear-gradient(135deg, ${C.orange}, ${C.orangeL})`,
            color: "#fff",
            padding: "16px 36px", borderRadius: 12,
            fontWeight: 800, fontSize: 17, textDecoration: "none",
            boxShadow: `0 8px 32px rgba(249,115,22,0.4)`,
            letterSpacing: "-0.01em",
          }}>
            デモ画面を見る
          </Link>
          <Link href="/kaitai/signup" style={{
            border: `1.5px solid rgba(255,255,255,0.2)`,
            color: C.textPri,
            padding: "16px 32px", borderRadius: 12,
            fontWeight: 700, fontSize: 17, textDecoration: "none",
            background: "rgba(255,255,255,0.06)",
            letterSpacing: "-0.01em",
          }}>
            無料で試してみる →
          </Link>
        </div>
      </section>

      {/* ── 3. Pain points ─────────────────────────────────────────────────── */}
      <section style={{ background: C.bgDark, padding: "80px 24px" }} id="problem">
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>PROBLEM</p>
          <h2 style={h2Style}>こんな課題、ありませんか？</h2>
          <p style={{ color: C.textSub, marginBottom: 48, fontSize: 16 }}>
            解体業の現場では、こんな非効率が毎日起きています。
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20, textAlign: "left",
          }}>
            {[
              { emoji: "📋", title: "日報管理がバラバラ", desc: "紙・LINE・メモアプリが混在。集計に毎朝1時間かかる。" },
              { emoji: "📄", title: "帳票作成が手作業", desc: "見積書・請求書をExcelで一から作成。記入ミスも多い。" },
              { emoji: "🔧", title: "機材の状況が不明", desc: "どの現場に何がある？リース返却期限はいつ？誰もわからない。" },
              { emoji: "📋", title: "引き継ぎが口頭だけ", desc: "翌日の担当者への申し送りが口頭や電話のみ。伝達漏れが多い。" },
            ].map((c) => (
              <div key={c.title} style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 16, padding: "28px 24px",
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
      <section style={{ background: C.bgCard, padding: "80px 24px" }} id="solution">
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>SOLUTION</p>
          <h2 style={h2Style}>解体LINKが、現場をつなぐ</h2>
          <p style={{ color: C.textSub, marginBottom: 56, fontSize: 16 }}>
            現場管理に必要な3つの柱を、スマホ1台に集約。
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16, textAlign: "left",
          }}>
            {[
              {
                num: "01",
                title: "現場リアルタイム管理",
                desc: "出勤・退勤・作業進捗・イレギュラーをその場でスマホ報告。事務所と現場が常に同じ情報を見ながら動ける。",
                icon: "🏗",
              },
              {
                num: "02",
                title: "簡単帳票作成",
                desc: "見積書・請求書・完了報告書をその場でPDF出力。Excelへの転記作業や手書きミスはゼロに。",
                icon: "📋",
              },
              {
                num: "03",
                title: "翌日への引き継ぎメモ",
                desc: "現場終了時に翌日担当者への申し送りを記録。翌朝の作業開始時に自動で表示され、伝達漏れを防ぐ。",
                icon: "📝",
              },
            ].map((s) => (
              <div key={s.num} style={{
                background: C.bgCard2,
                borderRadius: 16,
                borderLeft: `4px solid ${C.orange}`,
                padding: "28px 24px",
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: C.orange,
                  letterSpacing: "0.12em", marginBottom: 14,
                }}>{s.num}</div>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.textPri, marginBottom: 10 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.75 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Features ────────────────────────────────────────────────────── */}
      <section style={{ background: C.bgDark, padding: "80px 24px" }} id="features">
        <div style={{ maxWidth: 1060, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>FEATURES</p>
          <h2 style={h2Style}>主な機能</h2>
          <p style={{ color: C.textSub, marginBottom: 48, fontSize: 16 }}>
            解体業の現場管理に特化した機能群。
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20, textAlign: "left",
          }}>
            {[
              { emoji: "🏗", name: "現場状況ダッシュボード", desc: "進捗率・原価・担当者をひと目で。複数現場を同時管理。" },
              { emoji: "📝", name: "ワンタップ報告", desc: "勤務開始〜終了・経費・イレギュラー。写真添付可。" },
              { emoji: "📋", name: "帳票自動出力", desc: "見積書・請求書・領収書・完了報告書をPDF生成。" },
              { emoji: "🚛", name: "機材・車両管理", desc: "リース期限アラート・現場アサイン・給油記録。" },
              { emoji: "👷", name: "メンバー管理", desc: "経験年数・資格・勤怠をまとめて把握。" },
              { emoji: "📬", name: "引き継ぎメモ", desc: "翌朝作業開始時に自動表示。口頭伝達に頼らない。" },
            ].map((f) => (
              <div key={f.name} style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 16, padding: "28px 24px",
              }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{f.emoji}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.textPri, marginBottom: 8 }}>{f.name}</div>
                <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. How it works ────────────────────────────────────────────────── */}
      <section style={{ background: C.bgCard, padding: "80px 24px" }} id="how">
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>HOW IT WORKS</p>
          <h2 style={h2Style}>3ステップで始められます</h2>
          <p style={{ color: C.textSub, marginBottom: 48, fontSize: 16 }}>
            最短5分でセットアップ完了。
          </p>
          <div style={{
            display: "flex", gap: 0, flexWrap: "wrap", justifyContent: "center",
          }}>
            {[
              { num: "01", title: "会社情報を登録", sub: "5分で完了", detail: "会社名・住所・担当者を入力するだけ。" },
              { num: "02", title: "現場・メンバーを登録", sub: "すぐ使える", detail: "現場情報と作業員を追加して準備完了。" },
              { num: "03", title: "報告・管理スタート", sub: "即日稼働", detail: "翌日から現場もオフィスもつながります。" },
            ].map((s) => (
              <div key={s.num} style={{ display: "flex", alignItems: "stretch", flex: "1 1 220px", minWidth: 200 }}>
                <div style={{
                  flex: 1, background: C.bgCard2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16, padding: "36px 24px",
                  margin: "0 8px 16px", textAlign: "center",
                }}>
                  <div style={{
                    fontSize: 48, fontWeight: 900,
                    color: "rgba(249,115,22,0.15)",
                    lineHeight: 1, marginBottom: 16,
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. CTA ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, #C2410C 0%, ${C.orange} 50%, ${C.orangeL} 100%)`,
        padding: "80px 24px", textAlign: "center",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(26px, 5vw, 44px)",
            fontWeight: 900, color: "#fff",
            marginBottom: 20, letterSpacing: "-0.03em", lineHeight: 1.2,
          }}>
            まず、触ってみてください。
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.85)", marginBottom: 36, lineHeight: 1.7 }}>
            ログイン不要のデモ環境で、すべての機能を体験できます。
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/kaitai/demo" style={{
              display: "inline-block",
              background: "#fff", color: C.orange,
              padding: "16px 36px", borderRadius: 12,
              fontWeight: 800, fontSize: 17, textDecoration: "none",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              letterSpacing: "-0.01em",
            }}>
              デモ画面を見る →
            </Link>
            <Link href="/kaitai/signup" style={{
              display: "inline-block",
              background: "transparent",
              border: "2px solid rgba(255,255,255,0.5)",
              color: "#fff",
              padding: "16px 28px", borderRadius: 12,
              fontWeight: 700, fontSize: 17, textDecoration: "none",
            }}>
              無料で試してみる
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. Footer ──────────────────────────────────────────────────────── */}
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
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.orange, marginBottom: 8 }}>解体LINK</div>
              <div style={{ fontSize: 13, color: C.textMuted, maxWidth: 240, lineHeight: 1.6 }}>
                解体業専用の現場管理ツール。<br />
                現場と事務所をつなぐプラットフォーム。
              </div>
            </div>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              {[
                { label: "機能", href: "#features" },
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
              <span style={{ fontSize: 12, color: C.textMuted }}>解体LINKは現場管理を効率化するツールです。</span>
              <OperatorLoginButton />
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
