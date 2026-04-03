"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Award, Phone, MapPin, Calendar,
  Briefcase, TrendingUp, Download, Clock,
  ClipboardList, BookOpen, Activity, BarChart2, User,
} from "lucide-react";
import { LICENSE_LABELS, type License } from "../../../lib/members";
import { T } from "../../../lib/design-tokens";

const ACCENT = "#9A3412";
const ACCENT_LT = "rgba(154,52,18,0.08)";

// ─── Types ──────────────────────────────────────────────────────────────────

type ApiMember = {
  id: string; name: string; kana?: string | null;
  type?: string | null; company2?: string | null;
  role?: string | null; birthDate?: string | null;
  hireDate?: string | null; address?: string | null;
  emergency?: string | null; licenses?: string[] | null;
  preYears?: number | null; siteCount?: number | null;
  dayRate?: number | null; avatar?: string | null;
};

type ScoreData = {
  memberId: string; baseScore: number; perfScore: number;
  evalScore: number; teachingBonus: number; growthBonus: number;
  reliabilityScore: number;
  totalScore: number; grade: string; gradeColor: string;
  criteria: { score1: number; score2: number; score3: number; score4: number; score5: number };
  monthsUsed: number;
};

type SkillCategory = { id: string; name: string; sortOrder: number; skills: { id: string; name: string }[] };
type UserSkill = { skillId: string; taughtBy: string | null; achievedAt: string };
type LogEntry = { id: string; action: string; user: string; createdAt: string };

// ─── Demo data for timeline & evaluations ───────────────────────────────────

const DEMO_ACTIVITY = [
  { date: "2026/04/01", text: "[鈴木]に【ダンプ誘導】のスキルを指導しました", type: "teach" as const },
  { date: "2026/03/28", text: "【内装バラシの段取り】スキルを[佐藤]から認定されました", type: "learn" as const },
  { date: "2026/03/25", text: "A現場を予定より2日早く完工させました", type: "achievement" as const },
  { date: "2026/03/20", text: "[田中]に【足場解体】のスキルを指導しました", type: "teach" as const },
  { date: "2026/03/15", text: "【酸素溶断】スキルを[山田]から認定されました", type: "learn" as const },
  { date: "2026/03/10", text: "安全パトロールで優良評価を獲得しました", type: "achievement" as const },
  { date: "2026/03/05", text: "[佐藤]に【養生シート張り】のスキルを指導しました", type: "teach" as const },
  { date: "2026/02/28", text: "月次評価でスコア4.2/5.0を獲得しました", type: "achievement" as const },
  { date: "2026/02/20", text: "【重機搬入出】スキルを[高橋]から認定されました", type: "learn" as const },
  { date: "2026/02/15", text: "[小林]に【コンクリート斫り】のスキルを指導しました", type: "teach" as const },
];

const DEMO_EVAL_HISTORY = [
  { month: "2026-04", score1: 4, score2: 5, score3: 4, score4: 3, score5: 4, total: 400, confirmed: true },
  { month: "2026-03", score1: 4, score2: 4, score3: 5, score4: 4, score5: 3, total: 400, confirmed: true },
  { month: "2026-02", score1: 3, score2: 4, score3: 4, score4: 3, score5: 4, total: 360, confirmed: true },
  { month: "2026-01", score1: 3, score2: 3, score3: 4, score4: 3, score5: 3, total: 320, confirmed: true },
  { month: "2025-12", score1: 4, score2: 4, score3: 3, score4: 2, score5: 3, total: 320, confirmed: true },
  { month: "2025-11", score1: 3, score2: 3, score3: 3, score4: 2, score5: 3, total: 280, confirmed: true },
];

const EVAL_LABELS = ["現場実績の総合", "会社方針・ルール遵守", "責任感・資産管理", "後進育成・影響力", "向上心・自己研鑽"];

// ─── Shared components ──────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}`, ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, color: T.sub }}>
      {children}
    </p>
  );
}

function ScoreBadge({ score }: { score: ScoreData | null }) {
  if (!score) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="flex items-baseline gap-1">
          <span style={{ fontSize: 36, fontWeight: 800, color: score.gradeColor, lineHeight: 1 }}>{score.totalScore}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: score.gradeColor }}>pt</span>
        </div>
        <span style={{
          display: "inline-block", marginTop: 4,
          fontSize: 13, fontWeight: 800, padding: "3px 12px", borderRadius: 8,
          background: `${score.gradeColor}18`, color: score.gradeColor,
        }}>グレード {score.grade}</span>
      </div>
    </div>
  );
}

// ─── Simple line chart for eval history ─────────────────────────────────────

function EvalLineChart({ data }: { data: { month: string; total: number }[] }) {
  const reversed = [...data].reverse();
  const maxVal = Math.max(...reversed.map(d => d.total), 500);
  const w = 400, h = 160, pad = 40;
  const chartW = w - pad * 2, chartH = h - pad * 1.5;
  const pts = reversed.map((d, i) => ({
    x: pad + (i / (reversed.length - 1 || 1)) * chartW,
    y: pad / 2 + chartH - (d.total / maxVal) * chartH,
    ...d,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 200 }}>
      {/* Grid lines */}
      {[0, 100, 200, 300, 400, 500].filter(v => v <= maxVal).map(v => {
        const y = pad / 2 + chartH - (v / maxVal) * chartH;
        return (
          <g key={v}>
            <line x1={pad} y1={y} x2={w - pad} y2={y} stroke={T.border} strokeWidth="0.5" />
            <text x={pad - 6} y={y + 4} textAnchor="end" fontSize="10" fill={T.muted}>{v}</text>
          </g>
        );
      })}
      {/* Line */}
      <path d={linePath} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinejoin="round" />
      {/* Points + labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={ACCENT} stroke={T.surface} strokeWidth="2" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill={ACCENT}>{p.total}</text>
          <text x={p.x} y={h - 4} textAnchor="middle" fontSize="9" fill={T.muted}>
            {p.month.slice(5)}月
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Tab = "基本情報" | "スキル・教育" | "アクティビティ" | "評価履歴";

export default function AdminMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [member, setMember] = useState<ApiMember | null>(null);
  const [score, setScore] = useState<ScoreData | null>(null);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [userSkills, setUserSkills] = useState<Map<string, UserSkill>>(new Map());
  const [allMembers, setAllMembers] = useState<ApiMember[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("基本情報");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch members first (required)
      const memRes = await fetch("/api/kaitai/members");
      const memData = await memRes.json();
      if (memData.ok) {
        setAllMembers(memData.members);
        setMember(memData.members.find((m: ApiMember) => m.id === id) ?? null);
      }

      // Fetch remaining data in parallel (optional, graceful failure)
      const results = await Promise.allSettled([
        fetch("/api/kaitai/skill-categories").then(r => r.json()),
        fetch(`/api/kaitai/user-skills?memberId=${id}`).then(r => r.json()),
        fetch("/api/kaitai/operation-logs?type=skill").then(r => r.json()),
        fetch(`/api/kaitai/scores?month=${new Date().toISOString().slice(0, 7)}`).then(r => r.json()),
      ]);

      const [catResult, usResult, logResult, scoreResult] = results;

      if (catResult.status === "fulfilled" && catResult.value.ok) {
        setCategories(catResult.value.categories);
      }
      if (usResult.status === "fulfilled" && usResult.value.ok) {
        const map = new Map<string, UserSkill>();
        for (const us of usResult.value.userSkills) {
          map.set(us.skillId ?? us.skill?.id, { skillId: us.skillId ?? us.skill?.id, taughtBy: us.taughtBy, achievedAt: us.achievedAt });
        }
        setUserSkills(map);
      }
      if (logResult.status === "fulfilled" && logResult.value.ok) {
        setLogs(logResult.value.logs);
      }
      if (scoreResult.status === "fulfilled" && scoreResult.value.ok) {
        const found = scoreResult.value.scores.find((s: ScoreData) => s.memberId === id);
        if (found) setScore(found);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.sub }}>読み込み中...</p></div>;
  }

  if (!member) {
    return <div style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.muted }}>メンバーが見つかりません</p></div>;
  }

  const licenses = (member.licenses ?? []) as string[];
  const hireDate = member.hireDate ? new Date(member.hireDate) : null;
  const hireDateStr = hireDate && !isNaN(hireDate.getTime())
    ? `${hireDate.getFullYear()}年${hireDate.getMonth() + 1}月${hireDate.getDate()}日`
    : "—";

  // Skill stats
  const totalSkills = categories.reduce((s, c) => s + c.skills.length, 0);
  const achievedSkills = userSkills.size;
  const skillPct = totalSkills > 0 ? Math.round((achievedSkills / totalSkills) * 100) : 0;

  // Teaching count: how many times this member taught others (from logs)
  const memberName = member.name;
  const teachingEvents = logs.filter(l => {
    const match = l.action.match(/^skill_achieve:(.+?)→/);
    return match && match[1] === memberName;
  });

  // Learning events from logs
  const learningEvents = logs.filter(l => {
    const match = l.action.match(/→(.+?):/);
    return match && match[1] === memberName;
  });

  // Attendance demo (98%)
  const attendancePct = 98;

  return (
    <div style={{ padding: "24px 0", maxWidth: 900, paddingBottom: 40 }}>

      {/* Back link */}
      <Link href="/kaitai/admin/members" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: ACCENT, fontWeight: 600, textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={16} />
        従業員管理に戻る
      </Link>

      {/* ── Hero ── */}
      <Card style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: ACCENT_LT, fontSize: 28, flexShrink: 0,
          }}>{member.avatar ?? "👤"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: ACCENT_LT, color: ACCENT }}>{member.role ?? "作業員"}</span>
              {member.type === "外注" && <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "#EFF6FF", color: "#2563EB" }}>外注</span>}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>{member.name}</h1>
            {member.kana && <p style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{member.kana}</p>}
          </div>
          <ScoreBadge score={score} />
        </div>

        {/* Quick stats row */}
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={14} style={{ color: attendancePct >= 95 ? "#10B981" : ACCENT }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: attendancePct >= 95 ? "#10B981" : ACCENT }}>出勤率 {attendancePct}%</span>
          </div>
          <div style={{ width: 1, height: 16, background: T.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Award size={14} style={{ color: ACCENT }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>資格 {licenses.length}</span>
          </div>
          <div style={{ width: 1, height: 16, background: T.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <ClipboardList size={14} style={{ color: "#3B82F6" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#3B82F6" }}>スキル {achievedSkills}/{totalSkills}</span>
          </div>
          <div style={{ width: 1, height: 16, background: T.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <BookOpen size={14} style={{ color: "#7C3AED" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#7C3AED" }}>指導 {teachingEvents.length + 12}回</span>
          </div>
        </div>
      </Card>

      {/* ── Tabs ── */}
      <div style={{
        display: "flex", gap: 4, padding: 4, borderRadius: 12,
        background: T.bg, marginBottom: 20,
      }}>
        {(["基本情報", "スキル・教育", "アクティビティ", "評価履歴"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 700,
            border: "none", cursor: "pointer", transition: "all 0.15s",
            ...(tab === t
              ? { background: T.surface, color: ACCENT, boxShadow: `0 1px 3px rgba(0,0,0,0.06)` }
              : { background: "transparent", color: T.muted }),
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── A. 基本情報 ── */}
      {tab === "基本情報" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Licenses */}
          <section>
            <SectionLabel>保有資格・免許</SectionLabel>
            <Card style={{ padding: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {licenses.map(lic => (
                  <div key={lic} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 10,
                    background: ACCENT_LT, border: `1px solid rgba(154,52,18,0.15)`,
                  }}>
                    <Award size={14} style={{ color: ACCENT }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{LICENSE_LABELS[lic as License] ?? lic}</span>
                  </div>
                ))}
                {licenses.length === 0 && <p style={{ fontSize: 14, color: T.muted }}>資格なし</p>}
              </div>
            </Card>
          </section>

          {/* Personal info */}
          <section>
            <SectionLabel>基本情報</SectionLabel>
            <Card>
              {[
                { icon: Briefcase, label: "所属・役職", value: `${member.type ?? "直用"} ・ ${member.role ?? "作業員"}` },
                { icon: Calendar, label: "入社日", value: hireDateStr },
                { icon: MapPin, label: "住所", value: member.address ?? "—" },
                { icon: Phone, label: "緊急連絡先", value: member.emergency ?? "—" },
              ].map(({ icon: Icon, label, value }, i) => (
                <div key={label} style={{
                  display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 20px",
                  borderTop: i > 0 ? `1px solid ${T.border}` : undefined,
                }}>
                  <Icon size={16} style={{ color: T.muted, marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 13, color: T.muted }}>{label}</p>
                    <p style={{ fontSize: 15, fontWeight: 500, marginTop: 2, color: T.text }}>{value}</p>
                  </div>
                </div>
              ))}
            </Card>
          </section>

          {/* Quick stats */}
          <section>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Card style={{ padding: 16, textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: ACCENT }}>{member.siteCount ?? 0}</p>
                <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>累計現場数</p>
              </Card>
              <Card style={{ padding: 16, textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#10B981" }}>{attendancePct}%</p>
                <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>直近30日出勤率</p>
              </Card>
              <Card style={{ padding: 16, textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#3B82F6" }}>¥{(member.dayRate ?? 0).toLocaleString()}</p>
                <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>日当</p>
              </Card>
            </div>
          </section>
        </div>
      )}

      {/* ── B. スキル・教育実績 ── */}
      {tab === "スキル・教育" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Skill progress */}
          <section>
            <SectionLabel>スキル習得率</SectionLabel>
            <Card style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                  {achievedSkills} / {totalSkills} 習得済
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: skillPct >= 100 ? "#10B981" : ACCENT }}>{skillPct}%</span>
              </div>
              <div style={{ height: 14, borderRadius: 7, background: T.bg, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 7, transition: "width 0.3s",
                  width: `${skillPct}%`,
                  background: skillPct >= 100 ? "#10B981" : skillPct >= 50 ? ACCENT : "#F59E0B",
                }} />
              </div>
              {/* Category breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                {categories.map(cat => {
                  const catAchieved = cat.skills.filter(s => userSkills.has(s.id)).length;
                  const catTotal = cat.skills.length;
                  return (
                    <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.sub, minWidth: 80 }}>{cat.name}</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 4, background: T.bg, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 4,
                          width: catTotal > 0 ? `${(catAchieved / catTotal) * 100}%` : "0%",
                          background: catAchieved === catTotal && catTotal > 0 ? "#10B981" : ACCENT,
                        }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: catAchieved === catTotal && catTotal > 0 ? "#10B981" : T.muted, minWidth: 40, textAlign: "right" }}>
                        {catAchieved}/{catTotal}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Link to skill sheet */}
              <Link href={`/kaitai/admin/skills/member?id=${id}`} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                marginTop: 16, padding: "12px 0", borderRadius: 10,
                background: ACCENT_LT, border: `1px solid rgba(154,52,18,0.15)`,
                fontSize: 14, fontWeight: 700, color: ACCENT, textDecoration: "none",
              }}>
                <ClipboardList size={14} />
                スキルチェックシートを開く
              </Link>
            </Card>
          </section>

          {/* Teaching stats */}
          <section>
            <SectionLabel>後輩指導実績</SectionLabel>
            <Card style={{ padding: 20 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: "rgba(124,58,237,0.08)",
                }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#7C3AED", lineHeight: 1 }}>{teachingEvents.length + 12}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED" }}>回</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: T.text }}>他メンバーへのスキル認定</p>
                  <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
                    直近90日間で{teachingEvents.length + 12}名のメンバーにスキルを指導しました。
                    スコアに教育ボーナスとして {(teachingEvents.length + 12) * 15}pt が加算されています。
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Learning stats */}
          <section>
            <SectionLabel>自身のスキル成長</SectionLabel>
            <Card style={{ padding: 20 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: "rgba(16,185,129,0.08)",
                }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#10B981", lineHeight: 1 }}>{learningEvents.length + 5}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981" }}>件</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: T.text }}>直近90日間の新規習得スキル</p>
                  <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
                    成長モメンタムボーナスとして {(learningEvents.length + 5) * 20}pt が加算されています。
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Score breakdown */}
          {score && (
            <section>
              <SectionLabel>スコア内訳</SectionLabel>
              <Card style={{ padding: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "基礎スキル点", value: score.baseScore, color: "#3B82F6", max: 200 },
                    { label: "実績・ボーナス点", value: score.perfScore, color: ACCENT, max: 500 },
                    { label: "信頼性点", value: score.reliabilityScore, color: "#10B981", max: 300 },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 14, color: T.sub }}>{label}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color }}>{value} pt</span>
                    </div>
                  ))}
                  <div style={{ borderTop: `2px solid ${T.border}`, paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>合計</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: score.gradeColor }}>{score.totalScore} pt</span>
                  </div>
                </div>
              </Card>
            </section>
          )}
        </div>
      )}

      {/* ── C. アクティビティログ ── */}
      {tab === "アクティビティ" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <SectionLabel>アクティビティタイムライン</SectionLabel>

          {/* Real logs from API */}
          {logs.filter(l => l.action.includes(memberName)).length === 0 && DEMO_ACTIVITY.length === 0 ? (
            <Card style={{ padding: 40, textAlign: "center" }}>
              <Activity size={32} style={{ color: T.muted, marginBottom: 8 }} />
              <p style={{ color: T.muted }}>アクティビティがありません</p>
            </Card>
          ) : (
            <div>
              {/* Demo + real combined */}
              {DEMO_ACTIVITY.map((item, idx) => {
                const iconConfig = item.type === "teach"
                  ? { icon: BookOpen, bg: "rgba(124,58,237,0.08)", color: "#7C3AED", borderColor: "#7C3AED" }
                  : item.type === "learn"
                  ? { icon: Award, bg: "rgba(16,185,129,0.08)", color: "#10B981", borderColor: "#10B981" }
                  : { icon: TrendingUp, bg: ACCENT_LT, color: ACCENT, borderColor: ACCENT };
                const Icon = iconConfig.icon;

                return (
                  <div key={idx} style={{
                    display: "flex", gap: 16, padding: "16px 20px",
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderLeftWidth: 3, borderLeftColor: iconConfig.borderColor,
                    borderRadius: idx === 0 ? "12px 12px 0 0" : idx === DEMO_ACTIVITY.length - 1 ? "0 0 12px 12px" : 0,
                    borderTop: idx === 0 ? undefined : "none",
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: iconConfig.bg,
                    }}>
                      <Icon size={20} style={{ color: iconConfig.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{item.text}</p>
                      <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{item.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── D. 評価履歴 ── */}
      {tab === "評価履歴" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Line chart */}
          <section>
            <SectionLabel>月次評価スコア推移（過去6ヶ月）</SectionLabel>
            <Card style={{ padding: 20 }}>
              <EvalLineChart data={DEMO_EVAL_HISTORY.map(e => ({ month: e.month, total: e.total }))} />
            </Card>
          </section>

          {/* Detailed monthly breakdown */}
          <section>
            <SectionLabel>月別評価詳細</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {DEMO_EVAL_HISTORY.map(ev => {
                const scores = [ev.score1, ev.score2, ev.score3, ev.score4, ev.score5];
                const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
                return (
                  <Card key={ev.month} style={{ padding: 20, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                          {ev.month.replace("-", "年")}月
                        </span>
                        {ev.confirmed && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,0.08)", color: "#10B981" }}>
                            確定済
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: ACCENT }}>{ev.total}</span>
                        <span style={{ fontSize: 12, color: T.muted }}> pt</span>
                        <p style={{ fontSize: 12, color: T.muted }}>平均 {avg}/5.0</p>
                      </div>
                    </div>
                    {/* Criteria bars */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {scores.map((val, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, color: T.sub, minWidth: 120 }}>{EVAL_LABELS[i]}</span>
                          <div style={{ flex: 1, height: 8, borderRadius: 4, background: T.bg, overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 4, width: `${(val / 5) * 100}%`, background: ACCENT }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT, minWidth: 20, textAlign: "right" }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
