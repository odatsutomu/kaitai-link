// Calendar management skeleton
export default function CalendarLoading() {
  return (
    <div className="py-6 flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 rounded-lg" style={{ background: "#E2E8F0" }} />
        <div className="h-10 w-28 rounded-lg" style={{ background: "#E2E8F0" }} />
      </div>
      <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={`h${i}`} className="h-4 rounded" style={{ background: "#F1F5F9" }} />
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="h-16 rounded-lg" style={{ background: i % 7 === 0 ? "#F1F5F9" : "#FAFAFA" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
