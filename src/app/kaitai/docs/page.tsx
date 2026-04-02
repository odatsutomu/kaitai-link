"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, FileText, X, Building2, ChevronRight } from "lucide-react";
import { MOCK_DOC_SITES, DOC_META, DocType, DocSite, yen, calcTotals } from "../lib/doc-types";

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
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl"
        style={{ background: "#1A2535", border: "1px solid #2D3E54", paddingBottom: 24 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid #2D3E54", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 900, color: "#F1F5F9" }}>帳票を選択</p>
            <p style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{site.name}</p>
          </div>
          <button onClick={onClose} style={{ background: "#0F1928", border: "none", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} color="#64748B" />
          </button>
        </div>

        {/* Doc types */}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {docTypes.map(([type, meta]) => (
            <button
              key={type}
              onClick={() => router.push(`/kaitai/docs/preview?type=${type}&site=${site.id}`)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 16px", borderRadius: 16, textAlign: "left",
                background: "#0F1928", border: "1px solid #2D3E54",
                cursor: "pointer", width: "100%",
              }}
            >
              <span style={{ fontSize: 24 }}>{meta.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>{meta.label}</p>
                <p style={{ fontSize: 11, color: "#64748B", margin: "2px 0 0" }}>{meta.desc}</p>
              </div>
              <ChevronRight size={16} color="#475569" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const router = useRouter();
  const [selectedSite, setSelectedSite] = useState<DocSite | null>(null);

  return (
    <div className="max-w-md mx-auto flex flex-col pb-8" style={{ minHeight: "100dvh", background: "#080F1A" }}>

      {/* Header */}
      <header className="px-5 pt-10 pb-4" style={{ borderBottom: "1px solid #1E2D3D" }}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 14, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={20} color="#94A3B8" />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "#F1F5F9", margin: 0 }}>帳票出力</h1>
            <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>案件を選択して帳票を生成</p>
          </div>
        </div>

        {/* Available doc types */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {Object.entries(DOC_META).map(([, meta]) => (
            <span
              key={meta.label}
              style={{
                fontSize: 10, fontWeight: 600, color: "#94A3B8",
                background: "#1A2535", border: "1px solid #2D3E54",
                borderRadius: 20, padding: "3px 10px",
              }}
            >
              {meta.emoji} {meta.label}
            </span>
          ))}
        </div>
      </header>

      {/* Site list */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 2, margin: 0 }}>
          案件を選択
        </p>

        {MOCK_DOC_SITES.map(site => {
          const { total } = calcTotals(site.contractAmount);
          return (
            <div
              key={site.id}
              style={{
                background: "#1A2535", border: "1px solid #2D3E54", borderRadius: 16,
                padding: "16px",
              }}
            >
              {/* Site info */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, background: "rgba(249,115,22,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 size={16} color="#F97316" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{site.name}</p>
                  <p style={{ fontSize: 10, color: "#64748B", margin: "2px 0 0" }}>{site.address}</p>
                  <p style={{ fontSize: 10, color: "#64748B", margin: "1px 0 0" }}>
                    {site.startDate.replace(/-/g, "/")} ～ {site.endDate.replace(/-/g, "/")}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#FBBF24", margin: 0 }}>{yen(total)}</p>
                  <p style={{ fontSize: 9, color: "#475569", margin: "1px 0 0" }}>税込</p>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, display: "inline-block", marginTop: 4,
                    background: site.status === "施工中" ? "rgba(249,115,22,0.1)" : site.status === "着工前" ? "rgba(99,102,241,0.1)" : "rgba(34,197,94,0.1)",
                    color: site.status === "施工中" ? "#FB923C" : site.status === "着工前" ? "#818CF8" : "#4ADE80",
                  }}>
                    {site.status}
                  </span>
                </div>
              </div>

              {/* Client */}
              {site.clientName && (
                <p style={{ fontSize: 10, color: "#64748B", marginBottom: 10 }}>
                  発注者：{site.clientName}{site.clientContact ? `（${site.clientContact}）` : ""}
                </p>
              )}

              {/* 帳票出力 button */}
              <button
                onClick={() => setSelectedSite(site)}
                style={{
                  width: "100%", padding: "10px 0", borderRadius: 12,
                  background: "#F97316", color: "#fff", border: "none",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <FileText size={15} />
                帳票を出力する
              </button>
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
