// Activity log skeleton
export default function ActivityLoading() {
  return (
    <div className="py-6 flex flex-col gap-6 animate-pulse">
      <div>
        <div className="h-7 w-36 rounded-lg" style={{ background: "#E2E8F0" }} />
        <div className="h-4 w-44 rounded mt-2" style={{ background: "#E2E8F0" }} />
      </div>
      <div className="rounded-2xl" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="flex items-center gap-3 px-5 py-3" style={{ borderTop: i > 1 ? "1px solid #F1F5F9" : undefined }}>
            <div className="w-8 h-8 rounded-full" style={{ background: "#E2E8F0" }} />
            <div className="flex-1">
              <div className="h-4 w-48 rounded mb-1" style={{ background: "#E2E8F0" }} />
              <div className="h-3 w-28 rounded" style={{ background: "#F1F5F9" }} />
            </div>
            <div className="h-3 w-16 rounded" style={{ background: "#F1F5F9" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
