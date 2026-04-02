"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Mock schedule data ────────────────────────────────────────────────────────

const SITES = [
  { id: "s1", name: "山田邸",   shortName: "山田",   color: "#FF9800", startDay: 1,  endDay: 10 },
  { id: "s2", name: "田中倉庫", shortName: "田中",   color: "#1565C0", startDay: 1,  endDay: 20 },
  { id: "s3", name: "松本AP",   shortName: "松本",   color: "#7B1FA2", startDay: 7,  endDay: 30 },
];

// Staff assignments: which days each person works (April 2026)
const STAFF: { name: string; short: string; color: string; days: number[] }[] = [
  { name: "田中 義雄", short: "田", color: "#FF9800", days: [1,2,3,6,7,8,9,10,13,14,15,16,17,20] },
  { name: "佐藤 健太", short: "佐", color: "#EF5350", days: [1,2,3,6,7,8,9,10,13,14,15] },
  { name: "鈴木 大地", short: "鈴", color: "#4CAF50", days: [7,8,9,10,13,14,15,16,17,20] },
  { name: "山本 拓也", short: "山", color: "#9C27B0", days: [6,7,8,9,13,14] },
  { name: "高橋 真一", short: "高", color: "#00838F", days: [1,2,3,6,7,8,9,10,13,14,15,16,17] },
];

// Equipment: backhoe, truck
const EQUIPMENT: { name: string; short: string; color: string; days: number[] }[] = [
  { name: "バックホウ",     short: "重", color: "#B71C1C", days: [1,2,3,7,8,9,10,13,14] },
  { name: "産廃トラック",   short: "ト", color: "#004D40", days: [3,8,10,14,17,20] },
  { name: "高所作業車",     short: "高", color: "#E65100", days: [7,8,9] },
];

// April 2026: 30 days, starts on Wednesday (offset=2 in Mon=0 grid)
const DAYS_IN_MONTH = 30;
const FIRST_DAY_OFFSET = 2; // Wednesday = index 2 (Mon=0)
const WEEKENDS = new Set<number>(); // 0-based April day indices
for (let i = 0; i < DAYS_IN_MONTH; i++) {
  const col = (FIRST_DAY_OFFSET + i) % 7;
  if (col === 5 || col === 6) WEEKENDS.add(i + 1); // store as day number (1-based)
}

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(2); // default to today (Apr 2)

  // Build full calendar grid (empty leading cells + 30 days + trailing)
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
    <div className="max-w-md mx-auto flex flex-col pb-4">

      {/* ── Header ── */}
      <header
        className="px-5 pt-10 pb-5"
        style={{ borderBottom: "2px solid #EEEEEE" }}
      >
        <div className="flex items-center justify-between mb-1">
          <button className="w-10 h-10 flex items-center justify-center rounded-2xl" style={{ background: "#F5F5F5" }}>
            <ChevronLeft size={20} style={{ color: "#444" }} />
          </button>
          <div className="text-center">
            <p style={{ fontSize: 22, fontWeight: 900, color: "#111111" }}>2026年 4月</p>
            <p style={{ fontSize: 13, color: "#888888" }}>全体スケジュール</p>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-2xl" style={{ background: "#F5F5F5" }}>
            <ChevronRight size={20} style={{ color: "#444" }} />
          </button>
        </div>
      </header>

      <div className="px-3 pt-4">

        {/* ── Legend ── */}
        <div className="flex flex-wrap gap-2 mb-4 px-1">
          {SITES.map(s => (
            <div key={s.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${s.color}18`, border: `1px solid ${s.color}40` }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.name}</span>
            </div>
          ))}
        </div>

        {/* ── Calendar grid ── */}
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAY_LABELS.map((d, i) => (
            <div key={d} className="text-center py-1" style={{ fontSize: 11, fontWeight: 700, color: i >= 5 ? "#EF5350" : "#666666" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
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
                className="rounded-xl flex flex-col overflow-hidden transition-all"
                style={{
                  minHeight: 64,
                  background: isSelected
                    ? "#111111"
                    : isToday
                    ? "#FFF3E0"
                    : weekend
                    ? "#FAFAFA"
                    : "#FFFFFF",
                  border: isSelected
                    ? "2px solid #111111"
                    : isToday
                    ? "2px solid #FF9800"
                    : "1px solid #EEEEEE",
                  opacity: !isValid ? 0 : 1,
                  pointerEvents: !isValid ? "none" : "auto",
                }}
              >
                {isValid && (
                  <>
                    {/* Day number */}
                    <div className="text-center pt-1.5 pb-0.5">
                      <span style={{
                        fontSize: 14,
                        fontWeight: isToday || isSelected ? 900 : 600,
                        color: isSelected ? "#FFFFFF" : isToday ? "#FF9800" : weekend ? "#EF5350" : "#111111",
                      }}>
                        {dayNum}
                      </span>
                    </div>
                    {/* Site color bars */}
                    <div className="flex flex-col gap-0.5 px-1 pb-1.5">
                      {events?.sites.slice(0, 2).map(s => (
                        <div
                          key={s.id}
                          className="rounded-sm px-1"
                          style={{ background: isSelected ? `${s.color}60` : s.color, height: 5 }}
                        />
                      ))}
                      {(events?.sites.length ?? 0) > 2 && (
                        <div className="rounded-sm" style={{ background: "#CCCCCC", height: 4 }} />
                      )}
                    </div>
                    {/* Staff count dot */}
                    {(events?.staff.length ?? 0) > 0 && (
                      <div className="flex justify-center pb-1">
                        <div
                          className="rounded-full flex items-center justify-center"
                          style={{
                            width: 14, height: 14,
                            background: isSelected ? "rgba(255,255,255,0.3)" : "#1565C0",
                            fontSize: 8, fontWeight: 800,
                            color: isSelected ? "#FFFFFF" : "#FFFFFF",
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

        {/* ── Legend mini ── */}
        <div className="flex items-center gap-3 mt-2 px-1">
          <div className="flex items-center gap-1">
            <div style={{ width: 10, height: 5, borderRadius: 2, background: "#FF9800" }} />
            <span style={{ fontSize: 10, color: "#888" }}>現場</span>
          </div>
          <div className="flex items-center gap-1">
            <div style={{ width: 14, height: 14, borderRadius: 7, background: "#1565C0", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 8, color: "#fff", fontWeight: 800 }}>n</span>
            </div>
            <span style={{ fontSize: 10, color: "#888" }}>作業員数</span>
          </div>
          <div style={{ fontSize: 10, color: "#FF9800", fontWeight: 800 }}>2 = 今日</div>
        </div>

        {/* ── Selected day detail ── */}
        {selectedDay && selectedEvents && (
          <div className="mt-5 flex flex-col gap-3">
            <p style={{ fontSize: 18, fontWeight: 900, color: "#111111" }}>
              4月{selectedDay}日（{DAY_LABELS[(FIRST_DAY_OFFSET + selectedDay - 1) % 7]}）の予定
              {isWeekend && <span className="ml-2 text-sm font-bold" style={{ color: "#EF5350" }}>休日</span>}
            </p>

            {selectedEvents.sites.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#888888", marginBottom: 8 }}>稼働現場</p>
                <div className="flex flex-col gap-2">
                  {selectedEvents.sites.map(s => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{ background: `${s.color}10`, border: `1.5px solid ${s.color}30` }}
                    >
                      <div style={{ width: 12, height: 32, borderRadius: 4, background: s.color }} />
                      <p style={{ fontSize: 17, fontWeight: 800, color: "#111111" }}>{s.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedEvents.staff.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#888888", marginBottom: 8 }}>
                  出勤予定メンバー（{selectedEvents.staff.length}名）
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedEvents.staff.map(s => (
                    <div
                      key={s.name}
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                      style={{ background: `${s.color}12`, border: `1px solid ${s.color}30` }}
                    >
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-sm font-bold"
                        style={{ background: s.color, color: "#fff" }}
                      >
                        {s.short}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111111" }}>{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedEvents.equipment.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#888888", marginBottom: 8 }}>重機・車両</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEvents.equipment.map(e => (
                    <div
                      key={e.name}
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                      style={{ background: `${e.color}12`, border: `1px solid ${e.color}30` }}
                    >
                      <span style={{ fontSize: 18 }}>🚜</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111111" }}>{e.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedEvents.sites.length === 0 && selectedEvents.staff.length === 0 && (
              <div
                className="flex items-center justify-center py-8 rounded-2xl"
                style={{ background: "#F5F5F5", border: "1.5px solid #E0E0E0" }}
              >
                <p style={{ fontSize: 16, color: "#AAAAAA" }}>予定なし</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
