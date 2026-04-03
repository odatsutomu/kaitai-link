// Sites management skeleton
export default function SitesLoading() {
  return (
    <div className="py-6 flex flex-col gap-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-28 rounded-lg" style={{ background: "#E2E8F0" }} />
          <div className="h-4 w-48 rounded mt-2" style={{ background: "#E2E8F0" }} />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-lg" style={{ background: "#E2E8F0" }} />
          <div className="h-10 w-32 rounded-lg" style={{ background: "#E2E8F0" }} />
        </div>
      </div>

      {/* Search */}
      <div className="h-11 w-full rounded-xl" style={{ background: "#fff", border: "1px solid #E5E7EB" }} />

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="px-4 py-3 rounded-xl" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
            <div className="h-3 w-12 rounded mb-2" style={{ background: "#E2E8F0" }} />
            <div className="h-8 w-10 rounded" style={{ background: "#E2E8F0" }} />
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="h-16 rounded-xl" style={{ background: "#fff", border: "1px solid #E5E7EB" }} />

      {/* Site cards */}
      {[1,2,3].map(i => (
        <div key={i} className="rounded-xl" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
          <div className="px-5 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-28 rounded-lg" style={{ background: "#E2E8F0" }} />
                <div className="h-4 w-16 rounded" style={{ background: "#F1F5F9" }} />
              </div>
              <div className="h-8 w-14 rounded-lg" style={{ background: "#F1F5F9" }} />
            </div>
            <div className="h-5 w-48 rounded" style={{ background: "#E2E8F0" }} />
            <div className="h-4 w-64 rounded" style={{ background: "#F1F5F9" }} />
            <div className="flex gap-4">
              <div className="h-4 w-36 rounded" style={{ background: "#F1F5F9" }} />
              <div className="h-4 w-24 rounded" style={{ background: "#F1F5F9" }} />
            </div>
          </div>
          <div className="h-10 rounded-b-xl" style={{ background: "#F8FAFC", borderTop: "1px solid #E5E7EB" }} />
        </div>
      ))}
    </div>
  );
}
