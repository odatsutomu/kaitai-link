// Admin dashboard (経営分析) skeleton
export default function AdminLoading() {
  return (
    <div className="py-6 flex flex-col gap-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-7 w-32 rounded-lg" style={{ background: "#E2E8F0" }} />
          <div className="h-4 w-52 rounded mt-2" style={{ background: "#E2E8F0" }} />
        </div>
        <div className="h-10 w-32 rounded-xl" style={{ background: "#E2E8F0" }} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
            <div className="h-3 w-16 rounded mb-3" style={{ background: "#E2E8F0" }} />
            <div className="h-8 w-24 rounded" style={{ background: "#E2E8F0" }} />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E5E7EB", minHeight: 200 }}>
          <div className="h-4 w-28 rounded mb-4" style={{ background: "#E2E8F0" }} />
          <div className="flex items-end gap-3 h-32">
            {[60,80,90,70].map((h, i) => (
              <div key={i} className="flex-1 flex gap-1 items-end">
                <div className="flex-1 rounded-t" style={{ height: `${h}%`, background: "#E2E8F0" }} />
                <div className="flex-1 rounded-t" style={{ height: `${h * 0.7}%`, background: "#F1F5F9" }} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E5E7EB", minHeight: 200 }}>
          <div className="h-4 w-20 rounded mb-4" style={{ background: "#E2E8F0" }} />
          <div className="flex items-center justify-center h-32">
            <div className="w-28 h-28 rounded-full" style={{ background: "#F1F5F9", border: "12px solid #E2E8F0" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
