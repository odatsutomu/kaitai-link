"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, Search, User, Award, Filter, Clock,
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

  // Parse skill_achieve action format: "skill_achieve:teacher→learner:skillName"
  function parseAction(action: string) {
    const match = action.match(/^skill_achieve:(.+?)→(.+?):(.+)$/);
    if (!match) return { teacher: "", learner: "", skill: action };
    return { teacher: match[1], learner: match[2], skill: match[3] };
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
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>スキル習得アクティビティ</h1>
        <p style={{ fontSize: 14, color: T.sub, marginTop: 4 }}>
          スキル習得イベントのタイムライン
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
            const { teacher, learner, skill } = parseAction(log.action);
            const date = new Date(log.createdAt);
            const isSelf = teacher === "自主";

            return (
              <div key={log.id} style={{
                display: "flex", gap: 16, padding: "16px 20px",
                background: T.surface,
                borderLeft: `3px solid ${isSelf ? "#3B82F6" : ACCENT}`,
                border: `1px solid ${T.border}`,
                borderLeftWidth: 3,
                borderLeftColor: isSelf ? "#3B82F6" : ACCENT,
                borderRadius: idx === 0 ? "12px 12px 0 0" : idx === filtered.length - 1 ? "0 0 12px 12px" : 0,
                borderTop: idx === 0 ? undefined : "none",
              }}>
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isSelf ? "rgba(59,130,246,0.08)" : ACCENT_LT,
                }}>
                  {isSelf ? <User size={20} style={{ color: "#3B82F6" }} /> : <Award size={20} style={{ color: ACCENT }} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
                    <span style={{ fontWeight: 700 }}>{learner}</span>
                    {" が "}
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 13,
                      fontWeight: 700, background: ACCENT_LT, color: ACCENT,
                    }}>
                      {skill}
                    </span>
                    {" を習得"}
                  </p>
                  <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
                    {isSelf ? "自主習得" : `指導者: ${teacher}`}
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
