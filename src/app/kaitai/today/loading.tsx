import { T } from "../lib/design-tokens";

// Today dashboard skeleton
export default function TodayLoading() {
  return (
    <div className="py-6 flex flex-col gap-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 rounded-lg" style={{ background: T.border }} />
        <div className="h-6 w-20 rounded-full" style={{ background: "#F1F5F9" }} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="h-3 w-14 rounded mb-2" style={{ background: T.border }} />
            <div className="h-7 w-10 rounded" style={{ background: T.border }} />
          </div>
        ))}
      </div>
      {/* Map placeholder */}
      <div className="rounded-2xl h-48" style={{ background: "#E2E8F0" }} />
      {[1,2].map(i => (
        <div key={i} className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-5 w-16 rounded-full" style={{ background: "#F1F5F9" }} />
            <div className="h-5 w-32 rounded" style={{ background: T.border }} />
          </div>
          <div className="flex gap-2">
            {[1,2,3].map(j => (
              <div key={j} className="w-8 h-8 rounded-full" style={{ background: T.border }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
