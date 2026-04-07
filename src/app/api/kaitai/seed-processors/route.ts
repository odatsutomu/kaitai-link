import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/kaitai/seed-processors
 * Admin-only: seeds test processors (処理場) with per-waste-type pricing.
 * Calling multiple times is safe — existing processors for this company are removed first.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const companyId = session.companyId;

  // Remove existing processors (cascades prices)
  await prisma.kaitaiProcessor.deleteMany({ where: { companyId } });

  const PROCESSORS: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    notes: string;
    prices: { wasteType: string; unit: string; unitPrice: number; direction?: string }[];
  }[] = [
    {
      name: "岡山廃棄物センター株式会社",
      address: "岡山市南区藤田1580",
      lat: 34.6285,
      lng: 133.9420,
      notes: "コンクリート・木材・混合廃棄物対応。平日8:00〜17:00。",
      prices: [
        { wasteType: "コンクリートガラ（無筋）", unit: "t", unitPrice: 8000,  direction: "cost" },
        { wasteType: "木くず",                   unit: "t", unitPrice: 25000, direction: "cost" },
        { wasteType: "混合廃棄物（ミンチ）",     unit: "t", unitPrice: 45000, direction: "cost" },
        { wasteType: "石膏ボード",               unit: "t", unitPrice: 32000, direction: "cost" },
        { wasteType: "ガラス・陶磁器くず・瓦",  unit: "t", unitPrice: 18000, direction: "cost" },
        { wasteType: "廃プラスチック類",         unit: "t", unitPrice: 38000, direction: "cost" },
      ],
    },
    {
      name: "山陽産業廃棄物株式会社",
      address: "岡山市東区瀬戸町万富2000",
      lat: 34.6890,
      lng: 134.0350,
      notes: "コンクリート専門。大量搬入割引あり（50t以上）。土日対応可（要事前連絡）。",
      prices: [
        { wasteType: "コンクリートガラ（無筋）", unit: "t",  unitPrice: 6500, direction: "cost" },
        { wasteType: "コンクリートガラ（有筋）", unit: "t",  unitPrice: 9000, direction: "cost" },
        { wasteType: "アスファルトガラ",         unit: "t",  unitPrice: 7000, direction: "cost" },
      ],
    },
    {
      name: "吉備高原産廃リサイクル",
      address: "加賀郡吉備中央町高富1350",
      lat: 34.9120,
      lng: 133.7850,
      notes: "木材・紙類のリサイクル処理。遠方のため搬出量をまとめてから持込。",
      prices: [
        { wasteType: "木くず",             unit: "t", unitPrice: 20000, direction: "cost" },
        { wasteType: "廃プラスチック類",   unit: "t", unitPrice: 35000, direction: "cost" },
        { wasteType: "混合廃棄物（ミンチ）", unit: "t", unitPrice: 42000, direction: "cost" },
      ],
    },
    {
      name: "中国環境保全株式会社",
      address: "倉敷市水島川崎通1-3",
      lat: 34.5290,
      lng: 133.7730,
      notes: "金属くず・アスベスト含有廃材専門。特別管理産廃マニフェスト対応。",
      prices: [
        { wasteType: "金属くず",                             unit: "t", unitPrice: 5000,  direction: "buyback" },
        { wasteType: "特別管理産業廃棄物（アスベスト等）",  unit: "t", unitPrice: 150000, direction: "cost"    },
        { wasteType: "石膏ボード",                           unit: "t", unitPrice: 28000, direction: "cost"    },
      ],
    },
  ];

  const created: { id: string; name: string; priceCount: number }[] = [];

  for (const p of PROCESSORS) {
    const processor = await prisma.kaitaiProcessor.create({
      data: {
        companyId,
        name:    p.name,
        address: p.address,
        lat:     p.lat,
        lng:     p.lng,
        notes:   p.notes,
        prices: {
          create: p.prices.map(pr => ({
            companyId,
            wasteType: pr.wasteType,
            unit:      pr.unit,
            unitPrice: Math.abs(pr.unitPrice),
            direction: pr.direction ?? "cost",
          })),
        },
      },
      include: { prices: true },
    });
    created.push({ id: processor.id, name: processor.name, priceCount: processor.prices.length });
  }

  return NextResponse.json({
    ok:      true,
    message: `処理場 ${created.length} 件 + 合計 ${created.reduce((s, p) => s + p.priceCount, 0)} 単価を登録しました`,
    created,
  });
}
