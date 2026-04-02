import Link from "next/link";
import { Building2, Truck, ChevronRight, Plus, Edit3, Star, FileText } from "lucide-react";
import { MEMBERS, LICENSE_LABELS, experienceYears, experienceLevel } from "../lib/members";

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
  { id: "concrete", label: "コンクリートガラ",  unit: "㎥",   price: 8_000 },
  { id: "wood",     label: "木くず",            unit: "㎥",   price: 12_000 },
  { id: "metal",    label: "金属くず",           unit: "kg",   price: 15 },
  { id: "plastic",  label: "廃プラスチック",     unit: "kg",   price: 25 },
  { id: "gypsum",   label: "廃石膏ボード",       unit: "枚",   price: 200 },
  { id: "tile",     label: "瓦",                unit: "ton",  price: 6_000 },
  { id: "mixed",    label: "混合廃棄物",         unit: "㎥",   price: 18_000 },
  { id: "asbestos", label: "アスベスト含有廃材", unit: "㎡",   price: 45_000 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl ${className}`} style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
      {children}
    </div>
  );
}

function SectionLabel({ children, onAdd, addHref }: { children: React.ReactNode; onAdd?: boolean; addHref?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#F97316" }}>
        {children}
      </p>
      {onAdd && addHref && (
        <Link href={addHref}>
          <button
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl font-semibold"
            style={{ background: "rgba(249,115,22,0.1)", color: "#FB923C" }}
          >
            <Plus size={12} /> 追加
          </button>
        </Link>
      )}
      {onAdd && !addHref && (
        <button
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl font-semibold"
          style={{ background: "rgba(249,115,22,0.1)", color: "#FB923C" }}
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
    <div className="max-w-md mx-auto flex flex-col gap-5 pb-4">

      {/* ── Header ── */}
      <section className="px-5 pt-12 pb-6" style={{ borderBottom: "1px solid #2D3E54" }}>
        <h1 className="text-xl font-bold mb-1" style={{ color: "#F1F5F9" }}>マスタ管理</h1>
        <p className="text-sm" style={{ color: "#64748B" }}>
          現場・処分単価・労務単価の管理
        </p>
      </section>

      <div className="px-4 flex flex-col gap-6">

        {/* ══════════════════════════════════════════════
            現場マスタ
        ══════════════════════════════════════════════ */}
        <section>
          <SectionLabel onAdd addHref="/kaitai/sites/new">現場マスタ</SectionLabel>
          <div className="flex flex-col gap-2">
            {mockSites.map((site) => (
              <Card key={site.id} className="px-4 py-3 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: "rgba(249,115,22,0.1)" }}
                >
                  <Building2 size={16} style={{ color: "#F97316" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#F1F5F9" }}>
                    {site.name}
                  </p>
                  <p className="text-xs" style={{ color: "#64748B" }}>
                    ¥{(site.contractAmount / 10_000).toFixed(0)}万 ·{" "}
                    {site.startDate.replace(/-/g, "/")}〜{site.endDate.replace(/-/g, "/")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={
                      site.status === "解体中"
                        ? { background: "rgba(249,115,22,0.1)", color: "#FB923C" }
                        : site.status === "着工前"
                        ? { background: "rgba(99,102,241,0.1)", color: "#818CF8" }
                        : { background: "rgba(34,197,94,0.1)", color: "#4ADE80" }
                    }
                  >
                    {site.status}
                  </span>
                  <Link href={`/kaitai/docs?site=${site.id}`}>
                    <button
                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg"
                      style={{ background: "rgba(249,115,22,0.1)", color: "#FB923C" }}
                      title="帳票出力"
                    >
                      <FileText size={11} />
                      帳票
                    </button>
                  </Link>
                  <button style={{ color: "#475569" }}>
                    <Edit3 size={14} />
                  </button>
                </div>
              </Card>
            ))}
            <Link href="/kaitai/sites/new">
              <button
                className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2"
                style={{ background: "#0F1928", border: "1.5px dashed #2D3E54" }}
              >
                <Plus size={16} style={{ color: "#475569" }} />
                <span className="text-sm" style={{ color: "#475569" }}>新規現場を登録</span>
              </button>
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            処分単価マスタ
        ══════════════════════════════════════════════ */}
        <section>
          <SectionLabel onAdd>処分単価マスタ</SectionLabel>
          <Card>
            <div
              className="grid grid-cols-12 px-4 py-2 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "#64748B", borderBottom: "1px solid #2D3E54" }}
            >
              <span className="col-span-5">品目</span>
              <span className="col-span-2 text-center">単位</span>
              <span className="col-span-4 text-right">単価</span>
              <span className="col-span-1" />
            </div>
            {mockWastePrices.map((item, i) => (
              <div
                key={item.id}
                className="grid grid-cols-12 items-center px-4 py-3"
                style={{ borderBottom: i < mockWastePrices.length - 1 ? "1px solid #0F1928" : undefined }}
              >
                <div className="col-span-5 flex items-center gap-2">
                  <Truck size={12} style={{ color: "#475569" }} className="flex-shrink-0" />
                  <span className="text-xs font-medium truncate" style={{ color: "#F1F5F9" }}>
                    {item.label}
                  </span>
                </div>
                <span className="col-span-2 text-center text-xs" style={{ color: "#64748B" }}>
                  {item.unit}
                </span>
                <span
                  className="col-span-4 text-right text-sm font-bold"
                  style={{ color: "#FBBF24", fontFeatureSettings: "'tnum'" }}
                >
                  ¥{item.price.toLocaleString()}
                </span>
                <div className="col-span-1 flex justify-end">
                  <button style={{ color: "#475569" }}><Edit3 size={13} /></button>
                </div>
              </div>
            ))}
          </Card>
          <p className="text-xs mt-2 px-1" style={{ color: "#64748B" }}>
            ※ 単価変更は翌日以降の産廃集計に反映されます
          </p>
        </section>

        {/* ══════════════════════════════════════════════
            労務単価マスタ（メンバー別）
        ══════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#F97316" }}>
              労務単価マスタ（メンバー別）
            </p>
            <Link href="/kaitai/members" className="text-xs" style={{ color: "#F97316" }}>
              詳細 →
            </Link>
          </div>
          <Card>
            {/* Header */}
            <div
              className="grid grid-cols-12 px-4 py-2 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "#64748B", borderBottom: "1px solid #2D3E54" }}
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
                  className="grid grid-cols-12 items-center px-4 py-3"
                  style={{ borderBottom: i < MEMBERS.length - 1 ? "1px solid #0F1928" : undefined }}
                >
                  {/* Name + level */}
                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{ background: lvl.bg, color: lvl.color }}
                    >
                      {m.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#F1F5F9" }}>
                        {m.name}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: lvl.stars }).map((_, si) => (
                          <Star key={si} size={8} fill={lvl.color} style={{ color: lvl.color }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Type */}
                  <div className="col-span-2 flex justify-center">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={
                        m.type === "直用"
                          ? { background: "rgba(99,102,241,0.1)", color: "#818CF8" }
                          : { background: "rgba(34,197,94,0.1)", color: "#4ADE80" }
                      }
                    >
                      {m.type}
                    </span>
                  </div>
                  {/* Day rate */}
                  <span
                    className="col-span-4 text-right text-sm font-bold"
                    style={{ color: "#FBBF24", fontFeatureSettings: "'tnum'" }}
                  >
                    ¥{m.dayRate.toLocaleString()}
                  </span>
                  <div className="col-span-1 flex justify-end">
                    <button style={{ color: "#475569" }}><Edit3 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </Card>
          <p className="text-xs mt-2 px-1" style={{ color: "#64748B" }}>
            ※ 常用単価 / 日（税抜）· 労務費 ＝ 日当 × 出勤日数で自動計算
          </p>
        </section>

      </div>
    </div>
  );
}
