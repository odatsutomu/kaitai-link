"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Users, Truck,
  AlertTriangle, GanttChart, Building2, Clock, CheckCircle,
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

// Assignment: which member/equipment is assigned to which site on which dates
type Assignment = {
  id: string;
  resourceType: "member" | "equipment";
  resourceId: string;
  siteId: string;
  startDate: string;
  endDate: string;
  confirmed: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

const STATUS_COLOR: Record<string, string> = {
  "施工中": T.primary,
  "着工前": "#3B82F6",
  "完工": "#10B981",
};

const STATUS_LABEL: Record<string, string> = {
  "施工中": "解体中",
  "着工前": "着工前",
  "完工": "完工",
};

const LICENSE_LABELS: Record<string, string> = {
  kaitai: "解体施工技士",
  crane: "クレーン",
  sekimen: "石綿作業主任者",
  ashiba: "足場組立主任者",
  taikei: "大型特殊",
  tamakake: "玉掛け",
  futsuu: "普通自動車",
  sanpai: "産廃収集運搬",
  shikaku5: "1級土木施工管理技士",
};

// Required licenses for equipment categories
const EQUIPMENT_LICENSE_REQ: Record<string, string[]> = {
  "重機": ["crane", "taikei"],
  "クレーン": ["crane", "tamakake"],
  "高所作業車": ["taikei"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
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

// ─── Generate demo assignments from seed data ─────────────────────────────────

function generateAssignments(sites: SiteRow[], members: MemberRow[], equipment: EquipmentRow[]): Assignment[] {
  const assignments: Assignment[] = [];
  let idCounter = 0;

  const activeSites = sites.filter(s => s.status === "施工中" || s.status === "着工前");

  activeSites.forEach((site, siteIdx) => {
    if (!site.startDate || !site.endDate) return;

    // Assign 2-4 members per site (rotating)
    const memberCount = Math.min(members.length, 2 + (siteIdx % 3));
    for (let i = 0; i < memberCount; i++) {
      const mIdx = (siteIdx * 2 + i) % members.length;
      assignments.push({
        id: `assign-${idCounter++}`,
        resourceType: "member",
        resourceId: members[mIdx].id,
        siteId: site.id,
        startDate: site.startDate,
        endDate: site.endDate,
        confirmed: site.status === "施工中",
      });
    }

    // Assign 1-2 equipment per site
    const eqCount = Math.min(equipment.length, 1 + (siteIdx % 2));
    for (let i = 0; i < eqCount; i++) {
      const eIdx = (siteIdx + i) % equipment.length;
      assignments.push({
        id: `assign-${idCounter++}`,
        resourceType: "equipment",
        resourceId: equipment[eIdx].id,
        siteId: site.id,
        startDate: site.startDate,
        endDate: site.endDate,
        confirmed: site.status === "施工中",
      });
    }
  });

  return assignments;
}

// ─── Conflict detection ───────────────────────────────────────────────────────

type Conflict = {
  resourceId: string;
  resourceType: "member" | "equipment";
  resourceName: string;
  assignments: Assignment[];
  overlapStart: string;
  overlapEnd: string;
};

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
          const name = type === "member"
            ? members.find(m => m.id === id)?.name ?? "不明"
            : equipment.find(e => e.id === id)?.name ?? "不明";
          const overlapStart = group[i].startDate > group[j].startDate ? group[i].startDate : group[j].startDate;
          const overlapEnd = group[i].endDate < group[j].endDate ? group[i].endDate : group[j].endDate;
          conflicts.push({
            resourceId: id,
            resourceType: type as "member" | "equipment",
            resourceName: name,
            assignments: [group[i], group[j]],
            overlapStart,
            overlapEnd,
          });
        }
      }
    }
  });

  return conflicts;
}

// ─── License warnings ─────────────────────────────────────────────────────────

type LicenseWarning = {
  memberId: string;
  memberName: string;
  equipmentName: string;
  missingLicenses: string[];
};

function detectLicenseWarnings(
  assignments: Assignment[],
  members: MemberRow[],
  equipment: EquipmentRow[],
): LicenseWarning[] {
  const warnings: LicenseWarning[] = [];

  // Find sites where equipment and members overlap
  const eqAssignments = assignments.filter(a => a.resourceType === "equipment");
  const memAssignments = assignments.filter(a => a.resourceType === "member");

  for (const ea of eqAssignments) {
    const eq = equipment.find(e => e.id === ea.resourceId);
    if (!eq) continue;
    const requiredLicenses = EQUIPMENT_LICENSE_REQ[eq.category];
    if (!requiredLicenses) continue;

    // Find members assigned to the same site and overlapping dates
    const siteMembers = memAssignments.filter(
      ma => ma.siteId === ea.siteId && rangeOverlaps(ma.startDate, ma.endDate, ea.startDate, ea.endDate)
    );

    // Check if at least one member has the required licenses
    const anyQualified = siteMembers.some(ma => {
      const member = members.find(m => m.id === ma.resourceId);
      if (!member) return false;
      return requiredLicenses.every(lic => member.licenses.includes(lic));
    });

    if (!anyQualified && siteMembers.length > 0) {
      // Warn about the first member who doesn't have licenses
      for (const ma of siteMembers) {
        const member = members.find(m => m.id === ma.resourceId);
        if (!member) continue;
        const missing = requiredLicenses.filter(lic => !member.licenses.includes(lic));
        if (missing.length > 0) {
          warnings.push({
            memberId: member.id,
            memberName: member.name,
            equipmentName: eq.name,
            missingLicenses: missing,
          });
        }
      }
    }
  }

  return warnings;
}

// ─── MonthlyCalendarView ──────────────────────────────────────────────────────

function MonthlyCalendarView({
  year, month, sites, assignments, conflicts,
}: {
  year: number;
  month: number;
  sites: SiteRow[];
  assignments: Assignment[];
  conflicts: Conflict[];
}) {
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const totalCells = Math.ceil((firstDay + days) / 7) * 7;

  const conflictDates = useMemo(() => {
    const set = new Set<string>();
    for (const c of conflicts) {
      let d = parseDate(c.overlapStart);
      const end = parseDate(c.overlapEnd);
      while (d <= end) {
        set.add(fmtDate(d));
        d = addDays(d, 1);
      }
    }
    return set;
  }, [conflicts]);

  // Which sites are active on each day of the month
  const sitesPerDay = useMemo(() => {
    const map = new Map<number, SiteRow[]>();
    for (let day = 1; day <= days; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const active = sites.filter(s =>
        s.startDate && s.endDate && dateInRange(dateStr, s.startDate, s.endDate)
      );
      map.set(day, active);
    }
    return map;
  }, [year, month, days, sites]);

  // Assignments per day (count)
  const assignCountPerDay = useMemo(() => {
    const map = new Map<number, number>();
    for (let day = 1; day <= days; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const count = assignments.filter(a => dateInRange(dateStr, a.startDate, a.endDate)).length;
      map.set(day, count);
    }
    return map;
  }, [year, month, days, assignments]);

  const today = fmtDate(new Date());

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${T.border}` }}>
        {DAYS_JA.map((d, i) => (
          <div
            key={d}
            className="text-center py-2"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : T.sub,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: totalCells }, (_, i) => {
          const day = i - firstDay + 1;
          const isValid = day >= 1 && day <= days;
          const dateStr = isValid
            ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : "";
          const isToday = dateStr === today;
          const dayOfWeek = i % 7;
          const activeSites = isValid ? sitesPerDay.get(day) ?? [] : [];
          const assignCount = isValid ? assignCountPerDay.get(day) ?? 0 : 0;
          const hasConflict = isValid && conflictDates.has(dateStr);

          return (
            <div
              key={i}
              className="relative"
              style={{
                minHeight: 90,
                padding: "4px 6px",
                borderRight: `1px solid ${T.border}`,
                borderBottom: `1px solid ${T.border}`,
                background: !isValid
                  ? "#F8FAFC"
                  : hasConflict
                    ? "rgba(239,68,68,0.06)"
                    : isToday
                      ? "rgba(180,83,9,0.04)"
                      : "#fff",
              }}
            >
              {isValid && (
                <>
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="inline-flex items-center justify-center"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: isToday ? 800 : 600,
                        color: isToday
                          ? "#fff"
                          : dayOfWeek === 0
                            ? "#EF4444"
                            : dayOfWeek === 6
                              ? "#3B82F6"
                              : T.text,
                        background: isToday ? T.primary : "transparent",
                      }}
                    >
                      {day}
                    </span>
                    {hasConflict && (
                      <AlertTriangle size={14} style={{ color: "#EF4444" }} />
                    )}
                  </div>

                  {/* Site bars */}
                  <div className="flex flex-col gap-0.5">
                    {activeSites.slice(0, 3).map(site => (
                      <div
                        key={site.id}
                        className="truncate rounded px-1"
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          lineHeight: "16px",
                          color: "#fff",
                          background: STATUS_COLOR[site.status] ?? T.muted,
                        }}
                      >
                        {site.name}
                      </div>
                    ))}
                    {activeSites.length > 3 && (
                      <span style={{ fontSize: 10, color: T.sub }}>
                        +{activeSites.length - 3}件
                      </span>
                    )}
                  </div>

                  {/* Resource count badge */}
                  {assignCount > 0 && (
                    <div
                      className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-full px-1.5"
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: "rgba(180,83,9,0.1)",
                        color: T.primary,
                        lineHeight: "16px",
                      }}
                    >
                      <Users size={9} />
                      {assignCount}
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

// ─── GanttTimelineView ────────────────────────────────────────────────────────

function GanttTimelineView({
  year, month, sites, members, equipment, assignments, conflicts, licenseWarnings,
}: {
  year: number;
  month: number;
  sites: SiteRow[];
  members: MemberRow[];
  equipment: EquipmentRow[];
  assignments: Assignment[];
  conflicts: Conflict[];
  licenseWarnings: LicenseWarning[];
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

  const warningMemberIds = useMemo(() => {
    const set = new Set<string>();
    for (const w of licenseWarnings) set.add(w.memberId);
    return set;
  }, [licenseWarnings]);

  const [tab, setTab] = useState<"member" | "equipment">("member");

  const resources = tab === "member"
    ? members.map(m => ({ id: m.id, name: m.name, sub: m.role, avatar: m.avatar }))
    : equipment.map(e => ({ id: e.id, name: e.name, sub: `${e.category} / ${e.type}`, avatar: "" }));

  const resourceAssignments = useCallback(
    (resourceId: string) =>
      assignments.filter(
        a => a.resourceType === tab && a.resourceId === resourceId
          && rangeOverlaps(a.startDate, a.endDate, monthStart, monthEnd)
      ),
    [assignments, tab, monthStart, monthEnd],
  );

  const COL_W = 36;
  const LABEL_W = 160;

  return (
    <div>
      {/* Sub-tabs: Member / Equipment */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("member")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          style={{
            background: tab === "member" ? T.primary : "#F1F5F9",
            color: tab === "member" ? "#fff" : T.sub,
            border: `1px solid ${tab === "member" ? T.primary : T.border}`,
          }}
        >
          <Users size={14} />
          作業員（{members.length}）
        </button>
        <button
          onClick={() => setTab("equipment")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          style={{
            background: tab === "equipment" ? T.primary : "#F1F5F9",
            color: tab === "equipment" ? "#fff" : T.sub,
            border: `1px solid ${tab === "equipment" ? T.primary : T.border}`,
          }}
        >
          <Truck size={14} />
          機材（{equipment.length}）
        </button>
      </div>

      {/* Gantt chart */}
      <div className="overflow-x-auto" style={{ border: `1px solid ${T.border}`, borderRadius: T.cardRadius }}>
        <div style={{ minWidth: LABEL_W + COL_W * days }}>
          {/* Header: dates */}
          <div className="flex" style={{ borderBottom: `1px solid ${T.border}`, background: "#F8FAFC" }}>
            <div
              className="flex-shrink-0 flex items-center px-3"
              style={{ width: LABEL_W, borderRight: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, color: T.sub }}
            >
              {tab === "member" ? "作業員" : "機材"}
            </div>
            {Array.from({ length: days }, (_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const d = new Date(year, month, day);
              const dow = d.getDay();
              const isToday = dateStr === today;
              const isWeekend = dow === 0 || dow === 6;

              return (
                <div
                  key={day}
                  className="flex-shrink-0 flex flex-col items-center justify-center"
                  style={{
                    width: COL_W,
                    height: 44,
                    borderRight: `1px solid ${T.border}`,
                    background: isToday ? "rgba(180,83,9,0.08)" : isWeekend ? "#F1F5F9" : "transparent",
                  }}
                >
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: dow === 0 ? "#EF4444" : dow === 6 ? "#3B82F6" : T.muted,
                  }}>
                    {DAYS_JA[dow]}
                  </span>
                  <span style={{
                    fontSize: 13,
                    fontWeight: isToday ? 800 : 600,
                    color: isToday ? T.primary : T.text,
                  }}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rows: resources */}
          {resources.map(resource => {
            const rowAssignments = resourceAssignments(resource.id);
            const hasConflict = conflictResourceIds.has(resource.id);
            const hasWarning = tab === "member" && warningMemberIds.has(resource.id);

            return (
              <div
                key={resource.id}
                className="flex"
                style={{
                  borderBottom: `1px solid ${T.border}`,
                  background: hasConflict ? "rgba(239,68,68,0.04)" : "#fff",
                }}
              >
                {/* Label */}
                <div
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2"
                  style={{ width: LABEL_W, borderRight: `1px solid ${T.border}` }}
                >
                  {tab === "member" && resource.avatar && (
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full"
                      style={{
                        width: 28,
                        height: 28,
                        fontSize: 12,
                        fontWeight: 800,
                        background: hasConflict ? "rgba(239,68,68,0.15)" : T.primaryLt,
                        color: hasConflict ? "#EF4444" : T.primary,
                      }}
                    >
                      {resource.avatar}
                    </div>
                  )}
                  {tab === "equipment" && (
                    <Truck
                      size={16}
                      style={{ color: hasConflict ? "#EF4444" : T.muted, flexShrink: 0 }}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="truncate" style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                        {resource.name}
                      </span>
                      {hasConflict && <AlertTriangle size={12} style={{ color: "#EF4444", flexShrink: 0 }} />}
                      {hasWarning && <AlertTriangle size={12} style={{ color: "#F59E0B", flexShrink: 0 }} />}
                    </div>
                    <span className="truncate block" style={{ fontSize: 11, color: T.sub }}>
                      {resource.sub}
                    </span>
                  </div>
                </div>

                {/* Timeline cells */}
                <div className="flex-1 relative" style={{ height: 52 }}>
                  {/* Day columns (background) */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: days }, (_, i) => {
                      const day = i + 1;
                      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const d = new Date(year, month, day);
                      const dow = d.getDay();
                      const isToday = dateStr === today;
                      const isWeekend = dow === 0 || dow === 6;

                      return (
                        <div
                          key={day}
                          className="flex-shrink-0"
                          style={{
                            width: COL_W,
                            height: "100%",
                            borderRight: `1px solid ${T.border}`,
                            background: isToday
                              ? "rgba(180,83,9,0.06)"
                              : isWeekend
                                ? "rgba(241,245,249,0.5)"
                                : "transparent",
                          }}
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

                    const isConflictBar = hasConflict && conflictResourceIds.has(resource.id);
                    const barColor = isConflictBar
                      ? "#EF4444"
                      : a.confirmed
                        ? STATUS_COLOR[site.status] ?? T.primary
                        : "#CBD5E1";

                    return (
                      <div
                        key={a.id}
                        className="absolute truncate rounded"
                        style={{
                          left,
                          width: Math.max(width, 20),
                          top: 10,
                          height: 32,
                          background: barColor,
                          opacity: a.confirmed ? 1 : 0.7,
                          color: a.confirmed ? "#fff" : T.text,
                          fontSize: 11,
                          fontWeight: 700,
                          lineHeight: "32px",
                          paddingLeft: 8,
                          paddingRight: 4,
                          border: isConflictBar ? "2px solid #EF4444" : "none",
                          boxShadow: isConflictBar ? "0 0 0 2px rgba(239,68,68,0.2)" : "none",
                        }}
                        title={`${site.name}（${a.startDate} 〜 ${a.endDate}）`}
                      >
                        {site.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {resources.length === 0 && (
            <div className="py-12 text-center" style={{ color: T.sub, fontSize: 14 }}>
              {tab === "member" ? "作業員データがありません" : "機材データがありません"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Alerts Panel ─────────────────────────────────────────────────────────────

function AlertsPanel({
  conflicts, licenseWarnings, sites,
}: {
  conflicts: Conflict[];
  licenseWarnings: LicenseWarning[];
  sites: SiteRow[];
}) {
  if (conflicts.length === 0 && licenseWarnings.length === 0) return null;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: conflicts.length > 0 ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
        border: `1px solid ${conflicts.length > 0 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle
          size={16}
          style={{ color: conflicts.length > 0 ? "#EF4444" : "#F59E0B" }}
        />
        <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
          注意事項（{conflicts.length + licenseWarnings.length}件）
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {/* Double-booking conflicts */}
        {conflicts.map((c, i) => {
          const siteNames = c.assignments
            .map(a => sites.find(s => s.id === a.siteId)?.name ?? "不明")
            .join("、");
          return (
            <div
              key={`conflict-${i}`}
              className="flex items-start gap-2 rounded-lg p-3"
              style={{ background: "#fff", border: `1px solid ${T.border}` }}
            >
              <AlertTriangle size={14} style={{ color: "#EF4444", marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>
                  二重配置：{c.resourceName}
                </p>
                <p style={{ fontSize: 12, color: T.sub }}>
                  {c.overlapStart.replace(/-/g, "/")} 〜 {c.overlapEnd.replace(/-/g, "/")} に {siteNames} で重複
                </p>
              </div>
            </div>
          );
        })}

        {/* License warnings */}
        {licenseWarnings.map((w, i) => (
          <div
            key={`warn-${i}`}
            className="flex items-start gap-2 rounded-lg p-3"
            style={{ background: "#fff", border: `1px solid ${T.border}` }}
          >
            <AlertTriangle size={14} style={{ color: "#F59E0B", marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>
                資格不足：{w.memberName}
              </p>
              <p style={{ fontSize: 12, color: T.sub }}>
                {w.equipmentName} 操作に必要：{w.missingLicenses.map(l => LICENSE_LABELS[l] ?? l).join("、")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCalendarPage() {
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Current view month
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // View mode
  const [viewMode, setViewMode] = useState<"calendar" | "timeline">("calendar");

  // Fetch data
  useEffect(() => {
    Promise.all([
      fetch("/api/kaitai/sites", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/members", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/equipment", { credentials: "include" }).then(r => r.ok ? r.json() : null),
    ])
      .then(([sitesData, membersData, eqData]) => {
        if (sitesData?.sites) {
          setSites(
            sitesData.sites.map((s: Record<string, unknown>) => ({
              id: s.id as string,
              name: s.name as string,
              status: (s.status as string) ?? "着工前",
              startDate: (s.startDate as string) ?? "",
              endDate: (s.endDate as string) ?? "",
              structureType: (s.structureType as string) ?? "",
            }))
          );
        }
        if (membersData?.members) {
          setMembers(
            membersData.members.map((m: Record<string, unknown>) => ({
              id: m.id as string,
              name: m.name as string,
              role: (m.role as string) ?? "",
              licenses: (m.licenses as string[]) ?? [],
              avatar: ((m.name as string) ?? "").charAt(0),
            }))
          );
        }
        if (eqData?.equipment) {
          setEquipment(
            eqData.equipment.map((e: Record<string, unknown>) => ({
              id: e.id as string,
              name: e.name as string,
              category: (e.category as string) ?? "",
              type: (e.type as string) ?? "",
              status: (e.status as string) ?? "待機中",
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Generate assignments
  const assignments = useMemo(
    () => generateAssignments(sites, members, equipment),
    [sites, members, equipment],
  );

  // Detect conflicts
  const conflicts = useMemo(
    () => detectConflicts(assignments, members, equipment),
    [assignments, members, equipment],
  );

  // Detect license warnings
  const licenseWarnings = useMemo(
    () => detectLicenseWarnings(assignments, members, equipment),
    [assignments, members, equipment],
  );

  // Nav
  const goMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  };

  const goToday = () => {
    const n = new Date();
    setYear(n.getFullYear());
    setMonth(n.getMonth());
  };

  // Summary stats
  const activeSiteCount = sites.filter(s => s.status === "施工中").length;
  const upcomingSiteCount = sites.filter(s => s.status === "着工前").length;
  const assignedMemberCount = new Set(
    assignments.filter(a => a.resourceType === "member").map(a => a.resourceId)
  ).size;

  if (loading) {
    return (
      <div className="py-20 text-center" style={{ color: T.sub }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>
            スケジュール管理
          </h1>
          <p style={{ fontSize: 14, marginTop: 4, color: T.sub }}>
            現場・リソースのカレンダー管理
          </p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "解体中", value: activeSiteCount, unit: "件", color: T.primary, icon: Building2 },
          { label: "着工前", value: upcomingSiteCount, unit: "件", color: "#3B82F6", icon: Clock },
          { label: "配置済み作業員", value: assignedMemberCount, unit: "名", color: "#10B981", icon: Users },
          { label: "注意事項", value: conflicts.length + licenseWarnings.length, unit: "件", color: conflicts.length > 0 ? "#EF4444" : "#F59E0B", icon: AlertTriangle },
        ].map(card => (
          <div
            key={card.label}
            className="px-4 py-3 rounded-xl"
            style={{ background: "#fff", border: `1px solid ${T.border}` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <card.icon size={14} style={{ color: card.color }} />
              <span style={{ fontSize: 12, color: T.sub }}>{card.label}</span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: card.color, lineHeight: 1 }}>
              {card.value}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 2, color: T.sub }}>{card.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* ── Alerts ── */}
      <AlertsPanel conflicts={conflicts} licenseWarnings={licenseWarnings} sites={sites} />

      {/* ── Month Nav + View Toggle ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goMonth(-1)}
            className="flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            style={{ width: 36, height: 36, border: `1px solid ${T.border}` }}
          >
            <ChevronLeft size={18} style={{ color: T.sub }} />
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, minWidth: 140, textAlign: "center" }}>
            {year}年{month + 1}月
          </h2>
          <button
            onClick={() => goMonth(1)}
            className="flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            style={{ width: 36, height: 36, border: `1px solid ${T.border}` }}
          >
            <ChevronRight size={18} style={{ color: T.sub }} />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 rounded-lg text-sm font-bold transition-colors hover:bg-gray-100"
            style={{ border: `1px solid ${T.border}`, color: T.primary }}
          >
            今日
          </button>
        </div>

        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <button
            onClick={() => setViewMode("calendar")}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-colors"
            style={{
              background: viewMode === "calendar" ? T.primary : "#fff",
              color: viewMode === "calendar" ? "#fff" : T.sub,
              borderRight: `1px solid ${T.border}`,
            }}
          >
            <CalendarDays size={14} />
            カレンダー
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-colors"
            style={{
              background: viewMode === "timeline" ? T.primary : "#fff",
              color: viewMode === "timeline" ? "#fff" : T.sub,
            }}
          >
            <GanttChart size={14} />
            タイムライン
          </button>
        </div>
      </div>

      {/* ── View Content ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#fff", border: `1px solid ${T.border}` }}
      >
        {viewMode === "calendar" ? (
          <MonthlyCalendarView
            year={year}
            month={month}
            sites={sites}
            assignments={assignments}
            conflicts={conflicts}
          />
        ) : (
          <div className="p-4">
            <GanttTimelineView
              year={year}
              month={month}
              sites={sites}
              members={members}
              equipment={equipment}
              assignments={assignments}
              conflicts={conflicts}
              licenseWarnings={licenseWarnings}
            />
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div
        className="flex items-center flex-wrap gap-4 px-4 py-3 rounded-xl"
        style={{ background: "#F8FAFC", border: `1px solid ${T.border}` }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>凡例：</span>
        {[
          { label: "解体中（確定）", color: T.primary },
          { label: "着工前（確定）", color: "#3B82F6" },
          { label: "未確定", color: "#CBD5E1" },
          { label: "二重配置", color: "#EF4444" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="rounded" style={{ width: 16, height: 10, background: item.color }} />
            <span style={{ fontSize: 12, color: T.sub }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
