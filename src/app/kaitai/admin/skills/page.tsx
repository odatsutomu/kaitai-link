"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Edit3, Check, X, FolderOpen, Wrench, GripVertical,
} from "lucide-react";
import { T } from "../../lib/design-tokens";

const ACCENT = "#9A3412";
const ACCENT_LT = "rgba(154,52,18,0.08)";
const ACCENT_MD = "rgba(154,52,18,0.15)";

type Skill = { id: string; name: string; sortOrder: number };
type Category = { id: string; name: string; sortOrder: number; skills: Skill[] };

export default function AdminSkillsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // New category input
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  // Edit category
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");

  // New skill input (keyed by categoryId)
  const [newSkillCatId, setNewSkillCatId] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState("");

  // Edit skill
  const [editSkillId, setEditSkillId] = useState<string | null>(null);
  const [editSkillName, setEditSkillName] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/kaitai/skill-categories");
      const data = await res.json();
      if (data.ok) setCategories(data.categories);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Category CRUD ──
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const res = await fetch("/api/kaitai/skill-categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      if (res.ok) { setNewCatName(""); fetchCategories(); }
    } catch { /* ignore */ } finally { setAddingCat(false); }
  };

  const updateCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    await fetch("/api/kaitai/skill-categories", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editCatName.trim() }),
    });
    setEditCatId(null);
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("このカテゴリと所属するスキルを削除しますか？")) return;
    await fetch("/api/kaitai/skill-categories", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchCategories();
  };

  // ── Skill CRUD ──
  const addSkill = async (categoryId: string) => {
    if (!newSkillName.trim()) return;
    await fetch("/api/kaitai/skills", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, name: newSkillName.trim() }),
    });
    setNewSkillCatId(null); setNewSkillName("");
    fetchCategories();
  };

  const updateSkill = async (id: string) => {
    if (!editSkillName.trim()) return;
    await fetch("/api/kaitai/skills", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editSkillName.trim() }),
    });
    setEditSkillId(null);
    fetchCategories();
  };

  const deleteSkill = async (id: string) => {
    if (!confirm("このスキルを削除しますか？")) return;
    await fetch("/api/kaitai/skills", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchCategories();
  };

  const inputStyle = {
    padding: "10px 14px", fontSize: 15, borderRadius: 10,
    border: `1px solid ${T.border}`, background: T.bg, color: T.text, outline: "none",
    flex: 1, minWidth: 0,
  } as const;

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}><p style={{ fontSize: 15, color: T.sub }}>読み込み中...</p></div>;
  }

  return (
    <div style={{ padding: "24px 0", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>スキル管理</h1>
        <p style={{ fontSize: 14, color: T.sub, marginTop: 4 }}>
          スキルカテゴリと個別スキル項目の作成・編集・削除
        </p>
      </div>

      {/* Add category */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 24, padding: 16,
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
      }}>
        <input
          style={inputStyle}
          placeholder="新しいカテゴリ名（例：基礎、重機、手工具）"
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addCategory()}
        />
        <button
          onClick={addCategory}
          disabled={addingCat || !newCatName.trim()}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
            borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
            background: newCatName.trim() ? ACCENT : T.bg,
            color: newCatName.trim() ? "#fff" : T.muted,
          }}
        >
          <Plus size={16} />
          カテゴリ追加
        </button>
      </div>

      {/* Category list */}
      {categories.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <FolderOpen size={40} style={{ color: T.muted, marginBottom: 12 }} />
          <p style={{ fontSize: 15, color: T.muted }}>カテゴリがありません。最初のカテゴリを作成してください。</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {categories.map(cat => (
            <div key={cat.id} style={{
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
              overflow: "hidden",
            }}>
              {/* Category header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "14px 20px",
                background: "#F8FAFC", borderBottom: `1px solid ${T.border}`,
              }}>
                <GripVertical size={16} style={{ color: T.muted }} />
                <FolderOpen size={18} style={{ color: ACCENT }} />
                {editCatId === cat.id ? (
                  <>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      value={editCatName}
                      onChange={e => setEditCatName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && updateCategory(cat.id)}
                      autoFocus
                    />
                    <button onClick={() => updateCategory(cat.id)} style={{ padding: 8, borderRadius: 8, background: "#10B981", color: "#fff", border: "none", cursor: "pointer" }}>
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditCatId(null)} style={{ padding: 8, borderRadius: 8, background: T.bg, color: T.sub, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 16, fontWeight: 700, color: T.text, flex: 1 }}>{cat.name}</span>
                    <span style={{ fontSize: 13, color: T.muted }}>{cat.skills.length}スキル</span>
                    <button onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name); }} style={{ padding: 8, borderRadius: 8, background: "transparent", color: T.sub, border: "none", cursor: "pointer" }}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} style={{ padding: 8, borderRadius: 8, background: "transparent", color: "#EF4444", border: "none", cursor: "pointer" }}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>

              {/* Skills list */}
              <div>
                {cat.skills.map(skill => (
                  <div key={skill.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 20px 12px 52px",
                    borderBottom: `1px solid ${T.border}`,
                  }}>
                    <Wrench size={14} style={{ color: T.muted, flexShrink: 0 }} />
                    {editSkillId === skill.id ? (
                      <>
                        <input
                          style={{ ...inputStyle, flex: 1 }}
                          value={editSkillName}
                          onChange={e => setEditSkillName(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && updateSkill(skill.id)}
                          autoFocus
                        />
                        <button onClick={() => updateSkill(skill.id)} style={{ padding: 8, borderRadius: 8, background: "#10B981", color: "#fff", border: "none", cursor: "pointer" }}>
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditSkillId(null)} style={{ padding: 8, borderRadius: 8, background: T.bg, color: T.sub, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: 14, color: T.text, flex: 1 }}>{skill.name}</span>
                        <button onClick={() => { setEditSkillId(skill.id); setEditSkillName(skill.name); }} style={{ padding: 8, borderRadius: 8, background: "transparent", color: T.sub, border: "none", cursor: "pointer" }}>
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => deleteSkill(skill.id)} style={{ padding: 8, borderRadius: 8, background: "transparent", color: "#EF4444", border: "none", cursor: "pointer" }}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {/* Add skill row */}
                {newSkillCatId === cat.id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px 12px 52px" }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="スキル名（例：ダンプ誘導、サンダー操作）"
                      value={newSkillName}
                      onChange={e => setNewSkillName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addSkill(cat.id)}
                      autoFocus
                    />
                    <button onClick={() => addSkill(cat.id)} style={{ padding: "8px 16px", borderRadius: 8, background: ACCENT, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                      追加
                    </button>
                    <button onClick={() => { setNewSkillCatId(null); setNewSkillName(""); }} style={{ padding: 8, borderRadius: 8, background: T.bg, color: T.sub, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setNewSkillCatId(cat.id); setNewSkillName(""); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, width: "100%",
                      padding: "12px 20px 12px 52px", background: "transparent", border: "none",
                      cursor: "pointer", fontSize: 13, color: ACCENT, fontWeight: 600,
                    }}
                  >
                    <Plus size={14} />
                    スキルを追加
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
