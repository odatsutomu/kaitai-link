import React from "react";
import { DocSite, calcTotals, yen, todayStr, fmtDate } from "../../lib/doc-types";
import {
  DocPaper, DocTitle, HR, ClientIssuerRow, ProjectInfo,
  TotalHighlight, ItemsTable, NotesBox, BankInfo, DocFooter, PrintStyles,
} from "./shared";

interface Props {
  site: DocSite;
  docNo: string;
  issueDate?: string;
}

export function InvoiceDoc({ site, docNo, issueDate = todayStr() }: Props) {
  // Payment due: end of next month
  const dueDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2, 0); // last day of next month
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  })();

  const { total } = calcTotals(site.contractAmount);

  return (
    <>
      <PrintStyles />
      <DocPaper>
        <DocTitle title="請　求　書" docNo={docNo} issueDate={issueDate} />
        <HR thick />

        <ClientIssuerRow site={site} />

        <div style={{ fontSize: 11, color: "#444", marginBottom: 14 }}>
          下記の通り御請求申し上げます。何卒よろしくお願いいたします。
        </div>

        <TotalHighlight label="御請求金額（税込）" amount={site.contractAmount} />

        {/* Payment deadline */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          padding: "8px 14px", background: "${T.primaryLt}",
          border: "1px solid #FED7AA", borderRadius: 4, marginBottom: 16,
          fontSize: 11,
        }}>
          <span style={{ fontWeight: 600, color: "#92400E" }}>支払期限</span>
          <span style={{ color: "#92400E", fontWeight: 700 }}>{dueDate}</span>
        </div>

        <ProjectInfo site={site} />

        <ItemsTable items={site.items} />

        <BankInfo />

        <NotesBox memo={site.memo ? site.memo + "\n\n※ お振込手数料はご負担をお願いいたします。" : "※ お振込手数料はご負担をお願いいたします。"} />

        <DocFooter />
      </DocPaper>
    </>
  );
}
