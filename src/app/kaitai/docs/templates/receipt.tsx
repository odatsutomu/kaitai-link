import React from "react";
import { DocSite, calcTotals, yen, todayStr, SELF_COMPANY, FOOTER_BRANDING } from "../../lib/doc-types";
import type { CompanyInfo } from "../../lib/doc-types";
import { PrintStyles, StampSeal } from "./shared";
import { T } from "../../lib/design-tokens";

interface Props {
  site: DocSite;
  docNo: string;
  issueDate?: string;
  company?: CompanyInfo;
  stampUrl?: string | null;
}

export function ReceiptDoc({ site, docNo, issueDate = todayStr(), company, stampUrl }: Props) {
  const co = company ?? SELF_COMPANY;
  const { subtotal, tax, total } = calcTotals(site.contractAmount);

  return (
    <>
      <PrintStyles />
      <div className="doc-paper" style={{
        background: "#ffffff",
        width: 794,
        minHeight: 1122,
        padding: "64px 80px",
        fontFamily: "'Hiragino Kaku Gothic Pro','Yu Gothic Medium','Meiryo','MS PGothic',sans-serif",
        color: "#111",
        fontSize: 11,
        lineHeight: 1.7,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: 12, margin: 0 }}>領　収　書</h1>
          <div style={{ fontSize: 10, color: "#666", marginTop: 6 }}>
            No. {docNo}　　発行日：{issueDate}
          </div>
        </div>

        <div style={{ borderTop: "2px solid #111", borderBottom: "1px solid #bbb", margin: "0 0 28px" }} />

        {/* Recipient */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#777", marginBottom: 4 }}>御宛先</div>
          <div style={{ fontSize: 20, fontWeight: 700, borderBottom: "2px solid #111", paddingBottom: 6, display: "inline-block", minWidth: 300 }}>
            {site.clientName || "（宛先未設定）"}&ensp;様
          </div>
        </div>

        {/* Amount (large) */}
        <div style={{
          border: "2px solid #111", borderRadius: 6, padding: "20px 28px",
          marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>領収金額（税込）</div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: 2, fontFeatureSettings: "'tnum'" }}>
            {yen(total)}
          </div>
        </div>

        {/* But-writing (但し書き) */}
        <div style={{
          display: "flex", gap: 12, alignItems: "flex-start",
          fontSize: 12, marginBottom: 6,
        }}>
          <span style={{ width: 56, fontWeight: 600, color: "#444", flexShrink: 0 }}>但　し</span>
          <span>{site.name} 解体工事代金として</span>
        </div>

        <div style={{ display: "flex", gap: 12, fontSize: 12, marginBottom: 28 }}>
          <span style={{ width: 56, fontWeight: 600, color: "#444", flexShrink: 0 }}>上記正に</span>
          <span>領収いたしました</span>
        </div>

        {/* Tax breakdown */}
        <div style={{
          background: T.bg, border: "1px solid #E2E4E8", borderRadius: 4,
          padding: "10px 16px", marginBottom: 28, display: "inline-block",
        }}>
          <table style={{ borderCollapse: "collapse", fontSize: 10 }}>
            <tbody>
              <tr>
                <td style={{ padding: "2px 16px 2px 0", color: "#555" }}>税抜金額</td>
                <td style={{ fontFeatureSettings: "'tnum'", textAlign: "right" }}>{yen(subtotal)}</td>
              </tr>
              <tr>
                <td style={{ padding: "2px 16px 2px 0", color: "#555" }}>消費税額（10%）</td>
                <td style={{ fontFeatureSettings: "'tnum'", textAlign: "right" }}>{yen(tax)}</td>
              </tr>
              <tr style={{ borderTop: "1px solid #ddd" }}>
                <td style={{ padding: "4px 16px 0 0", fontWeight: 700 }}>合計（税込）</td>
                <td style={{ fontFeatureSettings: "'tnum'", fontWeight: 700, textAlign: "right" }}>{yen(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Issuer */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 240 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{co.name}</div>
            <div style={{ fontSize: 10, color: "#444", lineHeight: 1.9 }}>
              <div>{co.zip}　{co.address}</div>
              <div>TEL：{co.tel}</div>
              <div>{co.email}</div>
              <div style={{ marginTop: 3, fontWeight: 600 }}>{co.rep}</div>
              <div style={{ fontSize: 9, color: "#888" }}>登録番号：{co.invoiceNo}</div>
            </div>
            <StampSeal stampUrl={stampUrl} size={56} />
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Footer branding */}
        <div style={{
          marginTop: 28, paddingTop: 8, borderTop: "1px solid #E5E7EB",
          textAlign: "center", fontSize: 8, color: "#AAAAAA",
        }}>
          {FOOTER_BRANDING}
        </div>
      </div>
    </>
  );
}
