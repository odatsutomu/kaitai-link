import React from "react";
import { SELF_COMPANY as DEFAULT_COMPANY, FOOTER_BRANDING, LineItem, DocSite, yen, calcTotals, fmtDate } from "../../lib/doc-types";
import type { CompanyInfo } from "../../lib/doc-types";
import { T } from "../../lib/design-tokens";

// ─── Print CSS (injected in every document) ───────────────────────────────────

export function PrintStyles() {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          @page { size: A4 portrait; margin: 12mm 15mm; }
          .doc-paper {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
          }
          .doc-footer { page-break-inside: avoid; }
          .items-table { page-break-inside: auto; }
          .items-table tr { page-break-inside: avoid; }
        }
      `,
    }} />
  );
}

// ─── A4 paper shell ───────────────────────────────────────────────────────────

const PAPER: React.CSSProperties = {
  background: "#ffffff",
  width: 794,
  minHeight: 1122,
  padding: "48px 56px 44px",
  fontFamily: "'Hiragino Kaku Gothic Pro','Yu Gothic Medium','Meiryo','MS PGothic',sans-serif",
  color: "#111111",
  fontSize: 11,
  lineHeight: 1.7,
  boxSizing: "border-box" as const,
};

export function DocPaper({ children }: { children: React.ReactNode }) {
  return <div className="doc-paper" style={PAPER}>{children}</div>;
}

// ─── Title + meta row ─────────────────────────────────────────────────────────

export function DocTitle({
  title, docNo, issueDate,
}: { title: string; docNo: string; issueDate: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: 6, color: "#111" }}>
        {title}
      </h1>
      <div style={{ textAlign: "right", fontSize: 10, color: "#444", lineHeight: 1.9 }}>
        <div>書類番号：{docNo}</div>
        <div>発行日：{issueDate}</div>
      </div>
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function HR({ thick }: { thick?: boolean }) {
  return <div style={{ borderTop: thick ? "2px solid #111" : "1px solid #bbb", margin: "10px 0" }} />;
}

// ─── Client + Issuer two-column ───────────────────────────────────────────────

export function ClientIssuerRow({ site, company }: { site: DocSite; company?: CompanyInfo }) {
  const co = company ?? DEFAULT_COMPANY;
  return (
    <div style={{ display: "flex", gap: 20, marginBottom: 18 }}>
      {/* 宛先 */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, color: "#777", marginBottom: 3, letterSpacing: 1 }}>御宛先</div>
        <div style={{ fontSize: 15, fontWeight: 700, borderBottom: "2px solid #111", paddingBottom: 4, marginBottom: 5, whiteSpace: "nowrap" }}>
          {site.clientName || "（宛先未設定）"}&ensp;様
        </div>
        <div style={{ fontSize: 10, color: "#555", lineHeight: 1.9 }}>
          {site.clientZip && <div>{site.clientZip}</div>}
          {site.clientAddress && <div>{site.clientAddress}</div>}
          {site.clientContact && <div>担当者：{site.clientContact}&ensp;殿</div>}
        </div>
      </div>

      {/* 発行者 */}
      <div style={{ width: 220, borderLeft: "1px solid #ddd", paddingLeft: 18 }}>
        <div style={{ fontSize: 9, color: "#777", marginBottom: 3, letterSpacing: 1 }}>発行者</div>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{co.name}</div>
        <div style={{ fontSize: 10, color: "#444", lineHeight: 1.85 }}>
          <div>{co.zip}</div>
          <div>{co.address}</div>
          <div>TEL：{co.tel}　FAX：{co.fax}</div>
          <div>{co.email}</div>
          <div style={{ marginTop: 3, fontWeight: 600 }}>{co.rep}</div>
          <div style={{ fontSize: 9, color: "#888" }}>適格請求書 登録番号：{co.invoiceNo}</div>
        </div>
        <div style={{
          width: 44, height: 44, border: "1.5px solid #aaa", borderRadius: 3,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, color: "#bbb", marginTop: 6,
        }}>印</div>
      </div>
    </div>
  );
}

// ─── Project info table ───────────────────────────────────────────────────────

export function ProjectInfo({
  site, extra,
}: { site: DocSite; extra?: React.ReactNode }) {
  const rows: [string, string][] = [
    ["件　名", site.name],
    ["工事場所", site.address],
    ["工　期", `${fmtDate(site.startDate)} ～ ${fmtDate(site.endDate)}`],
    ...(site.structureType ? [["構造・規模", `${site.structureType}造　${site.area ? site.area + "㎡" : ""}`] as [string, string]] : []),
  ];
  return (
    <div style={{
      background: T.bg, border: "1px solid #E2E4E8", borderRadius: 4,
      padding: "10px 14px", marginBottom: 16,
    }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", gap: 16, marginBottom: 2, fontSize: 11 }}>
          <span style={{ width: 68, color: "#555", fontWeight: 600, flexShrink: 0 }}>{k}</span>
          <span style={{ fontWeight: 500 }}>{v}</span>
        </div>
      ))}
      {extra}
    </div>
  );
}

// ─── Big total highlight box ──────────────────────────────────────────────────

export function TotalHighlight({ label, amount }: { label: string; amount: number }) {
  const { total } = calcTotals(amount);
  return (
    <div style={{
      border: "2px solid #111", borderRadius: 4, padding: "12px 20px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: 18,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, fontFeatureSettings: "'tnum'" }}>
        {yen(total)}&ensp;<span style={{ fontSize: 11, fontWeight: 500, color: "#555" }}>（税込）</span>
      </div>
    </div>
  );
}

// ─── Line items table ─────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  background: T.text, color: T.bg, fontWeight: 700,
  padding: "7px 6px", fontSize: 10, textAlign: "center" as const,
  border: "1px solid #1E293B",
};
const TD: React.CSSProperties = {
  padding: "6px 8px", fontSize: 10, border: "1px solid #D1D5DB",
  verticalAlign: "middle" as const,
};

export function ItemsTable({ items }: { items: LineItem[] }) {
  const colWidths = [28, 180, 130, 48, 38, 84, 84];
  const headers = ["#", "工事項目", "仕様・内訳", "数量", "単位", "単価", "金額"];

  let subtotal = 0;
  const rows = items.map((it) => {
    const amount = it.qty * it.unitPrice;
    subtotal += amount;
    return { ...it, amount };
  });
  const { tax, total } = calcTotals(subtotal);

  return (
    <div style={{ marginBottom: 16 }}>
      <table className="items-table" style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup>
          {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ ...TH, textAlign: i >= 4 ? "right" as const : "center" as const }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((it, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
              <td style={{ ...TD, textAlign: "center" as const, color: "#888" }}>{i + 1}</td>
              <td style={{ ...TD, fontWeight: 500 }}>{it.name}</td>
              <td style={{ ...TD, color: "#555", fontSize: 9 }}>{it.spec}</td>
              <td style={{ ...TD, textAlign: "right" as const, fontFeatureSettings: "'tnum'" }}>{it.qty.toLocaleString()}</td>
              <td style={{ ...TD, textAlign: "center" as const, color: "#444" }}>{it.unit}</td>
              <td style={{ ...TD, textAlign: "right" as const, fontFeatureSettings: "'tnum'" }}>{yen(it.unitPrice)}</td>
              <td style={{ ...TD, textAlign: "right" as const, fontWeight: 600, fontFeatureSettings: "'tnum'" }}>{yen(it.amount)}</td>
            </tr>
          ))}
          {/* empty filler rows */}
          {rows.length < 8 && Array.from({ length: Math.max(0, 8 - rows.length) }).map((_, i) => (
            <tr key={`empty-${i}`} style={{ background: (rows.length + i) % 2 === 0 ? "#fff" : "#FAFAFA" }}>
              {[...Array(7)].map((__, j) => (
                <td key={j} style={{ ...TD, height: 24 }}>&nbsp;</td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6} style={{ ...TD, textAlign: "right" as const, fontWeight: 600, background: T.bg }}>小計</td>
            <td style={{ ...TD, textAlign: "right" as const, fontWeight: 600, background: T.bg, fontFeatureSettings: "'tnum'" }}>{yen(subtotal)}</td>
          </tr>
          <tr>
            <td colSpan={6} style={{ ...TD, textAlign: "right" as const, color: "#555", background: T.bg }}>消費税（10%）</td>
            <td style={{ ...TD, textAlign: "right" as const, color: "#555", background: T.bg, fontFeatureSettings: "'tnum'" }}>{yen(tax)}</td>
          </tr>
          <tr>
            <td colSpan={6} style={{ ...TD, textAlign: "right" as const, fontWeight: 800, background: T.text, color: "#fff", fontSize: 11 }}>
              合計（税込）
            </td>
            <td style={{ ...TD, textAlign: "right" as const, fontWeight: 800, background: T.text, color: "#fff", fontSize: 12, fontFeatureSettings: "'tnum'" }}>
              {yen(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Notes section ────────────────────────────────────────────────────────────

export function NotesBox({ memo }: { memo?: string }) {
  if (!memo) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#333", marginBottom: 4, letterSpacing: 1 }}>備　考</div>
      <div style={{
        border: "1px solid #D1D5DB", borderRadius: 3, padding: "8px 12px",
        minHeight: 48, fontSize: 10, color: "#444", lineHeight: 1.8,
        whiteSpace: "pre-wrap",
      }}>
        {memo}
      </div>
    </div>
  );
}

// ─── Bank transfer info ───────────────────────────────────────────────────────

export function BankInfo({ company }: { company?: CompanyInfo }) {
  const co = company ?? DEFAULT_COMPANY;
  return (
    <div style={{
      border: "1px solid #D1D5DB", borderRadius: 3, padding: "10px 14px",
      marginBottom: 14, background: "#FFFBF5",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 5, color: "#333" }}>お振込先</div>
      <div style={{ fontSize: 11, lineHeight: 1.9 }}>
        <div>
          <span style={{ fontWeight: 600 }}>{co.bank}</span>
          &ensp;{co.bankType}預金&ensp;
          <span style={{ fontFeatureSettings: "'tnum'", fontWeight: 600 }}>{co.bankNo}</span>
        </div>
        <div>口座名義：<span style={{ fontWeight: 600 }}>{co.bankHolder}</span></div>
      </div>
    </div>
  );
}

// ─── Footer branding ─────────────────────────────────────────────────────────

export function DocFooter() {
  return (
    <div className="doc-footer" style={{
      marginTop: 28, paddingTop: 8, borderTop: "1px solid #E5E7EB",
      textAlign: "center", fontSize: 8, color: "#AAAAAA", letterSpacing: 0.5,
    }}>
      {FOOTER_BRANDING}
    </div>
  );
}
