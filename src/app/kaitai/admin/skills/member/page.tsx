"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Check, CheckCircle, Circle, User, Award,
} from "lucide-react";
import { T } from "../../../lib/design-tokens";

const ACCENT = "#9A3412";
const ACCENT_LT = "rgba(154,52,18,0.08)";
const ACCENT_MD = "rgba(154,52,18,0.15)";

type Skill = { id: string; name: string; sortOrder: number };
type Category = { id: string; name: string; sortOrder: number; skills: Skill[] };
type UserSkill = { skillId: string; taughtBy: string | null; achievedAt: string };
type Member = { id: string; name: string; avatar?: string | null; role?: string | null };

export default function SkillCheckSheetPage() {
  const searchParams = useSearchParams();
  const memberId = searchParams.get("id");

  const [categories, setCategories] = useState<Category[]>([]);
  const [userSkills, setUserSkills] = useState<Map<string, UserSkill>>(new Map());
  const [members, setMembers] = useState<Member[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  // Teacher selection state
  const [selectingSkillId, setSelectingSkillId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const [catRes, usRes, memRes] = await Promise.all([
        fetch("/api/kaitai/skill-categories"),
        fetch(`/api/kaitai/user-skills?memberId=${memberId}`),
        fetch("/api/kaitai/members"),
      ]);
      const catData = await catRes.json();
      const usData = await usRes.json();
      const memData = await memRes.json();

      if (catData.ok) setCategories(catData.categories);
      if (usData.ok) {
        const map = new Map<string, UserSkill>();
        for (const us of usData.userSkills) {
          map.set(us.skillId ?? us.skill?.id, { skillId: us.skillId ?? us.skill?.id, taughtBy: us.taughtBy, achievedAt: us.achievedAt });
        }
        setUserSkills(map);
      }
      if (memData.ok) {
        setMembers(memData.members);
        setMember(memData.members.find((m: Member) => m.id === memberId) ?? null);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [memberId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Record skill
  const recordSkill = async (skillId: string, taughtBy: string | null) => {
    await fetch("/api/kaitai/user-skills", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, skillId, taughtBy }),
    });
    setSelectingSkillId(null);
    fetchData();
  };

  // Remove skill
  const removeSkill = async (skillId: string) => {
    await fetch("/api/kaitai/user-skills", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, skillId }),
    });
    fetchData();
  };

  // Stats
  const totalSkills = categories.reduce((s, c) => s + c.skills.length, 0);
  const achievedSkills = userSkills.size;
  const pct = totalSkills > 0 ? Math.round((achievedSkills / totalSkills) * 100) : 0;

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.sub }}>読み込み中...</p></div>;
  }

  if (!memberId || !member) {
    return <div style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.muted }}>メンバーが見つかりません</p></div>;
  }

  return (
    <div style={{ padding: "24px 0", maxWidth: 900 }}>
      {/* Back link */}
      <Link href="/kaitai/admin/members" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: ACCENT, fontWeight: 600, textDecoration: "none", marginBottom: 16 }}>
        <ChevronLeft size={16} />
        従業員管理に戻る
      </Link>

      {/* Header with member info */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, padding: 20,
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 20,
      }}>
        <span style={{
          width: 56, height: 56, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
          background: ACCENT_LT, fontSize: 24,
        }}>{member.avatar ?? "👤"}</span>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>{member.name}</h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{member.role ?? "作業員"} のスキルチェックシート</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Award size={18} style={{ color: ACCENT }} />
            <span style={{ fontSize: 28, fontWeight: 800, color: ACCENT }}>{pct}%</span>
          </div>
          <p style={{ fontSize: 12, color: T.muted }}>一人前達成率</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        padding: "16px 20px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
            現在の習得スキル数：{achievedSkills} / {totalSkills}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: pct >= 100 ? "#10B981" : ACCENT }}>{pct}%</span>
        </div>
        <div style={{ height: 12, borderRadius: 6, background: T.bg, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 6, transition: "width 0.3s",
            width: `${pct}%`,
            background: pct >= 100 ? "#10B981" : pct >= 50 ? ACCENT : "#F59E0B",
          }} />
        </div>
      </div>

      {/* Categories + skills */}
      {categories.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ color: T.muted }}>スキルが登録されていません。管理者がスキル管理画面で登録してください。</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {categories.map(cat => {
            const catAchieved = cat.skills.filter(s => userSkills.has(s.id)).length;
            const catTotal = cat.skills.length;
            return (
              <div key={cat.id} style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden",
              }}>
                {/* Category header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "14px 20px",
                  background: "#F8FAFC", borderBottom: `1px solid ${T.border}`,
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.text, flex: 1 }}>{cat.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: catAchieved === catTotal && catTotal > 0 ? "#10B981" : T.muted }}>
                    {catAchieved}/{catTotal}
                  </span>
                </div>

                {/* Skills */}
                {cat.skills.map(skill => {
                  const achieved = userSkills.get(skill.id);
                  const isSelecting = selectingSkillId === skill.id;
                  const teacher = achieved?.taughtBy ? members.find(m => m.id === achieved.taughtBy) : null;

                  return (
                    <div key={skill.id}>
                      <div
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "14px 20px", minHeight: 56,
                          borderBottom: `1px solid ${T.border}`,
                          background: achieved ? "rgba(16,185,129,0.04)" : "transparent",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          if (achieved) {
                            if (confirm(`「${skill.name}」の習得記録を取り消しますか？`)) removeSkill(skill.id);
                          } else {
                            setSelectingSkillId(isSelecting ? null : skill.id);
                          }
                        }}
                      >
                        {/* Check icon — large touch target */}
                        <div style={{
                          width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                          background: achieved ? "#10B981" : T.bg,
                          border: achieved ? "none" : `2px solid ${T.border}`,
                          flexShrink: 0,
                        }}>
                          {achieved ? <Check size={22} style={{ color: "#fff" }} /> : <Circle size={20} style={{ color: T.muted }} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 15, fontWeight: 600,
                            color: achieved ? T.text : T.sub,
                            textDecoration: achieved ? "none" : "none",
                          }}>{skill.name}</p>
                          {achieved && teacher && (
                            <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                              指導者: {teacher.name} ・ {new Date(achieved.achievedAt).toLocaleDateString("ja-JP")}
                            </p>
                          )}
                          {achieved && !teacher && achieved.taughtBy && (
                            <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                              {new Date(achieved.achievedAt).toLocaleDateString("ja-JP")} 習得
                            </p>
                          )}
                        </div>

                        {!achieved && (
                          <span style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>タップして記録</span>
                        )}
                      </div>

                      {/* Teacher selection dropdown */}
                      {isSelecting && !achieved && (
                        <div style={{
                          padding: "12px 20px 12px 76px", background: ACCENT_LT,
                          borderBottom: `1px solid ${T.border}`,
                        }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 10 }}>
                            「{skill.name}」を教えた人を選択：
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {members.filter(m => m.id !== memberId).map(m => (
                              <button
                                key={m.id}
                                onClick={(e) => { e.stopPropagation(); recordSkill(skill.id, m.id); }}
                                style={{
                                  display: "flex", alignItems: "center", gap: 6,
                                  padding: "10px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                                  background: T.surface, border: `1px solid ${T.border}`,
                                  color: T.text, cursor: "pointer", minHeight: 44,
                                }}
                              >
                                <span style={{ fontSize: 16 }}>{m.avatar ?? "👤"}</span>
                                {m.name}
                              </button>
                            ))}
                            <button
                              onClick={(e) => { e.stopPropagation(); recordSkill(skill.id, null); }}
                              style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "10px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                                background: T.bg, border: `1px solid ${T.border}`,
                                color: T.muted, cursor: "pointer", minHeight: 44,
                              }}
                            >
                              <User size={16} />
                              自主習得
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
