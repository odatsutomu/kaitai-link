import React from "react";
import { DocSite, SELF_COMPANY, todayStr } from "../../lib/doc-types";
import { DocPaper, DocTitle, HR, DocFooter, PrintStyles } from "./shared";

export interface DemolitionCertData {
  landAddress:   string;   // 所在地
  houseNo:       string;   // 家屋番号
  structureKind: string;   // 種類（居宅・店舗等）
  floor1Area:    string;   // 1階床面積
  floor2Area:    string;   // 2階床面積
  floor3Area:    string;   // 3階床面積
}

interface Props {
  site:        DocSite;
  certData:    DemolitionCertData;
  docNo:       string;
  issueDate?:  string;
}

const ROW_STYLE: React.CSSProperties = {
  display: "flex",
  borderBottom: "1px solid #D1D5DB",
  fontSize: 11,
  lineHeight: 1.8,
};
const LABEL_STYLE: React.CSSProperties = {
  width: 120,
  padding: "8px 12px",
  background: "#F8FAFC",
  fontWeight: 600,
  color: "#444",
  borderRight: "1px solid #D1D5DB",
  flexShrink: 0,
};
const VALUE_STYLE: React.CSSProperties = {
  padding: "8px 14px",
  flex: 1,
  color: "#111",
};

export function DemolitionCertDoc({ site, certData, docNo, issueDate = todayStr() }: Props) {
  const totalArea = [certData.floor1Area, certData.floor2Area, certData.floor3Area]
    .filter(Boolean)
    .map(v => parseFloat(v) || 0)
    .reduce((s, v) => s + v, 0);

  return (
    <>
      <PrintStyles />
      <DocPaper>
        <DocTitle title="建物滅失証明書" docNo={docNo} issueDate={issueDate} />
        <HR thick />

        {/* Intro text */}
        <div style={{ fontSize: 11, color: "#333", marginBottom: 20, lineHeight: 1.9 }}>
          下記建物は解体工事により滅失したことを証明いたします。
        </div>

        {/* Building info table */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#555", marginBottom: 8, textTransform: "uppercase" as const }}>
            建物の表示
          </div>
          <div style={{ border: "1px solid #D1D5DB", borderRadius: 4, overflow: "hidden" }}>
            <div style={ROW_STYLE}>
              <div style={LABEL_STYLE}>所　在</div>
              <div style={VALUE_STYLE}>{certData.landAddress || "　"}</div>
            </div>
            <div style={ROW_STYLE}>
              <div style={LABEL_STYLE}>家屋番号</div>
              <div style={VALUE_STYLE}>{certData.houseNo || "　"}</div>
            </div>
            <div style={ROW_STYLE}>
              <div style={LABEL_STYLE}>種　類</div>
              <div style={VALUE_STYLE}>{certData.structureKind || "　"}</div>
            </div>
            <div style={ROW_STYLE}>
              <div style={LABEL_STYLE}>構造・規模</div>
              <div style={VALUE_STYLE}>
                {site.structureType ? `${site.structureType}造` : "　"}
              </div>
            </div>
            <div style={ROW_STYLE}>
              <div style={LABEL_STYLE}>床面積</div>
              <div style={{ ...VALUE_STYLE }}>
                <div style={{ display: "flex", gap: 28, flexWrap: "wrap" as const }}>
                  {certData.floor1Area && (
                    <span>1階　<strong>{parseFloat(certData.floor1Area).toFixed(2)}</strong> ㎡</span>
                  )}
                  {certData.floor2Area && (
                    <span>2階　<strong>{parseFloat(certData.floor2Area).toFixed(2)}</strong> ㎡</span>
                  )}
                  {certData.floor3Area && (
                    <span>3階　<strong>{parseFloat(certData.floor3Area).toFixed(2)}</strong> ㎡</span>
                  )}
                  {totalArea > 0 && (
                    <span style={{ color: "#777" }}>（合計　{totalArea.toFixed(2)} ㎡）</span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ ...ROW_STYLE, borderBottom: "none" }}>
              <div style={LABEL_STYLE}>工事場所</div>
              <div style={VALUE_STYLE}>{site.address}</div>
            </div>
          </div>
        </div>

        {/* Work details */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#555", marginBottom: 8 }}>
            解体工事の概要
          </div>
          <div style={{ border: "1px solid #D1D5DB", borderRadius: 4, overflow: "hidden" }}>
            <div style={ROW_STYLE}>
              <div style={LABEL_STYLE}>工事名称</div>
              <div style={VALUE_STYLE}>{site.name}</div>
            </div>
            <div style={ROW_STYLE}>
              <div style={LABEL_STYLE}>施工場所</div>
              <div style={VALUE_STYLE}>{site.address}</div>
            </div>
            <div style={ROW_STYLE}>
              <div style={LABEL_STYLE}>施工期間</div>
              <div style={VALUE_STYLE}>
                {site.startDate.replace(/-/g, "/")} ～ {site.endDate.replace(/-/g, "/")}
              </div>
            </div>
            <div style={{ ...ROW_STYLE, borderBottom: "none" }}>
              <div style={LABEL_STYLE}>建物所有者</div>
              <div style={VALUE_STYLE}>{site.clientName || "　"}</div>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 40 }} />

        {/* Certification by contractor */}
        <div style={{ marginTop: 40, marginBottom: 20 }}>
          <div style={{ fontSize: 11, marginBottom: 16, color: "#333", lineHeight: 1.9 }}>
            上記のとおり、解体工事が完了し建物が滅失したことを証明します。
          </div>
          <div style={{ textAlign: "right" as const }}>
            <div style={{ display: "inline-block", textAlign: "left" as const, fontSize: 11, lineHeight: 2.1 }}>
              <div>証明年月日　{issueDate}</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ marginRight: 24 }}>証明者（施工業者）</span>
              </div>
              <div style={{ marginLeft: 120 }}>
                <div>所在地　{SELF_COMPANY.address || "　　　　　　　　　　　　　　"}</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>
                  {SELF_COMPANY.name || "　　　　　　　　　　　　"}
                </div>
                <div>代表者　{SELF_COMPANY.rep || "　　　　　　　　"}&ensp;㊞</div>
              </div>
            </div>
          </div>
        </div>

        {/* Seal box */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, border: "2px solid #aaa", borderRadius: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: "#bbb", fontWeight: 700,
          }}>
            印
          </div>
        </div>

        <HR />

        <div style={{ fontSize: 9, color: "#999", marginBottom: 4, lineHeight: 1.7 }}>
          ※この証明書は建物滅失登記申請の添付書類として使用されます。<br />
          ※登記申請には本書面に加え、解体業者の資格証明書等が必要な場合があります。
        </div>

        <DocFooter />
      </DocPaper>
    </>
  );
}
