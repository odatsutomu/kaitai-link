"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Users, Truck,
  AlertTriangle, GanttChart, Building2, Clock, CheckCircle,
  Plus, X, Check,
} from "lucide-react";
import { T } from "../../lib/design-tokens";

// ─── Types ────────────────────────────────────────────────────────────────────

type SiteRow = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  structureType: string;
};

type MemberRow = {
  id: string;
  name: string;
  role: string;
  licenses: string[];
  avatar: string;
};

type EquipmentRow = {
  id: string;
  name: string;
  category: string;
  type: string;
  status: string;
};

type Assignment = {
  id: string;
  resourceType: "member" | "equipment";
  resourceId: string;
  siteId: string;
  startDate: string;
  endDate: string;
  confirmed: boolean;
};

// Modal can be opened with pre-filled values
type ModalPreset = {
  startDate?: string;
  endDate?: string;
  resourceType?: "member" | "equipment";
  resourceId?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

const STATUS_COLOR: Record<string, string> = {
  "施工中": T.primary,
  "着工前": "#3B82F6",
  "完工": "#10B981",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function rangeOverlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

function dateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

let _assignId = 0;
function nextId() { return `a-${Date.now()}-${_assignId++}`; }

function makeDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── Generate demo assignments ────────────────────────────────────────────────

function generateAssignments(sites: SiteRow[], members: MemberRow[], equipment: EquipmentRow[]): Assignment[] {
  const assignments: Assignment[] = [];
  let idCounter = 0;
  const activeSites = sites.filter(s => s.status === "施工中" || s.status === "着工前");
  activeSites.forEach((site, siteIdx) => {
    if (!site.startDate || !site.endDate) return;
    const memberCount = Math.min(members.length, 2 + (siteIdx % 3));
    for (let i = 0; i < memberCount; i++) {
      const mIdx = (siteIdx * 2 + i) % members.length;
      assignments.push({ id: `seed-${idCounter++}`, resourceType: "member", resourceId: members[mIdx].id, siteId: site.id, startDate: site.startDate, endDate: site.endDate, confirmed: site.status === "施工中" });
    }
    const eqCount = Math.min(equipment.length, 1 + (siteIdx % 2));
    for (let i = 0; i < eqCount; i++) {
      const eIdx = (siteIdx + i) % equipment.length;
      assignments.push({ id: `seed-${idCounter++}`, resourceType: "equipment", resourceId: equipment[eIdx].id, siteId: site.id, startDate: site.startDate, endDate: site.endDate, confirmed: site.status === "施工中" });
    }
  });
  return assignments;
}

// ─── Conflict detection ───────────────────────────────────────────────────────

type Conflict = { resourceId: string; resourceType: "member" | "equipment"; resourceName: string; assignments: Assignment[]; overlapStart: string; overlapEnd: string };

function detectConflicts(assignments: Assignment[], members: MemberRow[], equipment: EquipmentRow[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const byResource = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const key = `${a.resourceType}:${a.resourceId}`;
    if (!byResource.has(key)) byResource.set(key, []);
    byResource.get(key)!.push(a);
  }
  byResource.forEach((group, key) => {
    if (group.length < 2) return;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (rangeOverlaps(group[i].startDate, group[i].endDate, group[j].startDate, group[j].endDate)) {
          const [type, id] = key.split(":");
          const name = type === "member" ? members.find(m => m.id === id)?.name ?? "不明" : equipment.find(e => e.id === id)?.name ?? "不明";
          const oS = group[i].startDate > group[j].startDate ? group[i].startDate : group[j].startDate;
          const oE = group[i].endDate < group[j].endDate ? group[i].endDate : group[j].endDate;
          conflicts.push({ resourceId: id, resourceType: type as "member" | "equipment", resourceName: name, assignments: [group[i], group[j]], overlapStart: oS, overlapEnd: oE });
        }
      }
    }
  });
  return conflicts;
}

// ─── Assignment Input Modal ───────────────────────────────────────────────────

function AssignmentModal({
  sites, members, equipment, onSave, onClose, preset,
}: {
  sites: SiteRow[];
  members: MemberRow[];
  equipment: EquipmentRow[];
  onSave: (assignments: Assignment[]) => void;
  onClose: () => void;
  preset?: ModalPreset;
}) {
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [startDate, setStartDate] = useState(preset?.startDate ?? "");
  const [endDate, setEndDate] = useState(preset?.endDate ?? "");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    () => preset?.resourceType === "member" && preset.resourceId ? new Set([preset.resourceId]) : new Set()
  );
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(
    () => preset?.resourceType === "equipment" && preset.resourceId ? new Set([preset.resourceId]) : new Set()
  );
  const [confirmed, setConfirmed] = useState(true);

  useEffect(() => {
    if (!selectedSiteId) return;
    const site = sites.find(s => s.id === selectedSiteId);
    if (site) {
      if (site.startDate && !startDate) setStartDate(site.startDate);
      if (site.endDate && !endDate) setEndDate(site.endDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteId]);

  const activeSites = sites.filter(s => s.status !== "完工");

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const toggleEquipment = (id: string) => {
    setSelectedEquipment(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const selectAllMembers = () => {
    setSelectedMembers(prev => prev.size === members.length ? new Set() : new Set(members.map(m => m.id)));
  };

  const canSave = selectedSiteId && startDate && endDate && (selectedMembers.size > 0 || selectedEquipment.size > 0);

  const handleSave = () => {
    if (!canSave) return;
    const out: Assignment[] = [];
    selectedMembers.forEach(mid => out.push({ id: nextId(), resourceType: "member", resourceId: mid, siteId: selectedSiteId, startDate, endDate, confirmed }));
    selectedEquipment.forEach(eid => out.push({ id: nextId(), resourceType: "equipment", resourceId: eid, siteId: selectedSiteId, startDate, endDate, confirmed }));
    onSave(out);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" style={{ background: "#fff", border: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>配置を追加</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} style={{ color: T.sub }} /></button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-5">
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: T.text, display: "block", marginBottom: 6 }}>現場を選択 <span style={{ color: "#EF4444" }}>*</span></label>
            <select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} className="w-full rounded-xl outline-none" style={{ height: 48, fontSize: 14, padding: "0 14px", border: `1px solid ${T.border}`, color: T.text, background: "#fff" }}>
              <option value="">-- 現場を選択 --</option>
              {activeSites.map(s => <option key={s.id} value={s.id}>{s.status === "施工中" ? "🔶" : "🔷"} {s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: T.text, display: "block", marginBottom: 6 }}>開始日 <span style={{ color: "#EF4444" }}>*</span></label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-xl outline-none" style={{ height: 48, fontSize: 14, padding: "0 14px", border: `1px solid ${T.border}`, color: T.text }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: T.text, display: "block", marginBottom: 6 }}>終了日 <span style={{ color: "#EF4444" }}>*</span></label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-xl outline-none" style={{ height: 48, fontSize: 14, padding: "0 14px", border: `1px solid ${T.border}`, color: T.text }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setConfirmed(v => !v)} className="flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, background: confirmed ? T.primary : "#fff", border: confirmed ? `2px solid ${T.primary}` : `2px solid ${T.border}` }}>
              {confirmed && <Check size={16} color="#fff" strokeWidth={3} />}
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>確定済みとして登録</span>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                <Users size={14} style={{ display: "inline", marginRight: 4, verticalAlign: "-2px" }} />
                作業員を選択{selectedMembers.size > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: T.primary, marginLeft: 6 }}>{selectedMembers.size}名選択中</span>}
              </label>
              <button onClick={selectAllMembers} className="text-xs font-bold px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: T.primary }}>{selectedMembers.size === members.length ? "全解除" : "全選択"}</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5" style={{ maxHeight: 200, overflowY: "auto" }}>
              {members.map(m => { const sel = selectedMembers.has(m.id); return (
                <button key={m.id} onClick={() => toggleMember(m.id)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors" style={{ background: sel ? T.primaryLt : "#F8FAFC", border: sel ? `1.5px solid ${T.primaryMd}` : "1.5px solid transparent" }}>
                  <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 28, height: 28, fontSize: 12, fontWeight: 800, background: sel ? T.primary : T.border, color: sel ? "#fff" : T.sub }}>{sel ? <Check size={14} /> : m.avatar}</div>
                  <div className="min-w-0"><span className="block truncate" style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{m.name}</span><span className="block truncate" style={{ fontSize: 11, color: T.muted }}>{m.role}</span></div>
                </button>
              ); })}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: T.text, display: "block", marginBottom: 6 }}>
              <Truck size={14} style={{ display: "inline", marginRight: 4, verticalAlign: "-2px" }} />
              機材を選択{selectedEquipment.size > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: T.primary, marginLeft: 6 }}>{selectedEquipment.size}台選択中</span>}
            </label>
            <div className="grid grid-cols-2 gap-1.5" style={{ maxHeight: 160, overflowY: "auto" }}>
              {equipment.map(e => { const sel = selectedEquipment.has(e.id); return (
                <button key={e.id} onClick={() => toggleEquipment(e.id)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors" style={{ background: sel ? T.primaryLt : "#F8FAFC", border: sel ? `1.5px solid ${T.primaryMd}` : "1.5px solid transparent" }}>
                  <div className="flex-shrink-0 flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, background: sel ? T.primary : T.border, color: sel ? "#fff" : T.sub }}>{sel ? <Check size={14} /> : <Truck size={14} />}</div>
                  <div className="min-w-0"><span className="block truncate" style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{e.name}</span><span className="block truncate" style={{ fontSize: 11, color: T.muted }}>{e.category}</span></div>
                </button>
              ); })}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${T.border}` }}>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ border: `1px solid ${T.border}`, color: T.sub }}>キャンセル</button>
          <button onClick={handleSave} disabled={!canSave} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors" style={{ background: canSave ? T.primary : T.border, color: canSave ? "#fff" : T.muted }}>
            <Check size={16} />配置を登録（{selectedMembers.size + selectedEquipment.size}件）
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Site Picker (for timeline click) ──────────────────────────────────

function InlineSitePicker({
  sites, position, onSelect, onClose,
}: {
  sites: SiteRow[];
  position: { top: number; left: number };
  onSelect: (siteId: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const activeSites = sites.filter(s => s.status !== "完工");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 rounded-xl py-2 min-w-[200px]"
      style={{
        top: position.top,
        left: position.left,
        background: "#fff",
        border: `1px solid ${T.border}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      <p className="px-3 pb-1" style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>現場を選択</p>
      {activeSites.map(s => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLOR[s.status] ?? T.muted }} />
          <span className="truncate" style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.name}</span>
        </button>
      ))}
    </div>
  );
}

// ─── GanttTimelineView ────────────────────────────────────────────────────────

function GanttTimelineView({
  year, month, sites, members, equipment, assignments, conflicts,
  onDeleteAssignment, onAddAssignment,
}: {
  year: number;
  month: number;
  sites: SiteRow[];
  members: MemberRow[];
  equipment: EquipmentRow[];
  assignments: Assignment[];
  conflicts: Conflict[];
  onDeleteAssignment: (id: string) => void;
  onAddAssignment: (a: Assignment) => void;
}) {
  const days = daysInMonth(year, month);
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
  const today = fmtDate(new Date());

  const conflictResourceIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of conflicts) set.add(c.resourceId);
    return set;
  }, [conflicts]);

  const [tab, setTab] = useState<"member" | "equipment">("member");

  // Click-to-assign state
  const [selecting, setSelecting] = useState<{ resourceId: string; startDay: number } | null>(null);
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  const [sitePicker, setSitePicker] = useState<{ resourceId: string; startDay: number; endDay: number; top: number; left: number } | null>(null);

  const resources = tab === "member"
    ? members.map(m => ({ id: m.id, name: m.name, sub: m.role, avatar: m.avatar }))
    : equipment.map(e => ({ id: e.id, name: e.name, sub: `${e.category} / ${e.type}`, avatar: "" }));

  const resourceAssignments = useCallback(
    (resourceId: string) =>
      assignments.filter(a => a.resourceType === tab && a.resourceId === resourceId && rangeOverlaps(a.startDate, a.endDate, monthStart, monthEnd)),
    [assignments, tab, monthStart, monthEnd],
  );

  const handleCellClick = (resourceId: string, day: number, e: React.MouseEvent) => {
    if (sitePicker) { setSitePicker(null); return; }

    if (!selecting) {
      // Start selection
      setSelecting({ resourceId, startDay: day });
    } else if (selecting.resourceId === resourceId) {
      // End selection — show site picker
      const startDay = Math.min(selecting.startDay, day);
      const endDay = Math.max(selecting.startDay, day);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const container = (e.target as HTMLElement).closest('.overflow-x-auto');
      const containerRect = container?.getBoundingClientRect();
      setSitePicker({
        resourceId,
        startDay,
        endDay,
        top: rect.bottom - (containerRect?.top ?? 0) + 4,
        left: rect.left - (containerRect?.left ?? 0),
      });
      setSelecting(null);
    } else {
      // Different resource — restart
      setSelecting({ resourceId, startDay: day });
    }
  };

  const handleSiteSelect = (siteId: string) => {
    if (!sitePicker) return;
    const startDate = makeDateStr(year, month, sitePicker.startDay);
    const endDate = makeDateStr(year, month, sitePicker.endDay);
    onAddAssignment({
      id: nextId(),
      resourceType: tab,
      resourceId: sitePicker.resourceId,
      siteId,
      startDate,
      endDate,
      confirmed: true,
    });
    setSitePicker(null);
  };

  const getSelectionRange = (resourceId: string) => {
    if (!selecting || selecting.resourceId !== resourceId) return null;
    if (hoverDay === null) return { start: selecting.startDay, end: selecting.startDay };
    return {
      start: Math.min(selecting.startDay, hoverDay),
      end: Math.max(selecting.startDay, hoverDay),
    };
  };

  const COL_W = 36;
  const LABEL_W = 160;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setTab("member")} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors" style={{ background: tab === "member" ? T.primary : "#F1F5F9", color: tab === "member" ? "#fff" : T.sub, border: `1px solid ${tab === "member" ? T.primary : T.border}` }}>
          <Users size={14} />作業員（{members.length}）
        </button>
        <button onClick={() => setTab("equipment")} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors" style={{ background: tab === "equipment" ? T.primary : "#F1F5F9", color: tab === "equipment" ? "#fff" : T.sub, border: `1px solid ${tab === "equipment" ? T.primary : T.border}` }}>
          <Truck size={14} />機材（{equipment.length}）
        </button>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}>
          <span style={{ fontSize: 12, color: "#92400E" }}>💡 空きセルをクリックして日付範囲を選択 → 現場を割り当て</span>
        </div>
      </div>

      <div className="overflow-x-auto relative" style={{ border: `1px solid ${T.border}`, borderRadius: T.cardRadius }}>
        <div style={{ minWidth: LABEL_W + COL_W * days }}>
          {/* Header */}
          <div className="flex" style={{ borderBottom: `1px solid ${T.border}`, background: "#F8FAFC" }}>
            <div className="flex-shrink-0 flex items-center px-3" style={{ width: LABEL_W, borderRight: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, color: T.sub }}>
              {tab === "member" ? "作業員" : "機材"}
            </div>
            {Array.from({ length: days }, (_, i) => {
              const day = i + 1;
              const dateStr = makeDateStr(year, month, day);
              const d = new Date(year, month, day);
              const dow = d.getDay();
              const isToday = dateStr === today;
              const isWeekend = dow === 0 || dow === 6;
              return (
                <div key={day} className="flex-shrink-0 flex flex-col items-center justify-center" style={{ width: COL_W, height: 44, borderRight: `1px solid ${T.border}`, background: isToday ? "rgba(180,83,9,0.08)" : isWeekend ? "#F1F5F9" : "transparent" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: dow === 0 ? "#EF4444" : dow === 6 ? "#3B82F6" : T.muted }}>{DAYS_JA[dow]}</span>
                  <span style={{ fontSize: 13, fontWeight: isToday ? 800 : 600, color: isToday ? T.primary : T.text }}>{day}</span>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {resources.map(resource => {
            const rowAssignments = resourceAssignments(resource.id);
            const hasConflict = conflictResourceIds.has(resource.id);
            const selRange = getSelectionRange(resource.id);
            const pickerRange = sitePicker?.resourceId === resource.id ? { start: sitePicker.startDay, end: sitePicker.endDay } : null;

            return (
              <div key={resource.id} className="flex" style={{ borderBottom: `1px solid ${T.border}`, background: hasConflict ? "rgba(239,68,68,0.04)" : "#fff" }}>
                {/* Label */}
                <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2" style={{ width: LABEL_W, borderRight: `1px solid ${T.border}` }}>
                  {tab === "member" && resource.avatar && (
                    <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 28, height: 28, fontSize: 12, fontWeight: 800, background: hasConflict ? "rgba(239,68,68,0.15)" : T.primaryLt, color: hasConflict ? "#EF4444" : T.primary }}>{resource.avatar}</div>
                  )}
                  {tab === "equipment" && <Truck size={16} style={{ color: hasConflict ? "#EF4444" : T.muted, flexShrink: 0 }} />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="truncate" style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{resource.name}</span>
                      {hasConflict && <AlertTriangle size={12} style={{ color: "#EF4444", flexShrink: 0 }} />}
                    </div>
                    <span className="truncate block" style={{ fontSize: 11, color: T.sub }}>{resource.sub}</span>
                  </div>
                </div>

                {/* Timeline cells */}
                <div className="flex-1 relative" style={{ height: 52 }}>
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: days }, (_, i) => {
                      const day = i + 1;
                      const dateStr = makeDateStr(year, month, day);
                      const d = new Date(year, month, day);
                      const dow = d.getDay();
                      const isToday = dateStr === today;
                      const isWeekend = dow === 0 || dow === 6;
                      const inSelection = selRange && day >= selRange.start && day <= selRange.end;
                      const inPicker = pickerRange && day >= pickerRange.start && day <= pickerRange.end;

                      return (
                        <div
                          key={day}
                          className="flex-shrink-0 cursor-pointer transition-colors"
                          style={{
                            width: COL_W,
                            height: "100%",
                            borderRight: `1px solid ${T.border}`,
                            background: inSelection
                              ? "rgba(180,83,9,0.15)"
                              : inPicker
                                ? "rgba(180,83,9,0.1)"
                                : isToday
                                  ? "rgba(180,83,9,0.06)"
                                  : isWeekend
                                    ? "rgba(241,245,249,0.5)"
                                    : "transparent",
                          }}
                          onClick={(e) => handleCellClick(resource.id, day, e)}
                          onMouseEnter={() => { if (selecting) setHoverDay(day); }}
                          onMouseLeave={() => setHoverDay(null)}
                        />
                      );
                    })}
                  </div>

                  {/* Assignment bars */}
                  {rowAssignments.map(a => {
                    const site = sites.find(s => s.id === a.siteId);
                    if (!site) return null;
                    const barStart = a.startDate < monthStart ? monthStart : a.startDate;
                    const barEnd = a.endDate > monthEnd ? monthEnd : a.endDate;
                    const startDay = parseDate(barStart).getDate();
                    const endDay = parseDate(barEnd).getDate();
                    const left = (startDay - 1) * COL_W + 2;
                    const width = (endDay - startDay + 1) * COL_W - 4;
                    const isConflictBar = hasConflict;
                    const barColor = isConflictBar ? "#EF4444" : a.confirmed ? STATUS_COLOR[site.status] ?? T.primary : "#CBD5E1";
                    return (
                      <div key={a.id} className="absolute truncate rounded group pointer-events-auto" style={{ left, width: Math.max(width, 20), top: 10, height: 32, background: barColor, opacity: a.confirmed ? 1 : 0.7, color: a.confirmed ? "#fff" : T.text, fontSize: 11, fontWeight: 700, lineHeight: "32px", paddingLeft: 8, paddingRight: 24, border: isConflictBar ? "2px solid #EF4444" : "none", zIndex: 5 }} title={`${site.name}（${a.startDate} 〜 ${a.endDate}）`}>
                        {site.name}
                        <button onClick={(e) => { e.stopPropagation(); onDeleteAssignment(a.id); }} className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center" style={{ width: 20, height: 20, background: "rgba(0,0,0,0.3)" }}>
                          <X size={12} color="#fff" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Selection indicator */}
                  {selRange && (
                    <div
                      className="absolute rounded pointer-events-none"
                      style={{
                        left: (selRange.start - 1) * COL_W + 1,
                        width: (selRange.end - selRange.start + 1) * COL_W - 2,
                        top: 8, height: 36,
                        border: `2px dashed ${T.primary}`,
                        borderRadius: 6,
                        zIndex: 10,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {resources.length === 0 && (
            <div className="py-12 text-center" style={{ color: T.sub, fontSize: 14 }}>
              {tab === "member" ? "作業員データがありません" : "機材データがありません"}
            </div>
          )}
        </div>

        {/* Inline site picker popup */}
        {sitePicker && (
          <InlineSitePicker
            sites={sites}
            position={{ top: sitePicker.top, left: sitePicker.left }}
            onSelect={handleSiteSelect}
            onClose={() => setSitePicker(null)}
          />
        )}
      </div>
    </div>
  );
}

// ─── MonthlyCalendarView ──────────────────────────────────────────────────────

function MonthlyCalendarView({
  year, month, sites, assignments, conflicts, onDayDoubleClick,
}: {
  year: number;
  month: number;
  sites: SiteRow[];
  assignments: Assignment[];
  conflicts: Conflict[];
  onDayDoubleClick: (dateStr: string) => void;
}) {
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const totalCells = Math.ceil((firstDay + days) / 7) * 7;
  const today = fmtDate(new Date());

  const conflictDates = useMemo(() => {
    const set = new Set<string>();
    for (const c of conflicts) {
      let d = parseDate(c.overlapStart);
      const end = parseDate(c.overlapEnd);
      while (d <= end) { set.add(fmtDate(d)); d = new Date(d.getTime() + 86400000); }
    }
    return set;
  }, [conflicts]);

  const sitesPerDay = useMemo(() => {
    const map = new Map<number, SiteRow[]>();
    for (let day = 1; day <= days; day++) {
      const dateStr = makeDateStr(year, month, day);
      map.set(day, sites.filter(s => s.startDate && s.endDate && dateInRange(dateStr, s.startDate, s.endDate)));
    }
    return map;
  }, [year, month, days, sites]);

  const assignCountPerDay = useMemo(() => {
    const map = new Map<number, number>();
    for (let day = 1; day <= days; day++) {
      const dateStr = makeDateStr(year, month, day);
      map.set(day, assignments.filter(a => dateInRange(dateStr, a.startDate, a.endDate)).length);
    }
    return map;
  }, [year, month, days, assignments]);

  return (
    <div>
      <div className="flex items-center gap-1.5 px-4 py-2 mb-0" style={{ background: "#FEF3C7", borderBottom: `1px solid #FDE68A` }}>
        <span style={{ fontSize: 12, color: "#92400E" }}>💡 日付をダブルクリックで配置を追加</span>
      </div>
      <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${T.border}` }}>
        {DAYS_JA.map((d, i) => (
          <div key={d} className="text-center py-2" style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : T.sub }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: totalCells }, (_, i) => {
          const day = i - firstDay + 1;
          const isValid = day >= 1 && day <= days;
          const dateStr = isValid ? makeDateStr(year, month, day) : "";
          const isToday = dateStr === today;
          const dayOfWeek = i % 7;
          const activeSites = isValid ? sitesPerDay.get(day) ?? [] : [];
          const assignCount = isValid ? assignCountPerDay.get(day) ?? 0 : 0;
          const hasConflict = isValid && conflictDates.has(dateStr);
          return (
            <div
              key={i}
              className="relative cursor-pointer hover:bg-amber-50 transition-colors"
              style={{ minHeight: 90, padding: "4px 6px", borderRight: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, background: !isValid ? "#F8FAFC" : hasConflict ? "rgba(239,68,68,0.06)" : isToday ? "rgba(180,83,9,0.04)" : "#fff" }}
              onDoubleClick={() => { if (isValid) onDayDoubleClick(dateStr); }}
            >
              {isValid && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center justify-center" style={{ width: 24, height: 24, borderRadius: 12, fontSize: 13, fontWeight: isToday ? 800 : 600, color: isToday ? "#fff" : dayOfWeek === 0 ? "#EF4444" : dayOfWeek === 6 ? "#3B82F6" : T.text, background: isToday ? T.primary : "transparent" }}>{day}</span>
                    {hasConflict && <AlertTriangle size={14} style={{ color: "#EF4444" }} />}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {activeSites.slice(0, 3).map(site => (
                      <div key={site.id} className="truncate rounded px-1" style={{ fontSize: 10, fontWeight: 600, lineHeight: "16px", color: "#fff", background: STATUS_COLOR[site.status] ?? T.muted }}>{site.name}</div>
                    ))}
                    {activeSites.length > 3 && <span style={{ fontSize: 10, color: T.sub }}>+{activeSites.length - 3}件</span>}
                  </div>
                  {assignCount > 0 && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-full px-1.5" style={{ fontSize: 10, fontWeight: 700, background: "rgba(180,83,9,0.1)", color: T.primary, lineHeight: "16px" }}>
                      <Users size={9} />{assignCount}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Alerts Panel ─────────────────────────────────────────────────────────────

function AlertsPanel({ conflicts, sites }: { conflicts: Conflict[]; sites: SiteRow[] }) {
  if (conflicts.length === 0) return null;
  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} style={{ color: "#EF4444" }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>二重配置の警告（{conflicts.length}件）</span>
      </div>
      <div className="flex flex-col gap-2">
        {conflicts.map((c, i) => {
          const siteNames = c.assignments.map(a => sites.find(s => s.id === a.siteId)?.name ?? "不明").join("、");
          return (
            <div key={i} className="flex items-start gap-2 rounded-lg p-3" style={{ background: "#fff", border: `1px solid ${T.border}` }}>
              <AlertTriangle size={14} style={{ color: "#EF4444", marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>二重配置：{c.resourceName}</p>
                <p style={{ fontSize: 12, color: T.sub }}>{c.overlapStart.replace(/-/g, "/")} 〜 {c.overlapEnd.replace(/-/g, "/")} に {siteNames} で重複</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCalendarPage() {
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalPreset, setModalPreset] = useState<ModalPreset | undefined>();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState<"calendar" | "timeline">("timeline");

  useEffect(() => {
    Promise.all([
      fetch("/api/kaitai/sites", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/members", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/equipment", { credentials: "include" }).then(r => r.ok ? r.json() : null),
    ])
      .then(([sitesData, membersData, eqData]) => {
        if (sitesData?.sites) setSites(sitesData.sites.map((s: Record<string, unknown>) => ({ id: s.id as string, name: s.name as string, status: (s.status as string) ?? "着工前", startDate: (s.startDate as string) ?? "", endDate: (s.endDate as string) ?? "", structureType: (s.structureType as string) ?? "" })));
        if (membersData?.members) setMembers(membersData.members.map((m: Record<string, unknown>) => ({ id: m.id as string, name: m.name as string, role: (m.role as string) ?? "", licenses: (m.licenses as string[]) ?? [], avatar: ((m.name as string) ?? "").charAt(0) })));
        if (eqData?.equipment) setEquipment(eqData.equipment.map((e: Record<string, unknown>) => ({ id: e.id as string, name: e.name as string, category: (e.category as string) ?? "", type: (e.type as string) ?? "", status: (e.status as string) ?? "待機中" })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (seeded || sites.length === 0 || members.length === 0) return;
    setAssignments(generateAssignments(sites, members, equipment));
    setSeeded(true);
  }, [sites, members, equipment, seeded]);

  const conflicts = useMemo(() => detectConflicts(assignments, members, equipment), [assignments, members, equipment]);

  const handleAddAssignments = useCallback((newAssignments: Assignment[]) => {
    setAssignments(prev => [...prev, ...newAssignments]);
    setShowModal(false);
    setModalPreset(undefined);
  }, []);

  const handleAddSingle = useCallback((a: Assignment) => {
    setAssignments(prev => [...prev, a]);
  }, []);

  const handleDeleteAssignment = useCallback((id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  }, []);

  const openModalWithPreset = useCallback((preset?: ModalPreset) => {
    setModalPreset(preset);
    setShowModal(true);
  }, []);

  const handleDayDoubleClick = useCallback((dateStr: string) => {
    openModalWithPreset({ startDate: dateStr, endDate: dateStr });
  }, [openModalWithPreset]);

  const goMonth = (delta: number) => {
    let m = month + delta; let y = year;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  };
  const goToday = () => { const n = new Date(); setYear(n.getFullYear()); setMonth(n.getMonth()); };

  const activeSiteCount = sites.filter(s => s.status === "施工中").length;
  const upcomingSiteCount = sites.filter(s => s.status === "着工前").length;
  const assignedMemberCount = new Set(assignments.filter(a => a.resourceType === "member").map(a => a.resourceId)).size;

  if (loading) return <div className="py-20 text-center" style={{ color: T.sub }}>読み込み中...</div>;

  return (
    <div className="py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>スケジュール管理</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: T.sub }}>現場・リソースの配置管理</p>
        </div>
        <button onClick={() => openModalWithPreset()} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]" style={{ background: T.primary, color: "#fff", fontSize: 15 }}>
          <Plus size={18} strokeWidth={3} />配置を追加
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "解体中", value: activeSiteCount, unit: "件", color: T.primary, icon: Building2 },
          { label: "着工前", value: upcomingSiteCount, unit: "件", color: "#3B82F6", icon: Clock },
          { label: "配置済み", value: assignedMemberCount, unit: "名", color: "#10B981", icon: Users },
          { label: "二重配置", value: conflicts.length, unit: "件", color: conflicts.length > 0 ? "#EF4444" : T.muted, icon: AlertTriangle },
        ].map(card => (
          <div key={card.label} className="px-4 py-3 rounded-xl" style={{ background: "#fff", border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-2 mb-1"><card.icon size={14} style={{ color: card.color }} /><span style={{ fontSize: 12, color: T.sub }}>{card.label}</span></div>
            <p style={{ fontSize: 26, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 2, color: T.sub }}>{card.unit}</span></p>
          </div>
        ))}
      </div>

      <AlertsPanel conflicts={conflicts} sites={sites} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => goMonth(-1)} className="flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100" style={{ width: 36, height: 36, border: `1px solid ${T.border}` }}><ChevronLeft size={18} style={{ color: T.sub }} /></button>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, minWidth: 140, textAlign: "center" }}>{year}年{month + 1}月</h2>
          <button onClick={() => goMonth(1)} className="flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100" style={{ width: 36, height: 36, border: `1px solid ${T.border}` }}><ChevronRight size={18} style={{ color: T.sub }} /></button>
          <button onClick={goToday} className="px-3 py-1.5 rounded-lg text-sm font-bold transition-colors hover:bg-gray-100" style={{ border: `1px solid ${T.border}`, color: T.primary }}>今日</button>
        </div>
        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <button onClick={() => setViewMode("calendar")} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-colors" style={{ background: viewMode === "calendar" ? T.primary : "#fff", color: viewMode === "calendar" ? "#fff" : T.sub, borderRight: `1px solid ${T.border}` }}><CalendarDays size={14} />カレンダー</button>
          <button onClick={() => setViewMode("timeline")} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-colors" style={{ background: viewMode === "timeline" ? T.primary : "#fff", color: viewMode === "timeline" ? "#fff" : T.sub }}><GanttChart size={14} />タイムライン</button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${T.border}` }}>
        {viewMode === "calendar" ? (
          <MonthlyCalendarView year={year} month={month} sites={sites} assignments={assignments} conflicts={conflicts} onDayDoubleClick={handleDayDoubleClick} />
        ) : (
          <div className="p-4">
            <GanttTimelineView year={year} month={month} sites={sites} members={members} equipment={equipment} assignments={assignments} conflicts={conflicts} onDeleteAssignment={handleDeleteAssignment} onAddAssignment={handleAddSingle} />
          </div>
        )}
      </div>

      <div className="flex items-center flex-wrap gap-4 px-4 py-3 rounded-xl" style={{ background: "#F8FAFC", border: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>凡例：</span>
        {[{ label: "解体中（確定）", color: T.primary }, { label: "着工前（確定）", color: "#3B82F6" }, { label: "未確定", color: "#CBD5E1" }, { label: "二重配置", color: "#EF4444" }].map(item => (
          <div key={item.label} className="flex items-center gap-1.5"><div className="rounded" style={{ width: 16, height: 10, background: item.color }} /><span style={{ fontSize: 12, color: T.sub }}>{item.label}</span></div>
        ))}
      </div>

      {showModal && <AssignmentModal sites={sites} members={members} equipment={equipment} onSave={handleAddAssignments} onClose={() => { setShowModal(false); setModalPreset(undefined); }} preset={modalPreset} />}
    </div>
  );
}
