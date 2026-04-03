"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MapPin, Users, HardHat, FileText, Clock, ChevronRight,
  BarChart3, Shield, Star, Award, TrendingUp,
  Camera, CheckCircle2, ArrowRight, Trash2, Calendar,
  Play, Coffee, LogOut, AlertTriangle, Receipt,
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
  navy:    "#1E293B",
} as const;

function yen(n: number) { return "¥" + n.toLocaleString("ja-JP"); }

// ─── Section wrapper ──────────────────────────────────────────────────────────

type SectionId = "sites" | "schedule" | "report" | "members" | "equipment" | "admin";

function DemoSection({ id, icon: Icon, title, desc, children }: {
  id: string; icon: React.ElementType; title: string; desc: string; children: React.ReactNode;
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
      {children}
    </section>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
      padding: 20, overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Step indicator for report flow ───────────────────────────────────────────

function FlowStep({ step, total, label, active }: {
  step: number; total: number; label: string; active?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
      borderRadius: 10,
      background: active ? C.rustLt : C.bg,
      border: active ? `1.5px solid ${C.rustMd}` : `1px solid ${C.border}`,
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 8,
        background: active ? C.rust : C.border,
        color: active ? "#fff" : C.sub,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800,
      }}>
        {step}
      </div>
      <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? C.rustDk : C.sub }}>
        {label}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════════

export default function DemoPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("sites");

  const sections: { id: SectionId; label: string }[] = [
    { id: "sites",    label: "現場状況" },
    { id: "schedule", label: "スケジュール" },
    { id: "report",   label: "作業報告" },
    { id: "members",  label: "メンバー" },
    { id: "equipment", label: "機材" },
    { id: "admin",    label: "管理者" },
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
            padding: "4px 14px", borderRadius: 99,
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

      {/* ── Section nav ── */}
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
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "120px 20px 20px" }}>
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
            1. 現場状況ダッシュボード
        ═══════════════════════════════════════════════════════ */}
        <DemoSection
          id="sites"
          icon={MapPin}
          title="現場状況ダッシュボード"
          desc="稼働中の現場と進捗・原価・スタッフをリアルタイムで確認"
        >
          {/* KPI strip */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "稼働中", value: "2", unit: "件", color: C.rust },
                { label: "本日作業員", value: "10", unit: "名", color: C.blue },
                { label: "着工前", value: "1", unit: "件", color: "#1D4ED8" },
                { label: "完工済", value: "1", unit: "件", color: C.green },
              ].map(k => (
                <div key={k.label} style={{ background: C.bg, borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>{k.label}</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>
                    {k.value}<span style={{ fontSize: 13, fontWeight: 600 }}>{k.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Active site card (rich) */}
          <Card style={{ marginBottom: 12, padding: 0 }}>
            <div style={{ display: "flex" }}>
              {/* Thumbnail */}
              <div style={{
                width: 120, minHeight: 160, background: "#1E293B",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                flexShrink: 0, borderRadius: "16px 0 0 0",
              }}>
                <HardHat size={28} color="rgba(255,255,255,0.15)" />
                <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>SITE PHOTO</span>
              </div>
              {/* Content */}
              <div style={{ flex: 1, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: "#0EA5E918", color: "#0EA5E9" }}>木造解体</span>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: C.rustLt, color: C.rustDk, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: C.rust }} />解体中
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: "#F0FDF4", color: C.green, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: C.green }} />本日稼働
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>田辺邸解体工事</h3>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 10, color: C.muted }}>施工進捗率</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: C.rust, lineHeight: 1 }}>68<span style={{ fontSize: 14 }}>%</span></p>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: C.sub, marginBottom: 10 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} style={{ color: C.muted }} />岡山市北区鹿田町1-1-1</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} style={{ color: C.muted }} />完工予定 <strong style={{ color: C.text }}>2026/04/10</strong></span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={12} style={{ color: C.green }} /><strong style={{ color: C.green }}>4名稼働中</strong></span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: C.bg, overflow: "hidden" }}>
                  <div style={{ width: "68%", height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${C.rust}, ${C.rustDk})` }} />
                </div>
              </div>
            </div>
            {/* Staff chips */}
            <div style={{ background: C.bg, borderTop: `1px solid ${C.border}`, padding: "14px 20px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.07em", marginBottom: 8 }}>本日のスタッフ</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { name: "田中 義雄", status: "出勤中", color: C.green },
                  { name: "佐藤 健太", status: "出勤中", color: C.green },
                  { name: "鈴木 大地", status: "休憩中", color: "#D97706" },
                  { name: "山本 拓也", status: "出勤中", color: C.green },
                ].map(s => (
                  <div key={s.name} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px",
                  }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.name}</p>
                      <p style={{ fontSize: 10, fontWeight: 600, color: s.color }}>{s.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Second site (compact) */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>旧山陽倉庫解体</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: C.rustLt, color: C.rustDk }}>解体中</span>
                </div>
                <p style={{ fontSize: 12, color: C.sub }}>岡山市北区奉還町2-3-5 / 6名稼働</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: C.rust, lineHeight: 1 }}>42<span style={{ fontSize: 12 }}>%</span></p>
              </div>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: C.bg, overflow: "hidden", marginTop: 10 }}>
              <div style={{ width: "42%", height: "100%", borderRadius: 3, background: C.rust }} />
            </div>
          </Card>

          {/* Pre-start + completed (compact) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#EFF6FF", color: "#1D4ED8" }}>着工前</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 8 }}>森本アパート解体</p>
              <p style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>着工 2026/04/15</p>
            </Card>
            <Card>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#F0FDF4", color: "#166534" }}>完工</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.sub, marginTop: 8 }}>旧備前工場棟解体</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>2026/03/28 引渡済</p>
            </Card>
          </div>
        </DemoSection>

        {/* ═══════════════════════════════════════════════════════
            2. 全体スケジュール
        ═══════════════════════════════════════════════════════ */}
        <DemoSection
          id="schedule"
          icon={Calendar}
          title="全体スケジュール"
          desc="現場・スタッフ・重機の月間配置をカレンダーで管理"
        >
          <Card style={{ marginBottom: 16 }}>
            {/* Month header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>◀</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>2026年 4月</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>▶</span>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
              {[
                { color: C.rust, label: "田辺邸解体" },
                { color: "#8B5CF6", label: "山陽倉庫解体" },
                { color: C.blue, label: "森本AP解体" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                  <span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {/* Day headers */}
              {["月", "火", "水", "木", "金", "土", "日"].map((d, i) => (
                <div key={d} style={{
                  textAlign: "center", fontSize: 11, fontWeight: 700, padding: "6px 0",
                  color: i >= 5 ? C.red : C.sub,
                }}>
                  {d}
                </div>
              ))}
              {/* Offset for April 2026 (starts Wednesday = 2 empty) */}
              {[null, null].map((_, i) => <div key={`e${i}`} />)}
              {/* Days 1-30 */}
              {Array.from({ length: 30 }, (_, i) => {
                const d = i + 1;
                const isWeekend = [3, 4, 10, 11, 17, 18, 24, 25].includes(i);
                const isToday = d === 3;
                // Sample site assignments
                const bars: string[] = [];
                if (d >= 1 && d <= 10 && !isWeekend) bars.push(C.rust);
                if (d >= 3 && d <= 20 && !isWeekend) bars.push("#8B5CF6");
                if (d >= 15 && d <= 30 && !isWeekend) bars.push(C.blue);
                const staffCount = isWeekend ? 0 : bars.length > 0 ? bars.length * 2 + Math.floor(Math.random() * 3) : 0;
                return (
                  <div key={d} style={{
                    textAlign: "center", padding: "6px 2px", borderRadius: 8, minHeight: 52,
                    background: isToday ? C.rustLt : isWeekend ? "#F8F9FA" : "transparent",
                    border: isToday ? `1.5px solid ${C.rustMd}` : "1px solid transparent",
                  }}>
                    <span style={{
                      fontSize: 12, fontWeight: isToday ? 800 : 500,
                      color: isToday ? C.rustDk : isWeekend ? C.red : C.text,
                    }}>
                      {d}
                    </span>
                    {bars.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4, padding: "0 2px" }}>
                        {bars.map((c, j) => (
                          <div key={j} style={{ height: 3, borderRadius: 2, background: c }} />
                        ))}
                      </div>
                    )}
                    {staffCount > 0 && (
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, margin: "3px auto 0",
                        background: C.blue, color: "#fff", fontSize: 9, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {staffCount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar legend */}
            <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
              {[
                { el: <div style={{ width: 20, height: 3, borderRadius: 2, background: C.rust }} />, label: "現場稼働日" },
                { el: <div style={{ width: 16, height: 16, borderRadius: 4, background: C.blue, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>5</div>, label: "スタッフ数" },
                { el: <div style={{ width: 16, height: 16, borderRadius: 4, background: C.rustLt, border: `1px solid ${C.rustMd}` }} />, label: "今日" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {item.el}
                  <span style={{ fontSize: 11, color: C.muted }}>{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Detail panel for selected day */}
          <Card>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.rustDk, marginBottom: 12 }}>4月3日（木）の詳細</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", marginBottom: 6 }}>稼働現場</p>
                {[
                  { name: "田辺邸解体工事", color: C.rust, workers: 4 },
                  { name: "旧山陽倉庫解体", color: "#8B5CF6", workers: 6 },
                ].map(s => (
                  <div key={s.name} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                    border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 6,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{s.name}</span>
                    <span style={{ fontSize: 12, color: C.blue, fontWeight: 700 }}>{s.workers}名</span>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", marginBottom: 6 }}>出勤予定</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["田中", "佐藤", "鈴木", "山本", "高橋", "渡辺", "伊藤", "中村", "小林", "加藤"].map(n => (
                    <span key={n} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: C.bg, color: C.text, border: `1px solid ${C.border}` }}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", marginBottom: 6 }}>重機・車両</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["0.7バックホー", "10tダンプ", "散水車"].map(eq => (
                    <span key={eq} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: C.rustLt, color: C.rustDk, border: `1px solid ${C.rustMd}` }}>
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </DemoSection>

        {/* ═══════════════════════════════════════════════════════
            3. 作業報告の流れ
        ═══════════════════════════════════════════════════════ */}
        <DemoSection
          id="report"
          icon={FileText}
          title="作業報告の流れ"
          desc="現場選択から退勤まで、作業員が行う1日の報告フロー"
        >
          {/* Flow overview */}
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 20,
            padding: "14px 16px", background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`,
          }}>
            {["現場選択", "PIN認証", "アクション選択", "作業開始", "作業終了・産廃", "退勤"].map((s, i) => (
              <span key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                  background: i === 0 ? C.rust : C.card, color: i === 0 ? "#fff" : C.sub,
                  border: i === 0 ? "none" : `1px solid ${C.border}`,
                }}>
                  {s}
                </span>
                {i < 5 && <ArrowRight size={12} style={{ color: C.muted }} />}
              </span>
            ))}
          </div>

          {/* Step 1: Site selection */}
          <Card style={{ marginBottom: 12 }}>
            <FlowStep step={1} total={6} label="現場を選択" active />
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { name: "田辺邸解体工事", status: "稼働中", workers: 4 },
                { name: "旧山陽倉庫解体", status: "稼働中", workers: 6 },
              ].map(s => (
                <div key={s.name} style={{
                  border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "14px 16px",
                  background: s.name === "田辺邸解体工事" ? C.rustLt : C.card,
                  borderColor: s.name === "田辺邸解体工事" ? C.rust : C.border,
                }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#F0FDF4", color: C.green }}>{s.status}</span>
                    <span style={{ fontSize: 12, color: C.sub }}>{s.workers}名稼働中</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Step 2: PIN */}
          <Card style={{ marginBottom: 12 }}>
            <FlowStep step={2} total={6} label="現場PIN認証" active />
            <div style={{
              marginTop: 14, background: "#0F172A", borderRadius: 12, padding: "20px 24px", textAlign: "center",
            }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>4桁のPINを入力</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
                {[true, true, true, false].map((filled, i) => (
                  <div key={i} style={{
                    width: 14, height: 14, borderRadius: 7,
                    background: filled ? C.rust : "rgba(255,255,255,0.15)",
                  }} />
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, maxWidth: 200, margin: "0 auto" }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "←"].map((n, i) => (
                  n !== null ? (
                    <div key={i} style={{
                      height: 40, borderRadius: 10,
                      background: "rgba(255,255,255,0.08)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 700,
                    }}>
                      {n}
                    </div>
                  ) : <div key={i} />
                ))}
              </div>
            </div>
          </Card>

          {/* Step 3: Action menu */}
          <Card style={{ marginBottom: 12 }}>
            <FlowStep step={3} total={6} label="アクション選択" active />
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { icon: Play, label: "勤務開始", color: C.green, bg: "#F0FDF4" },
                { icon: Coffee, label: "休憩", color: "#D97706", bg: "#FEF9C3" },
                { icon: LogOut, label: "退勤", color: C.red, bg: "#FEF2F2" },
                { icon: FileText, label: "終了報告", color: C.blue, bg: "#EFF6FF" },
                { icon: AlertTriangle, label: "イレギュラー", color: "#DC2626", bg: "#FEF2F2" },
                { icon: Receipt, label: "経費報告", color: "#7C3AED", bg: "#F5F3FF" },
              ].map(a => (
                <div key={a.label} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  padding: "16px 8px", borderRadius: 12, background: a.bg,
                  border: a.label === "勤務開始" ? `2px solid ${a.color}` : `1px solid ${C.border}`,
                }}>
                  <a.icon size={22} style={{ color: a.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: a.color }}>{a.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Step 4: Work start wizard */}
          <Card style={{ marginBottom: 12 }}>
            <FlowStep step={4} total={6} label="作業開始（3ステップ）" active />
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Sub-step 1: Work items */}
              <div style={{ padding: "14px 16px", border: `1px solid ${C.border}`, borderRadius: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.rustDk, marginBottom: 10 }}>① 作業内容を選択</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {[
                    { emoji: "🏠", label: "内装解体", selected: true },
                    { emoji: "🏗", label: "躯体解体", selected: true },
                    { emoji: "🪨", label: "基礎撤去", selected: false },
                    { emoji: "🚛", label: "搬出", selected: false },
                    { emoji: "🧹", label: "整地", selected: false },
                    { emoji: "🛡", label: "養生", selected: true },
                    { emoji: "🔧", label: "仮設", selected: false },
                    { emoji: "📋", label: "調査", selected: false },
                  ].map(w => (
                    <div key={w.label} style={{
                      textAlign: "center", padding: "10px 4px", borderRadius: 10,
                      background: w.selected ? C.rustLt : C.bg,
                      border: w.selected ? `1.5px solid ${C.rust}` : `1px solid ${C.border}`,
                    }}>
                      <span style={{ fontSize: 20 }}>{w.emoji}</span>
                      <p style={{ fontSize: 10, fontWeight: 600, color: w.selected ? C.rustDk : C.sub, marginTop: 4 }}>{w.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-step 2: Members */}
              <div style={{ padding: "14px 16px", border: `1px solid ${C.border}`, borderRadius: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.rustDk, marginBottom: 10 }}>② メンバーを選択</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { name: "田中 義雄", role: "職長", selected: true, leader: true },
                    { name: "佐藤 健太", role: "経験者", selected: true, leader: false },
                    { name: "鈴木 大地", role: "一般", selected: true, leader: false },
                    { name: "山本 拓也", role: "見習い", selected: false, leader: false },
                  ].map(m => (
                    <div key={m.name} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10,
                      background: m.selected ? C.rustLt : "transparent",
                      border: m.selected ? `1px solid ${C.rustMd}` : `1px solid ${C.border}`,
                    }}>
                      {m.selected && <CheckCircle2 size={16} style={{ color: C.rust }} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{m.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: C.bg, color: C.sub }}>{m.role}</span>
                      {m.leader && <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: "#FEF9C3", color: "#92400E" }}>👑 責任者</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-step 3: Photo */}
              <div style={{ padding: "14px 16px", border: `1px solid ${C.border}`, borderRadius: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.rustDk, marginBottom: 10 }}>③ 作業前写真を撮影</p>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "20px", background: C.bg, borderRadius: 12, border: `1px dashed ${C.border}`,
                }}>
                  <Camera size={20} style={{ color: C.rust }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.rust }}>写真を撮影（2枚撮影済）</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 5: Work end + waste */}
          <Card style={{ marginBottom: 12 }}>
            <FlowStep step={5} total={6} label="作業終了・産廃記録" active />
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 10 }}>完了した作業</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {[
                  { label: "内装解体", done: true },
                  { label: "躯体解体", done: true },
                  { label: "養生", done: false },
                ].map(t => (
                  <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6,
                      background: t.done ? C.green : "transparent",
                      border: t.done ? "none" : `2px solid ${C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {t.done && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: t.done ? C.text : C.muted }}>{t.label}</span>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 10 }}>産廃記録</p>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                {[
                  { name: "コンクリートがら", qty: 15, unit: "㎥", price: 8_000 },
                  { name: "木材", qty: 8, unit: "㎥", price: 12_000 },
                  { name: "金属くず", qty: 200, unit: "kg", price: 15 },
                ].map((w, i) => (
                  <div key={w.name} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: i < 2 ? `1px solid ${C.border}` : "none",
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{w.name}</p>
                      <p style={{ fontSize: 11, color: C.sub }}>{w.qty} {w.unit} × {yen(w.price)}</p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.rustDk }}>{yen(w.qty * w.price)}</span>
                  </div>
                ))}
                <div style={{ background: C.bg, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>産廃合計</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: C.rust }}>{yen(15 * 8_000 + 8 * 12_000 + 200 * 15)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 6: Clock out */}
          <Card>
            <FlowStep step={6} total={6} label="退勤記録" active />
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>退勤するメンバーを選択</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["田中 義雄", "佐藤 健太", "鈴木 大地"].map(n => (
                  <div key={n} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", borderRadius: 10,
                    background: C.rustLt, border: `1px solid ${C.rustMd}`,
                  }}>
                    <CheckCircle2 size={14} style={{ color: C.rust }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{n}</span>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 14, padding: "12px 20px", borderRadius: 10,
                background: C.rust, color: "#fff", textAlign: "center",
                fontWeight: 700, fontSize: 14,
              }}>
                3名 退勤を記録
              </div>
            </div>
          </Card>
        </DemoSection>

        {/* ═══════════════════════════════════════════════════════
            4. メンバー管理 (compact)
        ═══════════════════════════════════════════════════════ */}
        <DemoSection id="members" icon={Users} title="メンバー管理" desc="作業員のスキル・資格・経験レベルを一覧で把握">
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { name: "田中 義雄", role: "職長", years: 24, stars: 5, licenses: 6, avatar: "田", bg: "rgba(251,191,36,0.12)", color: "#B45309" },
                { name: "佐藤 健太", role: "経験者", years: 15, stars: 4, licenses: 4, avatar: "佐", bg: "rgba(249,115,22,0.12)", color: "#EA580C" },
                { name: "鈴木 大地", role: "一般", years: 7, stars: 3, licenses: 2, avatar: "鈴", bg: "rgba(96,165,250,0.12)", color: "#2563EB" },
                { name: "山本 拓也", role: "見習い", years: 3, stars: 2, licenses: 1, avatar: "山", bg: "rgba(148,163,184,0.12)", color: "#64748B" },
              ].map(m => (
                <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: m.bg, color: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700 }}>{m.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{m.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: m.bg, color: m.color }}>{m.role}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "flex", gap: 1 }}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} size={10} fill={j < m.stars ? m.color : "transparent"} style={{ color: j < m.stars ? m.color : C.border }} />
                        ))}
                      </span>
                      <span style={{ fontSize: 12, color: C.sub }}>{m.years}年</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Award size={12} style={{ color: C.rustDk }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.rustDk }}>{m.licenses}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </DemoSection>

        {/* ═══════════════════════════════════════════════════════
            5. 機材 + 管理者 (compact)
        ═══════════════════════════════════════════════════════ */}
        <DemoSection id="equipment" icon={HardHat} title="機材・車両管理" desc="重機・リース品の稼働状況と配車先を確認">
          <Card>
            {[
              { name: "0.7バックホー", type: "重機", status: "稼働中", site: "田辺邸解体工事" },
              { name: "10tダンプ", type: "車両", status: "稼働中", site: "旧山陽倉庫解体" },
              { name: "散水車", type: "車両", status: "待機中", site: "—" },
            ].map((eq, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
                <HardHat size={16} style={{ color: C.rust }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{eq.name}</p>
                  <p style={{ fontSize: 11, color: C.sub }}>{eq.type} / {eq.site}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: eq.status === "稼働中" ? "#F0FDF4" : "#FEF9C3", color: eq.status === "稼働中" ? "#166534" : "#854D0E" }}>{eq.status}</span>
              </div>
            ))}
          </Card>
        </DemoSection>

        <DemoSection id="admin" icon={BarChart3} title="管理者ダッシュボード" desc="収支分析・作業員評価・帳票出力を管理者PINで保護">
          <Card style={{ background: "#0F172A", border: "none" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { label: "総受注額", value: yen(31_200_000), color: C.rust },
                { label: "総原価", value: yen(16_930_000), color: C.red },
                { label: "粗利", value: yen(14_270_000), color: C.green },
              ].map(k => (
                <div key={k.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{k.label}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { icon: Shield, label: "管理者PIN認証でアクセス保護" },
                { icon: BarChart3, label: "現場別の収支・原価レポート" },
                { icon: TrendingUp, label: "作業員パフォーマンス評価" },
                { icon: FileText, label: "見積書・請求書・完了報告書を自動生成" },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                  <Icon size={14} style={{ color: "rgba(180,83,9,0.8)" }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </DemoSection>

        {/* ── CTA ── */}
        <div style={{ textAlign: "center", padding: "40px 0 60px", borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
          <h3 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 10 }}>
            実際に使ってみませんか？
          </h3>
          <p style={{ fontSize: 14, color: C.sub, marginBottom: 24, lineHeight: 1.7 }}>
            無料プランで現場2件・メンバー8名まで利用可能。<br />
            クレジットカード不要で今すぐスタートできます。
          </p>
          <Link href="/kaitai/signup" style={{
            display: "inline-block", background: C.rust, color: "#fff",
            padding: "14px 32px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none",
            marginBottom: 16,
          }}>
            無料でアカウント作成
          </Link>
          <div>
            <Link href="/kaitai/lp" style={{ fontSize: 13, color: C.muted, textDecoration: "none", fontWeight: 500 }}>
              ← ランディングページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
