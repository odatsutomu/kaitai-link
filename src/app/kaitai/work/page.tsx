import Link from "next/link";
import { Play, StopCircle, ChevronRight, MapPin } from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: "#1E293B", sub: "#64748B", muted: "#94A3B8",
  border: "#E2E8F0", card: "#FFFFFF",
  amber: "#F59E0B", amberDk: "#D97706",
};

// ─── Mock data ───────────────────────────────────────────────────────────────

const activeSites = [
  { id: "s1", name: "山田邸解体工事",   address: "東京都世田谷区豪徳寺2-14-5",   status: "解体中", progress: 65 },
  { id: "s2", name: "旧田中倉庫解体",   address: "神奈川県川崎市幸区堀川町580",  status: "解体中", progress: 40 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkSelectPage() {
  return (
    <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>作業報告</h1>
        <p className="text-sm mt-1" style={{ color: C.sub }}>
          現場を選んで「作業開始」または「作業終了・産廃入力」へ
        </p>
      </div>

      {/* ── Site cards grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {activeSites.map((site) => (
          <div
            key={site.id}
            className="overflow-hidden"
            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 2px 4px rgba(0,0,0,0.06)", borderRadius: 16 }}
          >
            {/* Progress bar top strip */}
            <div className="h-1" style={{ background: "#F1F5F9" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${site.progress}%`, background: C.amber }}
              />
            </div>

            <div className="p-6">
              {/* Site info */}
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: "rgba(245,158,11,0.1)" }}
                >
                  <MapPin size={20} style={{ color: C.amber }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
                      {site.name}
                    </p>
                    <span
                      style={{ fontSize: 14, fontWeight: 700, padding: "2px 10px", borderRadius: 20, flexShrink: 0, background: "#FFF7ED", color: C.amberDk }}
                    >
                      {site.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: C.muted }}>
                    {site.address}
                  </p>
                  <p style={{ fontSize: 14, marginTop: 6, color: C.muted }}>
                    進捗 <span style={{ fontWeight: 700, color: C.amberDk }}>{site.progress}%</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/kaitai/work/start?site=${site.id}`}>
                  <button
                    className="w-full flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{
                      background: C.amber, color: "#fff",
                      fontSize: 15, fontWeight: 700, padding: "12px 20px", borderRadius: 12,
                      boxShadow: "0 2px 12px rgba(245,158,11,0.35)",
                    }}
                  >
                    <Play size={16} color="#fff" fill="#fff" />
                    作業開始
                  </button>
                </Link>
                <Link href={`/kaitai/work/end?site=${site.id}`}>
                  <button
                    className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                    style={{ background: C.card, border: `1.5px solid ${C.amber}`, fontSize: 15, fontWeight: 700, padding: "12px 20px", borderRadius: 12 }}
                  >
                    <StopCircle size={16} style={{ color: C.amber }} />
                    <span style={{ color: C.amberDk }}>終了・産廃</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── View all link ── */}
      <Link href="/kaitai">
        <div
          className="rounded-xl px-5 py-4 flex items-center gap-3 hover:shadow-sm transition-all"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: C.sub }}>
            すべての現場を見る
          </span>
          <div className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: "#FFF8E6", color: "#F59E0B" }}><ChevronRight size={16} /></div>
        </div>
      </Link>
    </div>
  );
}
