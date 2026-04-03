"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Search, Filter, Users, BookOpen, X, CheckSquare, Square } from "lucide-react";
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

// Cell key = "memberId:skillId"
type CellKey = string;
function cellKey(memberId: string, skillId: string): CellKey {
  return `${memberId}:${skillId}`;
}

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: "#9CA3AF",
  border: T.border, card: T.surface,
  primary: T.primary, primaryDk: T.primaryDk,
  green: "#10B981", greenBg: "#D1FAE5",
  blue: "#3B82F6",
};

// ─── Batch Teacher Modal ─────────────────────────────────────────────────────
function TeacherModal({ cells, members, onClose, onSave, onRemove }: {
  cells: { memberId: string; skillId: string; skillName: string }[];
  members: Member[];
  onClose: () => void;
  onSave: (teacherId: string | null) => void;
  onRemove: () => void;
}) {
  // Get all unique member IDs involved as learners
  const learnerIds = new Set(cells.map(c => c.memberId));
  // Exclude learners from teacher options
  const teacherOptions = members.filter(m => !learnerIds.has(m.id));

  const handleSelect = (teacherId: string | null) => {
    onSave(teacherId);
  };

  const isSingle = cells.length === 1;
  const title = isSingle
    ? cells[0].skillName
    : `${cells.length}件のスキルを一括登録`;

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
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{title}</div>
            <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
              指導者をタップすると即座に保存されます
            </div>
            {!isSingle && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                {cells.slice(0, 6).map((c, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 6,
                    background: `${C.primary}10`, color: C.primary, fontWeight: 600,
                  }}>
                    {c.skillName}
                  </span>
                ))}
                {cells.length > 6 && (
                  <span style={{ fontSize: 11, color: C.muted }}>他{cells.length - 6}件</span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 4, color: C.muted,
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Quick-tap teacher list */}
        <div style={{ padding: "12px 20px" }}>
          {/* Self-learned */}
          <button
            onClick={() => handleSelect(null)}
            style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "14px 16px", borderRadius: 10, cursor: "pointer",
              border: `1px solid ${C.border}`, background: C.card,
              marginBottom: 8, textAlign: "left",
              transition: "background 0.1s",
            }}
            onMouseDown={e => (e.currentTarget.style.background = `${C.primary}10`)}
            onMouseUp={e => (e.currentTarget.style.background = C.card)}
            onMouseLeave={e => (e.currentTarget.style.background = C.card)}
          >
            <span style={{ fontSize: 18 }}>📝</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>自主習得</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>タップで保存 →</span>
          </button>

          <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, margin: "12px 0 8px" }}>
            指導者を選択
          </div>
          {teacherOptions.map(m => (
            <button key={m.id}
              onClick={() => handleSelect(m.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                border: `1px solid ${C.border}`, background: C.card,
                marginBottom: 6, textAlign: "left",
                transition: "background 0.1s",
              }}
              onMouseDown={e => (e.currentTarget.style.background = `${C.primary}10`)}
              onMouseUp={e => (e.currentTarget.style.background = C.card)}
              onMouseLeave={e => (e.currentTarget.style.background = C.card)}
            >
              <span style={{ fontSize: 18 }}>{m.avatar ?? "👤"}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{m.name}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>→</span>
            </button>
          ))}
        </div>

        {/* Remove button */}
        <div style={{ padding: "12px 20px 20px", borderTop: `1px solid ${C.border}` }}>
          <button onClick={onRemove} style={{
            width: "100%", padding: "12px", borderRadius: 10,
            border: `1px solid #FCA5A5`, background: "rgba(239,68,68,0.04)",
            fontSize: 14, fontWeight: 600, color: "#EF4444", cursor: "pointer",
          }}>
            スキル記録を解除
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

  // Multi-select mode
  const [multiMode, setMultiMode] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<CellKey>>(new Set());
  const [showModal, setShowModal] = useState(false);

  // Track in-flight saves for optimistic UI
  const pendingSavesRef = useRef(new Set<CellKey>());

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

  // Skill name lookup
  const skillNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of allSkills) m.set(s.id, s.name);
    return m;
  }, [allSkills]);

  // Filter skills by category
  const filteredSkills = useMemo(() =>
    selectedCat === "all" ? allSkills : allSkills.filter(s => s.categoryId === selectedCat),
    [allSkills, selectedCat],
  );

  // Sort members by hireDate ascending
  const sortedMembers = useMemo(() => {
    let list = [...members];
    if (search) list = list.filter(m => m.name.includes(search));
    list.sort((a, b) => (a.hireDate ?? "9999").localeCompare(b.hireDate ?? "9999"));
    return list;
  }, [members, search]);

  // Stats
  const totalSkills = allSkills.length;
  const totalAchievements = userSkills.length;
  const completionRate = members.length > 0 && totalSkills > 0
    ? Math.round((totalAchievements / (members.length * totalSkills)) * 100) : 0;

  // ── Cell click handlers ──
  const toggleCell = (key: CellKey) => {
    setSelectedCells(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCellClick = (skillId: string, memberId: string) => {
    if (multiMode) {
      toggleCell(cellKey(memberId, skillId));
    } else {
      // Single mode: select just this cell and show modal immediately
      setSelectedCells(new Set([cellKey(memberId, skillId)]));
      setShowModal(true);
    }
  };

  // ── Optimistic save/remove ──
  const applyOptimistic = (cells: { memberId: string; skillId: string }[], teacherId: string | null) => {
    // Immediately update userSkills state
    setUserSkills(prev => {
      const next = [...prev];
      for (const c of cells) {
        const key = cellKey(c.memberId, c.skillId);
        const existingIdx = next.findIndex(us => `${us.memberId}:${us.skillId}` === key);
        const newEntry: UserSkill = {
          memberId: c.memberId, skillId: c.skillId,
          taughtBy: teacherId, achievedAt: new Date().toISOString(),
          skill: { id: c.skillId, name: skillNameMap.get(c.skillId) ?? "", category: { id: "", name: "" } },
        };
        if (existingIdx >= 0) next[existingIdx] = newEntry;
        else next.push(newEntry);
      }
      return next;
    });
  };

  const removeOptimistic = (cells: { memberId: string; skillId: string }[]) => {
    setUserSkills(prev =>
      prev.filter(us => !cells.some(c => us.memberId === c.memberId && us.skillId === c.skillId)),
    );
  };

  const handleSave = (teacherId: string | null) => {
    const cells = Array.from(selectedCells).map(k => {
      const [memberId, skillId] = k.split(":");
      return { memberId, skillId };
    });

    // Optimistic UI: update immediately
    applyOptimistic(cells, teacherId);
    setShowModal(false);
    setSelectedCells(new Set());
    if (multiMode) setMultiMode(false);

    // Fire-and-forget API calls in background
    for (const c of cells) {
      const key = cellKey(c.memberId, c.skillId);
      pendingSavesRef.current.add(key);
      fetch("/api/kaitai/user-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: c.memberId, skillId: c.skillId, taughtBy: teacherId }),
      }).finally(() => {
        pendingSavesRef.current.delete(key);
        // Refresh data after all saves complete
        if (pendingSavesRef.current.size === 0) loadData();
      });
    }
  };

  const handleRemove = () => {
    const cells = Array.from(selectedCells).map(k => {
      const [memberId, skillId] = k.split(":");
      return { memberId, skillId };
    });

    // Optimistic UI: remove immediately
    removeOptimistic(cells);
    setShowModal(false);
    setSelectedCells(new Set());
    if (multiMode) setMultiMode(false);

    // Fire-and-forget
    for (const c of cells) {
      fetch("/api/kaitai/user-skills", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: c.memberId, skillId: c.skillId }),
      }).finally(() => {
        if (pendingSavesRef.current.size === 0) loadData();
      });
    }
  };

  const openBatchModal = () => {
    if (selectedCells.size > 0) setShowModal(true);
  };

  const exitMultiMode = () => {
    setMultiMode(false);
    setSelectedCells(new Set());
  };

  // Build modal cell info
  const modalCells = useMemo(() =>
    Array.from(selectedCells).map(k => {
      const [memberId, skillId] = k.split(":");
      return { memberId, skillId, skillName: skillNameMap.get(skillId) ?? "" };
    }),
    [selectedCells, skillNameMap],
  );

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
      {showModal && modalCells.length > 0 && (
        <TeacherModal
          cells={modalCells}
          members={members}
          onClose={() => { setShowModal(false); if (!multiMode) setSelectedCells(new Set()); }}
          onSave={handleSave}
          onRemove={handleRemove}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Link href="/kaitai" style={{ color: C.primary, display: "flex", alignItems: "center" }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>
            スキルマトリックス
          </h1>
          <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>全スタッフ × 全スキルの習得状況</p>
        </div>
        {/* Multi-select toggle */}
        {!multiMode ? (
          <button onClick={() => setMultiMode(true)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.card,
            fontSize: 13, fontWeight: 700, color: C.primary, cursor: "pointer",
          }}>
            <CheckSquare size={16} />
            複数選択
          </button>
        ) : (
          <button onClick={exitMultiMode} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 10,
            border: `1px solid #EF4444`, background: "rgba(239,68,68,0.04)",
            fontSize: 13, fontWeight: 700, color: "#EF4444", cursor: "pointer",
          }}>
            <X size={16} />
            選択解除
          </button>
        )}
      </div>

      {/* Multi-select action bar */}
      {multiMode && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: 12, marginBottom: 16,
          background: `${C.blue}08`, border: `1px solid ${C.blue}30`,
        }}>
          <CheckSquare size={18} style={{ color: C.blue }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
            {selectedCells.size > 0
              ? `${selectedCells.size}件選択中`
              : "セルをタップして選択してください"}
          </span>
          <div style={{ flex: 1 }} />
          {selectedCells.size > 0 && (
            <button onClick={openBatchModal} style={{
              padding: "8px 20px", borderRadius: 10, border: "none",
              background: C.primary, color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              一括登録
            </button>
          )}
        </div>
      )}

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { icon: Users, label: "スタッフ数", value: members.length, color: C.primary },
          { icon: BookOpen, label: "スキル項目", value: totalSkills, color: C.blue },
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
                  position: "sticky", left: 0, top: 0, zIndex: 20,
                  background: "#F3F4F6", padding: "10px 12px",
                  borderBottom: `2px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
                  fontSize: 11, fontWeight: 600, color: C.sub,
                  textAlign: "left", minWidth: 140,
                }}>
                  スキル ＼ スタッフ
                </th>
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
                const achieved = sortedMembers.filter(m => skillMap.has(cellKey(m.id, skill.id))).length;
                const prevSkill = idx > 0 ? filteredSkills[idx - 1] : null;
                const isNewCategory = !prevSkill || prevSkill.categoryId !== skill.categoryId;

                return (
                  <tr key={skill.id}>
                    <td style={{
                      position: "sticky", left: 0, zIndex: 5,
                      background: idx % 2 === 0 ? C.card : "#FAFAFA",
                      padding: "8px 12px", borderBottom: `1px solid ${C.border}`,
                      borderRight: `1px solid ${C.border}`,
                      borderTop: isNewCategory ? `2px solid ${C.primary}30` : undefined,
                    }}>
                      {isNewCategory && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.primary, marginBottom: 2 }}>
                          {skill.categoryName}
                        </div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>
                        {skill.name}
                      </div>
                    </td>
                    {sortedMembers.map(member => {
                      const key = cellKey(member.id, skill.id);
                      const us = skillMap.get(key);
                      const teacher = us?.taughtBy ? memberNameMap.get(us.taughtBy) : null;
                      const isSelected = selectedCells.has(key);

                      return (
                        <td key={member.id}
                          onClick={() => handleCellClick(skill.id, member.id)}
                          style={{
                            textAlign: "center", padding: "4px 2px",
                            borderBottom: `1px solid ${C.border}`,
                            borderRight: `1px solid ${C.border}`,
                            borderTop: isNewCategory ? `2px solid ${C.primary}30` : undefined,
                            background: isSelected
                              ? `${C.blue}18`
                              : us ? `${C.green}10`
                              : idx % 2 === 0 ? C.card : "#FAFAFA",
                            cursor: "pointer",
                            verticalAlign: "middle",
                            outline: isSelected ? `2px solid ${C.blue}` : "none",
                            outlineOffset: -2,
                            transition: "background 0.1s, outline 0.1s",
                          }}
                        >
                          {multiMode && isSelected && (
                            <div style={{ position: "relative" }}>
                              <div style={{
                                position: "absolute", top: -2, right: -2,
                                width: 14, height: 14, borderRadius: 3,
                                background: C.blue, display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <CheckSquare size={10} style={{ color: "#fff" }} />
                              </div>
                            </div>
                          )}
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
              {/* Bottom totals row */}
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
                  const achieved = filteredSkills.filter(s => skillMap.has(cellKey(member.id, s.id))).length;
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
          セルをタップで指導者登録 ・ 「複数選択」で一括登録
        </div>
      </div>
    </div>
  );
}
