"use client";

import { useState, useEffect, useRef } from "react";
import {
  Car, ClipboardCheck, MapPin, AlertTriangle,
  CheckCircle2, Circle, X, Camera, Upload, ChevronLeft,
} from "lucide-react";
import PhotoMarkingOverlay from "@/components/photo-marking-overlay";

// ─── 型定義 ────────────────────────────────────────────────────────────────

type Status = "idle" | "traveling" | "arrived" | "working" | "done" | "reported";

interface WorkSession {
  id: string; staffName: string; siteId: string | null; siteName: string | null;
  date: string; status: Status;
  travelStartAt: string | null; arrivedAt: string | null;
  workStartAt: string | null;   workEndAt: string | null;
}

interface ChecklistItem    { id: string; label: string; required: boolean; sortOrder: number }
interface ChecklistTemplate{ id: string; name: string; items: ChecklistItem[] }
interface Member           { id: string; name: string }
interface Site             { id: string; name: string; address: string; status?: string }
interface Shift            { id: string; staffName: string; date: string; startTime: string; siteId: string | null; siteName: string | null }

// ─── 定数 ─────────────────────────────────────────────────────────────────

const ACCENT = "#0EA5E9";
const TODAY  = new Date().toISOString().slice(0, 10);

const IRREGULAR_CATEGORIES = [
  { value: "trouble",   label: "トラブル",   color: "#F59E0B" },
  { value: "accident",  label: "事故",       color: "#EF4444" },
  { value: "injury",    label: "怪我",       color: "#EF4444" },
  { value: "equipment", label: "機材不具合", color: "#8B5CF6" },
  { value: "other",     label: "その他",     color: "#6B7280" },
];

// ─── ヘルパー ──────────────────────────────────────────────────────────────

function timeStr(iso: string | null) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}
function elapsed(from: string | null, to?: string | null) {
  if (!from) return "";
  const mins = Math.floor(((to ? new Date(to) : new Date()).getTime() - new Date(from).getTime()) / 60000);
  return mins < 60 ? `${mins}分` : `${Math.floor(mins / 60)}時間${mins % 60}分`;
}

// ─── メインページ ──────────────────────────────────────────────────────────

export default function SeisouReportPage() {
  const [members,      setMembers]      = useState<Member[]>([]);
  const [sites,        setSites]        = useState<Site[]>([]);
  const [todayShifts,  setTodayShifts]  = useState<Shift[]>([]);
  const [templates,    setTemplates]    = useState<ChecklistTemplate[]>([]);

  const [selectedSite,   setSelectedSite]   = useState<{ id: string; name: string } | null>(null);
  const [checkedStaff,   setCheckedStaff]   = useState<string[]>([]);
  const [confirmedStaff, setConfirmedStaff] = useState<string[]>([]);
  const [sessions,       setSessions]       = useState<WorkSession[]>([]);
  const [confirming,     setConfirming]     = useState(false);
  const [acting,         setActing]         = useState(false);

  const [checklistOpen,  setChecklistOpen]  = useState(false);
  const [irregularOpen,  setIrregularOpen]  = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/seisou/members",              { credentials: "include" }).then(r => r.json()),
      fetch("/api/seisou/sites",                { credentials: "include" }).then(r => r.json()),
      fetch(`/api/seisou/shifts?date=${TODAY}`, { credentials: "include" }).then(r => r.json()),
      fetch("/api/seisou/checklist-templates",  { credentials: "include" }).then(r => r.json()),
    ]).then(([m, s, sh, t]) => {
      if (m.members)   setMembers(m.members);
      if (s.sites)     setSites(s.sites);
      if (sh.shifts)   setTodayShifts(sh.shifts);
      if (t.templates) setTemplates(t.templates);
    });
  }, []);

  function toggleStaff(name: string) {
    setCheckedStaff(p => p.includes(name) ? p.filter(n => n !== name) : [...p, name]);
  }

  async function handleConfirm() {
    if (!checkedStaff.length || !selectedSite) return;
    setConfirming(true);
    const results: WorkSession[] = [];
    for (const name of checkedStaff) {
      const r1   = await fetch(`/api/seisou/report/session?date=${TODAY}&staffName=${encodeURIComponent(name)}`, { credentials: "include" });
      const d1   = await r1.json();
      const existing = (d1.workSessions ?? []).find((s: WorkSession) => s.siteId === selectedSite.id);
      if (existing) { results.push(existing); continue; }
      const myShift = todayShifts.find(s => s.staffName === name && s.siteId === selectedSite.id);
      const r2   = await fetch("/api/seisou/report/session", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffName: name, siteId: selectedSite.id, siteName: selectedSite.name, shiftId: myShift?.id ?? null, date: TODAY }),
      });
      const d2   = await r2.json();
      if (d2.workSession) results.push(d2.workSession);
    }
    setSessions(results);
    setConfirmedStaff(checkedStaff);
    setConfirming(false);
  }

  // チーム全員のセッションを一括更新
  async function doActionAll(action: string) {
    if (!sessions.length) return;
    setActing(true);
    const updated = await Promise.all(
      sessions.map(async sess => {
        const res  = await fetch("/api/seisou/report/session", {
          method: "PATCH", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: sess.id, action }),
        });
        const data = await res.json();
        return data.workSession as WorkSession ?? sess;
      })
    );
    setSessions(updated);
    setActing(false);
  }

  function updateSessions(updated: WorkSession) {
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  // 代表セッション（チームの状態表示に使用）
  const lead = sessions[0] ?? null;

  const travelPhase: "none" | "going" | "done" =
    lead?.arrivedAt    ? "done" :
    lead?.travelStartAt ? "going" : "none";

  const workPhase: "none" | "working" | "done" =
    lead?.workEndAt   ? "done" :
    lead?.workStartAt ? "working" : "none";

  // 今日この現場のシフトスタッフ
  const siteShiftStaff = selectedSite
    ? [...new Set(todayShifts.filter(s => s.siteId === selectedSite.id).map(s => s.staffName))]
    : [];
  const allStaff = members.length > 0 ? members.map(m => m.name)
    : [...new Set(todayShifts.map(s => s.staffName))].sort();
  const otherStaff = allStaff.filter(n => !siteShiftStaff.includes(n));

  const siteShiftCount = todayShifts.reduce<Record<string, number>>((acc, s) => {
    if (s.siteId) acc[s.siteId] = (acc[s.siteId] ?? 0) + 1;
    return acc;
  }, {});

  // 全員報告済みか
  const allReported = sessions.length > 0 && sessions.every(s => s.status === "reported");

  return (
    <div style={{ padding: "16px", maxWidth: 480, margin: "0 auto" }}>

      {/* ── ヘッダー ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        {selectedSite && (
          <button
            onClick={() => { setSelectedSite(null); setCheckedStaff([]); setConfirmedStaff([]); setSessions([]); }}
            style={{ width: 34, height: 34, borderRadius: 10, border: "none", background: "#F3F4F6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <ChevronLeft size={18} style={{ color: "#3D3530" }} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#3D3530", margin: 0 }}>作業報告</h1>
          <p style={{ fontSize: 11, color: "#8C7A70", margin: "2px 0 0" }}>
            {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "long" })}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          STEP 1: 現場選択
      ══════════════════════════════════════════ */}
      {!selectedSite && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#8C7A70", margin: 0 }}>本日の現場を選択</p>
          {/* 今日シフトがある現場のみ表示 */}
          {sites.filter(s => (siteShiftCount[s.id] ?? 0) > 0).map(site => {
            const count = siteShiftCount[site.id] ?? 0;
            return (
              <button
                key={site.id}
                onClick={() => { setSelectedSite({ id: site.id, name: site.name }); setCheckedStaff([]); setConfirmedStaff([]); setSessions([]); }}
                style={{
                  width: "100%", padding: "16px", borderRadius: 20, textAlign: "left",
                  border: `2px solid ${ACCENT}`,
                  background: "#EFF6FF",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MapPin size={22} style={{ color: "#fff" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#3D3530", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{site.name}</p>
                  <p style={{ fontSize: 11, color: "#8C7A70", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {site.address}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, background: "#DBEAFE", padding: "4px 10px", borderRadius: 10, flexShrink: 0 }}>
                  {count}名
                </span>
              </button>
            );
          })}
          {sites.filter(s => (siteShiftCount[s.id] ?? 0) > 0).length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "#9CA3AF", fontSize: 14 }}>
              本日のシフトが登録されていません
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          STEP 2: スタッフ選択（チーム確定前）
      ══════════════════════════════════════════ */}
      {selectedSite && confirmedStaff.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 現場バッジ */}
          <SiteBadge name={selectedSite.name} />

          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #EEE8D5", padding: "18px 16px" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#3D3530", margin: "0 0 4px" }}>
              本日のチームメンバー
              <span style={{ fontSize: 11, fontWeight: 500, color: "#8C7A70", marginLeft: 8 }}>複数選択可</span>
            </p>

            {siteShiftStaff.length > 0 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, color: ACCENT, margin: "14px 0 8px" }}>本日シフトあり</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {siteShiftStaff.map(name => {
                    const on = checkedStaff.includes(name);
                    return (
                      <StaffCheckRow key={name} name={name} checked={on} badge="シフトあり" onToggle={() => toggleStaff(name)} />
                    );
                  })}
                </div>
              </>
            )}

            {otherStaff.length > 0 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#8C7A70", margin: "14px 0 8px" }}>
                  {siteShiftStaff.length > 0 ? "その他" : "スタッフ一覧"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {otherStaff.map(name => {
                    const on = checkedStaff.includes(name);
                    return <StaffCheckRow key={name} name={name} checked={on} onToggle={() => toggleStaff(name)} />;
                  })}
                </div>
              </>
            )}

            <button
              onClick={handleConfirm}
              disabled={checkedStaff.length === 0 || confirming}
              style={{
                marginTop: 18, width: "100%", height: 52, borderRadius: 14,
                background: checkedStaff.length === 0 || confirming ? "#D1D5DB" : ACCENT,
                border: "none", color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: checkedStaff.length === 0 || confirming ? "not-allowed" : "pointer",
              }}
            >
              {confirming ? "準備中…" : checkedStaff.length === 0 ? "メンバーを選択" : `${checkedStaff.length}名で作業開始 →`}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          STEP 3: チーム作業パネル
      ══════════════════════════════════════════ */}
      {selectedSite && confirmedStaff.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 現場バッジ */}
          <SiteBadge name={selectedSite.name} />

          {/* チームメンバー */}
          <div style={{
            background: "#fff", borderRadius: 20, border: "1px solid #EEE8D5",
            padding: "16px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#8C7A70", margin: "0 0 10px" }}>本日のチーム</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {confirmedStaff.map(name => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, background: "#EFF6FF", border: `1px solid ${ACCENT}33` }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{name[0]}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1E40AF" }}>{name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setConfirmedStaff([]); setSessions([]); }}
              style={{ marginTop: 12, fontSize: 11, color: "#8C7A70", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
            >
              メンバーを変更
            </button>
          </div>

          {/* ── 移動カード ── */}
          <ActionCard
            icon={<Car size={18} />}
            title="移動"
            phase={travelPhase}
            startAt={lead?.travelStartAt ?? null}
            endAt={lead?.arrivedAt ?? null}
            startLabel="移動開始"
            endLabel="現地到着"
            startAction="record_travel_start"
            endAction="record_arrived"
            clearStartAction="clear_travel_start"
            clearEndAction="clear_arrived"
            acting={acting}
            onAction={doActionAll}
          />

          {/* ── 作業カード ── */}
          <ActionCard
            icon={<ClipboardCheck size={18} />}
            title="作業"
            phase={workPhase}
            startAt={lead?.workStartAt ?? null}
            endAt={lead?.workEndAt ?? null}
            startLabel="作業開始"
            endLabel="作業終了"
            startAction="record_work_start"
            endAction="record_work_end"
            clearStartAction="clear_work_start"
            clearEndAction="clear_work_end"
            acting={acting}
            onAction={doActionAll}
          />

          {/* ── 報告 / イレギュラー ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {allReported ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px", borderRadius: 16, background: "#F0FDF4", border: "1px solid #86EFAC" }}>
                <CheckCircle2 size={22} style={{ color: "#22C55E", flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>チームの作業報告が完了しました</span>
              </div>
            ) : (
              <button
                onClick={() => setChecklistOpen(true)}
                style={{ width: "100%", height: 56, borderRadius: 16, background: ACCENT, border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(14,165,233,0.3)" }}
              >
                <ClipboardCheck size={20} />
                作業報告（チェックリスト提出）
              </button>
            )}
            <button
              onClick={() => setIrregularOpen(true)}
              style={{ width: "100%", height: 50, borderRadius: 16, border: "1.5px solid #E5E7EB", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}
            >
              <AlertTriangle size={18} />
              イレギュラー報告
            </button>
          </div>
        </div>
      )}

      {/* モーダル */}
      {checklistOpen && lead && (
        <ChecklistModal session={lead} templates={templates} onClose={() => setChecklistOpen(false)}
          onSubmit={updated => { updateSessions(updated); setChecklistOpen(false); }} />
      )}
      {irregularOpen && (
        <IrregularModal
          session={lead}
          staffName={confirmedStaff.join("・")}
          onClose={() => setIrregularOpen(false)}
        />
      )}
    </div>
  );
}

// ─── 共通 UI ──────────────────────────────────────────────────────────────

function SiteBadge({ name }: { name: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#EFF6FF", borderRadius: 16, border: `1.5px solid ${ACCENT}55` }}>
      <MapPin size={16} style={{ color: ACCENT, flexShrink: 0 }} />
      <span style={{ fontSize: 15, fontWeight: 800, color: "#1E40AF" }}>{name}</span>
    </div>
  );
}

function StaffCheckRow({ name, checked, badge, onToggle }: { name: string; checked: boolean; badge?: string; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      width: "100%", padding: "12px 14px", borderRadius: 14, textAlign: "left",
      border: `2px solid ${checked ? ACCENT : "#EEE8D5"}`,
      background: checked ? "#EFF6FF" : "#FAFAFA",
      cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: `2px solid ${checked ? ACCENT : "#D1D5DB"}`, background: checked ? ACCENT : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: checked ? ACCENT : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: checked ? "#fff" : "#6B7280", fontWeight: 700 }}>{name[0]}</span>
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#3D3530", flex: 1 }}>{name}</span>
      {badge && <span style={{ fontSize: 10, color: ACCENT, background: "#DBEAFE", padding: "2px 8px", borderRadius: 8, flexShrink: 0 }}>{badge}</span>}
    </button>
  );
}

// ─── 移動 / 作業カード ────────────────────────────────────────────────────

function ActionCard({
  icon, title, phase,
  startAt, endAt, startLabel, endLabel,
  startAction, endAction, clearStartAction, clearEndAction,
  acting, onAction,
}: {
  icon: React.ReactNode; title: string;
  phase: "none" | "going" | "working" | "done";
  startAt: string | null; endAt: string | null;
  startLabel: string; endLabel: string;
  startAction: string; endAction: string;
  clearStartAction: string; clearEndAction: string;
  acting: boolean;
  onAction: (a: string) => void;
}) {
  const phaseColor = phase === "done" ? "#6B7280" : phase !== "none" ? ACCENT : "#9CA3AF";
  const phaseBg    = phase === "done" ? "#F3F4F6" : phase !== "none" ? "#EFF6FF" : "#F3F4F6";

  return (
    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #EEE8D5", padding: "18px" }}>
      {/* タイトル行 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: phaseBg, color: phaseColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#3D3530", flex: 1 }}>{title}</span>
        {phase === "done" && startAt && endAt && (
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>所要 {elapsed(startAt, endAt)}</span>
        )}
        {phase !== "none" && phase !== "done" && startAt && (
          <span style={{ fontSize: 12, color: ACCENT, fontWeight: 700 }}>{timeStr(startAt)} 〜</span>
        )}
      </div>

      {/* 時刻バー */}
      {(startAt || endAt) && (
        <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: "1px solid #EEE8D5", marginBottom: 14 }}>
          <TimeCell label={startLabel} time={startAt} />
          <div style={{ width: 1, background: "#EEE8D5" }} />
          <TimeCell label={endLabel}   time={endAt} />
        </div>
      )}

      {/* ボタン */}
      {phase === "none" && (
        <BigBtn label={startLabel} loading={acting} onClick={() => onAction(startAction)} />
      )}
      {(phase === "going" || phase === "working") && (
        <div style={{ display: "flex", gap: 10 }}>
          <BigBtn label={endLabel} loading={acting} onClick={() => onAction(endAction)} style={{ flex: 1 }} />
          <button disabled={acting} onClick={() => onAction(clearStartAction)} style={{ height: 48, borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", padding: "0 16px", fontSize: 12, color: "#9CA3AF", cursor: acting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <X size={14} />取消
          </button>
        </div>
      )}
      {phase === "done" && (
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, height: 48, borderRadius: 12, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <CheckCircle2 size={18} style={{ color: "#22C55E" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>完了</span>
          </div>
          <button disabled={acting} onClick={() => onAction(clearEndAction)} style={{ height: 48, borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", padding: "0 16px", fontSize: 12, color: "#9CA3AF", cursor: acting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <X size={14} />修正
          </button>
        </div>
      )}
    </div>
  );
}

function TimeCell({ label, time }: { label: string; time: string | null }) {
  return (
    <div style={{ flex: 1, padding: "10px 14px" }}>
      <p style={{ margin: 0, fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{label}</p>
      <p style={{ margin: "3px 0 0", fontSize: 18, fontWeight: 800, color: time ? "#3D3530" : "#D1D5DB" }}>
        {timeStr(time)}
      </p>
    </div>
  );
}

function BigBtn({ label, loading, onClick, style: extStyle }: { label: string; loading: boolean; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        height: 48, borderRadius: 12, border: "none",
        background: loading ? "#D1D5DB" : ACCENT,
        color: "#fff", fontSize: 14, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer", width: "100%",
        ...extStyle,
      }}
    >
      {loading ? "記録中…" : label}
    </button>
  );
}

// ─── チェックリストモーダル ────────────────────────────────────────────────

function ChecklistModal({ session, templates, onClose, onSubmit }: {
  session: WorkSession; templates: ChecklistTemplate[];
  onClose: () => void; onSubmit: (u: WorkSession) => void;
}) {
  const tpl = templates[0];
  const [checks,     setChecks]     = useState<Record<string, boolean>>({});
  const [notes,      setNotes]      = useState("");
  const [images,     setImages]     = useState<string[]>([]);
  const [uploading,  setUploading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [markingBlob, setMarkingBlob] = useState<Blob | null>(null);

  function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > 1024 || h > 1024) { const r = Math.min(1024/w, 1024/h); w = Math.round(w*r); h = Math.round(h*r); }
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d")!.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob(b => b ? resolve(b) : reject(new Error("圧縮失敗")), "image/jpeg", 0.6);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("読み込み失敗")); };
      img.src = url;
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (fileRef.current) fileRef.current.value = "";
    try {
      const blob = await compressImage(file);
      setMarkingBlob(blob);
    } catch { alert("画像の読み込みに失敗しました"); }
  }

  async function handleMarkingComplete(resultBlob: Blob) {
    setMarkingBlob(null);
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const res = await fetch("/api/seisou/upload", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: ev.target?.result, siteId: session.siteId, reportType: "work_report", uploadedBy: session.staffName }),
      });
      const d = await res.json();
      if (d.image) setImages(p => [...p, d.image.url]);
      setUploading(false);
    };
    reader.readAsDataURL(resultBlob);
  }

  async function submit() {
    setError("");
    if (tpl) for (const item of tpl.items) {
      if (item.required && !checks[item.id]) { setError(`「${item.label}」は必須です`); return; }
    }
    setSubmitting(true);
    const res = await fetch("/api/seisou/report/checklist", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id,
        responses: tpl?.items.map(i => ({ itemId: i.id, checked: checks[i.id] ?? false, label: i.label, required: i.required })) ?? [],
        notes, imageUrls: images,
      }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "送信に失敗しました"); setSubmitting(false); return; }
    onSubmit(d.workSession);
  }

  return (
    <Modal title="作業報告チェックリスト" onClose={onClose}>
      {!tpl ? <p style={{ color: "#8C7A70", fontSize: 13 }}>テンプレートが未登録です</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {tpl.items.map(item => (
            <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, border: `1.5px solid ${checks[item.id] ? "#22C55E" : "#EEE8D5"}`, background: checks[item.id] ? "#F0FDF4" : "#fff", cursor: "pointer" }}>
              {checks[item.id] ? <CheckCircle2 size={20} style={{ color: "#22C55E", flexShrink: 0 }} /> : <Circle size={20} style={{ color: "#D1D5DB", flexShrink: 0 }} />}
              <span style={{ fontSize: 13, fontWeight: 600, color: "#3D3530", flex: 1 }}>
                {item.label}{item.required && <span style={{ color: "#EF4444", marginLeft: 4 }}>*</span>}
              </span>
              <input type="checkbox" checked={checks[item.id] ?? false} onChange={e => setChecks(c => ({ ...c, [item.id]: e.target.checked }))} style={{ display: "none" }} />
            </label>
          ))}
        </div>
      )}
      <label style={{ display: "block", marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#3D3530", display: "block", marginBottom: 6 }}>備考・特記事項</span>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="作業内容・気になった点など" style={{ width: "100%", borderRadius: 14, border: "1.5px solid #EEE8D5", padding: "12px", fontSize: 13, resize: "none", outline: "none", background: "#FFFBF0", boxSizing: "border-box" }} />
      </label>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#3D3530", display: "block", marginBottom: 8 }}>作業完了写真</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {images.map((url, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={url} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10 }} />
              <button onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#EF4444", border: "none", color: "#fff", cursor: "pointer", fontSize: 11 }}>×</button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ width: 80, height: 80, borderRadius: 10, border: "2px dashed #D1D5DB", background: "#F9FAFB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}>
            {uploading ? <Upload size={20} style={{ color: "#8C7A70" }} /> : <Camera size={20} style={{ color: "#8C7A70" }} />}
            <span style={{ fontSize: 10, color: "#8C7A70" }}>{uploading ? "送信中" : "追加"}</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelect} />
        </div>
      </div>
      {error && <p style={{ fontSize: 13, color: "#EF4444", marginBottom: 12 }}>{error}</p>}
      <button onClick={submit} disabled={submitting} style={{ width: "100%", height: 52, borderRadius: 26, background: submitting ? "#D1D5DB" : ACCENT, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}>
        {submitting ? "送信中…" : "報告を提出する"}
      </button>
      {markingBlob && (
        <PhotoMarkingOverlay
          imageBlob={markingBlob}
          onComplete={handleMarkingComplete}
          onCancel={() => setMarkingBlob(null)}
          colors={{ primary: ACCENT }}
        />
      )}
    </Modal>
  );
}

// ─── イレギュラー報告モーダル ──────────────────────────────────────────────

function IrregularModal({ session, staffName, onClose }: { session: WorkSession | null; staffName: string; onClose: () => void }) {
  const [category,    setCategory]    = useState("trouble");
  const [description, setDescription] = useState("");
  const [severity,    setSeverity]    = useState("low");
  const [images,      setImages]      = useState<string[]>([]);
  const [uploading,   setUploading]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);
  const [error,       setError]       = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [markingBlob, setMarkingBlob] = useState<Blob | null>(null);

  function compressImg(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > 1024 || h > 1024) { const r = Math.min(1024/w, 1024/h); w = Math.round(w*r); h = Math.round(h*r); }
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d")!.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob(b => b ? resolve(b) : reject(new Error("圧縮失敗")), "image/jpeg", 0.6);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("読み込み失敗")); };
      img.src = url;
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (fileRef.current) fileRef.current.value = "";
    try {
      const blob = await compressImg(file);
      setMarkingBlob(blob);
    } catch { alert("画像の読み込みに失敗しました"); }
  }

  async function handleMarkingComplete(resultBlob: Blob) {
    setMarkingBlob(null);
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const res = await fetch("/api/seisou/upload", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl: ev.target?.result, siteId: session?.siteId, reportType: "irregular", uploadedBy: staffName }) });
      const d = await res.json();
      if (d.image) setImages(p => [...p, d.image.url]);
      setUploading(false);
    };
    reader.readAsDataURL(resultBlob);
  }

  async function submit() {
    if (!description.trim()) { setError("状況の説明を入力してください"); return; }
    setSubmitting(true);
    const res = await fetch("/api/seisou/report/irregular", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session?.id ?? null, siteId: session?.siteId ?? null, siteName: session?.siteName ?? null, staffName, category, description, severity, imageUrls: images }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "送信に失敗しました"); setSubmitting(false); return; }
    setDone(true);
    setTimeout(onClose, 1500);
  }

  return (
    <Modal title="イレギュラー報告" onClose={onClose}>
      {done ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <CheckCircle2 size={40} style={{ color: "#22C55E", margin: "0 auto 12px" }} />
          <p style={{ fontWeight: 700, color: "#22C55E" }}>報告を送信しました</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3D3530", display: "block", marginBottom: 8 }}>種別 *</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {IRREGULAR_CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)} style={{ padding: "8px 14px", borderRadius: 99, border: `1.5px solid ${category === c.value ? c.color : "#EEE8D5"}`, background: category === c.value ? c.color + "18" : "#fff", fontSize: 13, fontWeight: 600, color: category === c.value ? c.color : "#8C7A70", cursor: "pointer" }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3D3530", display: "block", marginBottom: 8 }}>緊急度</span>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ value: "low", label: "低", color: "#22C55E" }, { value: "medium", label: "中", color: "#F59E0B" }, { value: "high", label: "高", color: "#EF4444" }].map(s => (
                <button key={s.value} onClick={() => setSeverity(s.value)} style={{ flex: 1, height: 44, borderRadius: 12, border: `1.5px solid ${severity === s.value ? s.color : "#EEE8D5"}`, background: severity === s.value ? s.color + "18" : "#fff", fontSize: 14, fontWeight: 700, color: severity === s.value ? s.color : "#8C7A70", cursor: "pointer" }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3D3530", display: "block", marginBottom: 6 }}>状況の説明 *</span>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="発生した状況・場所・対応内容を記述してください" style={{ width: "100%", borderRadius: 14, border: "1.5px solid #EEE8D5", padding: "12px", fontSize: 13, resize: "none", outline: "none", background: "#FFFBF0", boxSizing: "border-box" }} />
          </label>
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3D3530", display: "block", marginBottom: 8 }}>現場写真（任意）</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {images.map((url, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={url} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10 }} />
                  <button onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#EF4444", border: "none", color: "#fff", cursor: "pointer", fontSize: 11 }}>×</button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ width: 80, height: 80, borderRadius: 10, border: "2px dashed #FCA5A5", background: "#FEF2F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}>
                <Camera size={20} style={{ color: "#EF4444" }} />
                <span style={{ fontSize: 10, color: "#EF4444" }}>{uploading ? "送信中" : "追加"}</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelect} />
            </div>
          </div>
          {error && <p style={{ fontSize: 13, color: "#EF4444", marginBottom: 12 }}>{error}</p>}
          <button onClick={submit} disabled={submitting} style={{ width: "100%", height: 52, borderRadius: 26, background: submitting ? "#D1D5DB" : "#EF4444", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}>
            {submitting ? "送信中…" : "イレギュラーを報告する"}
          </button>
          {markingBlob && (
            <PhotoMarkingOverlay
              imageBlob={markingBlob}
              onComplete={handleMarkingComplete}
              onCancel={() => setMarkingBlob(null)}
              colors={{ primary: "#EF4444" }}
            />
          )}
        </>
      )}
    </Modal>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#FFFBF0", borderRadius: "28px 28px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#3D3530", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "#EEE8D5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} style={{ color: "#3D3530" }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
