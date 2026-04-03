import { T } from "./lib/design-tokens";

// Worker home page skeleton
export default function HomeLoading() {
  return (
    <div className="py-6 flex flex-col gap-5 animate-pulse">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="h-3 w-14 rounded mb-2" style={{ background: T.border }} />
            <div className="h-8 w-10 rounded mb-1" style={{ background: T.border }} />
            <div className="h-3 w-8 rounded" style={{ background: "#F1F5F9" }} />
          </div>
        ))}
      </div>

      {/* Site cards */}
      {[1,2,3].map(i => (
        <div key={i} className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          {/* Card header */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 rounded-full" style={{ background: "#F1F5F9" }} />
                <div className="h-4 w-16 rounded" style={{ background: "#F1F5F9" }} />
              </div>
              <div className="h-4 w-20 rounded" style={{ background: "#F1F5F9" }} />
            </div>
            <div className="h-5 w-40 rounded mb-2" style={{ background: T.border }} />
            <div className="h-4 w-56 rounded mb-3" style={{ background: "#F1F5F9" }} />
            {/* Progress bar */}
            <div className="h-2 w-full rounded-full" style={{ background: "#F1F5F9" }} />
          </div>
          {/* Workers */}
          <div className="px-4 py-3" style={{ borderTop: `1px solid ${T.border}`, background: "#F8FAFC" }}>
            <div className="flex gap-2">
              {[1,2,3].map(j => (
                <div key={j} className="w-7 h-7 rounded-full" style={{ background: T.border }} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
