// Skills management skeleton
export default function SkillsLoading() {
  return (
    <div className="py-6 flex flex-col gap-6 animate-pulse">
      <div>
        <div className="h-7 w-28 rounded-lg" style={{ background: "#E2E8F0" }} />
        <div className="h-4 w-44 rounded mt-2" style={{ background: "#E2E8F0" }} />
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
        <div className="h-10" style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }} />
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex items-center gap-3 px-5 py-3" style={{ borderTop: i > 1 ? "1px solid #F1F5F9" : undefined }}>
            <div className="h-4 w-20 rounded" style={{ background: "#E2E8F0" }} />
            <div className="flex-1 flex gap-2">
              {[1,2,3,4,5].map(j => (
                <div key={j} className="h-6 w-6 rounded" style={{ background: "#F1F5F9" }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
