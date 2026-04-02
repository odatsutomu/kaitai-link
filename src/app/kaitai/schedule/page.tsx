"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: "#1E293B", sub: "#64748B", muted: "#94A3B8",
  border: "#E2E8F0", card: "#FFFFFF",
  amber: "#F59E0B", amberDk: "#D97706",
};

// ─── Mock schedule data ────────────────────────────────────────────────────────

const SITES = [
  { id: "s1", name: "山田邸",   shortName: "山田",   color: "#F59E0B", startDay: 1,  endDay: 10 },
  { id: "s2", name: "田中倉庫", shortName: "田中",   color: "#3B82F6", startDay: 1,  endDay: 20 },
  { id: "s3", name: "松本AP",   shortName: "松本",   color: "#8B5CF6", startDay: 7,  endDay: 30 },
];

const STAFF: { name: string; short: string; color: string; days: number[] }[] = [
  { name: "田中 義雄", short: "田", color: "#F59E0B", days: [1,2,3,6,7,8,9,10,13,14,15,16,17,20] },
  { name: "佐藤 健太", short: "佐", color: "#EF4444", days: [1,2,3,6,7,8,9,10,13,14,15] },
  { name: "鈴木 大地", short: "鈴", color: "#10B981", days: [7,8,9,10,13,14,15,16,17,20] },
  { name: "山本 拓也", short: "山", color: "#8B5CF6", days: [6,7,8,9,13,14] },
  { name: "高橋 真一", short: "高", color: "#0EA5E9", days: [1,2,3,6,7,8,9,10,13,14,15,16,17] },
];

const EQUIPMENT: { name: string; short: string; color: string; days: number[] }[] = [
  { name: "バックホウ",   short: "重", color: "#DC2626", days: [1,2,3,7,8,9,10,13,14] },
  { name: "産廃トラック", short: "ト", color: "#059669", days: [3,8,10,14,17,20] },
  { name: "高所作業車",   short: "高", color: "#D97706", days: [7,8,9] },
];

const DAYS_IN_MONTH = 30;
const FIRST_DAY_OFFSET = 2; // Wednesday = index 2 (Mon=0)
const WEEKENDS = new Set<number>();
for (let i = 0; i < DAYS_IN_MONTH; i++) {
  const col = (FIRST_DAY_OFFSET + i) % 7;
  if (col === 5 || col === 6) WEEKENDS.add(i + 1);
}

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(2);

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
    <div className="px-4 md:px-8 py-6 flex flex-col gap-6 pb-24 md:pb-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>全体スケジュール</h1>
          <p className="text-sm mt-1" style={{ color: C.sub }}>2026年 4月</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <ChevronLeft size={18} style={{ color: C.sub }} />
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <ChevronRight size={18} style={{ color: C.sub }} />
          </button>
        </div>
      </div>

      {/* ── Main layout: calendar + detail ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Calendar panel ── */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-xl p-5"
            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            {/* Site legend */}
            <div className="flex flex-wrap gap-2 mb-5">
              {SITES.map(s => (
                <div key={s.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${s.color}12`, border: `1px solid ${s.color}30` }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.name}</span>
                </div>
              ))}
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_LABELS.map((d, i) => (
                <div key={d} className="text-center py-1.5" style={{ fontSize: 11, fontWeight: 700, color: i >= 5 ? "#EF4444" : C.muted }}>
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
                const isToday = dayNum === 2;
                const weekend = WEEKENDS.has(dayNum);
                const events = isValid ? getDayEvents(dayNum) : null;

                return (
                  <button
                    key={cellIdx}
                    disabled={!isValid}
                    onClick={() => isValid && setSelectedDay(isSelected ? null : dayNum)}
                    className="rounded-lg flex flex-col overflow-hidden transition-all"
                    style={{
                      minHeight: 58,
                      background: isSelected
                        ? C.text
                        : isToday
                        ? "#FFFBEB"
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
                        <div className="text-center pt-1.5 pb-0.5">
                          <span style={{
                            fontSize: 13,
                            fontWeight: isToday || isSelected ? 800 : 600,
                            color: isSelected ? "#FFFFFF" : isToday ? C.amberDk : weekend ? "#EF4444" : C.text,
                          }}>
                            {dayNum}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 px-1 pb-1.5">
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
                                width: 14, height: 14,
                                background: isSelected ? "rgba(255,255,255,0.3)" : "#1E293B",
                                fontSize: 8, fontWeight: 800,
                                color: "#FFFFFF",
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
                <span className="text-[10px]" style={{ color: C.muted }}>現場稼働</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 14, height: 14, borderRadius: 7, background: C.text, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 8, color: "#fff", fontWeight: 800 }}>n</span>
                </div>
                <span className="text-[10px]" style={{ color: C.muted }}>作業員数</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 16, height: 16, borderRadius: 4, background: "#FFFBEB", border: `2px solid ${C.amber}` }} />
                <span className="text-[10px]" style={{ color: C.muted }}>今日</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Detail panel ── */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0">
          {selectedDay && selectedEvents ? (
            <div
              className="rounded-xl p-5 flex flex-col gap-5"
              style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} style={{ color: C.amber }} />
                <h2 className="text-base font-bold" style={{ color: C.text }}>
                  4月{selectedDay}日（{DAY_LABELS[(FIRST_DAY_OFFSET + selectedDay - 1) % 7]}）
                </h2>
                {isWeekend && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: "#EF4444" }}>休日</span>
                )}
              </div>

              {selectedEvents.sites.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold tracking-widest uppercase mb-2.5" style={{ color: C.muted }}>稼働現場</p>
                  <div className="flex flex-col gap-2">
                    {selectedEvents.sites.map(s => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg"
                        style={{ background: `${s.color}10`, border: `1.5px solid ${s.color}30` }}
                      >
                        <div style={{ width: 10, height: 28, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                        <p className="text-sm font-bold" style={{ color: C.text }}>{s.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvents.staff.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold tracking-widest uppercase mb-2.5" style={{ color: C.muted }}>
                    出勤予定（{selectedEvents.staff.length}名）
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvents.staff.map(s => (
                      <div
                        key={s.name}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: s.color, color: "#fff" }}
                        >
                          {s.short}
                        </div>
                        <span className="text-sm font-medium" style={{ color: C.text }}>{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvents.equipment.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold tracking-widest uppercase mb-2.5" style={{ color: C.muted }}>重機・車両</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvents.equipment.map(e => (
                      <div
                        key={e.name}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{ background: `${e.color}10`, border: `1px solid ${e.color}25` }}
                      >
                        <span style={{ fontSize: 16 }}>🚜</span>
                        <span className="text-sm font-medium" style={{ color: C.text }}>{e.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvents.sites.length === 0 && selectedEvents.staff.length === 0 && (
                <div
                  className="flex flex-col items-center justify-center py-10 rounded-lg"
                  style={{ background: "#F8FAFC", border: `1px solid ${C.border}` }}
                >
                  <p className="text-sm" style={{ color: C.muted }}>この日の予定はありません</p>
                </div>
              )}
            </div>
          ) : (
            <div
              className="rounded-xl p-8 flex flex-col items-center justify-center text-center"
              style={{ background: C.card, border: `1px dashed ${C.border}` }}
            >
              <Calendar size={32} style={{ color: C.border, marginBottom: 12 }} />
              <p className="text-sm font-medium" style={{ color: C.muted }}>日付を選択すると<br />詳細を表示します</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
