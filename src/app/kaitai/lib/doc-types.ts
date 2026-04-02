export type DocType = "estimate" | "invoice" | "receipt" | "completion" | "report";

export const DOC_META: Record<DocType, { label: string; emoji: string; desc: string }> = {
  estimate:   { label: "見積書",         emoji: "📋", desc: "工事費用の見積提示" },
  invoice:    { label: "請求書",         emoji: "💴", desc: "工事代金の請求" },
  receipt:    { label: "領収書",         emoji: "🧾", desc: "代金受領の証明" },
  completion: { label: "工事完了報告書", emoji: "✅", desc: "工事完了の公式記録" },
  report:     { label: "作業報告書",     emoji: "📊", desc: "日々の現場作業記録" },
};

export interface LineItem {
  name: string;
  spec: string;
  qty: number;
  unit: string;
  unitPrice: number;
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

export const MOCK_DOC_SITES: DocSite[] = [
  {
    id: "s1",
    name: "山田邸解体工事",
    address: "東京都世田谷区豪徳寺2-14-5",
    contractAmount: 3_200_000,
    startDate: "2026-03-18",
    endDate: "2026-04-10",
    status: "施工中",
    structureType: "木造",
    area: "148",
    clientName: "山田 花子",
    clientAddress: "東京都世田谷区豪徳寺2-14-5",
    clientZip: "〒154-0021",
    clientContact: "",
    items: [
      { name: "木造家屋解体工事",         spec: "木造2階建 148㎡",   qty: 1,    unit: "式",  unitPrice: 1_800_000 },
      { name: "産廃処理費（コンクリート）", spec: "約15㎥",           qty: 15,   unit: "㎥",  unitPrice: 8_000 },
      { name: "産廃処理費（木材）",        spec: "約20㎥",           qty: 20,   unit: "㎥",  unitPrice: 12_000 },
      { name: "重機回送費",               spec: "往復",             qty: 1,    unit: "式",  unitPrice: 80_000 },
      { name: "養生費",                  spec: "周囲防護シート",     qty: 1,    unit: "式",  unitPrice: 60_000 },
      { name: "近隣挨拶費",              spec: "近隣5世帯",          qty: 1,    unit: "式",  unitPrice: 20_000 },
    ],
    memo: "隣家との距離が狭いため養生に十分注意。搬出は北側より行うこと。アスベスト調査済み（不検出）。",
  },
  {
    id: "s2",
    name: "旧田中倉庫解体",
    address: "神奈川県川崎市幸区堀川町580",
    contractAmount: 5_600_000,
    startDate: "2026-03-25",
    endDate: "2026-04-20",
    status: "施工中",
    structureType: "鉄骨",
    area: "320",
    clientName: "株式会社大和建設",
    clientAddress: "東京都品川区西品川1-1-1",
    clientZip: "〒141-0033",
    clientContact: "前田 健二",
    items: [
      { name: "鉄骨造倉庫解体工事",        spec: "鉄骨2階建 320㎡",  qty: 1,    unit: "式",  unitPrice: 3_200_000 },
      { name: "産廃処理費（鉄骨・金属）",   spec: "約2,400kg",        qty: 2400, unit: "kg",  unitPrice: 15 },
      { name: "産廃処理費（コンクリート）",  spec: "約40㎥",           qty: 40,   unit: "㎥",  unitPrice: 8_000 },
      { name: "アスベスト含有建材除去",     spec: "屋根材 レベル2",   qty: 1,    unit: "式",  unitPrice: 800_000 },
      { name: "重機回送費",               spec: "往復（10t級）",     qty: 1,    unit: "式",  unitPrice: 120_000 },
      { name: "仮設工事費",               spec: "足場・防護シート設置", qty: 1,  unit: "式",  unitPrice: 250_000 },
    ],
    memo: "重機は15t以下。敷地内転回可。アスベスト含有材 L2処理完了。",
  },
  {
    id: "s3",
    name: "松本アパート解体",
    address: "埼玉県さいたま市浦和区常盤6-4-21",
    contractAmount: 2_800_000,
    startDate: "2026-04-07",
    endDate: "2026-04-30",
    status: "着工前",
    structureType: "RC",
    area: "180",
    clientName: "松本 太郎",
    clientAddress: "埼玉県さいたま市浦和区常盤6-4-21",
    clientZip: "〒330-0064",
    clientContact: "",
    items: [
      { name: "RC造アパート解体工事",      spec: "RC造3階建 180㎡",  qty: 1,   unit: "式",  unitPrice: 1_900_000 },
      { name: "産廃処理費（コンクリート）", spec: "約60㎥",           qty: 60,  unit: "㎥",  unitPrice: 8_000 },
      { name: "産廃処理費（鉄筋）",        spec: "約800kg",          qty: 800, unit: "kg",  unitPrice: 15 },
      { name: "重機回送費",               spec: "往復",             qty: 1,   unit: "式",  unitPrice: 80_000 },
      { name: "仮設工事費",               spec: "防護ネット・養生一式", qty: 1, unit: "式",  unitPrice: 120_000 },
    ],
    memo: "RC造のため特殊重機（クラッシャー）使用。解体前調査済み、アスベスト不検出。",
  },
];

export const SELF_COMPANY = {
  name: "解体工業株式会社",
  zip: "〒154-0021",
  address: "東京都世田谷区豪徳寺2-14-5",
  tel: "03-1234-5678",
  fax: "03-1234-5679",
  email: "info@kaitai-kogyo.jp",
  rep: "代表取締役　田中 義雄",
  invoiceNo: "T1234567890123",
  bank: "三菱UFJ銀行 渋谷支店",
  bankType: "普通",
  bankNo: "1234567",
  bankHolder: "カ）カイタイコウギョウ",
};

export const FOOTER_BRANDING =
  "本帳票は 解体LINK により作成されています。解体LINKは現場管理を効率化するSaaSツールです。";

export function genDocNo(type: DocType, siteId: string): string {
  const prefix: Record<DocType, string> = {
    estimate: "EST", invoice: "INV", receipt: "REC", completion: "CMP", report: "RPT",
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
