"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Search, Filter, Users, BookOpen } from "lucide-react";
import { T } from "../lib/design-tokens";

// ─── Types ───────────────────────────────────────────────────────────────────
type Skill = { id: string; name: string; sortOrder: number };
type Category = { id: string; name: string; sortOrder: number; skills: Skill[] };
type UserSkill = {
  memberId: string; skillId: string; taughtBy: string | null;
  achievedAt: string;
  skill: { id: string; name: string; category: { id: string; name: string } };
};
type Member = {
  id: string; name: string; avatar?: string | null;
  licenses?: string[] | null;
};

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: "#9CA3AF",
  border: T.border, card: T.surface,
  primary: T.primary, primaryDk: T.primaryDk,
  green: "#10B981", greenBg: "#D1FAE5",
};

export default function SkillMatrixPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");

  useEffect(() => {
    (async () => {
      try {
        const [catRes, usRes, memRes] = await Promise.all([
          fetch("/api/kaitai/skill-categories"),
          fetch("/api/kaitai/user-skills"),
          fetch("/api/kaitai/members"),
        ]);
        const [catData, usData, memData] = await Promise.all([
          catRes.json(), usRes.json(), memRes.json(),
        ]);
        if (catData.categories) setCategories(catData.categories);
        if (usData.userSkills) setUserSkills(usData.userSkills);
        if (memData.members) setMembers(memData.members);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  // Build lookup: memberId+skillId → UserSkill
  const skillMap = useMemo(() => {
    const m = new Map<string, UserSkill>();
    for (const us of userSkills) m.set(`${us.memberId}:${us.skillId}`, us);
    return m;
  }, [userSkills]);

  // All skills flattened
  const allSkills = useMemo(() =>
    categories.flatMap(c => c.skills.map(s => ({ ...s, categoryId: c.id, categoryName: c.name }))),
    [categories],
  );

  // Filter skills by category
  const filteredSkills = useMemo(() =>
    selectedCat === "all" ? allSkills : allSkills.filter(s => s.categoryId === selectedCat),
    [allSkills, selectedCat],
  );

  // Filter members by search
  const filteredMembers = useMemo(() =>
    search ? members.filter(m => m.name.includes(search)) : members,
    [members, search],
  );

  // Stats
  const totalSkills = allSkills.length;
  const totalAchievements = userSkills.length;
  const completionRate = members.length > 0 && totalSkills > 0
    ? Math.round((totalAchievements / (members.length * totalSkills)) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ fontSize: 16, color: C.sub }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 120px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Link href="/kaitai" style={{ color: C.primary, display: "flex", alignItems: "center" }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>
            スキルマトリックス
          </h1>
          <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>全スタッフ × 全スキルの習得状況</p>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { icon: Users, label: "スタッフ数", value: members.length, color: C.primary },
          { icon: BookOpen, label: "スキル項目", value: totalSkills, color: "#3B82F6" },
          { icon: CheckCircle2, label: "習得率", value: `${completionRate}%`, color: C.green },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            background: C.card, borderRadius: 12, padding: "16px 12px",
            border: `1px solid ${C.border}`, textAlign: "center",
          }}>
            <Icon size={20} style={{ color, marginBottom: 4 }} />
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: C.sub }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="スタッフ名で検索..."
            style={{
              width: "100%", padding: "10px 10px 10px 36px", borderRadius: 10,
              border: `1px solid ${C.border}`, fontSize: 14, outline: "none",
              background: C.card,
            }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <Filter size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }} />
          <select
            value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
            style={{
              padding: "10px 12px 10px 32px", borderRadius: 10,
              border: `1px solid ${C.border}`, fontSize: 14, background: C.card,
              appearance: "none", cursor: "pointer", minWidth: 120,
            }}
          >
            <option value="all">全カテゴリ</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Matrix table */}
      {filteredSkills.length === 0 ? (
        <div style={{
          textAlign: "center", padding: 60, color: C.sub,
          background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
        }}>
          <BookOpen size={40} style={{ color: C.muted, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>スキル項目がまだ登録されていません</p>
          <p style={{ fontSize: 13, color: C.muted, margin: "4px 0 0" }}>管理者がスキル管理画面から登録してください</p>
        </div>
      ) : (
        <div style={{
          overflow: "auto", borderRadius: 12,
          border: `1px solid ${C.border}`, background: C.card,
        }}>
          <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
            <thead>
              <tr>
                <th style={{
                  position: "sticky", left: 0, zIndex: 10,
                  background: "#F3F4F6", padding: "12px 16px",
                  borderBottom: `2px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
                  fontSize: 13, fontWeight: 700, color: C.text,
                  textAlign: "left", minWidth: 120,
                }}>
                  スタッフ
                </th>
                {filteredSkills.map(skill => (
                  <th key={skill.id} style={{
                    background: "#F3F4F6", padding: "8px 6px",
                    borderBottom: `2px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
                    fontSize: 11, fontWeight: 600, color: C.sub,
                    textAlign: "center", minWidth: 60, maxWidth: 80,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{skill.categoryName}</div>
                    {skill.name}
                  </th>
                ))}
                <th style={{
                  background: "#F3F4F6", padding: "8px 12px",
                  borderBottom: `2px solid ${C.border}`,
                  fontSize: 12, fontWeight: 700, color: C.primary,
                  textAlign: "center", minWidth: 60,
                }}>
                  習得数
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, idx) => {
                const achieved = filteredSkills.filter(s => skillMap.has(`${member.id}:${s.id}`)).length;
                const pct = filteredSkills.length > 0 ? Math.round((achieved / filteredSkills.length) * 100) : 0;
                return (
                  <tr key={member.id} style={{ background: idx % 2 === 0 ? C.card : "#FAFAFA" }}>
                    <td style={{
                      position: "sticky", left: 0, zIndex: 5,
                      background: idx % 2 === 0 ? C.card : "#FAFAFA",
                      padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
                      borderRight: `1px solid ${C.border}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          width: 32, height: 32, borderRadius: 8,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: `${C.primary}12`, fontSize: 14,
                        }}>
                          {member.avatar ?? "👤"}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>
                          {member.name}
                        </span>
                      </div>
                    </td>
                    {filteredSkills.map(skill => {
                      const us = skillMap.get(`${member.id}:${skill.id}`);
                      return (
                        <td key={skill.id} style={{
                          textAlign: "center", padding: "6px 4px",
                          borderBottom: `1px solid ${C.border}`,
                          borderRight: `1px solid ${C.border}`,
                        }}>
                          {us ? (
                            <CheckCircle2 size={18} style={{ color: C.green }} />
                          ) : (
                            <span style={{ color: "#E5E7EB", fontSize: 16 }}>—</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{
                      textAlign: "center", padding: "8px 12px",
                      borderBottom: `1px solid ${C.border}`,
                    }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: pct >= 80 ? C.green : pct >= 50 ? C.primary : C.sub }}>
                        {achieved}/{filteredSkills.length}
                      </span>
                      <div style={{ fontSize: 11, color: C.muted }}>{pct}%</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, marginTop: 16,
        padding: "12px 16px", borderRadius: 10, background: "#F9FAFB",
        border: `1px solid ${C.border}`, fontSize: 13, color: C.sub,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <CheckCircle2 size={16} style={{ color: C.green }} />
          <span>習得済み</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#E5E7EB", fontSize: 16 }}>—</span>
          <span>未習得</span>
        </div>
      </div>
    </div>
  );
}
