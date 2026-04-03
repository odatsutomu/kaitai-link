"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MapPin, Users, HardHat, Briefcase, FileText,
  Star, Award, TrendingUp, CheckCircle2, Clock,
  ChevronRight, ArrowUpRight, BarChart3, Shield,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      "#F9FAFB",
  card:    "#FFFFFF",
  border:  "#E5E7EB",
  rust:    "#B45309",
  rustDk:  "#92400E",
  rustLt:  "rgba(180,83,9,0.08)",
  rustMd:  "rgba(180,83,9,0.15)",
  text:    "#1E293B",
  sub:     "#6B7280",
  muted:   "#9CA3AF",
  blue:    "#3B82F6",
  green:   "#10B981",
  red:     "#EF4444",
} as const;

// ─── Sample data (demo only) ─────────────────────────────────────────────────

const DEMO_SITES = [
  { id: "s1", name: "山田邸解体工事", type: "木造解体", address: "東京都世田谷区豪徳寺2-14-5", status: "解体中", progressPct: 68, workers: 4, endDate: "2026-04-10", contract: 3_200_000, cost: 1_540_000 },
  { id: "s2", name: "旧田中倉庫解体", type: "鉄骨解体", address: "神奈川県川崎市幸区堀川町580", status: "解体中", progressPct: 42, workers: 6, endDate: "2026-04-20", contract: 5_600_000, cost: 2_890_000 },
  { id: "s3", name: "松本アパート解体", type: "RC解体", address: "埼玉県さいたま市浦和区常盤6-4-21", status: "着工前", progressPct: 0, workers: 0, endDate: "2026-04-30", contract: 2_800_000, cost: 0 },
];

const DEMO_MEMBERS = [
  { name: "田中 義雄", role: "職長", years: 24, stars: 5, licenses: 6, avatar: "田" },
  { name: "佐藤 健太", role: "経験者", years: 15, stars: 4, licenses: 4, avatar: "佐" },
  { name: "鈴木 大地", role: "一般", years: 7, stars: 3, licenses: 2, avatar: "鈴" },
  { name: "山本 拓也", role: "見習い", years: 3, stars: 2, licenses: 1, avatar: "山" },
];

const DEMO_EQUIPMENT = [
  { name: "0.7バックホー", type: "重機", status: "稼働中", site: "山田邸解体工事" },
  { name: "10tダンプ", type: "車両", status: "稼働中", site: "旧田中倉庫解体" },
  { name: "散水車", type: "車両", status: "待機中", site: "—" },
  { name: "解体用アタッチメント", type: "アタッチメント", status: "稼働中", site: "旧田中倉庫解体" },
];

const DEMO_DOCS = [
  { type: "見積書", site: "山田邸解体工事", amount: 3_200_000 },
  { type: "請求書", site: "旧田中倉庫解体", amount: 5_600_000 },
  { type: "工事完了報告書", site: "山田邸解体工事", amount: 0 },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  "解体中": { bg: C.rustLt, color: C.rustDk },
  "着工前": { bg: "#EFF6FF", color: "#1D4ED8" },
  "完工":   { bg: "#F0FDF4", color: "#166534" },
  "稼働中": { bg: "#F0FDF4", color: "#166534" },
  "待機中": { bg: "#FEF9C3", color: "#854D0E" },
};

const EQ_STATUS: Record<string, { bg: string; color: string }> = {
  "稼働中": { bg: "#F0FDF4", color: "#166534" },
  "待機中": { bg: "#FEF9C3", color: "#854D0E" },
};

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  "職長":  { bg: "rgba(251,191,36,0.12)", color: "#B45309" },
  "経験者": { bg: "rgba(249,115,22,0.12)", color: "#EA580C" },
  "一般":  { bg: "rgba(96,165,250,0.12)", color: "#2563EB" },
  "見習い": { bg: "rgba(148,163,184,0.12)", color: "#64748B" },
};

function yen(n: number) { return "¥" + n.toLocaleString("ja-JP"); }

// ─── Section wrapper ──────────────────────────────────────────────────────────

type SectionId = "dashboard" | "members" | "equipment" | "docs" | "admin";

function DemoSection({ id, icon: Icon, title, desc, children }: {
  id: SectionId;
  icon: React.ElementType;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: C.rustLt, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} style={{ color: C.rust }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{title}</h2>
      </div>
      <p style={{ fontSize: 14, color: C.sub, marginBottom: 20, paddingLeft: 46 }}>{desc}</p>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
        padding: 24, overflow: "hidden",
      }}>
        {children}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");

  const sections: { id: SectionId; label: string }[] = [
    { id: "dashboard", label: "現場管理" },
    { id: "members",   label: "メンバー" },
    { id: "equipment", label: "機材" },
    { id: "docs",      label: "帳票" },
    { id: "admin",     label: "管理者" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100dvh", fontFamily: "'Noto Sans JP', sans-serif", color: C.text }}>

      {/* ── Header ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "#FFFFFF", borderBottom: `1px solid ${C.border}`,
        height: 56, display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
      }}>
        <Link href="/kaitai/lp" style={{ fontSize: 13, color: C.muted, textDecoration: "none", fontWeight: 500, flexShrink: 0 }}>
          ← 解体LINK
        </Link>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <span style={{
            background: C.rustLt, border: `1px solid ${C.rustMd}`,
            color: C.rustDk, fontSize: 12, fontWeight: 800,
            padding: "4px 14px", borderRadius: 99, letterSpacing: "0.04em",
          }}>
            デモ体験
          </span>
        </div>
        <Link href="/kaitai/signup" style={{
          fontSize: 12, fontWeight: 700, color: "#fff", background: C.rust,
          padding: "7px 14px", borderRadius: 8, textDecoration: "none", flexShrink: 0,
        }}>
          無料で始める
        </Link>
      </header>

      {/* ── Section nav (sticky below header) ── */}
      <div style={{
        position: "fixed", top: 56, left: 0, right: 0, zIndex: 40,
        background: "#FFFFFF", borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "center", gap: 4, padding: "8px 16px",
        overflowX: "auto",
      }}>
        {sections.map(s => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={() => setActiveSection(s.id)}
            style={{
              fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 8,
              textDecoration: "none", whiteSpace: "nowrap", transition: "all 0.15s",
              ...(activeSection === s.id
                ? { background: C.rustLt, color: C.rustDk, border: `1px solid ${C.rustMd}` }
                : { color: C.sub, border: "1px solid transparent" }),
            }}
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* ── Hero ── */}
      <div style={{ paddingTop: 108, maxWidth: 900, margin: "0 auto", padding: "120px 20px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{
            fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 900,
            color: C.text, marginBottom: 12, letterSpacing: "-0.03em", lineHeight: 1.25,
          }}>
            解体LINKの使用感を体験
          </h1>
          <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
            サンプルデータで各機能のイメージをご確認ください。<br />
            実際のアカウントでは、すべてゼロからスタートできます。
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════
            Section 1: Dashboard / Site Management
        ═══════════════════════════════════════════════════════ */}
        <DemoSection
          id="dashboard"
          icon={MapPin}
          title="現場ダッシュボード"
          desc="稼働中の現場と進捗・原価をリアルタイムで確認"
        >
          {/* KPI strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "稼働中現場", value: "2", unit: "件", color: C.rust },
              { label: "本日作業員", value: "10", unit: "名", color: C.blue },
              { label: "着工前", value: "1", unit: "件", color: "#1D4ED8" },
            ].map(k => (
              <div key={k.label} style={{ background: C.bg, borderRadius: 12, padding: "16px 14px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>{k.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: k.color, lineHeight: 1 }}>
                  {k.value}<span style={{ fontSize: 14, fontWeight: 600 }}>{k.unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Site cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DEMO_SITES.map(site => {
              const ss = STATUS_STYLE[site.status] ?? { bg: C.bg, color: C.sub };
              return (
                <div key={site.id} style={{
                  border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{site.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: ss.bg, color: ss.color }}>
                          {site.status}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: C.sub }}>{site.address}</p>
                    </div>
                    <ChevronRight size={16} style={{ color: C.muted }} />
                  </div>
                  {site.status === "解体中" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.sub, marginBottom: 4 }}>
                          <span>進捗</span><span style={{ fontWeight: 700, color: C.rustDk }}>{site.progressPct}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: C.bg, overflow: "hidden" }}>
                          <div style={{ width: `${site.progressPct}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${C.rust}, ${C.rustDk})` }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: C.sub, textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 700, color: C.blue }}>{site.workers}名</span> 稼働
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DemoSection>

        {/* ═══════════════════════════════════════════════════════
            Section 2: Members
        ═══════════════════════════════════════════════════════ */}
        <DemoSection
          id="members"
          icon={Users}
          title="メンバー管理"
          desc="作業員のスキル・資格・経験レベルを一覧で把握"
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
            <div style={{ background: C.bg, borderRadius: 12, padding: "16px 14px", textAlign: "center" }}>
              <p style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>総メンバー数</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: C.blue, lineHeight: 1 }}>4<span style={{ fontSize: 14, fontWeight: 600 }}>名</span></p>
            </div>
            <div style={{ background: C.bg, borderRadius: 12, padding: "16px 14px", textAlign: "center" }}>
              <p style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>保有資格合計</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: C.rustDk, lineHeight: 1 }}>13<span style={{ fontSize: 14, fontWeight: 600 }}>件</span></p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DEMO_MEMBERS.map((m, i) => {
              const lvl = LEVEL_STYLE[m.role] ?? LEVEL_STYLE["一般"];
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: lvl.bg, color: lvl.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, flexShrink: 0,
                  }}>
                    {m.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{m.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: lvl.bg, color: lvl.color }}>
                        {m.role}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.sub }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} size={11} fill={j < m.stars ? lvl.color : "transparent"} style={{ color: j < m.stars ? lvl.color : C.border }} />
                        ))}
                      </span>
                      <span>{m.years}年</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <Award size={13} style={{ color: C.rustDk }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.rustDk }}>{m.licenses}資格</span>
                  </div>
                </div>
              );
            })}
          </div>
        </DemoSection>

        {/* ═══════════════════════════════════════════════════════
            Section 3: Equipment
        ═══════════════════════════════════════════════════════ */}
        <DemoSection
          id="equipment"
          icon={HardHat}
          title="機材・車両管理"
          desc="重機・リース品の稼働状況と配車先を一目で確認"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DEMO_EQUIPMENT.map((eq, i) => {
              const es = EQ_STATUS[eq.status] ?? { bg: C.bg, color: C.sub };
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: C.rustLt, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <HardHat size={18} style={{ color: C.rust }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{eq.name}</p>
                    <p style={{ fontSize: 12, color: C.sub }}>{eq.type} / 配車先: {eq.site}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: es.bg, color: es.color }}>
                    {eq.status}
                  </span>
                </div>
              );
            })}
          </div>
        </DemoSection>

        {/* ═══════════════════════════════════════════════════════
            Section 4: Documents
        ═══════════════════════════════════════════════════════ */}
        <DemoSection
          id="docs"
          icon={FileText}
          title="帳票出力"
          desc="見積書・請求書・完了報告書をワンクリックで自動生成"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DEMO_DOCS.map((doc, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FileText size={18} style={{ color: C.blue }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{doc.type}</p>
                  <p style={{ fontSize: 12, color: C.sub }}>{doc.site}</p>
                </div>
                {doc.amount > 0 && (
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{yen(doc.amount)}</span>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 14, lineHeight: 1.6 }}>
            現場データを登録すると、見積書・請求書・領収書・工事完了報告書・作業報告書をPDF出力できます。
          </p>
        </DemoSection>

        {/* ═══════════════════════════════════════════════════════
            Section 5: Admin
        ═══════════════════════════════════════════════════════ */}
        <DemoSection
          id="admin"
          icon={BarChart3}
          title="管理者ダッシュボード"
          desc="収支分析・作業員評価・原価管理を管理者PINで保護"
        >
          {/* Revenue/cost summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "総受注額", value: yen(11_600_000), color: C.rust },
              { label: "総原価", value: yen(4_430_000), color: C.red },
              { label: "粗利", value: yen(7_170_000), color: C.green },
            ].map(k => (
              <div key={k.label} style={{
                background: "#0F172A", borderRadius: 12, padding: "16px 14px", textAlign: "center",
              }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{k.label}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Eval preview */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginBottom: 10 }}>作業員評価</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, textAlign: "center" }}>
              {["勤怠", "安全", "スピード", "機材", "近隣"].map(cat => (
                <div key={cat} style={{ background: C.bg, borderRadius: 8, padding: "10px 6px" }}>
                  <p style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>{cat}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: C.green }}>3</p>
                </div>
              ))}
            </div>
          </div>

          {/* Admin features list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { icon: Shield, label: "管理者PIN認証でアクセス保護" },
              { icon: BarChart3, label: "現場別の収支・原価レポート" },
              { icon: TrendingUp, label: "作業員パフォーマンス評価" },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <Icon size={16} style={{ color: C.rust }} />
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </DemoSection>

        {/* ── CTA footer ── */}
        <div style={{
          textAlign: "center", padding: "40px 0 60px",
          borderTop: `1px solid ${C.border}`, marginTop: 8,
        }}>
          <h3 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 10 }}>
            実際に使ってみませんか？
          </h3>
          <p style={{ fontSize: 14, color: C.sub, marginBottom: 24, lineHeight: 1.7 }}>
            無料プランで現場2件・メンバー8名まで利用可能。<br />
            クレジットカード不要で今すぐスタートできます。
          </p>
          <Link href="/kaitai/signup" style={{
            display: "inline-block",
            background: C.rust, color: "#fff",
            padding: "14px 32px", borderRadius: 10,
            fontWeight: 700, fontSize: 15, textDecoration: "none",
            marginBottom: 16,
          }}>
            無料でアカウント作成
          </Link>
          <div>
            <Link href="/kaitai/lp" style={{
              fontSize: 13, color: C.muted, textDecoration: "none", fontWeight: 500,
            }}>
              ← ランディングページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
