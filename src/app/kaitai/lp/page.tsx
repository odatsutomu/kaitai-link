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
  blue:      "#60A5FA",
  red:       "#F87171",
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
            border: `1.5px solid ${C.border}`, color: C.textSub,
            padding: "7px 18px", borderRadius: 8,
            fontWeight: 700, fontSize: 14, textDecoration: "none",
            whiteSpace: "nowrap", background: "transparent",
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

        <p style={{
          fontSize: "clamp(15px, 2vw, 17px)",
          color: C.textSub, maxWidth: 620,
          lineHeight: 1.85, marginBottom: 40,
        }}>
          写真マーキング・帳票自動生成・電子印対応・収支分析・人材育成まで。<br />
          解体業のすべてをスマホ1台で完結し、<br />
          経営判断をデータで支える業界特化型プラットフォーム。
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/kaitai/demo" style={{
            background: `linear-gradient(135deg, ${C.orange}, ${C.orangeL})`,
            color: "#fff",
            padding: "16px 36px", borderRadius: 12,
            fontWeight: 800, fontSize: 17, textDecoration: "none",
            boxShadow: `0 8px 32px rgba(249,115,22,0.4)`,
          }}>
            デモ画面を見る
          </Link>
          <Link href="/kaitai/login" style={{
            border: `1.5px solid rgba(255,255,255,0.2)`,
            color: C.textPri,
            padding: "16px 32px", borderRadius: 12,
            fontWeight: 700, fontSize: 17, textDecoration: "none",
            background: "rgba(255,255,255,0.06)",
          }}>
            無料で試してみる →
          </Link>
        </div>
      </section>

      {/* ── 4. Highlight numbers ──────────────────────────────────────────── */}
      <section style={{ background: C.bgCard, padding: "56px 24px" }}>
        <div style={{
          maxWidth: 960, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 24, textAlign: "center",
        }}>
          {[
            { num: "6種", label: "帳票PDF自動生成", color: C.orange },
            { num: "4色", label: "写真マーキングペン", color: C.red },
            { num: "9段階", label: "プロジェクト管理", color: C.blue },
            { num: "1000点", label: "人材スコアリング", color: C.green },
          ].map(h => (
            <div key={h.label}>
              <div style={{ fontSize: 36, fontWeight: 900, color: h.color, marginBottom: 6 }}>{h.num}</div>
              <div style={{ fontSize: 13, color: C.textSub }}>{h.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Pain points (6 items) ──────────────────────────────────────── */}
      <section style={{ background: C.bgDark, padding: "80px 24px" }} id="problem">
        <div style={{ maxWidth: 1060, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>PROBLEM</p>
          <h2 style={h2Style}>こんな課題、ありませんか？</h2>
          <p style={{ color: C.textSub, marginBottom: 48, fontSize: 16 }}>
            解体業の現場では、こんな非効率が毎日起きています。
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20, textAlign: "left",
          }}>
            {[
              { emoji: "📋", title: "日報管理がバラバラ", desc: "紙・LINE・メモアプリが混在。集計に毎朝1時間かかる。" },
              { emoji: "📄", title: "帳票作成が手作業", desc: "見積書・請求書をExcelで一から作成。記入ミスも多い。会社印も毎回押す手間。" },
              { emoji: "📸", title: "写真の管理が煩雑", desc: "現場写真がカメラロールに埋もれる。どの写真がどの現場か後から分からない。" },
              { emoji: "🔧", title: "機材の状況が不明", desc: "どの現場に何がある？リース返却期限はいつ？誰もわからない。" },
              { emoji: "💰", title: "現場の収支が見えない", desc: "工事が終わるまで利益が出たか不明。原価超過に気づくのが遅い。" },
              { emoji: "👷", title: "人材育成が属人的", desc: "誰がどのスキルを持っているか把握できない。評価基準も曖昧。" },
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

      {/* ── 6. Solution (6 pillars) ───────────────────────────────────────── */}
      <section style={{ background: C.bgCard, padding: "80px 24px" }} id="solution">
        <div style={{ maxWidth: 1060, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>SOLUTION</p>
          <h2 style={h2Style}>解体LINKが、現場をつなぐ</h2>
          <p style={{ color: C.textSub, marginBottom: 56, fontSize: 16 }}>
            現場管理に必要な6つの柱を、スマホ1台に集約。
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16, textAlign: "left",
          }}>
            {[
              { num: "01", icon: "🏗", title: "現場リアルタイム管理", desc: "9段階のプロジェクトステータスで進捗を可視化。写真付き作業報告・産廃記録・引き継ぎメモまで、現場の「今」をリアルタイムに共有。" },
              { num: "02", icon: "📸", title: "写真マーキング & 現場記録", desc: "撮影した写真に4色ペンで危険箇所・残置物・解体範囲を直接書き込み。注意コメントも添えて、現場状況を正確に伝達。" },
              { num: "03", icon: "📊", title: "経営分析ダッシュボード", desc: "現場別の売上内訳・費目別の原価推移をグラフで表示。月次・年次の比較分析で、利益率の改善ポイントが一目でわかる。" },
              { num: "04", icon: "📄", title: "帳票自動生成 & 電子印", desc: "見積書・請求書・領収書・完了報告書・建物滅失証明書をPDF出力。自社情報・電子スタンプ印を自動反映。発行履歴で再発行も即座に。" },
              { num: "05", icon: "👥", title: "人材マネジメント", desc: "スキルマトリクスで技術者の育成状況を見える化。月次5段階評価・1000点スコアリング・資格管理で、チーム力を底上げ。" },
              { num: "06", icon: "🚛", title: "機材・リース管理", desc: "重機・車両・アタッチメントの所在と状態を一元管理。リース返却期限のアラートで、無駄なコストを防止。" },
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

      {/* ── 7. Features (16 items) ────────────────────────────────────────── */}
      <section style={{ background: C.bgDark, padding: "80px 24px" }} id="features">
        <div style={{ maxWidth: 1060, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>FEATURES</p>
          <h2 style={h2Style}>主な機能</h2>
          <p style={{ color: C.textSub, marginBottom: 48, fontSize: 16 }}>
            解体業の現場管理に特化した機能群。すべてスマホ対応。
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20, textAlign: "left",
          }}>
            {[
              { emoji: "🏗", name: "現場ダッシュボード", desc: "進捗率・原価・担当者をひと目で。マップ表示で複数現場を同時管理。" },
              { emoji: "📝", name: "ワンタップ作業報告", desc: "作業開始〜終了・経費・イレギュラーをスマホから。カメラで写真も添付。" },
              { emoji: "🖊️", name: "写真マーキング", desc: "4色ペンで危険・残す・解体範囲・注意を写真に直接書き込み。凡例も自動生成。", highlight: true },
              { emoji: "📄", name: "帳票PDF自動生成", desc: "見積書・請求書・領収書・完了報告書・作業報告書・建物滅失証明書の6種類。", highlight: true },
              { emoji: "🔏", name: "電子スタンプ印", desc: "会社の電子印を登録すれば、全帳票の印欄に自動で反映。PDF出力にも対応。", highlight: true },
              { emoji: "🏢", name: "自社情報一括設定", desc: "会社名・代表者・住所・口座情報を一度登録すれば、全帳票に自動反映。", highlight: true },
              { emoji: "📋", name: "発行履歴・再発行", desc: "帳票の発行日時・内容をスナップショット保存。過去の帳票をワンタップで再発行。" },
              { emoji: "📷", name: "現場写真アップロード", desc: "着工前・施工中・完了写真をフォルダ分け管理。作業員が現場から直接アップ。" },
              { emoji: "🔄", name: "9段階ステータス管理", desc: "調査から入金確認まで。プロジェクトの進行をステージごとに追跡。" },
              { emoji: "📊", name: "経営分析", desc: "現場別売上・費目別原価の積み上げグラフ。月次/年次の収支推移を可視化。" },
              { emoji: "🧑‍🔧", name: "スキルマトリクス", desc: "技術者ごとのスキル習得状況を一覧表示。指導者の記録で育成を組織的に。" },
              { emoji: "⭐", name: "月次評価・1000点スコア", desc: "勤怠・安全・技術・近隣対応を5段階評価。資格・経験を含む1000点総合スコア。" },
              { emoji: "🚛", name: "機材・車両管理", desc: "リース返却期限アラート・現場アサイン・稼働状態を一元管理。" },
              { emoji: "📦", name: "残置物リスト管理", desc: "現場の残置物・不用品をテキストリストで記録。写真と合わせて管理。" },
              { emoji: "♻️", name: "産廃処理最適化", desc: "処理場の距離・単価を自動比較。買取と処分のコスト最適化を支援。" },
              { emoji: "📅", name: "スケジュール・配車", desc: "人員・重機の現場アサインをカレンダーで管理。稼働率の最適化に。" },
            ].map((f) => (
              <div key={f.name} style={{
                background: C.bgCard,
                border: `1px solid ${"highlight" in f && f.highlight ? C.orange + "40" : C.border}`,
                borderRadius: 16, padding: "28px 24px",
                position: "relative",
              }}>
                {"highlight" in f && f.highlight && (
                  <div style={{
                    position: "absolute", top: 12, right: 12,
                    fontSize: 9, fontWeight: 800,
                    color: C.orange, background: `${C.orange}18`,
                    padding: "2px 8px", borderRadius: 6,
                    letterSpacing: "0.05em",
                  }}>NEW</div>
                )}
                <div style={{ fontSize: 36, marginBottom: 14 }}>{f.emoji}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.textPri, marginBottom: 8 }}>{f.name}</div>
                <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Document showcase ──────────────────────────────────────────── */}
      <section style={{ background: C.bgCard, padding: "80px 24px" }} id="docs">
        <div style={{ maxWidth: 1060, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>DOCUMENTS</p>
          <h2 style={h2Style}>帳票を自動生成、電子印も対応</h2>
          <p style={{ color: C.textSub, marginBottom: 48, fontSize: 16, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            自社情報を一度登録するだけ。会社名・住所・口座・電子印が全帳票に自動反映され、
            PDF出力から発行履歴の管理まで完結します。
          </p>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
          }}>
            {[
              { name: "見積書", emoji: "📝" },
              { name: "請求書", emoji: "💴" },
              { name: "領収書", emoji: "🧾" },
              { name: "完了報告書", emoji: "✅" },
              { name: "作業報告書", emoji: "📊" },
              { name: "滅失証明書", emoji: "🏚️" },
            ].map(d => (
              <div key={d.name} style={{
                background: C.bgCard2, borderRadius: 14, padding: "24px 16px",
                border: `1px solid ${C.border}`, textAlign: "center",
              }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{d.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textPri }}>{d.name}</div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 32, padding: "20px 24px",
            background: C.bgCard2, borderRadius: 14,
            border: `1px solid ${C.border}`,
            display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24,
          }}>
            {[
              { icon: "🔏", text: "電子印の自動反映" },
              { icon: "🏢", text: "自社情報の一括設定" },
              { icon: "📋", text: "発行履歴と再発行" },
              { icon: "📎", text: "写真添付ページ" },
            ].map(f => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <span style={{ fontSize: 13, color: C.textSub, fontWeight: 600 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Photo marking showcase ─────────────────────────────────────── */}
      <section style={{ background: C.bgDark, padding: "80px 24px" }} id="marking">
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={sectionLabel}>PHOTO MARKING</p>
            <h2 style={h2Style}>写真に直接マーキング</h2>
            <p style={{ color: C.textSub, fontSize: 16, maxWidth: 560, margin: "0 auto" }}>
              撮影した写真にその場で書き込み。危険箇所・残置物・解体範囲を色分けして正確に伝達。
            </p>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16, maxWidth: 720, margin: "0 auto",
          }}>
            {[
              { color: "#EF4444", name: "危険・キズ", desc: "クラック、活線、地中障害物、アスベスト" },
              { color: "#22C55E", name: "残す・保護", desc: "残置物、境界ブロック、庭木" },
              { color: "#3B82F6", name: "解体範囲", desc: "ここから壊す、縁切りライン" },
              { color: "#EAB308", name: "注意・確認", desc: "確認事項、後工程への申し送り" },
            ].map(pen => (
              <div key={pen.name} style={{
                background: C.bgCard, borderRadius: 14, padding: "20px 18px",
                border: `1px solid ${C.border}`,
                borderLeft: `4px solid ${pen.color}`,
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 8,
                  background: pen.color, marginBottom: 10,
                }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: C.textPri, marginBottom: 6 }}>{pen.name}</div>
                <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.6 }}>{pen.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 13, color: C.textMuted, marginTop: 20 }}>
            全ての写真アップロード箇所で利用可能。マーキング不要な場合はスキップできます。
          </p>
        </div>
      </section>

      {/* ── 10. Who is it for ─────────────────────────────────────────────── */}
      <section style={{ background: C.bgCard, padding: "80px 24px" }} id="users">
        <div style={{ maxWidth: 1060, margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>WHO IS IT FOR</p>
          <h2 style={h2Style}>立場に合わせた最適な画面</h2>
          <p style={{ color: C.textSub, marginBottom: 56, fontSize: 16 }}>
            現場作業員から経営者まで、それぞれに必要な情報を最適な形で提供。
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20, textAlign: "left",
          }}>
            {[
              {
                role: "現場作業員",
                icon: "👷",
                color: "#3B82F6",
                features: [
                  "スマホでワンタップ作業報告",
                  "写真撮影 → マーキング → アップロード",
                  "残置物リストの現場入力",
                  "着工前・施工中写真の直接アップロード",
                  "自分のスキルチェックシート確認",
                ],
              },
              {
                role: "現場責任者",
                icon: "🏗",
                color: C.orange,
                features: [
                  "進捗スライダーで工事の進行を報告",
                  "写真マーキングで危険箇所を正確に伝達",
                  "産廃量・引き継ぎメモの記録",
                  "チームメンバーの出退勤管理",
                  "写真・資料のフォルダ別管理",
                ],
              },
              {
                role: "経営者・管理者",
                icon: "📊",
                color: C.green,
                features: [
                  "全現場の収支・粗利をダッシュボードで一覧",
                  "帳票PDF自動生成 + 電子印対応",
                  "自社情報の一括設定と帳票への自動反映",
                  "従業員の1000点スコア評価・スキル管理",
                  "発行履歴から過去帳票をすぐに再発行",
                ],
              },
            ].map((u) => (
              <div key={u.role} style={{
                background: C.bgCard2,
                border: `1px solid ${C.border}`,
                borderRadius: 16, padding: "32px 28px",
              }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{u.icon}</div>
                <div style={{
                  fontSize: 20, fontWeight: 800, color: u.color, marginBottom: 20,
                }}>{u.role}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {u.features.map((f, i) => (
                    <li key={i} style={{
                      fontSize: 14, color: C.textSub, lineHeight: 1.7,
                      paddingLeft: 20, position: "relative", marginBottom: 8,
                    }}>
                      <span style={{
                        position: "absolute", left: 0, top: 7,
                        width: 8, height: 8, borderRadius: 4,
                        background: u.color, display: "inline-block",
                        opacity: 0.6,
                      }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. How it works ───────────────────────────────────────────────── */}
      <section style={{ background: C.bgDark, padding: "80px 24px" }} id="how">
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
              { num: "01", title: "会社情報を登録", sub: "5分で完了", detail: "会社名・住所・口座・電子印を一括登録。帳票に自動反映されます。" },
              { num: "02", title: "現場・メンバーを登録", sub: "すぐ使える", detail: "現場情報と作業員を追加。スキル・資格も合わせて登録。" },
              { num: "03", title: "報告・管理スタート", sub: "即日稼働", detail: "翌日から現場もオフィスもつながります。写真マーキングも即利用可能。" },
            ].map((s) => (
              <div key={s.num} style={{ display: "flex", alignItems: "stretch", flex: "1 1 220px", minWidth: 200 }}>
                <div style={{
                  flex: 1, background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16, padding: "36px 24px",
                  margin: "0 8px 16px", textAlign: "center",
                }}>
                  <div style={{
                    fontSize: 48, fontWeight: 900,
                    color: "rgba(249,115,22,0.15)",
                    lineHeight: 1, marginBottom: 16,
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

      {/* ── 12. CTA ────────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, #C2410C 0%, ${C.orange} 50%, ${C.orangeL} 100%)`,
        padding: "80px 24px", textAlign: "center",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(26px, 5vw, 44px)",
            fontWeight: 900, color: "#fff",
            marginBottom: 20, lineHeight: 1.2,
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
            }}>
              デモ画面を見る →
            </Link>
            <Link href="/kaitai/login" style={{
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

      {/* ── 13. Footer ─────────────────────────────────────────────────────── */}
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
              <div style={{ fontSize: 13, color: C.textMuted, maxWidth: 300, lineHeight: 1.6 }}>
                解体業専用の現場管理プラットフォーム。<br />
                写真マーキング・帳票自動生成・電子印・<br />
                収支分析・人材育成まで、すべてスマホ対応。
              </div>
            </div>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              {[
                { label: "機能", href: "#features" },
                { label: "帳票", href: "#docs" },
                { label: "対象ユーザー", href: "#users" },
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
              <span style={{ fontSize: 12, color: C.textMuted }}>解体LINKは現場管理を効率化するプラットフォームです。</span>
              <OperatorLoginButton />
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
