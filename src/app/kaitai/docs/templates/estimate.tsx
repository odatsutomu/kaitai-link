import React from "react";
import { DocSite, calcTotals, yen, todayStr, fmtDate } from "../../lib/doc-types";
import type { CompanyInfo } from "../../lib/doc-types";
import {
  DocPaper, DocTitle, HR, ClientIssuerRow, ProjectInfo,
  TotalHighlight, ItemsTable, NotesBox, DocFooter, PrintStyles,
} from "./shared";

interface Props {
  site: DocSite;
  docNo: string;
  issueDate?: string;
  company?: CompanyInfo;
  stampUrl?: string | null;
}

export function EstimateDoc({ site, docNo, issueDate = todayStr(), company, stampUrl }: Props) {
  const { subtotal } = calcTotals(site.contractAmount);
  // Expiry: 30 days from today
  const expiry = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  })();

  return (
    <>
      <PrintStyles />
      <DocPaper>
        <DocTitle title="見　積　書" docNo={docNo} issueDate={issueDate} />
        <HR thick />

        <ClientIssuerRow site={site} company={company} stampUrl={stampUrl} />

        <div style={{ fontSize: 11, color: "#444", marginBottom: 14 }}>
          下記の通り御見積申し上げます。
        </div>

        <TotalHighlight label="御見積金額（税込）" amount={subtotal} />

        <ProjectInfo site={site} extra={
          <div style={{ display: "flex", gap: 16, marginTop: 2, fontSize: 11 }}>
            <span style={{ width: 68, color: "#555", fontWeight: 600, flexShrink: 0 }}>有効期限</span>
            <span>本見積書の有効期限は発行日より30日間（{expiry}）</span>
          </div>
        } />

        <ItemsTable items={site.items} />

        <NotesBox memo={site.memo} />

        {/* Signature area */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <div style={{ width: 200, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>上記見積書に同意いたします</div>
            <div style={{ border: "1px solid #bbb", borderRadius: 3, padding: "8px 12px" }}>
              <div style={{ fontSize: 10, color: "#999", marginBottom: 24 }}>会社名・担当者名</div>
              <div style={{ borderTop: "1px solid #bbb", paddingTop: 4, fontSize: 9, color: "#aaa" }}>
                ご署名・ご捺印
              </div>
            </div>
          </div>
        </div>

        <DocFooter />
      </DocPaper>
    </>
  );
}
