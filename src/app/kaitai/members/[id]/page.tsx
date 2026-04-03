"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Star, Award, Phone, MapPin, Calendar,
  Briefcase, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, XCircle, MinusCircle, Download, MessageSquare,
  Shield, Clock, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  MEMBERS, MEMBER_STATS, LICENSE_LABELS,
  experienceYears, experienceLevel,
  type License, type TroubleRecord,
} from "../../lib/members";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ n, color }: { n: number; color: string }) {
  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} fill={i < n ? color : "transparent"} style={{ color: i < n ? color : "#2D3E54" }} />
      ))}
    </span>
  );
}

const C_MEM = {
  text: "#1E293B", sub: "#64748B", muted: "#94A3B8",
  border: "#E2E8F0", card: "#FFFFFF",
  amber: "#F59E0B", amberDk: "#D97706",
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: C_MEM.card, border: `1px solid ${C_MEM.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, color: C_MEM.sub }}>
      {children}
    </p>
  );
}

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  "#要注意":         { bg: "rgba(239,68,68,0.12)",   color: "#F87171" },
  "#ルール違反":     { bg: "rgba(239,68,68,0.12)",   color: "#F87171" },
  "#リーダーシップ": { bg: "rgba(251,191,36,0.12)", color: "#FBBF24" },
  "#安全模範":       { bg: "rgba(74,222,128,0.1)",  color: "#4ADE80" },
  "#効率的":         { bg: "rgba(96,165,250,0.1)",  color: "#60A5FA" },
  "#成長中":         { bg: "rgba(167,139,250,0.1)", color: "#A78BFA" },
  "#冷静対応":       { bg: "rgba(52,211,153,0.1)",  color: "#34D399" },
  "#粉塵管理":       { bg: "rgba(251,191,36,0.1)",  color: "#FBBF24" },
};
function tagStyle(tag: string) {
  return TAG_COLORS[tag] ?? { bg: "rgba(100,116,139,0.12)", color: "#94A3B8" };
}

// ─── Radar chart ──────────────────────────────────────────────────────────────

function RadarChart({ radar }: { radar: Record<string, number> }) {
  const labels = ["勤怠率", "安全性", "技術力", "コミュニ", "効率"];
  const vals   = [radar.attendance, radar.safety, radar.skill, radar.communication, radar.efficiency];
  const n = 5;
  const cx = 120, cy = 115, r = 80;
  const labelR = 100;

  const angles = Array.from({ length: n }, (_, i) => (i * 2 * Math.PI) / n - Math.PI / 2);

  const toXY = (ang: number, radius: number) => ({
    x: cx + radius * Math.cos(ang),
    y: cy + radius * Math.sin(ang),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPolygons = gridLevels.map(scale =>
    angles.map(a => `${toXY(a, r * scale).x},${toXY(a, r * scale).y}`).join(" ")
  );

  const dataPts = vals.map((v, i) => {
    const { x, y } = toXY(angles[i], r * v / 100);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 240 230" className="w-full">
      {/* Grid */}
      {gridPolygons.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#2D3E54" strokeWidth={i === 3 ? "0.8" : "0.5"} />
      ))}
      {/* Axis spokes */}
      {angles.map((a, i) => {
        const tip = toXY(a, r);
        return <line key={i} x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#2D3E54" strokeWidth="0.5" />;
      })}
      {/* Data fill */}
      <polygon points={dataPts} fill="rgba(249,115,22,0.15)" stroke="#F97316" strokeWidth="1.8" strokeLinejoin="round" />
      {/* Data dots */}
      {vals.map((v, i) => {
        const { x, y } = toXY(angles[i], r * v / 100);
        return <circle key={i} cx={x} cy={y} r="3.5" fill="#F97316" stroke="#0F1928" strokeWidth="1" />;
      })}
      {/* Score labels at data points */}
      {vals.map((v, i) => {
        const offset = 12;
        const { x, y } = toXY(angles[i], r * v / 100 + offset);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#F97316" fontWeight="bold">
            {v}
          </text>
        );
      })}
      {/* Axis labels */}
      {labels.map((label, i) => {
        const { x, y } = toXY(angles[i], labelR);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#94A3B8">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Attendance calendar ───────────────────────────────────────────────────────

function AttendanceCalendar({ calendar }: { calendar: string[] }) {
  // April 2026: day 1 = Wednesday (col index 2, 0=Mon)
  const offset = 2;
  const days = ["月", "火", "水", "木", "金", "土", "日"];

  const statusColor = (s: string) => {
    if (s === "出勤") return { bg: "rgba(74,222,128,0.15)", border: "#4ADE80", text: "#4ADE80" };
    if (s === "遅刻") return { bg: "rgba(251,191,36,0.15)", border: "#FBBF24", text: "#FBBF24" };
    if (s === "欠勤") return { bg: "rgba(239,68,68,0.15)",  border: "#EF4444", text: "#EF4444" };
    if (s === "休日") return { bg: "#1A2535", border: "transparent", text: "#2D3E54" };
    return { bg: "#0F1928", border: "transparent", text: "#1A2535" }; // 未来
  };

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {days.map((d, i) => (
          <div key={d} className="text-center py-0.5" style={{ fontSize: 14, fontWeight: 700, color: i >= 5 ? "#F87171" : "#64748B" }}>
            {d}
          </div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading empty cells */}
        {Array.from({ length: offset }, (_, i) => (
          <div key={`e${i}`} />
        ))}
        {/* Day cells */}
        {calendar.map((status, i) => {
          const c = statusColor(status);
          const dayNum = i + 1;
          const colIdx = (offset + i) % 7;
          return (
            <div
              key={i}
              className="rounded-lg flex flex-col items-center justify-center"
              style={{
                aspectRatio: "1",
                background: c.bg,
                border: `1px solid ${c.border}`,
                opacity: status === "未来" ? 0.3 : 1,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: colIdx >= 5 ? (status === "休日" ? "#F87171" : c.text) : c.text }}>
                {dayNum}
              </span>
              {status === "遅刻" && <span style={{ fontSize: 14, color: "#FBBF24" }}>遅</span>}
              {status === "欠勤" && <span style={{ fontSize: 14, color: "#EF4444" }}>欠</span>}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 justify-end">
        {[["出勤","#4ADE80"],["遅刻","#FBBF24"],["欠勤","#EF4444"],["休日","#475569"]].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color, opacity: 0.6 }} />
            <span style={{ fontSize: 14, color: "#64748B" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Trouble card ──────────────────────────────────────────────────────────────

const SCORE_CONFIG = {
  1: { icon: XCircle,     label: "要改善", color: "#F87171", bg: "rgba(239,68,68,0.1)" },
  2: { icon: MinusCircle, label: "普通",   color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
  3: { icon: CheckCircle, label: "適切",   color: "#4ADE80", bg: "rgba(74,222,128,0.1)" },
};

function TroubleCard({
  t, onScore,
}: {
  t: TroubleRecord;
  onScore: (id: string, score: 1 | 2 | 3, memo: string) => void;
}) {
  const [open,   setOpen]   = useState(false);
  const [memo,   setMemo]   = useState(t.adminMemo ?? "");
  const [saving, setSaving] = useState(false);

  const typeColor = {
    "近隣クレーム": "#FBBF24", "埋設物": "#60A5FA",
    "事故": "#F87171", "機材故障": "#94A3B8",
    "ルール違反": "#F87171", "その他": "#94A3B8",
  }[t.type] ?? "#94A3B8";

  const handleScore = (score: 1 | 2 | 3) => {
    setSaving(true);
    setTimeout(() => {
      onScore(t.id, score, memo);
      setSaving(false);
      setOpen(false);
    }, 300);
  };

  const cfg = t.adminScore ? SCORE_CONFIG[t.adminScore] : null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
      <button className="w-full text-left px-4 py-3 flex items-start gap-3" onClick={() => setOpen(o => !o)}>
        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "rgba(239,68,68,0.1)" }}>
          <AlertTriangle size={16} style={{ color: "#F87171" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${typeColor}1A`, color: typeColor }}>
              {t.type}
            </span>
            <span style={{ fontSize: 14, color: "#64748B" }}>{t.date}・{t.site}</span>
          </div>
          <p style={{ fontSize: 14, color: "#94A3B8" }} className="line-clamp-2">{t.detail}</p>
          {cfg && !open && (
            <div className="flex items-center gap-1 mt-1">
              <cfg.icon size={12} style={{ color: cfg.color }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>管理者評価: {cfg.label}</span>
            </div>
          )}
        </div>
        {open ? <ChevronUp size={14} style={{ color: "#475569" }} className="flex-shrink-0 mt-1" />
              : <ChevronDown size={14} style={{ color: "#475569" }} className="flex-shrink-0 mt-1" />}
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: "1px solid #0F1928" }}>
          <p style={{ fontSize: 14, paddingTop: 12, color: "#94A3B8" }}>{t.detail}</p>

          {/* Admin evaluation */}
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#64748B" }}>管理者評価（3段階）</p>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(score => {
                const c = SCORE_CONFIG[score];
                const active = t.adminScore === score;
                return (
                  <button
                    key={score}
                    onClick={() => handleScore(score)}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all"
                    style={{
                      fontSize: 14, fontWeight: 700,
                      background: active ? c.bg : "rgba(15,25,40,0.5)",
                      color: active ? c.color : "#475569",
                      border: active ? `1px solid ${c.color}30` : "1px solid #2D3E54",
                    }}
                  >
                    <c.icon size={14} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Memo */}
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: "#64748B" }}>管理者メモ</p>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={2}
              placeholder="対応内容・指示事項など…"
              className="w-full rounded-xl px-3 py-2 resize-none outline-none"
              style={{ fontSize: 14, background: "#0F1928", color: "#F1F5F9", border: "1px solid #2D3E54" }}
            />
          </div>

          {t.adminMemo && (
            <div className="px-3 py-2 rounded-xl" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.12)" }}>
              <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 2, color: "#F97316" }}>保存済メモ</p>
              <p style={{ fontSize: 14, color: "#94A3B8" }}>{t.adminMemo}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCSV(memberName: string, stats: ReturnType<typeof MEMBER_STATS[0]["memberId"] extends string ? () => typeof MEMBER_STATS[0] : never>) {
  // Build CSV rows
  const rows: (string | number)[][] = [
    ["項目", "値"],
    ["氏名", memberName],
    ["当月出勤日数", stats.workDays],
    ["遅刻回数", stats.lateDays],
    ["欠勤日数", stats.absentDays],
    ["合計勤務時間(h)", stats.totalHours],
    ["平均残業時間(h)", stats.avgOvertime],
    ["出勤率(%)", stats.attendancePct],
    ["効率スコア(%差)", `${stats.efficiencyDelta > 0 ? "+" : ""}${stats.efficiencyDelta}%`],
    ["ルール違反件数", stats.ruleViolations],
    ["トラブル対応件数", stats.troubles.length],
    [],
    ["レーダー評価"],
    ["勤怠率", stats.radar.attendance],
    ["安全性", stats.radar.safety],
    ["技術力", stats.radar.skill],
    ["コミュニケーション", stats.radar.communication],
    ["効率", stats.radar.efficiency],
    [],
    ["トラブル履歴"],
    ...stats.troubles.map(t => [t.date, t.site, t.type, t.detail.slice(0, 30)]),
    [],
    ["現場評価タグ"],
    ...stats.siteEvals.map(e => [e.date, e.site, e.tags.join(" "), e.memo ?? ""]),
  ];

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const bom  = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${memberName}_月次レポート_2026-04.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Tab = "基本情報" | "勤怠" | "パフォーマンス" | "評価";

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const member = MEMBERS.find(m => m.id === id);
  const [statsState, setStatsState] = useState(() =>
    MEMBER_STATS.find(s => s.memberId === id) ?? MEMBER_STATS[0]
  );
  const [tab, setTab] = useState<Tab>("基本情報");
  const [newEvalMemo, setNewEvalMemo] = useState("");
  const [newEvalTags, setNewEvalTags] = useState<string[]>([]);

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ color: "#64748B" }}>
        メンバーが見つかりません
      </div>
    );
  }

  const yrs    = experienceYears(member);
  const lvl    = experienceLevel(yrs);
  const expPct = Math.min(Math.round((yrs / 20) * 100), 100);
  const hired  = new Date(member.hireDate);
  const hiredStr = `${hired.getFullYear()}年${hired.getMonth() + 1}月${hired.getDate()}日`;

  const s = statsState;
  const attColor = s.attendancePct >= 95 ? "#4ADE80" : s.attendancePct >= 80 ? "#FBBF24" : "#F87171";
  const effColor = s.efficiencyDelta >= 0 ? "#4ADE80" : "#F87171";

  const handleTroubleScore = (troubleId: string, score: 1 | 2 | 3, memo: string) => {
    setStatsState(prev => ({
      ...prev,
      troubles: prev.troubles.map(t =>
        t.id === troubleId ? { ...t, adminScore: score, adminMemo: memo } : t
      ),
    }));
  };

  const AVAILABLE_TAGS = ["#効率的", "#リーダーシップ", "#安全模範", "#要注意", "#ルール違反", "#成長中", "#冷静対応"];

  return (
    <div className="py-6 pb-28 md:pb-8 flex flex-col gap-5">

      {/* ── Hero ── */}
      <section
        className="rounded-xl p-5"
        style={{ background: "linear-gradient(160deg, #0F1928 0%, #1A2535 100%)", border: "1px solid #2D3E54" }}
      >
        <Link href="/kaitai/members" className="inline-flex items-center gap-1.5 mb-4 text-sm" style={{ color: "#64748B" }}>
          <ArrowLeft size={15} /> メンバー一覧
        </Link>

        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ background: lvl.bg, color: lvl.color, border: `2px solid ${lvl.color}` }}
          >
            {member.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span style={{ fontSize: 14, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: lvl.bg, color: lvl.color }}>{lvl.label}</span>
              {member.type === "外注" && (
                <span style={{ fontSize: 14, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(99,102,241,0.1)", color: "#818CF8" }}>外注</span>
              )}
              {s.troubles.length > 0 && (
                <span style={{ fontSize: 14, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(239,68,68,0.1)", color: "#F87171" }}>⚠ 要注意</span>
              )}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F1F5F9" }}>{member.name}</h1>
            <p style={{ fontSize: 14, marginTop: 2, color: "#64748B" }}>{member.kana}</p>
          </div>
          {/* CSV export */}
          <button
            onClick={() => exportCSV(member.name, s)}
            className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl active:scale-95 transition-transform"
            style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}
          >
            <Download size={16} style={{ color: "#F97316" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#F97316" }}>CSV</span>
          </button>
        </div>

        {/* Stars + experience */}
        <div className="flex items-center gap-3 mb-3">
          <Stars n={lvl.stars} color={lvl.color} />
          <span style={{ fontSize: 15, fontWeight: 700, color: lvl.color }}>累計 {yrs}年</span>
          <span style={{ fontSize: 14, color: "#64748B" }}>（前職 {member.preYears}年 + {member.siteCount}現場）</span>
        </div>

        {/* Experience gauge */}
        <div>
          <div className="flex justify-between mb-1" style={{ fontSize: 14, color: "#64748B" }}>
            <span>経験値ゲージ</span><span>{expPct}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "#0F1928" }}>
            <div className="h-full rounded-full" style={{ width: `${expPct}%`, background: `linear-gradient(90deg, ${lvl.color}, #FBBF24)` }} />
          </div>
          <div className="flex justify-between mt-1" style={{ fontSize: 14, color: "#2D3E54" }}>
            <span>見習い</span><span>一般</span><span>中堅</span><span>熟練</span><span>職長</span>
          </div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className="py-1">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#1A2535" }}>
          {(["基本情報", "勤怠", "パフォーマンス", "評価"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl transition-all"
              style={{
                fontSize: 14, fontWeight: 700,
                ...(tab === t
                  ? { background: "rgba(249,115,22,0.15)", color: "#F97316" }
                  : { color: "#64748B" })
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">

        {/* ════════════════════════════════════════
            TAB: 基本情報
        ════════════════════════════════════════ */}
        {tab === "基本情報" && (
          <>
            {/* 資格 */}
            <section>
              <SectionLabel>保有資格・免許</SectionLabel>
              <Card className="p-4">
                <div className="flex flex-wrap gap-2">
                  {member.licenses.map(lic => (
                    <div key={lic} className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
                      <Award size={14} style={{ color: "#FBBF24" }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9" }}>{LICENSE_LABELS[lic as License] ?? lic}</span>
                    </div>
                  ))}
                  {member.licenses.length === 0 && <p style={{ fontSize: 14, color: "#64748B" }}>資格なし</p>}
                </div>
              </Card>
            </section>

            {/* 基本情報 */}
            <section>
              <SectionLabel>基本情報</SectionLabel>
              <Card>
                {[
                  { icon: Briefcase, label: "職種",       value: member.role },
                  { icon: Calendar,  label: "入社日",     value: hiredStr },
                  { icon: MapPin,    label: "住所",       value: member.address },
                  { icon: Phone,     label: "緊急連絡先", value: member.emergency },
                ].map(({ icon: Icon, label, value }, i) => (
                  <div key={label} className="flex items-start gap-3 px-4" style={{ paddingTop: 16, paddingBottom: 16, minHeight: 64, borderTop: i > 0 ? "1px solid #0F1928" : undefined }}>
                    <Icon size={16} style={{ color: "#475569" }} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p style={{ fontSize: 14, color: "#64748B" }}>{label}</p>
                      <p style={{ fontSize: 15, fontWeight: 500, marginTop: 2, color: "#F1F5F9" }}>{value}</p>
                    </div>
                  </div>
                ))}
              </Card>
            </section>

            {/* Stats */}
            <section>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "累計現場数",    value: `${member.siteCount}現場`, color: "#F97316" },
                  { label: "累計経験年数",  value: `${yrs}年`,               color: lvl.color },
                  { label: "日当",          value: `¥${member.dayRate.toLocaleString()}`, color: "#4ADE80" },
                ].map(({ label, value, color }) => (
                  <Card key={label} className="p-4 text-center">
                    <p style={{ fontSize: 18, fontWeight: 700, color }}>{value}</p>
                    <p style={{ fontSize: 14, marginTop: 2, color: "#64748B" }}>{label}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* Recent work */}
            <section>
              <SectionLabel>直近の現場出勤</SectionLabel>
              {s.siteEvals.map((e, i) => (
                <Card key={i} className="px-4 flex items-center gap-3 mb-2" style={{ paddingTop: 14, paddingBottom: 14, minHeight: 64 }}>
                  <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 40, height: 40, background: "rgba(249,115,22,0.1)" }}>
                    <TrendingUp size={18} style={{ color: "#F97316" }} />
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize: 16, fontWeight: 600, color: "#F1F5F9" }}>{e.site}</p>
                    <p style={{ fontSize: 14, color: "#64748B" }}>{e.date}</p>
                  </div>
                  {e.role === "責任者" && (
                    <span style={{ fontSize: 14, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>責任者</span>
                  )}
                </Card>
              ))}
            </section>
          </>
        )}

        {/* ════════════════════════════════════════
            TAB: 勤怠
        ════════════════════════════════════════ */}
        {tab === "勤怠" && (
          <>
            {/* Monthly summary */}
            <section>
              <SectionLabel>4月 月次サマリー</SectionLabel>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: "出勤日数",     value: `${s.workDays}日`,          color: "#4ADE80" },
                  { label: "遅刻",         value: `${s.lateDays}回`,          color: s.lateDays > 0 ? "#FBBF24" : "#64748B" },
                  { label: "欠勤",         value: `${s.absentDays}日`,        color: s.absentDays > 0 ? "#F87171" : "#64748B" },
                  { label: "合計勤務時間", value: `${s.totalHours}h`,         color: "#60A5FA" },
                  { label: "平均残業",     value: `${s.avgOvertime}h/日`,     color: "#94A3B8" },
                  { label: "出勤率",       value: `${s.attendancePct}%`,      color: attColor },
                ].map(({ label, value, color }) => (
                  <Card key={label} className="p-4">
                    <p style={{ fontSize: 14, marginBottom: 4, color: "#64748B" }}>{label}</p>
                    <p style={{ fontSize: 28, fontWeight: 800, color, fontFeatureSettings: "'tnum'", lineHeight: 1 }}>{value}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* Attendance bar */}
            <section>
              <div className="flex justify-between mb-1">
                <span style={{ fontSize: 14, color: "#64748B" }}>出勤率</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: attColor }}>{s.attendancePct}%</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "#0F1928" }}>
                <div className="h-full rounded-full" style={{ width: `${s.attendancePct}%`, background: attColor }} />
              </div>
              <div className="flex justify-between mt-1" style={{ fontSize: 14, color: "#2D3E54" }}>
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </section>

            {/* Calendar */}
            <section>
              <SectionLabel>4月 出勤カレンダー</SectionLabel>
              <Card className="p-4">
                <AttendanceCalendar calendar={s.calendar} />
              </Card>
            </section>

            {/* Overtime note */}
            {s.lateDays > 0 && (
              <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <Clock size={16} style={{ color: "#FBBF24" }} />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#FBBF24" }}>遅刻フラグ: {s.lateDays}件</p>
                  <p style={{ fontSize: 14, color: "#94A3B8" }}>現場端末の開始打刻が予定時刻を超過した記録</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════
            TAB: パフォーマンス
        ════════════════════════════════════════ */}
        {tab === "パフォーマンス" && (
          <>
            {/* Radar chart */}
            <section>
              <SectionLabel>スキルレーダーチャート</SectionLabel>
              <Card className="p-4">
                <RadarChart radar={s.radar} />
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {[
                    { label: "勤怠", v: s.radar.attendance },
                    { label: "安全", v: s.radar.safety },
                    { label: "技術", v: s.radar.skill },
                    { label: "コミュ", v: s.radar.communication },
                    { label: "効率", v: s.radar.efficiency },
                  ].map(({ label, v }) => (
                    <div key={label} className="text-center">
                      <p style={{ fontSize: 16, fontWeight: 700, color: "#F97316" }}>{v}</p>
                      <p style={{ fontSize: 14, color: "#64748B" }}>{label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            {/* Efficiency score */}
            <section>
              <SectionLabel>作業効率スコア</SectionLabel>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex-shrink-0 flex flex-col items-center justify-center"
                    style={{ background: s.efficiencyDelta >= 0 ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)" }}
                  >
                    {s.efficiencyDelta >= 0
                      ? <TrendingUp size={22} style={{ color: "#4ADE80" }} />
                      : <TrendingDown size={22} style={{ color: "#F87171" }} />
                    }
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize: 32, fontWeight: 800, color: effColor, fontFeatureSettings: "'tnum'", lineHeight: 1 }}>
                      {s.efficiencyDelta > 0 ? "+" : ""}{s.efficiencyDelta}%
                    </p>
                    <p style={{ fontSize: 14, color: "#64748B", marginTop: 4 }}>
                      標準工数との比較（マイナスが速い）
                    </p>
                    <p style={{ fontSize: 14, marginTop: 2, color: "#475569" }}>
                      坪数あたり標準作業時間を基準に算出
                    </p>
                  </div>
                </div>
              </Card>
            </section>

            {/* Rule violations */}
            <section>
              <SectionLabel>安全・ルール遵守</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={16} style={{ color: s.ruleViolations > 0 ? "#F87171" : "#4ADE80" }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#64748B" }}>ルール違反</p>
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 800, color: s.ruleViolations > 0 ? "#F87171" : "#4ADE80", lineHeight: 1 }}>
                    {s.ruleViolations}件
                  </p>
                  <p style={{ fontSize: 14, marginTop: 2, color: "#475569" }}>当月</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} style={{ color: "#4ADE80" }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#64748B" }}>ポジティブ</p>
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "#4ADE80", lineHeight: 1 }}>{s.positiveFeedback.length}件</p>
                  <p style={{ fontSize: 14, marginTop: 2, color: "#475569" }}>好評価記録</p>
                </Card>
              </div>
            </section>

            {/* Positive feedback */}
            {s.positiveFeedback.length > 0 && (
              <section>
                <SectionLabel>ポジティブフィードバック</SectionLabel>
                <div className="flex flex-col gap-2">
                  {s.positiveFeedback.map((fb, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.15)" }}>
                      <CheckCircle size={16} style={{ color: "#4ADE80" }} className="flex-shrink-0 mt-0.5" />
                      <p style={{ fontSize: 14, color: "#94A3B8" }}>{fb}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trouble history */}
            <section>
              <SectionLabel>トラブル対応履歴</SectionLabel>
              {s.troubles.length === 0 ? (
                <div className="flex items-center gap-3 px-4 py-5 rounded-2xl" style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.15)" }}>
                  <CheckCircle size={18} style={{ color: "#4ADE80" }} />
                  <p style={{ fontSize: 15, color: "#4ADE80" }}>当月トラブルなし</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {s.troubles.map(t => (
                    <TroubleCard key={t.id} t={t} onScore={handleTroubleScore} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ════════════════════════════════════════
            TAB: 評価
        ════════════════════════════════════════ */}
        {tab === "評価" && (
          <>
            {/* Existing evaluations */}
            <section>
              <SectionLabel>現場別評価履歴</SectionLabel>
              {s.siteEvals.length === 0 ? (
                <p className="text-sm" style={{ color: "#64748B" }}>評価記録なし</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {s.siteEvals.map((e, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ fontSize: 14, color: "#64748B" }}>{e.date}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>・{e.site}</span>
                        {e.role === "責任者" && (
                          <span style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px", borderRadius: 20, marginLeft: "auto", background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>責任者</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {e.tags.map(tag => {
                          const ts = tagStyle(tag);
                          return (
                            <span key={tag} style={{ fontSize: 14, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: ts.bg, color: ts.color }}>
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                      {e.memo && (
                        <div className="flex items-start gap-2 pt-2" style={{ borderTop: "1px solid #0F1928" }}>
                          <MessageSquare size={14} style={{ color: "#475569" }} className="flex-shrink-0 mt-0.5" />
                          <p style={{ fontSize: 14, color: "#94A3B8" }}>{e.memo}</p>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Add evaluation form */}
            <section>
              <SectionLabel>新規評価を追加</SectionLabel>
              <Card className="p-4">
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#64748B" }}>タグを選択</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {AVAILABLE_TAGS.map(tag => {
                    const active = newEvalTags.includes(tag);
                    const ts = tagStyle(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => setNewEvalTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                        style={{
                          fontSize: 14, fontWeight: 700, padding: "4px 12px", borderRadius: 20, transition: "all 0.15s",
                          ...(active
                            ? { background: ts.bg, color: ts.color, border: `1px solid ${ts.color}40` }
                            : { background: "#0F1928", color: "#475569", border: "1px solid #2D3E54" })
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: "#64748B" }}>メモ</p>
                <textarea
                  value={newEvalMemo}
                  onChange={e => setNewEvalMemo(e.target.value)}
                  rows={3}
                  placeholder="今回の仕事ぶりについてメモ…"
                  className="w-full rounded-xl px-3 py-2 resize-none outline-none"
                  style={{ fontSize: 14, background: "#0F1928", color: "#F1F5F9", border: "1px solid #2D3E54" }}
                />

                <button
                  onClick={() => {
                    if (newEvalTags.length === 0 && !newEvalMemo) return;
                    setStatsState(prev => ({
                      ...prev,
                      siteEvals: [
                        { date: "4月2日", site: "（最新現場）", role: "作業員", tags: newEvalTags, memo: newEvalMemo },
                        ...prev.siteEvals,
                      ],
                    }));
                    setNewEvalTags([]);
                    setNewEvalMemo("");
                  }}
                  className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                  style={{
                    background: newEvalTags.length > 0 || newEvalMemo
                      ? "linear-gradient(135deg, #F97316, #FBBF24)"
                      : "#1A2535",
                    color: newEvalTags.length > 0 || newEvalMemo ? "#fff" : "#475569",
                  }}
                >
                  評価を保存
                </button>
              </Card>
            </section>
          </>
        )}

        {/* ── CSV / PDF export footer ── */}
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => exportCSV(member.name, s)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform"
            style={{
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.2)",
              color: "#F97316",
            }}
          >
            <Download size={15} />
            CSV出力（査定・給与計算用）
          </button>
        </div>

      </div>
    </div>
  );
}
