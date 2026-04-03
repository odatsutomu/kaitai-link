"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { mockSites } from "../../page";
import { T } from "../../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
  green: "#10B981", red: "#EF4444", blue: "#3B82F6",
};

const fmt = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;

function marginColor(pct: number) {
  if (pct >= 30) return { text: C.green,   bg: "#F0FDF4", border: "#BBF7D0" };
  if (pct >= 15) return { text: C.amberDk, bg: T.primaryLt, border: T.primaryMd };
  return              { text: C.red,      bg: "#FEF2F2", border: "#FECACA" };
}

type SortKey = "name" | "contract" | "margin" | "status";

export default function AdminProjectsPage() {
  const [sort, setSort] = useState<SortKey>("status");
  const [dir, setDir]   = useState<1 | -1>(1);

  function toggleSort(key: SortKey) {
    if (sort === key) setDir(d => (d === 1 ? -1 : 1));
    else { setSort(key); setDir(1); }
  }

  const sites = [...mockSites].sort((a, b) => {
    if (sort === "name")     return dir * a.name.localeCompare(b.name);
    if (sort === "contract") return dir * (a.contract - b.contract);
    if (sort === "margin") {
      const ma = a.cost > 0 ? (a.contract - a.cost) / a.contract : 0;
      const mb = b.cost > 0 ? (b.contract - b.cost) / b.contract : 0;
      return dir * (ma - mb);
    }
    // status sort: 解体中 > 着工前 > 完工
    const order: Record<string, number> = { "解体中": 0, "着工前": 1, "完工": 2 };
    return dir * ((order[a.status] ?? 9) - (order[b.status] ?? 9));
  });

  // Totals
  const total     = mockSites.reduce((s, x) => s + x.contract, 0);
  const totalCost = mockSites.reduce((s, x) => s + x.cost, 0);
  const totalProfit = total - totalCost;
  const avgMargin = total > 0 ? Math.round((totalProfit / total) * 100) : 0;
  const activeCount = mockSites.filter(s => s.status === "解体中").length;

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 transition-colors"
      style={{ fontSize: 13, fontWeight: 700, color: sort === k ? C.amber : C.sub }}
    >
      {label}
      {sort === k && (dir === 1
        ? <TrendingUp size={11} />
        : <TrendingDown size={11} />
      )}
    </button>
  );

  return (
    <div className="py-6 flex flex-col gap-6">

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>プロジェクト収支一覧</h1>
        <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>受注額・原価・粗利を現場単位で管理</p>
      </div>

      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "受注総額",   value: fmt(total),        color: C.blue,    icon: null },
          { label: "原価合計",   value: fmt(totalCost),    color: C.sub,     icon: null },
          { label: "粗利合計",   value: fmt(totalProfit),  color: C.green,   icon: null },
          { label: "平均粗利率", value: `${avgMargin}%`,   color: avgMargin >= 25 ? C.green : avgMargin >= 15 ? C.amberDk : C.red, icon: null },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px",
 }}>
            <p style={{ fontSize: 13, color: C.sub, marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden",
 }}>

        {/* Table header */}
        <div
          className="grid items-center px-5 py-3"
          style={{
            gridTemplateColumns: "1fr 120px 130px 130px 110px 80px 90px",
            background: T.bg,
            borderBottom: `1px solid ${C.border}`,
            gap: 8,
          }}
        >
          <SortBtn k="name"     label="現場名" />
          <SortBtn k="status"   label="ステータス" />
          <SortBtn k="contract" label="受注額" />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>原価（現在）</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>粗利（予測）</span>
          <SortBtn k="margin"   label="粗利率" />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>完工予定</span>
        </div>

        {/* Rows */}
        {sites.map((site, i) => {
          const profit = site.cost > 0 ? site.contract - site.cost : null;
          const pct    = profit && site.contract > 0 ? Math.round((profit / site.contract) * 100) : null;
          const mc     = pct !== null ? marginColor(pct) : null;

          const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
            "解体中": { bg: T.primaryLt, color: "#92400E", dot: C.amber },
            "着工前": { bg: "#EFF6FF", color: "#1D4ED8", dot: C.blue  },
            "完工":   { bg: "#F0FDF4", color: "#166534", dot: C.green },
          };
          const ss = statusStyle[site.status];

          const isAlert = pct !== null && pct < 15;

          return (
            <div
              key={site.id}
              className="grid items-center px-5 py-4 transition-colors hover:bg-amber-50/30"
              style={{
                gridTemplateColumns: "1fr 120px 130px 130px 110px 80px 90px",
                borderTop: i > 0 ? `1px solid ${C.border}` : undefined,
                background: isAlert ? "#FFF9F9" : undefined,
                gap: 8,
              }}
            >
              {/* 現場名 */}
              <div className="flex items-center gap-2 min-w-0">
                {isAlert && <AlertTriangle size={13} style={{ color: C.red, flexShrink: 0 }} />}
                {!isAlert && pct !== null && pct >= 30 && <CheckCircle size={13} style={{ color: C.green, flexShrink: 0 }} />}
                <div className="min-w-0">
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{site.name}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>{site.address}</p>
                </div>
              </div>

              {/* ステータス */}
              <span
                className="flex items-center gap-1 px-2 py-1 rounded-full w-fit text-xs font-bold"
                style={{ background: ss.bg, color: ss.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: ss.dot }} />
                {site.status}
              </span>

              {/* 受注額 */}
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                {fmt(site.contract)}
              </span>

              {/* 原価 */}
              <span style={{ fontSize: 14, color: site.cost > 0 ? C.text : C.muted }}>
                {site.cost > 0 ? fmt(site.cost) : "未入力"}
              </span>

              {/* 粗利 */}
              <span style={{ fontSize: 14, fontWeight: 700, color: profit ? (profit > 0 ? C.green : C.red) : C.muted }}>
                {profit !== null ? fmt(profit) : "—"}
              </span>

              {/* 粗利率 */}
              {pct !== null && mc ? (
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold w-fit"
                  style={{ background: mc.bg, color: mc.text, border: `1px solid ${mc.border}` }}
                >
                  {pct}%
                </span>
              ) : (
                <span style={{ fontSize: 13, color: C.muted }}>—</span>
              )}

              {/* 完工予定 */}
              <span style={{ fontSize: 13, color: C.sub }}>
                {site.endDate.replace(/-/g, "/")}
              </span>
            </div>
          );
        })}

        {/* Footer totals */}
        <div
          className="grid items-center px-5 py-3"
          style={{
            gridTemplateColumns: "1fr 120px 130px 130px 110px 80px 90px",
            background: T.bg,
            borderTop: `2px solid ${C.border}`,
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>合計 {mockSites.length}件（稼働中 {activeCount}件）</span>
          <span />
          <span style={{ fontSize: 14, fontWeight: 800, color: C.blue }}>{fmt(total)}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.sub }}>{fmt(totalCost)}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.green }}>{fmt(totalProfit)}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: avgMargin >= 25 ? C.green : avgMargin >= 15 ? C.amberDk : C.red }}>
            {avgMargin}%
          </span>
          <span />
        </div>
      </div>

      {/* ── Cost breakdown ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px",
 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.sub, marginBottom: 16 }}>原価内訳（全現場合計）</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "産廃コスト",   value: mockSites.reduce((s, x) => s + x.breakdown.waste, 0),  color: C.red   },
            { label: "労務費",       value: mockSites.reduce((s, x) => s + x.breakdown.labor, 0),  color: C.blue  },
            { label: "その他経費",   value: mockSites.reduce((s, x) => s + x.breakdown.other, 0),  color: C.muted },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: T.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{fmt(value)}</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                {totalCost > 0 ? `原価比 ${Math.round((value / totalCost) * 100)}%` : "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
