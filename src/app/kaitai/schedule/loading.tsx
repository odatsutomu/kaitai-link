import { T } from "../lib/design-tokens";

// Schedule page skeleton
export default function ScheduleLoading() {
  return (
    <div className="py-6 flex flex-col gap-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 rounded-lg" style={{ background: T.border }} />
        <div className="h-9 w-24 rounded-lg" style={{ background: T.border }} />
      </div>
      {/* Calendar grid placeholder */}
      <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={`h${i}`} className="h-4 rounded" style={{ background: "#F1F5F9" }} />
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="h-12 rounded-lg" style={{ background: i % 5 === 0 ? T.border : "#F8FAFC" }} />
          ))}
        </div>
      </div>
      {/* Event list */}
      {[1,2,3].map(i => (
        <div key={i} className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="h-4 w-32 rounded mb-2" style={{ background: T.border }} />
          <div className="h-3 w-48 rounded" style={{ background: "#F1F5F9" }} />
        </div>
      ))}
    </div>
  );
}
