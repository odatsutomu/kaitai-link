"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, X, Building2, ChevronRight } from "lucide-react";
import { MOCK_DOC_SITES, DOC_META, DocType, DocSite, yen, calcTotals } from "../lib/doc-types";
import { T } from "../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  text: T.text,
  sub: T.sub,
  muted: T.muted,
  border: T.border,
  card: T.surface,
  amber: T.primary,
  amberDk: T.primaryDk,
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg: string; fg: string }> = {
  施工中: { bg: "${T.primaryLt}", fg: T.primaryDk },
  着工前: { bg: "#F5F3FF", fg: "#7C3AED" },
  完工:   { bg: "#F0FDF4", fg: "#16A34A" },
};

// ─── Doc type selector modal ──────────────────────────────────────────────────

function DocTypeModal({
  site,
  onClose,
}: {
  site: DocSite;
  onClose: () => void;
}) {
  const router = useRouter();
  const docTypes = Object.entries(DOC_META) as [DocType, (typeof DOC_META)[DocType]][];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          maxWidth: 520,
          width: "100%",
          paddingBottom: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>帳票を選択</p>
            <p style={{ fontSize: 14, color: C.sub, marginTop: 2 }}>{site.name}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: T.bg,
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} color={C.sub} />
          </button>
        </div>

        {/* Doc types */}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {docTypes.map(([type, meta]) => (
            <button
              key={type}
              onClick={() => router.push(`/kaitai/docs/preview?type=${type}&site=${site.id}`)}
              className="hover:bg-gray-50"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                borderRadius: 12,
                textAlign: "left",
                background: T.bg,
                border: `1px solid ${C.border}`,
                cursor: "pointer",
                width: "100%",
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: 24 }}>{meta.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{meta.label}</p>
                <p style={{ fontSize: 14, color: C.sub, margin: "2px 0 0" }}>{meta.desc}</p>
              </div>
              <ChevronRight size={16} color={C.muted} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [selectedSite, setSelectedSite] = useState<DocSite | null>(null);

  return (
    <div className="px-4 md:px-8 py-6 pb-24 md:pb-8">

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>帳票出力</h1>
        <p style={{ fontSize: 14, color: C.sub, margin: "4px 0 0" }}>案件を選択して帳票を生成</p>

        {/* Available doc types */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {Object.entries(DOC_META).map(([, meta]) => (
            <span
              key={meta.label}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.amberDk,
                background: T.primaryLt,
                border: "1px solid #E5E7EB",
                borderRadius: 20,
                padding: "5px 12px",
              }}
            >
              {meta.emoji} {meta.label}
            </span>
          ))}
        </div>
      </header>

      {/* Site grid */}
      <p
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: 2,
          margin: "0 0 12px",
        }}
      >
        案件を選択
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: 16 }}>
        {MOCK_DOC_SITES.map(site => {
          const { total } = calcTotals(site.contractAmount);
          const badge = STATUS_BADGE[site.status] ?? { bg: T.bg, fg: C.sub };

          return (
            <div
              key={site.id}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {/* Amber accent strip */}
              <div style={{ height: 4, background: C.amber }} />

              <div style={{ padding: 16 }}>
                {/* Site info */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: T.primaryLt,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Building2 size={16} color={C.amber} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: C.text,
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {site.name}
                    </p>
                    <p style={{ fontSize: 14, color: C.sub, margin: "2px 0 0" }}>{site.address}</p>
                    <p style={{ fontSize: 14, color: C.sub, margin: "1px 0 0" }}>
                      {site.startDate.replace(/-/g, "/")} ～ {site.endDate.replace(/-/g, "/")}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: C.amberDk, margin: 0 }}>{yen(total)}</p>
                    <p style={{ fontSize: 14, color: C.muted, margin: "1px 0 0" }}>税込</p>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        padding: "5px 12px",
                        borderRadius: 20,
                        display: "inline-block",
                        marginTop: 4,
                        background: badge.bg,
                        color: badge.fg,
                      }}
                    >
                      {site.status}
                    </span>
                  </div>
                </div>

                {/* Client */}
                {site.clientName && (
                  <p style={{ fontSize: 14, color: C.sub, marginBottom: 12 }}>
                    発注者：{site.clientName}{site.clientContact ? `（${site.clientContact}）` : ""}
                  </p>
                )}

                {/* 帳票出力 button */}
                <button
                  onClick={() => setSelectedSite(site)}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    borderRadius: 12,
                    background: C.amber,
                    color: "#fff",
                    border: "none",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <FileText size={15} />
                  帳票を出力する
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedSite && (
        <DocTypeModal site={selectedSite} onClose={() => setSelectedSite(null)} />
      )}
    </div>
  );
}
