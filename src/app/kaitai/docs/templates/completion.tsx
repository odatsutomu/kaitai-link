import React from "react";
import { DocSite, SELF_COMPANY, todayStr, fmtDate } from "../../lib/doc-types";
import type { CompanyInfo } from "../../lib/doc-types";
import { DocPaper, DocTitle, HR, ProjectInfo, NotesBox, DocFooter, PrintStyles } from "./shared";
import { T } from "../../lib/design-tokens";

interface Props {
  site:            DocSite;
  docNo:           string;
  issueDate?:      string;
  wasteDisposals?: WasteDisposalItem[];
  photoUrls?:      string[];
  company?:        CompanyInfo;
}

export interface WasteDisposalItem {
  wasteType:     string;
  processorName: string;
  unit:          string;
  quantity:      number;
  unitPrice:     number;
}

const WORK_ITEMS = [
  "仮設工事（足場・養生シート設置）",
  "内部造作・設備撤去",
  "アスベスト等有害物質対応",
  "構造体解体（重機使用）",
  "産廃分別・搬出",
  "基礎解体・埋設物確認",
  "残土処分・地盤整地",
  "清掃・後片付け",
];

export function CompletionDoc({ site, docNo, issueDate = todayStr(), wasteDisposals = [], photoUrls = [], company }: Props) {
  const co = company ?? SELF_COMPANY;
  const totalWasteCost = wasteDisposals.reduce((s, w) => s + w.quantity * w.unitPrice, 0);

  return (
    <>
      <PrintStyles />
      <DocPaper>
        <DocTitle title="工事完了報告書" docNo={docNo} issueDate={issueDate} />
        <HR thick />

        {/* To / From */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: "#777", marginBottom: 3 }}>提出先</div>
            <div style={{ fontSize: 15, fontWeight: 700, borderBottom: "2px solid #111", paddingBottom: 3, display: "inline-block" }}>
              {site.clientName || "（宛先未設定）"}&ensp;様
            </div>
            {site.clientContact && (
              <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>担当：{site.clientContact}&ensp;殿</div>
            )}
          </div>
          <div style={{ textAlign: "right", fontSize: 10, color: "#444", lineHeight: 1.9 }}>
            <div style={{ fontWeight: 700 }}>{co.name}</div>
            <div>{co.rep}</div>
            <div>{co.tel}</div>
          </div>
        </div>

        <div style={{ fontSize: 11, marginBottom: 14 }}>
          下記工事が完了しましたのでご報告申し上げます。
        </div>

        <ProjectInfo site={site} extra={
          <div style={{ display: "flex", gap: 16, marginTop: 2, fontSize: 11 }}>
            <span style={{ width: 68, color: "#555", fontWeight: 600, flexShrink: 0 }}>完了日</span>
            <span style={{ fontWeight: 700 }}>{fmtDate(site.endDate)}</span>
          </div>
        } />

        {/* Work items checklist */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#333", marginBottom: 6, letterSpacing: 1 }}>
            実施工程一覧
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr>
                <th style={{ background: T.text, color: "#fff", padding: "6px 10px", textAlign: "left", fontWeight: 700, border: "1px solid #1E293B", width: 280 }}>工程</th>
                <th style={{ background: T.text, color: "#fff", padding: "6px 10px", textAlign: "center", fontWeight: 700, border: "1px solid #1E293B", width: 60 }}>実施</th>
                <th style={{ background: T.text, color: "#fff", padding: "6px 10px", textAlign: "left", fontWeight: 700, border: "1px solid #1E293B" }}>備考・確認事項</th>
              </tr>
            </thead>
            <tbody>
              {WORK_ITEMS.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "7px 10px", border: "1px solid #D1D5DB" }}>{item}</td>
                  <td style={{ padding: "7px 10px", border: "1px solid #D1D5DB", textAlign: "center", fontSize: 13 }}>✓</td>
                  <td style={{ padding: "7px 10px", border: "1px solid #D1D5DB", color: "#999" }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Waste disposal section */}
        {wasteDisposals.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#333", marginBottom: 6, letterSpacing: 1 }}>
              廃材処理明細
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr>
                  <th style={{ background: T.text, color: "#fff", padding: "6px 10px", textAlign: "left", fontWeight: 700, border: "1px solid #1E293B" }}>廃材の種類</th>
                  <th style={{ background: T.text, color: "#fff", padding: "6px 10px", textAlign: "left", fontWeight: 700, border: "1px solid #1E293B" }}>処理場</th>
                  <th style={{ background: T.text, color: "#fff", padding: "6px 10px", textAlign: "right", fontWeight: 700, border: "1px solid #1E293B", width: 70 }}>数量</th>
                  <th style={{ background: T.text, color: "#fff", padding: "6px 10px", textAlign: "right", fontWeight: 700, border: "1px solid #1E293B", width: 80 }}>単価</th>
                  <th style={{ background: T.text, color: "#fff", padding: "6px 10px", textAlign: "right", fontWeight: 700, border: "1px solid #1E293B", width: 90 }}>金額</th>
                </tr>
              </thead>
              <tbody>
                {wasteDisposals.map((w, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <td style={{ padding: "7px 10px", border: "1px solid #D1D5DB" }}>{w.wasteType}</td>
                    <td style={{ padding: "7px 10px", border: "1px solid #D1D5DB", color: "#555" }}>{w.processorName}</td>
                    <td style={{ padding: "7px 10px", border: "1px solid #D1D5DB", textAlign: "right" }}>{w.quantity.toLocaleString()}{w.unit}</td>
                    <td style={{ padding: "7px 10px", border: "1px solid #D1D5DB", textAlign: "right" }}>¥{w.unitPrice.toLocaleString()}/{w.unit}</td>
                    <td style={{ padding: "7px 10px", border: "1px solid #D1D5DB", textAlign: "right", fontWeight: 700 }}>¥{(w.quantity * w.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ padding: "7px 10px", border: "1px solid #D1D5DB", textAlign: "right", fontWeight: 700, background: "#F8FAFC" }}>
                    廃材処理費合計
                  </td>
                  <td style={{ padding: "7px 10px", border: "1px solid #D1D5DB", textAlign: "right", fontWeight: 700, background: "#F8FAFC", color: "#B45309" }}>
                    ¥{totalWasteCost.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Photo area */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#333", marginBottom: 6, letterSpacing: 1 }}>
            現場写真（完了確認）
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {photoUrls.length > 0
              ? photoUrls.slice(0, 6).map((url, i) => (
                  <div key={i} style={{
                    border: "1px solid #bbb", borderRadius: 4, height: 120,
                    overflow: "hidden", background: "#FAFAFA",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`現場写真 ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))
              : ["施工前", "施工中", "完了後"].map((label) => (
                  <div key={label} style={{
                    border: "1px dashed #bbb", borderRadius: 4, height: 90,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    background: "#FAFAFA",
                  }}>
                    <div style={{ fontSize: 16, color: "#ddd" }}>📷</div>
                    <div style={{ fontSize: 9, color: "#bbb", marginTop: 4 }}>{label}</div>
                  </div>
                ))
            }
          </div>
        </div>

        <NotesBox memo={site.memo} />

        {/* Confirmation signatures */}
        <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
          {["施工確認（発注者）", "施工確認（元請け）", "施工責任者"].map((label) => (
            <div key={label} style={{ flex: 1, border: "1px solid #bbb", borderRadius: 3 }}>
              <div style={{ background: T.bg, padding: "4px 8px", fontSize: 9, fontWeight: 700, color: "#555", borderBottom: "1px solid #ddd" }}>
                {label}
              </div>
              <div style={{ height: 52, padding: "6px 8px" }}>
                <div style={{ borderBottom: "1px solid #E2E4E8", marginTop: 24 }} />
              </div>
            </div>
          ))}
        </div>

        <DocFooter />
      </DocPaper>
    </>
  );
}
