"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Download, Plus, X, Trash2, ChevronDown, ChevronUp, Pencil, History, RotateCcw } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { DOC_META, genDocNo, todayStr, DocType, SELF_COMPANY } from "../../lib/doc-types";
import type { DocSite, LineItem, CompanyInfo } from "../../lib/doc-types";
import { EstimateDoc }       from "../templates/estimate";
import { InvoiceDoc }        from "../templates/invoice";
import { ReceiptDoc }        from "../templates/receipt";
import { CompletionDoc, WasteDisposalItem } from "../templates/completion";
import { ReportDoc }         from "../templates/report";
import { DemolitionCertDoc } from "../templates/demolition-cert";
import type { DemolitionCertData } from "../templates/demolition-cert";
import { T } from "../../lib/design-tokens";
import {
  PhotoAttachmentPanel,
  AttachedPhotoPage,
  paginatePhotos,
} from "../components/photo-attachments";
import type { AlbumPhoto, PhotoLayoutType } from "../components/photo-attachments";

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

const inputCls  = "w-full px-2.5 py-1.5 rounded-lg text-sm outline-none";
const inputStyle = { border: `1.5px solid ${C.border}`, background: T.bg, color: C.text };

// ─── Collapsible Section ──────────────────────────────────────────────────────

function EditSection({
  title,
  emoji,
  children,
  defaultOpen = false,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="no-print rounded-xl overflow-hidden"
      style={{ background: C.card, border: `1px solid ${C.border}`, marginBottom: 12 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3"
        style={{ background: T.bg, border: "none", cursor: "pointer", borderBottom: open ? `1px solid ${C.border}` : "none" }}
      >
        <span className="flex items-center gap-2 text-sm font-bold" style={{ color: C.text }}>
          {emoji} {title}
        </span>
        {open ? <ChevronUp size={16} color={C.muted} /> : <ChevronDown size={16} color={C.muted} />}
      </button>
      {open && <div style={{ padding: "16px 20px" }}>{children}</div>}
    </div>
  );
}

// ─── Editable Field Row ──────────────────────────────────────────────────────

function FieldRow({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <label className="text-sm font-semibold flex-shrink-0" style={{ color: C.sub, width: 100 }}>{label}</label>
      <input
        className={inputCls}
        style={inputStyle}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? label}
      />
    </div>
  );
}

// ─── Company Edit Panel ───────────────────────────────────────────────────────

function CompanyEditPanel({
  company,
  setCompany,
}: {
  company: CompanyInfo;
  setCompany: (c: CompanyInfo) => void;
}) {
  function set<K extends keyof CompanyInfo>(k: K, v: string) {
    setCompany({ ...company, [k]: v });
  }
  return (
    <EditSection title="発行者情報（自社）" emoji="🏢" defaultOpen={!company.name}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <FieldRow label="会社名" value={company.name} onChange={v => set("name", v)} />
        <FieldRow label="代表者" value={company.rep} onChange={v => set("rep", v)} />
        <FieldRow label="郵便番号" value={company.zip} onChange={v => set("zip", v)} placeholder="〒000-0000" />
        <FieldRow label="住所" value={company.address} onChange={v => set("address", v)} />
        <FieldRow label="TEL" value={company.tel} onChange={v => set("tel", v)} />
        <FieldRow label="FAX" value={company.fax} onChange={v => set("fax", v)} />
        <FieldRow label="メール" value={company.email} onChange={v => set("email", v)} />
        <FieldRow label="登録番号" value={company.invoiceNo} onChange={v => set("invoiceNo", v)} placeholder="T0000000000000" />
        <FieldRow label="振込先銀行" value={company.bank} onChange={v => set("bank", v)} placeholder="〇〇銀行 △△支店" />
        <FieldRow label="口座種別" value={company.bankType} onChange={v => set("bankType", v)} placeholder="普通" />
        <FieldRow label="口座番号" value={company.bankNo} onChange={v => set("bankNo", v)} />
        <FieldRow label="口座名義" value={company.bankHolder} onChange={v => set("bankHolder", v)} />
      </div>
    </EditSection>
  );
}

// ─── Client Edit Panel ───────────────────────────────────────────────────────

function ClientEditPanel({
  site,
  setSite,
}: {
  site: DocSite;
  setSite: (s: DocSite) => void;
}) {
  return (
    <EditSection title="宛先情報（発注者）" emoji="👤">
      <FieldRow label="会社名" value={site.clientName ?? ""} onChange={v => setSite({ ...site, clientName: v })} />
      <FieldRow label="郵便番号" value={site.clientZip ?? ""} onChange={v => setSite({ ...site, clientZip: v })} placeholder="〒000-0000" />
      <FieldRow label="住所" value={site.clientAddress ?? ""} onChange={v => setSite({ ...site, clientAddress: v })} />
      <FieldRow label="担当者" value={site.clientContact ?? ""} onChange={v => setSite({ ...site, clientContact: v })} />
    </EditSection>
  );
}

// ─── Line Items Edit Panel ───────────────────────────────────────────────────

function LineItemsEditPanel({
  items,
  setItems,
}: {
  items: LineItem[];
  setItems: (items: LineItem[]) => void;
}) {
  function addItem() {
    setItems([...items, { name: "", spec: "", qty: 1, unit: "式", unitPrice: 0 }]);
  }
  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }
  function setField<K extends keyof LineItem>(i: number, k: K, v: LineItem[K]) {
    setItems(items.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  }

  return (
    <EditSection title="明細項目" emoji="📝">
      {items.length > 0 && (
        <div
          className="grid px-1 pb-2 text-xs font-bold"
          style={{ gridTemplateColumns: "2fr 2fr 70px 50px 90px 36px", color: C.muted }}
        >
          <span>工事項目</span>
          <span>仕様・内訳</span>
          <span className="text-right">数量</span>
          <span className="text-center">単位</span>
          <span className="text-right">単価</span>
          <span />
        </div>
      )}
      {items.map((it, i) => (
        <div
          key={i}
          className="grid items-center gap-2 mb-2"
          style={{ gridTemplateColumns: "2fr 2fr 70px 50px 90px 36px" }}
        >
          <input className={inputCls} style={inputStyle} placeholder="工事項目" value={it.name} onChange={e => setField(i, "name", e.target.value)} />
          <input className={inputCls} style={inputStyle} placeholder="仕様" value={it.spec} onChange={e => setField(i, "spec", e.target.value)} />
          <input type="number" className={`${inputCls} text-right`} style={inputStyle} value={it.qty || ""} onChange={e => setField(i, "qty", Number(e.target.value))} />
          <input className={`${inputCls} text-center`} style={inputStyle} value={it.unit} onChange={e => setField(i, "unit", e.target.value)} />
          <input type="number" className={`${inputCls} text-right`} style={inputStyle} value={it.unitPrice || ""} onChange={e => setField(i, "unitPrice", Number(e.target.value))} />
          <button onClick={() => removeItem(i)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 mx-auto" style={{ color: C.muted, background: "none", border: "none", cursor: "pointer" }}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <div className="py-4 text-center text-sm" style={{ color: C.muted }}>
          明細項目がありません。「行を追加」で項目を追加してください。
        </div>
      )}
      <button
        onClick={addItem}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold mt-2"
        style={{ background: T.primaryLt, color: C.amberDk, border: `1px solid ${T.primaryMd}`, cursor: "pointer" }}
      >
        <Plus size={12} /> 行を追加
      </button>
    </EditSection>
  );
}

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
    <EditSection title="廃材処理明細" emoji="🗑️" defaultOpen>
      <p className="text-sm mb-3" style={{ color: C.muted }}>印刷時に完了報告書へ反映されます</p>
      {rows.length > 0 && (
        <div
          className="grid px-1 pb-2 text-xs font-bold"
          style={{ gridTemplateColumns: "2fr 2fr 100px 80px 90px 36px", color: C.muted }}
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
        <div className="py-4 text-center text-sm" style={{ color: C.muted }}>
          「行を追加」ボタンで廃材処理を記入
        </div>
      )}

      {rows.map((row, i) => {
        const proc  = processors.find(p => p.id === row.processorId);
        const price = proc?.prices.find(p => p.wasteType === row.wasteType);

        return (
          <div
            key={i}
            className="grid items-center gap-2 mb-2"
            style={{ gridTemplateColumns: "2fr 2fr 100px 80px 90px 36px" }}
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

            <div className="text-right text-sm font-bold" style={{ color: C.text }}>
              {price && row.quantity > 0 ? `¥${(row.quantity * price.unitPrice).toLocaleString()}` : "—"}
            </div>

            <button
              onClick={() => removeRow(i)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 mx-auto"
              style={{ color: C.muted, background: "none", border: "none", cursor: "pointer" }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      })}

      <button
        onClick={addRow}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold mt-2"
        style={{ background: T.primaryLt, color: C.amberDk, border: `1px solid ${T.primaryMd}`, cursor: "pointer" }}
      >
        <Plus size={12} /> 行を追加
      </button>

      {rows.length > 0 && (
        <div className="flex items-center justify-end mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <p className="text-sm font-bold mr-4" style={{ color: C.sub }}>廃材処理費合計</p>
          <p className="text-lg font-bold" style={{ color: C.amberDk }}>
            ¥{total.toLocaleString()}
          </p>
        </div>
      )}
    </EditSection>
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
  const [company,      setCompany]      = useState<CompanyInfo>({ ...SELF_COMPANY });
  const [certData,     setCertData]     = useState<DemolitionCertData>({
    landAddress: "", houseNo: "", structureKind: "",
    floor1Area: "", floor2Area: "", floor3Area: "",
  });
  const [photoUrls,    setPhotoUrls]    = useState<string[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [issueDate,    setIssueDate]    = useState(todayStr());
  const [showEdit,     setShowEdit]     = useState(true);

  // Photo attachments (available for all doc types)
  const [attachedPhotos, setAttachedPhotos] = useState<AlbumPhoto[]>([]);
  const [photoLayout,    setPhotoLayout]    = useState<PhotoLayoutType>("3");

  // Waste disposal state (completion doc only)
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [wasteRows,  setWasteRows]  = useState<WasteRow[]>([]);

  // Issue history
  interface DocIssue {
    id: string;
    docType: string;
    docNo: string;
    issuedAt: string;
    snapshot: Record<string, unknown>;
  }
  const [issues, setIssues]           = useState<DocIssue[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const docNo = genDocNo(docType, siteId);

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

  // Load issue history
  const loadIssues = useCallback(() => {
    if (!siteId) return;
    fetch(`/api/kaitai/docs/issues?siteId=${siteId}&docType=${docType}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.issues) setIssues(data.issues); })
      .catch(() => {});
  }, [siteId, docType]);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  // Restore from issue snapshot
  function restoreIssue(issue: DocIssue) {
    const s = issue.snapshot as Record<string, unknown>;
    if (s.issueDate) setIssueDate(s.issueDate as string);
    if (s.company) setCompany(s.company as CompanyInfo);
    if (s.site) setSite(s.site as DocSite);
    if (s.certData) setCertData(s.certData as DemolitionCertData);
    if (s.wasteRows) setWasteRows(s.wasteRows as WasteRow[]);
    if (s.attachedPhotos) setAttachedPhotos(s.attachedPhotos as AlbumPhoto[]);
    if (s.photoLayout) setPhotoLayout(s.photoLayout as PhotoLayoutType);
    setShowHistory(false);
  }

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

  const [pdfBusy, setPdfBusy] = useState(false);

  const handleDownloadPdf = useCallback(async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      const papers = document.querySelectorAll<HTMLElement>(".doc-paper");
      if (papers.length === 0) return;

      // A4 mm
      const A4_W_MM = 210;
      const A4_H_MM = 297;

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      for (let i = 0; i < papers.length; i++) {
        const el = papers[i];
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, A4_W_MM, A4_H_MM);
      }

      const filename = `${meta.label}_${site?.name ?? ""}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);

      // Record issue in DB
      try {
        const snapshot = {
          site,
          company,
          issueDate,
          certData,
          wasteRows,
          attachedPhotos,
          photoLayout,
        };
        await fetch("/api/kaitai/docs/issues", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId, docType, docNo, snapshot }),
        });
        loadIssues();
      } catch { /* non-critical */ }
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF生成に失敗しました。もう一度お試しください。");
    } finally {
      setPdfBusy(false);
    }
  }, [pdfBusy, meta.label, site, company, issueDate, certData, wasteRows, attachedPhotos, photoLayout, siteId, docType, docNo, loadIssues]);

  // Helper to update site fields
  function updateSite(partial: Partial<DocSite>) {
    if (site) setSite({ ...site, ...partial });
  }

  const DocComponent = site ? {
    estimate:   <EstimateDoc   site={site} docNo={docNo} issueDate={issueDate} company={company} />,
    invoice:    <InvoiceDoc    site={site} docNo={docNo} issueDate={issueDate} company={company} />,
    receipt:    <ReceiptDoc    site={site} docNo={docNo} issueDate={issueDate} company={company} />,
    completion: <CompletionDoc site={site} docNo={docNo} issueDate={issueDate} wasteDisposals={wasteDisposals} photoUrls={photoUrls} company={company} />,
    report:     <ReportDoc     site={site} docNo={docNo} issueDate={issueDate} company={company} />,
    demolition: <DemolitionCertDoc site={site} certData={certData} docNo={docNo} issueDate={issueDate} company={company} />,
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
          onClick={() => setShowEdit(!showEdit)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: showEdit ? "#334155" : "transparent",
            color: showEdit ? T.bg : T.muted,
            border: `1px solid ${showEdit ? "#475569" : "#475569"}`,
            borderRadius: 8, padding: "8px 14px",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Pencil size={14} />
          編集
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={pdfBusy}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: pdfBusy ? T.sub : T.primary, color: "#fff",
            border: "none", borderRadius: 8, padding: "8px 16px",
            fontSize: 14, fontWeight: 700,
            cursor: pdfBusy ? "wait" : "pointer",
            opacity: pdfBusy ? 0.7 : 1,
          }}
        >
          <Download size={15} />
          {pdfBusy ? "PDF生成中..." : "PDF保存"}
        </button>

        {/* History button */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: showHistory ? "#334155" : "transparent",
            color: showHistory ? T.bg : T.muted,
            border: `1px solid #475569`,
            borderRadius: 8, padding: "8px 12px",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            position: "relative",
          }}
        >
          <History size={14} />
          履歴
          {issues.length > 0 && (
            <span style={{
              position: "absolute", top: -6, right: -6,
              width: 18, height: 18, borderRadius: 9,
              background: T.primary, color: "#fff",
              fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {issues.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Issue history panel ── */}
      {showHistory && (
        <div className="no-print" style={{
          maxWidth: 794, margin: "0 auto",
          padding: "16px 16px 0",
        }}>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 16px",
              background: T.bg, borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span className="flex items-center gap-2" style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                <History size={15} color={C.amber} />
                発行履歴
              </span>
              <span style={{ fontSize: 12, color: C.muted }}>{issues.length}件</span>
            </div>
            {issues.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>
                まだ発行履歴はありません。PDF保存すると履歴が記録されます。
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {issues.map((issue, idx) => {
                  const d = new Date(issue.issuedAt);
                  const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
                  const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                  const snap = issue.snapshot as Record<string, unknown>;
                  const photos = Array.isArray(snap.attachedPhotos) ? snap.attachedPhotos.length : 0;
                  const items = (snap.site as Record<string, unknown>)?.items;
                  const lineCount = Array.isArray(items) ? items.length : 0;

                  return (
                    <div
                      key={issue.id}
                      style={{
                        padding: "12px 16px",
                        borderBottom: idx < issues.length - 1 ? `1px solid ${C.border}` : "none",
                        display: "flex", alignItems: "center", gap: 12,
                      }}
                    >
                      {/* Issue number badge */}
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: T.primaryLt,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: C.amberDk,
                        flexShrink: 0,
                      }}>
                        #{issues.length - idx}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                          {dateStr} {timeStr} 発行済み
                        </div>
                        <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                          {issue.docNo}
                          {lineCount > 0 && ` · 明細${lineCount}行`}
                          {photos > 0 && ` · 写真${photos}枚`}
                        </div>
                      </div>

                      {/* Restore button */}
                      <button
                        onClick={() => restoreIssue(issue)}
                        className="flex items-center gap-1.5"
                        style={{
                          fontSize: 12, fontWeight: 600,
                          color: C.amber, background: T.primaryLt,
                          border: `1px solid ${T.primaryMd}`,
                          borderRadius: 8, padding: "6px 12px",
                          cursor: "pointer", flexShrink: 0,
                        }}
                      >
                        <RotateCcw size={12} />
                        復元
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit panels (hidden on print) ── */}
      {showEdit && site && (
        <div className="no-print" style={{ maxWidth: 794, margin: "0 auto", paddingTop: 20, paddingLeft: 16, paddingRight: 16 }}>

          {/* Issue date */}
          <EditSection title="発行日" emoji="📅" defaultOpen>
            <FieldRow
              label="発行日"
              value={issueDate}
              onChange={v => setIssueDate(v)}
              placeholder="2024年1月1日"
            />
          </EditSection>

          {/* Company info */}
          <CompanyEditPanel company={company} setCompany={setCompany} />

          {/* Client info */}
          <ClientEditPanel site={site} setSite={setSite} />

          {/* Site/project info */}
          <EditSection title="工事情報" emoji="🏗️">
            <FieldRow label="現場名" value={site.name} onChange={v => updateSite({ name: v })} />
            <FieldRow label="住所" value={site.address} onChange={v => updateSite({ address: v })} />
            <FieldRow label="構造" value={site.structureType ?? ""} onChange={v => updateSite({ structureType: v })} placeholder="木造・鉄骨造 等" />
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-semibold flex-shrink-0" style={{ color: C.sub, width: 100 }}>契約金額</label>
              <input
                type="number"
                className={inputCls}
                style={inputStyle}
                value={site.contractAmount || ""}
                onChange={e => updateSite({ contractAmount: Number(e.target.value) })}
                placeholder="税抜金額"
              />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-semibold flex-shrink-0" style={{ color: C.sub, width: 100 }}>備考</label>
              <textarea
                className="w-full px-2.5 py-1.5 rounded-lg text-sm outline-none"
                style={{ ...inputStyle, minHeight: 60, resize: "vertical" as const }}
                value={site.memo ?? ""}
                onChange={e => updateSite({ memo: e.target.value })}
                placeholder="備考・注記"
              />
            </div>
          </EditSection>

          {/* Line items (estimate/invoice only) */}
          {(docType === "estimate" || docType === "invoice") && (
            <LineItemsEditPanel
              items={site.items}
              setItems={items => updateSite({ items })}
            />
          )}

          {/* Waste disposal (completion only) */}
          {docType === "completion" && (
            <WasteDisposalPanel processors={processors} rows={wasteRows} setRows={setWasteRows} />
          )}

          {/* Demolition cert fields */}
          {docType === "demolition" && (
            <EditSection title="建物の表示" emoji="🏚️" defaultOpen>
              <FieldRow label="所在" value={certData.landAddress} onChange={v => setCertData({ ...certData, landAddress: v })} />
              <FieldRow label="家屋番号" value={certData.houseNo} onChange={v => setCertData({ ...certData, houseNo: v })} />
              <FieldRow label="種類" value={certData.structureKind} onChange={v => setCertData({ ...certData, structureKind: v })} placeholder="居宅・店舗 等" />
              <FieldRow label="1階面積(㎡)" value={certData.floor1Area} onChange={v => setCertData({ ...certData, floor1Area: v })} />
              <FieldRow label="2階面積(㎡)" value={certData.floor2Area} onChange={v => setCertData({ ...certData, floor2Area: v })} />
              <FieldRow label="3階面積(㎡)" value={certData.floor3Area} onChange={v => setCertData({ ...certData, floor3Area: v })} />
            </EditSection>
          )}

          {/* Photo attachments — available for all doc types */}
          <PhotoAttachmentPanel
            siteId={siteId}
            attachedPhotos={attachedPhotos}
            setAttachedPhotos={setAttachedPhotos}
            layout={photoLayout}
            setLayout={setPhotoLayout}
          />
        </div>
      )}

      {/* ── Document preview ── */}
      <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        {DocComponent ?? (
          <div style={{ color: T.sub, fontSize: 14, padding: 40 }}>
            現場データが見つかりません。ログインしてから再度お試しください。
          </div>
        )}

        {/* Attached photo pages (shown inline in preview) */}
        {attachedPhotos.length > 0 && (() => {
          const perPage = parseInt(photoLayout) as 3 | 4 | 6;
          const photoPages = paginatePhotos(attachedPhotos, perPage);
          const docLabel = meta.label;
          return photoPages.map((pagePhotos, pageIdx) => (
            <AttachedPhotoPage
              key={`photo-page-${pageIdx}`}
              photos={pagePhotos}
              layout={photoLayout}
              headerLeft={`${docLabel} — 添付写真`}
              headerRight={site?.name ?? ""}
              footerLeft="株式会社良心"
              pageNum={pageIdx + 1}
              totalPages={photoPages.length}
              startNo={pageIdx * perPage + 1}
            />
          ));
        })()}
      </div>
    </div>
  );
}
