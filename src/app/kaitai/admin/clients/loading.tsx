// Clients management skeleton
export default function ClientsLoading() {
  return (
    <div className="py-6 flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 rounded-lg" style={{ background: "#E2E8F0" }} />
        <div className="h-10 w-28 rounded-lg" style={{ background: "#E2E8F0" }} />
      </div>
      {[1,2,3,4].map(i => (
        <div key={i} className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
          <div className="h-5 w-32 rounded mb-2" style={{ background: "#E2E8F0" }} />
          <div className="h-3 w-48 rounded mb-1" style={{ background: "#F1F5F9" }} />
          <div className="h-3 w-28 rounded" style={{ background: "#F1F5F9" }} />
        </div>
      ))}
    </div>
  );
}
