import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

// GET: 本日の廃材送信履歴を取得
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const siteId = req.nextUrl.searchParams.get("siteId");
  const date = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const where: Record<string, unknown> = { companyId: session.companyId };
  if (siteId) where.siteId = siteId;
  if (date) where.date = date;

  const dispatches = await prisma.kaitaiWasteDispatch.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, dispatches });
}

// POST: 廃材送信を記録
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const body = await req.json();
  const { siteId, siteName, wasteType, quantity, unit, processorId, processorName, cost, direction, reporter } = body;

  if (!siteId || !wasteType || quantity == null) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const dispatch = await prisma.kaitaiWasteDispatch.create({
    data: {
      companyId: session.companyId,
      siteId,
      siteName: siteName ?? "",
      date: new Date().toISOString().slice(0, 10),
      wasteType,
      quantity: Number(quantity),
      unit: unit ?? "t",
      processorId: processorId ?? null,
      processorName: processorName ?? null,
      cost: cost ?? 0,
      direction: direction ?? "cost",
      reporter: reporter ?? "",
    },
  });

  return NextResponse.json({ ok: true, dispatch });
}
