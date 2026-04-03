// Evaluation skeleton
export default function EvaluationLoading() {
  return (
    <div className="py-6 flex flex-col gap-6 animate-pulse">
      <div>
        <div className="h-7 w-28 rounded-lg" style={{ background: "#E2E8F0" }} />
        <div className="h-4 w-48 rounded mt-2" style={{ background: "#E2E8F0" }} />
      </div>
      <div className="h-10 w-48 rounded-lg" style={{ background: "#E2E8F0" }} />
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderTop: i > 1 ? "1px solid #F1F5F9" : undefined }}>
            <div className="w-8 h-8 rounded-full" style={{ background: "#E2E8F0" }} />
            <div className="h-4 w-20 rounded" style={{ background: "#E2E8F0" }} />
            <div className="flex-1 flex gap-2">
              {[1,2,3,4].map(j => (
                <div key={j} className="h-8 w-20 rounded" style={{ background: "#F1F5F9" }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
