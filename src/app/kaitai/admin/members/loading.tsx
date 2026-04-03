// Members management skeleton
export default function MembersLoading() {
  return (
    <div className="py-6 flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-28 rounded-lg" style={{ background: "#E2E8F0" }} />
          <div className="h-4 w-40 rounded mt-2" style={{ background: "#E2E8F0" }} />
        </div>
        <div className="h-10 w-32 rounded-lg" style={{ background: "#E2E8F0" }} />
      </div>
      <div className="h-11 w-full rounded-xl" style={{ background: "#fff", border: "1px solid #E5E7EB" }} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full" style={{ background: "#E2E8F0" }} />
              <div>
                <div className="h-4 w-20 rounded mb-1" style={{ background: "#E2E8F0" }} />
                <div className="h-3 w-14 rounded" style={{ background: "#F1F5F9" }} />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-12 rounded-full" style={{ background: "#F1F5F9" }} />
              <div className="h-5 w-16 rounded-full" style={{ background: "#F1F5F9" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
