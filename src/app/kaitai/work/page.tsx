import Link from "next/link";
import { Play, StopCircle, ChevronRight, MapPin } from "lucide-react";

// ─── Mock data ───────────────────────────────────────────────────────────────

const activeSites = [
  { id: "s1", name: "山田邸解体工事",   address: "東京都世田谷区豪徳寺2-14-5",   status: "解体中" },
  { id: "s2", name: "旧田中倉庫解体",   address: "神奈川県川崎市幸区堀川町580",  status: "解体中" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkSelectPage() {
  return (
    <div className="max-w-md mx-auto flex flex-col gap-5 pb-4">
      <section
        className="px-5 pt-12 pb-6"
        style={{ borderBottom: "1px solid #2D3E54" }}
      >
        <h1 className="text-xl font-bold mb-1" style={{ color: "#F1F5F9" }}>
          作業報告
        </h1>
        <p className="text-sm" style={{ color: "#64748B" }}>
          現場を選んで「作業開始」または「作業終了・産廃入力」へ
        </p>
      </section>

      <div className="px-4 flex flex-col gap-4">
        {activeSites.map((site) => (
          <div
            key={site.id}
            className="rounded-2xl p-4"
            style={{ background: "#1A2535", border: "1px solid #2D3E54" }}
          >
            {/* Site name */}
            <div className="flex items-start gap-2 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: "rgba(249,115,22,0.1)" }}
              >
                <MapPin size={16} style={{ color: "#F97316" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-snug" style={{ color: "#F1F5F9" }}>
                  {site.name}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: "#64748B" }}>
                  {site.address}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/kaitai/work/start?site=${site.id}`}>
                <button
                  className="w-full rounded-xl py-3.5 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                  style={{
                    background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
                    boxShadow: "0 3px 14px rgba(249,115,22,0.25)",
                  }}
                >
                  <Play size={15} color="#fff" fill="#fff" />
                  <span className="text-sm font-bold" style={{ color: "#fff" }}>作業開始</span>
                </button>
              </Link>
              <Link href={`/kaitai/work/end?site=${site.id}`}>
                <button
                  className="w-full rounded-xl py-3.5 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                  style={{ background: "#0F1928", border: "1.5px solid #F97316" }}
                >
                  <StopCircle size={15} style={{ color: "#F97316" }} />
                  <span className="text-sm font-bold" style={{ color: "#F97316" }}>終了・産廃</span>
                </button>
              </Link>
            </div>
          </div>
        ))}

        {/* View all sites */}
        <Link href="/kaitai">
          <div
            className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
            style={{ background: "#1A2535", border: "1px solid #2D3E54" }}
          >
            <span className="flex-1 text-sm" style={{ color: "#94A3B8" }}>
              すべての現場を見る
            </span>
            <ChevronRight size={15} style={{ color: "#2D3E54" }} />
          </div>
        </Link>
      </div>
    </div>
  );
}
