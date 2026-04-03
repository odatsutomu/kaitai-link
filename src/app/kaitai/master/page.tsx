import Link from "next/link";
import { Building2, Truck, ChevronRight, Plus, Edit3, Star, FileText } from "lucide-react";
import { MEMBERS, LICENSE_LABELS, experienceYears, experienceLevel } from "../lib/members";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: "#1E293B", sub: "#64748B", muted: "#94A3B8",
  border: "#E5E7EB", card: "#FFFFFF",
  amber: "#F59E0B", amberDk: "#D97706",
  green: "#10B981",
};

// ─── Mock data ───────────────────────────────────────────────────────────────

const mockSites = [
  {
    id: "s1",
    name: "山田邸解体工事",
    address: "東京都世田谷区豪徳寺2-14-5",
    contractAmount: 3_200_000,
    startDate: "2026-03-18",
    endDate: "2026-04-10",
    status: "解体中",
  },
  {
    id: "s2",
    name: "旧田中倉庫解体",
    address: "神奈川県川崎市幸区堀川町580",
    contractAmount: 5_600_000,
    startDate: "2026-03-25",
    endDate: "2026-04-20",
    status: "解体中",
  },
  {
    id: "s3",
    name: "松本アパート解体",
    address: "埼玉県さいたま市浦和区常盤6-4-21",
    contractAmount: 2_800_000,
    startDate: "2026-04-07",
    endDate: "2026-04-30",
    status: "着工前",
  },
];

const mockWastePrices = [
  { id: "concrete", label: "コンクリートガラ",  unit: "㎥",  price: 8_000 },
  { id: "wood",     label: "木くず",            unit: "㎥",  price: 12_000 },
  { id: "metal",    label: "金属くず",           unit: "kg",  price: 15 },
  { id: "plastic",  label: "廃プラスチック",     unit: "kg",  price: 25 },
  { id: "gypsum",   label: "廃石膏ボード",       unit: "枚",  price: 200 },
  { id: "tile",     label: "瓦",                unit: "ton", price: 6_000 },
  { id: "mixed",    label: "混合廃棄物",         unit: "㎥",  price: 18_000 },
  { id: "asbestos", label: "アスベスト含有廃材", unit: "㎡",  price: 45_000 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${className}`} style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 2px 4px rgba(0,0,0,0.06)", borderRadius: 16 }}>
      {children}
    </div>
  );
}

function SectionLabel({ children, onAdd, addHref }: { children: React.ReactNode; onAdd?: boolean; addHref?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-bold tracking-widest uppercase" style={{ color: C.amber }}>
        {children}
      </p>
      {onAdd && addHref && (
        <Link href={addHref}>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all active:scale-95 hover:opacity-90"
            style={{ background: "#F59E0B", boxShadow: "0 2px 8px rgba(245,158,11,0.35)" }}
          >
            <Plus size={12} /> 追加
          </button>
        </Link>
      )}
      {onAdd && !addHref && (
        <button
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: "rgba(245,158,11,0.1)", color: C.amberDk, border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <Plus size={12} /> 追加
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MasterPage() {
  return (
    <div className="py-6 flex flex-col gap-8 pb-28 md:pb-8">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>マスタ管理</h1>
        <p className="text-sm mt-1" style={{ color: C.sub }}>
          現場・処分単価・労務単価の管理
        </p>
      </div>

      {/* ── 2-column layout on PC ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-8">

          {/* 現場マスタ */}
          <section>
            <SectionLabel onAdd addHref="/kaitai/sites/new">現場マスタ</SectionLabel>
            <div className="flex flex-col gap-2.5">
              {mockSites.map((site) => (
                <Card key={site.id} className="px-5 py-4 flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: "rgba(245,158,11,0.1)" }}
                  >
                    <Building2 size={18} style={{ color: C.amber }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: C.text }}>
                      {site.name}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: C.muted }}>
                      ¥{Math.round(site.contractAmount).toLocaleString("ja-JP")} ·{" "}
                      {site.startDate.replace(/-/g, "/")}〜{site.endDate.replace(/-/g, "/")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-sm font-bold px-2 py-0.5 rounded-full"
                      style={
                        site.status === "解体中"
                          ? { background: "#FFF7ED", color: C.amberDk }
                          : site.status === "着工前"
                          ? { background: "#EFF6FF", color: "#2563EB" }
                          : { background: "#F0FDF4", color: "#16A34A" }
                      }
                    >
                      {site.status}
                    </span>
                    <Link href={`/kaitai/docs?site=${site.id}`}>
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-sm transition-all"
                        style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", color: "#334155", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                        title="帳票出力"
                      >
                        <FileText size={11} />
                        帳票
                      </button>
                    </Link>
                    <Link href={`/kaitai/sites/${site.id}/edit`}>
                      <button className="inline-flex items-center p-2 rounded-xl transition-all" style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", color: "#334155", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                        <Edit3 size={14} />
                      </button>
                    </Link>
                    <div className="flex items-center justify-center w-7 h-7 rounded-full" style={{ background: "#FFF8E6", color: "#F59E0B" }}><ChevronRight size={12} /></div>
                  </div>
                </Card>
              ))}
              <Link href="/kaitai/sites/new">
                <button
                  className="w-full rounded-xl py-4 flex items-center justify-center gap-2 transition-colors hover:bg-gray-50"
                  style={{ background: C.card, border: `1.5px dashed ${C.border}` }}
                >
                  <Plus size={16} style={{ color: C.muted }} />
                  <span className="text-sm" style={{ color: C.muted }}>新規現場を登録</span>
                </button>
              </Link>
            </div>
          </section>

          {/* 処分単価マスタ */}
          <section>
            <SectionLabel onAdd>処分単価マスタ</SectionLabel>
            <Card>
              <div
                className="grid grid-cols-12 px-5 py-3 text-sm font-bold uppercase tracking-wider"
                style={{ color: C.muted, borderBottom: `1px solid ${C.border}`, background: "#F8FAFC" }}
              >
                <span className="col-span-5">品目</span>
                <span className="col-span-2 text-center">単位</span>
                <span className="col-span-4 text-right">単価</span>
                <span className="col-span-1" />
              </div>
              {mockWastePrices.map((item, i) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 items-center px-5 py-3.5"
                  style={{ borderBottom: i < mockWastePrices.length - 1 ? `1px solid #F1F5F9` : undefined }}
                >
                  <div className="col-span-5 flex items-center gap-2.5">
                    <Truck size={12} style={{ color: C.muted }} className="flex-shrink-0" />
                    <span className="text-sm font-medium truncate" style={{ color: C.text }}>
                      {item.label}
                    </span>
                  </div>
                  <span className="col-span-2 text-center text-sm" style={{ color: C.muted }}>
                    {item.unit}
                  </span>
                  <span
                    className="col-span-4 text-right text-sm font-bold font-numeric"
                    style={{ color: C.amberDk }}
                  >
                    ¥{item.price.toLocaleString()}
                  </span>
                  <div className="col-span-1 flex justify-end">
                    <button className="p-1 rounded hover:bg-gray-50" style={{ color: C.muted }}>
                      <Edit3 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
            <p className="text-sm mt-2 px-1" style={{ color: C.muted }}>
              ※ 単価変更は翌日以降の産廃集計に反映されます
            </p>
          </section>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-8">

          {/* 労務単価マスタ */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold tracking-widest uppercase" style={{ color: C.amber }}>
                労務単価マスタ（メンバー別）
              </p>
              <Link href="/kaitai/members" className="text-sm font-semibold" style={{ color: C.amber }}>
                詳細 →
              </Link>
            </div>
            <Card>
              <div
                className="grid grid-cols-12 px-5 py-3 text-sm font-bold uppercase tracking-wider"
                style={{ color: C.muted, borderBottom: `1px solid ${C.border}`, background: "#F8FAFC" }}
              >
                <span className="col-span-5">氏名</span>
                <span className="col-span-2 text-center">種別</span>
                <span className="col-span-4 text-right">日当</span>
                <span className="col-span-1" />
              </div>
              {MEMBERS.map((m, i) => {
                const yrs = experienceYears(m);
                const lvl = experienceLevel(yrs);
                return (
                  <div
                    key={m.id}
                    className="grid grid-cols-12 items-center px-5 py-3.5"
                    style={{ borderBottom: i < MEMBERS.length - 1 ? "1px solid #F1F5F9" : undefined }}
                  >
                    <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold"
                        style={{ background: lvl.bg, color: lvl.color }}
                      >
                        {m.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: C.text }}>
                          {m.name}
                        </p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: lvl.stars }).map((_, si) => (
                            <Star key={si} size={8} fill={lvl.color} style={{ color: lvl.color }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <span
                        className="text-sm font-bold px-1.5 py-0.5 rounded-full"
                        style={
                          m.type === "直用"
                            ? { background: "#EFF6FF", color: "#2563EB" }
                            : { background: "#F0FDF4", color: "#16A34A" }
                        }
                      >
                        {m.type}
                      </span>
                    </div>
                    <span
                      className="col-span-4 text-right text-sm font-bold font-numeric"
                      style={{ color: C.amberDk }}
                    >
                      ¥{m.dayRate.toLocaleString()}
                    </span>
                    <div className="col-span-1 flex justify-end">
                      <button className="p-1.5 rounded-lg transition-all hover:bg-slate-100" style={{ color: "#334155", border: "1px solid #E5E7EB" }}>
                        <Edit3 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </Card>
            <p className="text-sm mt-2 px-1" style={{ color: C.muted }}>
              ※ 常用単価 / 日（税抜）· 労務費 ＝ 日当 × 出勤日数で自動計算
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
