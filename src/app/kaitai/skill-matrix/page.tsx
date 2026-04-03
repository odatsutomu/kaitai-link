"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Search, Filter, Users, BookOpen, X } from "lucide-react";
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
  hireDate?: string | null; licenses?: string[] | null;
};

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: "#9CA3AF",
  border: T.border, card: T.surface,
  primary: T.primary, primaryDk: T.primaryDk,
  green: "#10B981", greenBg: "#D1FAE5",
};

// ─── Teach Modal ─────────────────────────────────────────────────────────────
function TeachModal({ skill, member, members, currentTeacher, onClose, onSave, onRemove }: {
  skill: { id: string; name: string; categoryName: string };
  member: Member;
  members: Member[];
  currentTeacher: string | null;
  onClose: () => void;
  onSave: (teacherId: string | null) => void;
  onRemove: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(currentTeacher);
  const isExisting = !!currentTeacher || currentTeacher === null; // has a userSkill record
  const others = members.filter(m => m.id !== member.id);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)", padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: C.card, borderRadius: 16, width: "100%", maxWidth: 420,
        maxHeight: "80vh", overflow: "auto",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.primary, marginBottom: 4 }}>
              {skill.categoryName}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{skill.name}</div>
            <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
              {member.avatar ?? "👤"} {member.name} の指導者を選択
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 4, color: C.muted,
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Options */}
        <div style={{ padding: "12px 20px" }}>
          {/* Self-learned option */}
          <label style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", borderRadius: 10, cursor: "pointer",
            border: `2px solid ${selected === null ? C.primary : C.border}`,
            background: selected === null ? `${C.primary}08` : "transparent",
            marginBottom: 8,
          }}>
            <input type="radio" name="teacher" checked={selected === null}
              onChange={() => setSelected(null)}
              style={{ accentColor: C.primary }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>自主習得</span>
          </label>

          {/* Other members */}
          <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, margin: "12px 0 8px" }}>
            指導者を選択
          </div>
          {others.map(m => (
            <label key={m.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 16px", borderRadius: 10, cursor: "pointer",
              border: `2px solid ${selected === m.id ? C.primary : C.border}`,
              background: selected === m.id ? `${C.primary}08` : "transparent",
              marginBottom: 6,
            }}>
              <input type="radio" name="teacher" checked={selected === m.id}
                onChange={() => setSelected(m.id)}
                style={{ accentColor: C.primary }} />
              <span style={{ fontSize: 16 }}>{m.avatar ?? "👤"}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m.name}</span>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 20px", borderTop: `1px solid ${C.border}`,
          display: "flex", gap: 8,
        }}>
          <button onClick={onRemove} style={{
            flex: 0, padding: "10px 16px", borderRadius: 10,
            border: `1px solid #EF4444`, background: "transparent",
            fontSize: 14, fontWeight: 600, color: "#EF4444", cursor: "pointer",
            whiteSpace: "nowrap",
          }}>
            解除
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{
            padding: "10px 20px", borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.card,
            fontSize: 14, fontWeight: 600, color: C.sub, cursor: "pointer",
          }}>
            キャンセル
          </button>
          <button onClick={() => onSave(selected)} style={{
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: C.primary, color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SkillMatrixPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [modal, setModal] = useState<{
    skillId: string; skillName: string; categoryName: string;
    memberId: string; currentTeacher: string | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Build lookup: memberId:skillId → UserSkill
  const skillMap = useMemo(() => {
    const m = new Map<string, UserSkill>();
    for (const us of userSkills) m.set(`${us.memberId}:${us.skillId}`, us);
    return m;
  }, [userSkills]);

  // Member name lookup
  const memberNameMap = useMemo(() => {
    const m = new Map<string, Member>();
    for (const mem of members) m.set(mem.id, mem);
    return m;
  }, [members]);

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

  // Sort members by hireDate ascending (oldest first = leftmost), filter by search
  const sortedMembers = useMemo(() => {
    let list = [...members];
    if (search) list = list.filter(m => m.name.includes(search));
    list.sort((a, b) => {
      const da = a.hireDate ?? "9999";
      const db = b.hireDate ?? "9999";
      return da.localeCompare(db);
    });
    return list;
  }, [members, search]);

  // Stats
  const totalSkills = allSkills.length;
  const totalAchievements = userSkills.length;
  const completionRate = members.length > 0 && totalSkills > 0
    ? Math.round((totalAchievements / (members.length * totalSkills)) * 100) : 0;

  // Modal handlers
  const handleCellClick = (skillId: string, skillName: string, categoryName: string, memberId: string) => {
    const us = skillMap.get(`${memberId}:${skillId}`);
    setModal({
      skillId, skillName, categoryName, memberId,
      currentTeacher: us?.taughtBy ?? null,
    });
  };

  const handleSave = async (teacherId: string | null) => {
    if (!modal) return;
    setSaving(true);
    try {
      await fetch("/api/kaitai/user-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: modal.memberId,
          skillId: modal.skillId,
          taughtBy: teacherId,
        }),
      });
      await loadData();
    } catch { /* ignore */ }
    setSaving(false);
    setModal(null);
  };

  const handleRemove = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      await fetch("/api/kaitai/user-skills", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: modal.memberId,
          skillId: modal.skillId,
        }),
      });
      await loadData();
    } catch { /* ignore */ }
    setSaving(false);
    setModal(null);
  };

  const modalMember = modal ? memberNameMap.get(modal.memberId) : null;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ fontSize: 16, color: C.sub }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 120px" }}>
      {/* Modal */}
      {modal && modalMember && (
        <TeachModal
          skill={{ id: modal.skillId, name: modal.skillName, categoryName: modal.categoryName }}
          member={modalMember}
          members={members}
          currentTeacher={modal.currentTeacher}
          onClose={() => !saving && setModal(null)}
          onSave={handleSave}
          onRemove={handleRemove}
        />
      )}

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

      {/* Matrix table — rows=skills, columns=members */}
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
                {/* Top-left corner: "スキル / スタッフ" */}
                <th style={{
                  position: "sticky", left: 0, top: 0, zIndex: 20,
                  background: "#F3F4F6", padding: "10px 12px",
                  borderBottom: `2px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
                  fontSize: 11, fontWeight: 600, color: C.sub,
                  textAlign: "left", minWidth: 140,
                }}>
                  <div>スキル ＼ スタッフ</div>
                </th>
                {/* Column headers = members sorted by hireDate */}
                {sortedMembers.map(member => (
                  <th key={member.id} style={{
                    background: "#F3F4F6", padding: "8px 4px",
                    borderBottom: `2px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
                    fontSize: 11, fontWeight: 600, color: C.text,
                    textAlign: "center", minWidth: 72, maxWidth: 90,
                    verticalAlign: "bottom",
                  }}>
                    <div style={{ fontSize: 16, marginBottom: 2 }}>{member.avatar ?? "👤"}</div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: C.text,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {member.name.split(" ")[0]}
                    </div>
                    {member.hireDate && (
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>
                        {member.hireDate.slice(0, 7)}
                      </div>
                    )}
                  </th>
                ))}
                {/* Acquisition count column */}
                <th style={{
                  background: "#F3F4F6", padding: "8px 8px",
                  borderBottom: `2px solid ${C.border}`,
                  fontSize: 11, fontWeight: 700, color: C.primary,
                  textAlign: "center", minWidth: 50,
                }}>
                  習得数
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSkills.map((skill, idx) => {
                const achieved = sortedMembers.filter(m => skillMap.has(`${m.id}:${skill.id}`)).length;
                // Show category separator
                const prevSkill = idx > 0 ? filteredSkills[idx - 1] : null;
                const isNewCategory = !prevSkill || prevSkill.categoryId !== skill.categoryId;

                return (
                  <tr key={skill.id}>
                    {/* Skill name (row header) */}
                    <td style={{
                      position: "sticky", left: 0, zIndex: 5,
                      background: idx % 2 === 0 ? C.card : "#FAFAFA",
                      padding: "8px 12px", borderBottom: `1px solid ${C.border}`,
                      borderRight: `1px solid ${C.border}`,
                      borderTop: isNewCategory ? `2px solid ${C.primary}30` : undefined,
                    }}>
                      {isNewCategory && (
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: C.primary,
                          marginBottom: 2, textTransform: "uppercase",
                        }}>
                          {skill.categoryName}
                        </div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>
                        {skill.name}
                      </div>
                    </td>
                    {/* Cells: one per member */}
                    {sortedMembers.map(member => {
                      const us = skillMap.get(`${member.id}:${skill.id}`);
                      const teacher = us?.taughtBy ? memberNameMap.get(us.taughtBy) : null;
                      return (
                        <td key={member.id}
                          onClick={() => handleCellClick(skill.id, skill.name, skill.categoryName, member.id)}
                          style={{
                            textAlign: "center", padding: "4px 2px",
                            borderBottom: `1px solid ${C.border}`,
                            borderRight: `1px solid ${C.border}`,
                            borderTop: isNewCategory ? `2px solid ${C.primary}30` : undefined,
                            background: us
                              ? `${C.green}10`
                              : idx % 2 === 0 ? C.card : "#FAFAFA",
                            cursor: "pointer",
                            verticalAlign: "middle",
                          }}
                        >
                          {us ? (
                            <div>
                              <CheckCircle2 size={16} style={{ color: C.green }} />
                              {teacher ? (
                                <div style={{ fontSize: 9, fontWeight: 600, color: C.sub, marginTop: 1, lineHeight: 1.1 }}>
                                  {teacher.name.split(" ")[0]}
                                </div>
                              ) : (
                                <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>自主</div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "#E5E7EB", fontSize: 14 }}>—</span>
                          )}
                        </td>
                      );
                    })}
                    {/* Row total */}
                    <td style={{
                      textAlign: "center", padding: "6px 8px",
                      borderBottom: `1px solid ${C.border}`,
                      borderTop: isNewCategory ? `2px solid ${C.primary}30` : undefined,
                      fontSize: 14, fontWeight: 700,
                      color: achieved === sortedMembers.length ? C.green : achieved > 0 ? C.primary : C.muted,
                    }}>
                      {achieved}/{sortedMembers.length}
                    </td>
                  </tr>
                );
              })}
              {/* Bottom row: per-member totals */}
              <tr>
                <td style={{
                  position: "sticky", left: 0, zIndex: 5,
                  background: "#F3F4F6", padding: "10px 12px",
                  borderTop: `2px solid ${C.border}`,
                  fontSize: 13, fontWeight: 700, color: C.primary,
                }}>
                  習得数
                </td>
                {sortedMembers.map(member => {
                  const achieved = filteredSkills.filter(s => skillMap.has(`${member.id}:${s.id}`)).length;
                  const pct = filteredSkills.length > 0 ? Math.round((achieved / filteredSkills.length) * 100) : 0;
                  return (
                    <td key={member.id} style={{
                      textAlign: "center", padding: "8px 4px",
                      background: "#F3F4F6", borderTop: `2px solid ${C.border}`,
                    }}>
                      <div style={{
                        fontSize: 14, fontWeight: 700,
                        color: pct >= 80 ? C.green : pct >= 50 ? C.primary : C.sub,
                      }}>
                        {achieved}/{filteredSkills.length}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted }}>{pct}%</div>
                    </td>
                  );
                })}
                <td style={{ background: "#F3F4F6", borderTop: `2px solid ${C.border}` }} />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, marginTop: 16,
        padding: "12px 16px", borderRadius: 10, background: "#F9FAFB",
        border: `1px solid ${C.border}`, fontSize: 13, color: C.sub,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <CheckCircle2 size={16} style={{ color: C.green }} />
          <span>習得済み</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#E5E7EB", fontSize: 16 }}>—</span>
          <span>未習得</span>
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>
          セルをタップして指導者を登録できます
        </div>
      </div>
    </div>
  );
}
