import React from "react";
import { DocSite, SELF_COMPANY, FOOTER_BRANDING, todayStr, fmtDate, yen } from "../../lib/doc-types";
import { DocPaper, DocTitle, HR, ProjectInfo, NotesBox, DocFooter, PrintStyles } from "./shared";
import { T } from "../../lib/design-tokens";

interface Props {
  site: DocSite;
  docNo: string;
  issueDate?: string;
}

const WASTE_RECORDS = [
  { type: "コンクリートガラ",     unit: "㎥",  qty: 15,   disposal: "〇〇産廃業者" },
  { type: "木材廃材",            unit: "㎥",  qty: 22,   disposal: "△△処理場" },
  { type: "金属スクラップ",       unit: "kg",  qty: 480,  disposal: "□□リサイクル" },
  { type: "その他混合廃棄物",     unit: "㎥",  qty: 4,    disposal: "〇〇産廃業者" },
];

const DAILY_WORK = [
  { date: "3/18", work: "仮設工事・養生シート設置",        crew: 4 },
  { date: "3/19", work: "内部造作撤去・設備切断",          crew: 5 },
  { date: "3/20", work: "屋根解体・上部構造解体開始",      crew: 6 },
  { date: "3/21", work: "構造体解体（重機投入）",          crew: 5 },
  { date: "3/22", work: "基礎解体・土工事",               crew: 4 },
  { date: "3/25", work: "産廃搬出・整地",                 crew: 4 },
  { date: "3/26", work: "残土処分・清掃・完了確認",        crew: 3 },
];

export function ReportDoc({ site, docNo, issueDate = todayStr() }: Props) {
  return (
    <>
      <PrintStyles />
      <DocPaper>
        <DocTitle title="作　業　報　告　書" docNo={docNo} issueDate={issueDate} />
        <HR thick />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: "#777", marginBottom: 3 }}>提出先</div>
            <div style={{ fontSize: 14, fontWeight: 700, borderBottom: "2px solid #111", paddingBottom: 3, display: "inline-block" }}>
              {site.clientName || "（宛先未設定）"}&ensp;様
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 10, color: "#444", lineHeight: 1.9 }}>
            <div style={{ fontWeight: 700 }}>{SELF_COMPANY.name}</div>
            <div>{SELF_COMPANY.rep}</div>
            <div>TEL：{SELF_COMPANY.tel}</div>
          </div>
        </div>

        <ProjectInfo site={site} extra={
          <div style={{ display: "flex", gap: 16, marginTop: 2, fontSize: 11 }}>
            <span style={{ width: 68, color: "#555", fontWeight: 600, flexShrink: 0 }}>報告期間</span>
            <span>{fmtDate(site.startDate)} ～ {fmtDate(site.endDate)}</span>
          </div>
        } />

        {/* Daily work log */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#333", marginBottom: 5, letterSpacing: 1 }}>
            作業日誌
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr>
                {["日付", "作業内容", "人数"].map((h, i) => (
                  <th key={h} style={{
                    background: T.text, color: "#fff", padding: "6px 8px",
                    textAlign: i === 2 ? "center" : "left",
                    fontWeight: 700, border: "1px solid #1E293B",
                    width: i === 0 ? 52 : i === 2 ? 48 : undefined,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAILY_WORK.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "6px 8px", border: "1px solid #D1D5DB", fontWeight: 600, whiteSpace: "nowrap" }}>{row.date}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #D1D5DB" }}>{row.work}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #D1D5DB", textAlign: "center" }}>{row.crew}名</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Waste disposal log */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#333", marginBottom: 5, letterSpacing: 1 }}>
            産廃処理記録
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr>
                {["廃棄物の種類", "数量", "単位", "処理業者"].map((h, i) => (
                  <th key={h} style={{
                    background: "#374151", color: "#fff", padding: "6px 8px",
                    textAlign: i === 1 ? "right" : "left",
                    fontWeight: 700, border: "1px solid #374151",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WASTE_RECORDS.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "5px 8px", border: "1px solid #D1D5DB" }}>{row.type}</td>
                  <td style={{ padding: "5px 8px", border: "1px solid #D1D5DB", textAlign: "right", fontFeatureSettings: "'tnum'" }}>{row.qty.toLocaleString()}</td>
                  <td style={{ padding: "5px 8px", border: "1px solid #D1D5DB" }}>{row.unit}</td>
                  <td style={{ padding: "5px 8px", border: "1px solid #D1D5DB", color: "#555" }}>{row.disposal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Photos */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#333", marginBottom: 5, letterSpacing: 1 }}>現場写真</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
            {["着工前", "解体中①", "解体中②", "完了後"].map((l) => (
              <div key={l} style={{
                border: "1px dashed #bbb", borderRadius: 3, height: 70,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: "#FAFAFA",
              }}>
                <div style={{ fontSize: 14, color: "#ddd" }}>📷</div>
                <div style={{ fontSize: 8, color: "#bbb", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <NotesBox memo={site.memo} />

        {/* Sign-off */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          {["報告者（担当）", "確認（現場責任者）", "承認（管理者）"].map((label) => (
            <div key={label} style={{ flex: 1, border: "1px solid #bbb", borderRadius: 3 }}>
              <div style={{ background: T.bg, padding: "3px 8px", fontSize: 9, fontWeight: 700, color: "#555", borderBottom: "1px solid #ddd" }}>
                {label}
              </div>
              <div style={{ height: 44 }}>
                <div style={{ borderBottom: "1px solid #E2E4E8", margin: "0 8px", marginTop: 30 }} />
              </div>
            </div>
          ))}
        </div>

        <DocFooter />
      </DocPaper>
    </>
  );
}
