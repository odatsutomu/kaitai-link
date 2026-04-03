// Projects (プロジェクト収支) skeleton
export default function ProjectsLoading() {
  return (
    <div className="py-6 flex flex-col gap-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-7 w-44 rounded-lg" style={{ background: "#E2E8F0" }} />
          <div className="h-4 w-56 rounded mt-2" style={{ background: "#E2E8F0" }} />
        </div>
        <div className="h-10 w-24 rounded-lg" style={{ background: "#E2E8F0" }} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
            <div className="h-3 w-14 rounded mb-2" style={{ background: "#E2E8F0" }} />
            <div className="h-7 w-24 rounded" style={{ background: "#E2E8F0" }} />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
        <div className="h-10" style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }} />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderTop: i > 1 ? "1px solid #F1F5F9" : undefined }}>
            <div className="flex-1">
              <div className="h-4 w-36 rounded mb-1" style={{ background: "#E2E8F0" }} />
              <div className="h-3 w-48 rounded" style={{ background: "#F1F5F9" }} />
            </div>
            <div className="h-6 w-16 rounded-full" style={{ background: "#F1F5F9" }} />
            <div className="h-4 w-20 rounded" style={{ background: "#E2E8F0" }} />
            <div className="h-4 w-20 rounded" style={{ background: "#F1F5F9" }} />
            <div className="h-4 w-16 rounded" style={{ background: "#E2E8F0" }} />
            <div className="h-5 w-12 rounded" style={{ background: "#F1F5F9" }} />
            <div className="h-4 w-20 rounded" style={{ background: "#F1F5F9" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
