"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Printer, FileDown } from "lucide-react";
import { MOCK_DOC_SITES, DOC_META, genDocNo, todayStr, DocType } from "../../lib/doc-types";
import { EstimateDoc }  from "../templates/estimate";
import { InvoiceDoc }   from "../templates/invoice";
import { ReceiptDoc }   from "../templates/receipt";
import { CompletionDoc } from "../templates/completion";
import { ReportDoc }    from "../templates/report";
import { T } from "../../lib/design-tokens";

interface Props { type: string; siteId: string }

export default function PreviewClient({ type, siteId }: Props) {
  const router = useRouter();
  const docType = (type as DocType) in DOC_META ? (type as DocType) : "estimate";
  const site = MOCK_DOC_SITES.find(s => s.id === siteId) ?? MOCK_DOC_SITES[0];
  const meta = DOC_META[docType];
  const docNo = genDocNo(docType, site.id);
  const issueDate = todayStr();

  function handlePrint() {
    const filename = `${meta.label}_${site.name}_${new Date().toISOString().slice(0, 10)}`;
    const prev = document.title;
    document.title = filename;
    window.print();
    document.title = prev;
  }

  const DocComponent = {
    estimate:   <EstimateDoc   site={site} docNo={docNo} issueDate={issueDate} />,
    invoice:    <InvoiceDoc    site={site} docNo={docNo} issueDate={issueDate} />,
    receipt:    <ReceiptDoc    site={site} docNo={docNo} issueDate={issueDate} />,
    completion: <CompletionDoc site={site} docNo={docNo} issueDate={issueDate} />,
    report:     <ReportDoc     site={site} docNo={docNo} issueDate={issueDate} />,
  }[docType];

  return (
    <div style={{ minHeight: "100dvh", background: T.border }}>

      {/* ── Action bar (hidden on print) ── */}
      <div
        className="no-print"
        style={{
          position: "sticky", top: 0, zIndex: 20,
          background: T.text, borderBottom: "1px solid #334155",
          padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            color: T.muted, fontSize: 14, fontWeight: 600,
            background: "none", border: "none", cursor: "pointer", padding: "4px 8px",
            borderRadius: 8,
          }}
        >
          <ChevronLeft size={16} />
          戻る
        </button>

        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.bg }}>
            {meta.emoji} {meta.label}
          </span>
          <span style={{ fontSize: 14, color: T.sub, marginLeft: 12 }}>
            {site.name}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handlePrint}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: T.primary, color: "#fff",
              border: "none", borderRadius: 8, padding: "8px 16px",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            <Printer size={15} />
            印刷・PDF保存
          </button>
        </div>
      </div>

      {/* ── Document preview ── */}
      <div
        className="no-print"
        style={{ padding: "24px 16px 48px", display: "flex", justifyContent: "center" }}
      >
        <div style={{ overflowX: "auto" }}>
          {DocComponent}
        </div>
      </div>

      {/* ── Print-only: document fills the page ── */}
      <div style={{ display: "none" }} className="print-only">
        {DocComponent}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .print-only { display: block !important; }
          }
        `,
      }} />
    </div>
  );
}
