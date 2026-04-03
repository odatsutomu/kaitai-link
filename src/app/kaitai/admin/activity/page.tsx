"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, Search, User, Award, Filter, Clock, X, RefreshCw, Activity,
} from "lucide-react";
import { T } from "../../lib/design-tokens";

const ACCENT = "#9A3412";
const ACCENT_LT = "rgba(154,52,18,0.08)";

type LogEntry = {
  id: string;
  action: string;
  user: string;
  createdAt: string;
};

type Member = { id: string; name: string; avatar?: string | null };

export default function ActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [filterMember, setFilterMember] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [logRes, memRes] = await Promise.all([
        fetch("/api/kaitai/operation-logs?type=skill"),
        fetch("/api/kaitai/members"),
      ]);
      const logData = await logRes.json();
      const memData = await memRes.json();
      if (logData.ok) setLogs(logData.logs);
      if (memData.ok) setMembers(memData.members);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Parse action formats:
  //   skill_achieve:teacher→learner:skillName
  //   skill_remove:memberName:skillName
  //   skill_teacher_change:memberName:skillName:oldTeacher→newTeacher
  type ParsedAction = {
    type: "achieve" | "remove" | "teacher_change" | "unknown";
    teacher: string; learner: string; skill: string;
    oldTeacher?: string; newTeacher?: string;
  };
  function parseAction(action: string): ParsedAction {
    const achieveMatch = action.match(/^skill_achieve:(.+?)→(.+?):(.+)$/);
    if (achieveMatch) return { type: "achieve", teacher: achieveMatch[1], learner: achieveMatch[2], skill: achieveMatch[3] };

    const removeMatch = action.match(/^skill_remove:(.+?):(.+)$/);
    if (removeMatch) return { type: "remove", teacher: "", learner: removeMatch[1], skill: removeMatch[2] };

    const changeMatch = action.match(/^skill_teacher_change:(.+?):(.+?):(.+?)→(.+)$/);
    if (changeMatch) return { type: "teacher_change", teacher: "", learner: changeMatch[1], skill: changeMatch[2], oldTeacher: changeMatch[3], newTeacher: changeMatch[4] };

    return { type: "unknown", teacher: "", learner: "", skill: action };
  }

  const filtered = logs.filter(log => {
    const { teacher, learner, skill } = parseAction(log.action);
    const text = `${teacher} ${learner} ${skill} ${log.user}`.toLowerCase();
    if (filterText && !text.includes(filterText.toLowerCase())) return false;
    if (filterMember) {
      const memberName = members.find(m => m.id === filterMember)?.name ?? "";
      if (!text.includes(memberName.toLowerCase())) return false;
    }
    return true;
  });

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.sub }}>読み込み中...</p></div>;
  }

  return (
    <div style={{ padding: "24px 0", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>スキルアクティビティ</h1>
        <p style={{ fontSize: 14, color: T.sub, marginTop: 4 }}>
          スキル習得・取り消し・指導者変更のタイムライン
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 24, padding: 16, flexWrap: "wrap",
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ color: T.muted, flexShrink: 0 }} />
          <input
            placeholder="スキル名・メンバー名で検索"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            style={{
              flex: 1, padding: "10px 14px", fontSize: 15, borderRadius: 10,
              border: `1px solid ${T.border}`, background: T.bg, color: T.text, outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Filter size={16} style={{ color: T.muted }} />
          <select
            value={filterMember}
            onChange={e => setFilterMember(e.target.value)}
            style={{
              padding: "10px 14px", fontSize: 14, borderRadius: 10,
              border: `1px solid ${T.border}`, background: T.bg, color: T.text, outline: "none",
            }}
          >
            <option value="">全メンバー</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 24,
      }}>
        <div style={{
          flex: 1, padding: 16, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: ACCENT }}>{logs.length}</p>
          <p style={{ fontSize: 12, color: T.muted }}>総習得イベント</p>
        </div>
        <div style={{
          flex: 1, padding: 16, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#10B981" }}>
            {new Set(logs.map(l => parseAction(l.action).learner)).size}
          </p>
          <p style={{ fontSize: 12, color: T.muted }}>習得者数</p>
        </div>
        <div style={{
          flex: 1, padding: 16, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#3B82F6" }}>
            {new Set(logs.filter(l => parseAction(l.action).teacher !== "自主").map(l => parseAction(l.action).teacher)).size}
          </p>
          <p style={{ fontSize: 12, color: T.muted }}>指導者数</p>
        </div>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Clock size={40} style={{ color: T.muted, marginBottom: 12 }} />
          <p style={{ fontSize: 15, color: T.muted }}>
            {logs.length === 0 ? "スキル習得イベントがありません" : "検索条件に一致するイベントがありません"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {filtered.map((log, idx) => {
            const parsed = parseAction(log.action);
            const date = new Date(log.createdAt);
            const isSelf = parsed.teacher === "自主";

            const colorMap = {
              achieve: isSelf ? "#3B82F6" : ACCENT,
              remove: "#EF4444",
              teacher_change: "#7C3AED",
              unknown: T.muted,
            };
            const accentColor = colorMap[parsed.type];
            const bgMap = {
              achieve: isSelf ? "rgba(59,130,246,0.08)" : ACCENT_LT,
              remove: "rgba(239,68,68,0.08)",
              teacher_change: "rgba(124,58,237,0.08)",
              unknown: T.bg,
            };
            const IconMap = {
              achieve: isSelf ? User : Award,
              remove: X,
              teacher_change: RefreshCw,
              unknown: Activity,
            };
            const Icon = IconMap[parsed.type];

            return (
              <div key={log.id} style={{
                display: "flex", gap: 16, padding: "16px 20px",
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderLeftWidth: 3,
                borderLeftColor: accentColor,
                borderRadius: idx === 0 ? "12px 12px 0 0" : idx === filtered.length - 1 ? "0 0 12px 12px" : 0,
                borderTop: idx === 0 ? undefined : "none",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: bgMap[parsed.type],
                }}>
                  <Icon size={20} style={{ color: accentColor }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {parsed.type === "achieve" && (
                    <p style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
                      <span style={{ fontWeight: 700 }}>{parsed.learner}</span>
                      {" が "}
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 13,
                        fontWeight: 700, background: ACCENT_LT, color: ACCENT,
                      }}>
                        {parsed.skill}
                      </span>
                      {" を習得"}
                    </p>
                  )}
                  {parsed.type === "remove" && (
                    <p style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
                      <span style={{ fontWeight: 700 }}>{parsed.learner}</span>
                      {" の "}
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 13,
                        fontWeight: 700, background: "rgba(239,68,68,0.08)", color: "#EF4444",
                      }}>
                        {parsed.skill}
                      </span>
                      {" を取り消し"}
                    </p>
                  )}
                  {parsed.type === "teacher_change" && (
                    <p style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
                      <span style={{ fontWeight: 700 }}>{parsed.learner}</span>
                      {" の "}
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 13,
                        fontWeight: 700, background: "rgba(124,58,237,0.08)", color: "#7C3AED",
                      }}>
                        {parsed.skill}
                      </span>
                      {" の指導者を変更"}
                    </p>
                  )}
                  {parsed.type === "unknown" && (
                    <p style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{log.action}</p>
                  )}
                  <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
                    {parsed.type === "achieve" && (isSelf ? "自主習得" : `指導者: ${parsed.teacher}`)}
                    {parsed.type === "remove" && `操作者: ${log.user}`}
                    {parsed.type === "teacher_change" && `${parsed.oldTeacher} → ${parsed.newTeacher}`}
                    {" ・ "}
                    {date.toLocaleDateString("ja-JP")} {date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
