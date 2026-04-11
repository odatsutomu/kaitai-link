export type DocType = "estimate" | "invoice" | "receipt" | "completion" | "report" | "demolition";

export const DOC_META: Record<DocType, { label: string; emoji: string; desc: string }> = {
  estimate:   { label: "見積書",         emoji: "📋", desc: "工事費用の見積提示" },
  invoice:    { label: "請求書",         emoji: "💴", desc: "工事代金の請求" },
  receipt:    { label: "領収書",         emoji: "🧾", desc: "代金受領の証明" },
  completion: { label: "工事完了報告書", emoji: "✅", desc: "工事完了の公式記録" },
  report:     { label: "作業報告書",     emoji: "📊", desc: "日々の現場作業記録" },
  demolition: { label: "建物滅失証明書", emoji: "🏚", desc: "建物滅失登記申請用証明書" },
};

export interface LineItem {
  name: string;
  spec: string;
  qty: number;
  unit: string;
  unitPrice: number;
  taxRate?: number;   // 10 | 8 | 0 (%)
}

export interface DocSite {
  id: string;
  name: string;
  address: string;
  contractAmount: number;
  startDate: string;
  endDate: string;
  status: string;
  structureType?: string;
  area?: string;
  items: LineItem[];
  memo?: string;
  clientName?: string;
  clientAddress?: string;
  clientZip?: string;
  clientContact?: string;
}

export const MOCK_DOC_SITES: DocSite[] = [];

export interface CompanyInfo {
  name: string;
  zip: string;
  address: string;
  tel: string;
  fax: string;
  email: string;
  rep: string;
  invoiceNo: string;
  bank: string;
  bankType: string;
  bankNo: string;
  bankHolder: string;
}

export const SELF_COMPANY: CompanyInfo = {
  name: "",
  zip: "",
  address: "",
  tel: "",
  fax: "",
  email: "",
  rep: "",
  invoiceNo: "",
  bank: "",
  bankType: "",
  bankNo: "",
  bankHolder: "",
};

export const FOOTER_BRANDING =
  "本帳票は 解体LINK により作成されています。解体LINKは現場管理を効率化するSaaSツールです。";

export function genDocNo(type: DocType, siteId: string): string {
  const prefix: Record<DocType, string> = {
    estimate: "EST", invoice: "INV", receipt: "REC", completion: "CMP", report: "RPT", demolition: "DMC",
  };
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${prefix[type]}-${ymd}-${siteId.toUpperCase()}`;
}

export function calcTotals(subtotal: number, taxRate = 0.1) {
  const tax = Math.floor(subtotal * taxRate);
  return { subtotal, tax, total: subtotal + tax };
}

export function yen(n: number): string {
  return "¥" + n.toLocaleString("ja-JP");
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
