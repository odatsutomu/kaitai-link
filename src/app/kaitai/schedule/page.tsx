"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Calendar, MapPin, Users, Wrench,
  ChevronRight as ArrowRight,
} from "lucide-react";
import { T } from "../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: T.sub,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
};

type SiteSched = {
  id: string; name: string; shortName: string; color: string;
  startDay: number; endDay: number;
  address?: string; status?: string;
};
type StaffSched = {
  id: string; name: string; short: string; color: string;
  days: number[]; role?: string; avatar?: string;
};
type EquipSched = {
  id: string; name: string; short: string; color: string;
  days: number[]; category?: string;
};

const SITE_COLORS = [T.primary, "#3B82F6", "#8B5CF6", "#10B981", "#EF4444", "#0EA5E9", "#DC2626"];
const STAFF_COLORS = [T.primary, "#EF4444", "#10B981", "#8B5CF6", "#0EA5E9", "#DC2626", "#F97316"];

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

function getMonthInfo(year: number, month: number) {
  const firstDate = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOfWeek = firstDate.getDay();
  const firstDayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekends = new Set<number>();
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month - 1, i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) weekends.add(i);
  }
  return { daysInMonth, firstDayOffset, weekends };
}

function parseDateDay(dateStr: string, year: number, month: number): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (d.getFullYear() === year && d.getMonth() + 1 === month) return d.getDate();
  return null;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const now = new Date();
  const [year]  = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);

  const [SITES, setSites] = useState<SiteSched[]>([]);
  const [STAFF, setStaff] = useState<StaffSched[]>([]);
  const [EQUIPMENT, setEquipment] = useState<EquipSched[]>([]);

  const { daysInMonth: DAYS_IN_MONTH, firstDayOffset: FIRST_DAY_OFFSET, weekends: WEEKENDS } = useMemo(
    () => getMonthInfo(year, month), [year, month]
  );

  useEffect(() => {
    fetch("/api/kaitai/sites", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.sites) return;
        const mapped: SiteSched[] = data.sites
          .filter((s: Record<string, unknown>) => s.status !== "完工")
          .map((s: Record<string, unknown>, i: number) => {
            const start = parseDateDay(s.startDate as string, year, month);
            const end   = parseDateDay(s.endDate as string, year, month);
            const name = s.name as string;
            return {
              id: s.id as string,
              name,
              shortName: name.length > 4 ? name.slice(0, 4) : name,
              color: SITE_COLORS[i % SITE_COLORS.length],
              startDay: start ?? 1,
              endDay: end ?? DAYS_IN_MONTH,
              address: (s.address as string) ?? "",
              status: (s.status as string) ?? "",
            };
          });
        setSites(mapped);
      })
      .catch(() => {});

    fetch("/api/kaitai/members", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.members) return;
        const mapped: StaffSched[] = data.members.map((m: Record<string, unknown>, i: number) => {
          const days: number[] = [];
          for (let d = 1; d <= DAYS_IN_MONTH; d++) {
            const date = new Date(year, month - 1, d);
            const dow = date.getDay();
            if (dow !== 0 && dow !== 6) days.push(d);
          }
          return {
            id: m.id as string,
            name: m.name as string,
            short: ((m.avatar as string) ?? (m.name as string).charAt(0)),
            color: STAFF_COLORS[i % STAFF_COLORS.length],
            days,
            role: (m.role as string) ?? "作業員",
            avatar: (m.avatar as string) ?? null,
          };
        });
        setStaff(mapped);
      })
      .catch(() => {});

    fetch("/api/kaitai/equipment", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.equipment) return;
        const mapped: EquipSched[] = data.equipment
          .filter((e: Record<string, unknown>) => e.status === "稼働中")
          .map((e: Record<string, unknown>, i: number) => {
            const days: number[] = [];
            for (let d = 1; d <= DAYS_IN_MONTH; d++) {
              const date = new Date(year, month - 1, d);
              const dow = date.getDay();
              if (dow !== 0 && dow !== 6) days.push(d);
            }
            return {
              id: e.id as string,
              name: e.name as string,
              short: (e.name as string).charAt(0),
              color: SITE_COLORS[(i + 3) % SITE_COLORS.length],
              days,
              category: (e.category as string) ?? "",
            };
          });
        setEquipment(mapped);
      })
      .catch(() => {});
  }, [year, month, DAYS_IN_MONTH]);

  useEffect(() => {
    if (now.getFullYear() === year && now.getMonth() + 1 === month) {
      setSelectedDay(now.getDate());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCells = FIRST_DAY_OFFSET + DAYS_IN_MONTH;
  const rows = Math.ceil(totalCells / 7);

  function getDayEvents(day: number) {
    return {
      sites:     SITES.filter(s => day >= s.startDay && day <= s.endDay),
      staff:     STAFF.filter(s => s.days.includes(day)),
      equipment: EQUIPMENT.filter(e => e.days.includes(day)),
    };
  }

  const selectedEvents = selectedDay ? getDayEvents(selectedDay) : null;
  const isWeekend = selectedDay ? WEEKENDS.has(selectedDay) : false;

  return (
    <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>全体スケジュール</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>{year}年 {month}月</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
            style={{ width: 40, height: 40, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }}
          >
            <ChevronLeft size={20} style={{ color: C.sub }} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text, padding: "0 8px" }}>{year}年 {month}月</span>
          <button
            className="flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
            style={{ width: 40, height: 40, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }}
          >
            <ChevronRight size={20} style={{ color: C.sub }} />
          </button>
        </div>
      </div>

      {/* ── Calendar ── */}
      <div
        className="p-5"
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16 }}
      >
        {/* Site legend */}
        <div className="flex flex-wrap gap-2 mb-5">
          {SITES.map(s => (
            <div key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: `${s.color}12`, border: `1px solid ${s.color}30` }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.name}</span>
            </div>
          ))}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((d, i) => (
            <div key={d} className="text-center py-1.5" style={{ fontSize: 14, fontWeight: 700, color: i >= 5 ? "#EF4444" : C.muted }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: rows * 7 }, (_, cellIdx) => {
            const dayNum = cellIdx - FIRST_DAY_OFFSET + 1;
            const isValid = dayNum >= 1 && dayNum <= DAYS_IN_MONTH;
            const isSelected = selectedDay === dayNum;
            const isToday = dayNum === now.getDate() && year === now.getFullYear() && month === now.getMonth() + 1;
            const weekend = WEEKENDS.has(dayNum);
            const events = isValid ? getDayEvents(dayNum) : null;

            return (
              <button
                key={cellIdx}
                disabled={!isValid}
                onClick={() => isValid && setSelectedDay(isSelected ? null : dayNum)}
                className="rounded-xl flex flex-col overflow-hidden transition-all"
                style={{
                  minHeight: 68,
                  background: isSelected
                    ? C.text
                    : isToday
                    ? T.primaryLt
                    : weekend
                    ? "#FAFAFA"
                    : C.card,
                  border: isSelected
                    ? `2px solid ${C.text}`
                    : isToday
                    ? `2px solid ${C.amber}`
                    : `1px solid ${C.border}`,
                  opacity: !isValid ? 0 : 1,
                  pointerEvents: !isValid ? "none" : "auto",
                }}
              >
                {isValid && (
                  <>
                    <div className="text-center pt-2 pb-1">
                      <span style={{
                        fontSize: isToday || isSelected ? 16 : 14,
                        fontWeight: isToday || isSelected ? 700 : 500,
                        color: isSelected ? T.surface : isToday ? C.amberDk : weekend ? "#EF4444" : C.text,
                      }}>
                        {dayNum}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 px-1.5 pb-2">
                      {events?.sites.slice(0, 2).map(s => (
                        <div
                          key={s.id}
                          className="rounded-sm"
                          style={{ background: isSelected ? `${s.color}80` : s.color, height: 4 }}
                        />
                      ))}
                    </div>
                    {(events?.staff.length ?? 0) > 0 && (
                      <div className="flex justify-center pb-1">
                        <div
                          className="rounded-full flex items-center justify-center"
                          style={{
                            width: 20, height: 20,
                            background: isSelected ? "rgba(255,255,255,0.3)" : T.text,
                            fontSize: 14, fontWeight: 800,
                            color: T.surface,
                          }}
                        >
                          {events?.staff.length}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 16, height: 4, borderRadius: 2, background: C.amber }} />
            <span style={{ fontSize: 14, color: C.muted }}>現場稼働</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 20, height: 20, borderRadius: 10, background: C.text, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14, color: "#fff", fontWeight: 800 }}>n</span>
            </div>
            <span style={{ fontSize: 14, color: C.muted }}>作業員数</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 16, height: 16, borderRadius: 4, background: T.primaryLt, border: `2px solid ${C.amber}` }} />
            <span style={{ fontSize: 14, color: C.muted }}>今日</span>
          </div>
        </div>
      </div>

      {/* ── Detail panel (below calendar) ── */}
      {selectedDay && selectedEvents ? (
        <div
          className="flex flex-col gap-5 p-5"
          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16 }}
        >
          {/* Date header */}
          <div className="flex items-center gap-3">
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: T.primaryLt,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: C.amberDk, lineHeight: 1 }}>{selectedDay}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.amber }}>
                {DAY_LABELS[(FIRST_DAY_OFFSET + selectedDay - 1) % 7]}
              </span>
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
                {month}月{selectedDay}日（{DAY_LABELS[(FIRST_DAY_OFFSET + selectedDay - 1) % 7]}）
              </h2>
              <div className="flex items-center gap-3 mt-1">
                {isWeekend && (
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#FEF2F2", color: "#EF4444" }}>休日</span>
                )}
                <span style={{ fontSize: 13, color: C.sub }}>
                  現場 {selectedEvents.sites.length} ・ 作業員 {selectedEvents.staff.length} ・ 重機 {selectedEvents.equipment.length}
                </span>
              </div>
            </div>
          </div>

          {/* Sites section */}
          {selectedEvents.sites.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} style={{ color: C.amber }} />
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: C.muted }}>
                  稼働現場（{selectedEvents.sites.length}件）
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {selectedEvents.sites.map(s => (
                  <Link
                    key={s.id}
                    href={`/kaitai/sites/${s.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl active:scale-[0.99] transition-all"
                      style={{
                        background: `${s.color}08`, border: `1.5px solid ${s.color}25`,
                        borderLeft: `4px solid ${s.color}`,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{s.name}</span>
                          {s.status && (
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                              background: `${s.color}15`, color: s.color,
                            }}>
                              {s.status}
                            </span>
                          )}
                        </div>
                        {s.address && (
                          <p style={{ fontSize: 12, color: C.sub, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.address}
                          </p>
                        )}
                      </div>
                      <ArrowRight size={16} style={{ color: C.muted, flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Staff section */}
          {selectedEvents.staff.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} style={{ color: "#3B82F6" }} />
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: C.muted }}>
                  出勤予定（{selectedEvents.staff.length}名）
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {selectedEvents.staff.map(s => (
                  <Link
                    key={s.id}
                    href={`/kaitai/admin/members/${s.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-xl active:scale-[0.99] transition-all"
                      style={{
                        background: C.card, border: `1px solid ${C.border}`,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        className="flex items-center justify-center rounded-lg flex-shrink-0"
                        style={{
                          width: 36, height: 36,
                          background: `${s.color}12`, fontSize: 16,
                        }}
                      >
                        {s.avatar ?? s.short}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{s.name}</span>
                        {s.role && (
                          <span style={{ fontSize: 12, color: C.sub, marginLeft: 8 }}>{s.role}</span>
                        )}
                      </div>
                      <ArrowRight size={16} style={{ color: C.muted, flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Equipment section */}
          {selectedEvents.equipment.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Wrench size={16} style={{ color: "#8B5CF6" }} />
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: C.muted }}>
                  重機・車両（{selectedEvents.equipment.length}台）
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedEvents.equipment.map(e => (
                  <div
                    key={e.id}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                    style={{ background: `${e.color}08`, border: `1px solid ${e.color}20` }}
                  >
                    <span style={{ fontSize: 16 }}>🚜</span>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{e.name}</span>
                      {e.category && (
                        <span style={{ fontSize: 11, color: C.sub, marginLeft: 6 }}>{e.category}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No events */}
          {selectedEvents.sites.length === 0 && selectedEvents.staff.length === 0 && selectedEvents.equipment.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-xl"
              style={{ background: T.bg, border: `1px solid ${C.border}` }}
            >
              <Calendar size={32} style={{ color: C.muted, marginBottom: 8 }} />
              <p style={{ fontSize: 15, color: C.muted }}>この日の予定はありません</p>
            </div>
          )}
        </div>
      ) : (
        <div
          className="p-8 flex flex-col items-center justify-center text-center rounded-2xl"
          style={{ background: C.card, border: `1px dashed ${C.border}`, borderRadius: 16 }}
        >
          <Calendar size={32} style={{ color: C.border, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 500, color: C.muted }}>日付を選択すると<br />詳細を表示します</p>
        </div>
      )}
    </div>
  );
}
