"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronLeft, Printer, Plus, X, Trash2 } from "lucide-react";
import { DOC_META, genDocNo, todayStr, DocType } from "../../lib/doc-types";
import type { DocSite, LineItem } from "../../lib/doc-types";
import { EstimateDoc }       from "../templates/estimate";
import { InvoiceDoc }        from "../templates/invoice";
import { ReceiptDoc }        from "../templates/receipt";
import { CompletionDoc, WasteDisposalItem } from "../templates/completion";
import { ReportDoc }         from "../templates/report";
import { DemolitionCertDoc } from "../templates/demolition-cert";
import type { DemolitionCertData } from "../templates/demolition-cert";
import { T } from "../../lib/design-tokens";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcessorPrice {
  wasteType: string;
  unit:      string;
  unitPrice: number;
}

interface Processor {
  id:     string;
  name:   string;
  prices: ProcessorPrice[];
}

interface WasteRow {
  wasteType:   string;
  processorId: string;
  quantity:    number;
}

const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
  red: "#EF4444",
};

// ─── Waste Disposal Panel ─────────────────────────────────────────────────────

function WasteDisposalPanel({
  processors,
  rows,
  setRows,
}: {
  processors: Processor[];
  rows:       WasteRow[];
  setRows:    (rows: WasteRow[]) => void;
}) {
  const inputCls  = "w-full px-2.5 py-1.5 rounded-lg text-sm outline-none";
  const inputStyle = { border: `1.5px solid ${C.border}`, background: T.bg, color: C.text };

  function addRow() {
    setRows([...rows, { wasteType: "", processorId: "", quantity: 0 }]);
  }

  function removeRow(i: number) {
    setRows(rows.filter((_, idx) => idx !== i));
  }

  function setField<K extends keyof WasteRow>(i: number, k: K, v: WasteRow[K]) {
    setRows(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  }

  const resolved = rows.map(row => {
    const proc  = processors.find(p => p.id === row.processorId);
    const price = proc?.prices.find(p => p.wasteType === row.wasteType);
    return { ...row, processorName: proc?.name ?? "—", unit: price?.unit ?? "kg", unitPrice: price?.unitPrice ?? 0 };
  });
  const total = resolved.reduce((s, r) => s + r.quantity * r.unitPrice, 0);

  return (
    <div
      className="no-print rounded-xl overflow-hidden"
      style={{ background: C.card, border: `1px solid ${C.border}`, marginBottom: 24 }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: `1px solid ${C.border}`, background: T.bg }}
      >
        <div>
          <p className="font-bold text-sm" style={{ color: C.text }}>🗑️ 廃材処理明細を入力</p>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>印刷時に完了報告書へ反映されます</p>
        </div>
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
          style={{ background: T.primaryLt, color: C.amberDk, border: `1px solid ${T.primaryMd}` }}
        >
          <Plus size={12} /> 行を追加
        </button>
      </div>

      {rows.length > 0 && (
        <div
          className="grid px-5 py-2.5 text-sm font-bold uppercase tracking-wide"
          style={{ gridTemplateColumns: "2fr 2fr 100px 80px 90px 36px", color: C.muted, borderBottom: `1px solid ${C.border}` }}
        >
          <span>廃材の種類</span>
          <span>処理場</span>
          <span className="text-right">数量</span>
          <span className="text-right">単価</span>
          <span className="text-right">金額</span>
          <span />
        </div>
      )}

      {rows.length === 0 && (
        <div className="py-8 text-center text-sm" style={{ color: C.muted }}>
          「行を追加」ボタンで廃材処理を記入
        </div>
      )}

      {rows.map((row, i) => {
        const proc  = processors.find(p => p.id === row.processorId);
        const price = proc?.prices.find(p => p.wasteType === row.wasteType);

        return (
          <div
            key={i}
            className="grid items-center gap-2 px-5 py-3"
            style={{ gridTemplateColumns: "2fr 2fr 100px 80px 90px 36px", borderTop: `1px solid #F1F5F9` }}
          >
            <div className="relative">
              <input
                list={`wt-${i}`}
                className={inputCls}
                style={inputStyle}
                placeholder="廃材を選択または入力"
                value={row.wasteType}
                onChange={e => setField(i, "wasteType", e.target.value)}
              />
              <datalist id={`wt-${i}`}>
                {proc
                  ? proc.prices.map(p => <option key={p.wasteType} value={p.wasteType} />)
                  : processors.flatMap(p => p.prices).map(p => <option key={p.wasteType} value={p.wasteType} />)
                }
              </datalist>
            </div>

            <select
              className={inputCls}
              style={inputStyle}
              value={row.processorId}
              onChange={e => setField(i, "processorId", e.target.value)}
            >
              <option value="">処理場を選択</option>
              {processors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <input
              type="number"
              className={`${inputCls} text-right`}
              style={inputStyle}
              placeholder="0"
              value={row.quantity || ""}
              onChange={e => setField(i, "quantity", Number(e.target.value))}
            />

            <div className="text-right text-sm" style={{ color: price ? C.amberDk : C.muted }}>
              {price ? `¥${price.unitPrice.toLocaleString()}/${price.unit}` : "—"}
            </div>

            <div className="text-right text-sm font-bold font-numeric" style={{ color: C.text }}>
              {price && row.quantity > 0 ? `¥${(row.quantity * price.unitPrice).toLocaleString()}` : "—"}
            </div>

            <button
              onClick={() => removeRow(i)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 mx-auto"
              style={{ color: C.muted }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      })}

      {rows.length > 0 && (
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderTop: `1px solid ${C.border}`, background: T.bg }}
        >
          <p className="text-sm font-bold" style={{ color: C.sub }}>廃材処理費合計</p>
          <p className="text-lg font-bold font-numeric" style={{ color: C.amberDk }}>
            ¥{total.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

interface Props { type: string; siteId: string }

export default function PreviewClient({ type, siteId }: Props) {
  const router  = useRouter();
  const docType = (type as DocType) in DOC_META ? (type as DocType) : "estimate";
  const meta    = DOC_META[docType];

  // Site + contract data from API
  const [site,         setSite]         = useState<DocSite | null>(null);
  const [certData,     setCertData]     = useState<DemolitionCertData>({
    landAddress: "", houseNo: "", structureKind: "",
    floor1Area: "", floor2Area: "", floor3Area: "",
  });
  const [photoUrls,    setPhotoUrls]    = useState<string[]>([]);
  const [loading,      setLoading]      = useState(true);

  // Waste disposal state (completion doc only)
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [wasteRows,  setWasteRows]  = useState<WasteRow[]>([]);

  const docNo     = genDocNo(docType, siteId);
  const issueDate = todayStr();

  // Load site data + contract data
  useEffect(() => {
    if (!siteId) { setLoading(false); return; }

    Promise.all([
      fetch("/api/kaitai/sites", { credentials: "include" })
        .then(r => r.ok ? r.json() : null),
      fetch(`/api/kaitai/sites/contract?siteId=${siteId}`, { credentials: "include" })
        .then(r => r.ok ? r.json() : null),
    ]).then(([sitesData, contractRes]) => {
      const raw = sitesData?.sites?.find((s: Record<string, unknown>) => s.id === siteId);
      if (raw) {
        const cd = contractRes?.data;
        const items: LineItem[] = cd?.estimateItems ?? cd?.invoiceItems ?? [];
        setSite({
          id:             raw.id as string,
          name:           raw.name as string,
          address:        raw.address as string,
          contractAmount: (raw.contractAmount as number) ?? 0,
          startDate:      (raw.startDate as string) ?? "",
          endDate:        (raw.endDate as string) ?? "",
          status:         raw.status as string,
          structureType:  raw.structureType as string | undefined,
          items:          docType === "invoice"
            ? (cd?.invoiceItems ?? [])
            : (cd?.estimateItems ?? items),
          memo:           (cd?.notes as string) ?? undefined,
          clientName:     (cd?.clientName as string) ?? undefined,
          clientAddress:  (cd?.clientAddress as string) ?? undefined,
          clientZip:      (cd?.clientZip as string) ?? undefined,
          clientContact:  (cd?.clientContact as string) ?? undefined,
        });
        if (cd) {
          setCertData({
            landAddress:   cd.landAddress   ?? "",
            houseNo:       cd.houseNo       ?? "",
            structureKind: cd.structureKind ?? "",
            floor1Area:    cd.floor1Area    ?? "",
            floor2Area:    cd.floor2Area    ?? "",
            floor3Area:    cd.floor3Area    ?? "",
          });
          // Load photo URLs from saved photoIds
          const ids: string[] = Array.isArray(cd.photoIds) ? cd.photoIds : [];
          if (ids.length > 0 && docType === "completion") {
            fetch(`/api/kaitai/upload?siteId=${siteId}`, { credentials: "include" })
              .then(r => r.ok ? r.json() : null)
              .then(imgData => {
                if (imgData?.images) {
                  const urls = ids
                    .map((id: string) => imgData.images.find((img: { id: string; url: string }) => img.id === id)?.url)
                    .filter(Boolean) as string[];
                  setPhotoUrls(urls);
                }
              });
          }
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [siteId, docType]);

  // Load processors for completion doc
  useEffect(() => {
    if (docType !== "completion") return;
    fetch("/api/kaitai/processors", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.processors) setProcessors(data.processors); })
      .catch(() => {});
  }, [docType]);

  const wasteDisposals: WasteDisposalItem[] = wasteRows
    .filter(r => r.wasteType && r.processorId && r.quantity > 0)
    .map(r => {
      const proc  = processors.find(p => p.id === r.processorId);
      const price = proc?.prices.find(p => p.wasteType === r.wasteType);
      return {
        wasteType:     r.wasteType,
        processorName: proc?.name    ?? "—",
        unit:          price?.unit   ?? "kg",
        quantity:      r.quantity,
        unitPrice:     price?.unitPrice ?? 0,
      };
    });

  function handlePrint() {
    const filename = `${meta.label}_${site?.name ?? ""}_${new Date().toISOString().slice(0, 10)}`;
    const prev = document.title;
    document.title = filename;
    window.print();
    document.title = prev;
  }

  const DocComponent = site ? {
    estimate:   <EstimateDoc   site={site} docNo={docNo} issueDate={issueDate} />,
    invoice:    <InvoiceDoc    site={site} docNo={docNo} issueDate={issueDate} />,
    receipt:    <ReceiptDoc    site={site} docNo={docNo} issueDate={issueDate} />,
    completion: <CompletionDoc site={site} docNo={docNo} issueDate={issueDate} wasteDisposals={wasteDisposals} photoUrls={photoUrls} />,
    report:     <ReportDoc     site={site} docNo={docNo} issueDate={issueDate} />,
    demolition: <DemolitionCertDoc site={site} certData={certData} docNo={docNo} issueDate={issueDate} />,
  }[docType] : null;

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: T.border, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: T.sub, fontSize: 14 }}>読み込み中...</div>
      </div>
    );
  }

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
            {site?.name ?? ""}
          </span>
        </div>

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
          印刷 / PDF保存
        </button>
      </div>

      {/* ── Waste disposal panel (completion only) ── */}
      {docType === "completion" && (
        <div className="no-print" style={{ maxWidth: 794, margin: "0 auto", paddingTop: 24 }}>
          <WasteDisposalPanel processors={processors} rows={wasteRows} setRows={setWasteRows} />
        </div>
      )}

      {/* ── Document ── */}
      <div style={{ padding: "24px 16px", display: "flex", justifyContent: "center" }}>
        {DocComponent ?? (
          <div style={{ color: T.sub, fontSize: 14, padding: 40 }}>
            現場データが見つかりません。ログインしてから再度お試しください。
          </div>
        )}
      </div>
    </div>
  );
}
