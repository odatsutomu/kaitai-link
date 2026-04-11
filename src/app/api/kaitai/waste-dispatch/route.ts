import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

// GET: 本日の廃材送信履歴を取得
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const siteId = req.nextUrl.searchParams.get("siteId");
  const date = req.nextUrl.searchParams.get("date");
  const all = req.nextUrl.searchParams.get("all");

  const where: Record<string, unknown> = { companyId: session.companyId };
  if (siteId) where.siteId = siteId;
  // all=1 で全件取得、date指定で日付絞り込み、どちらもなければ今日
  if (!all && date) {
    where.date = date;
  } else if (!all) {
    where.date = new Date().toISOString().slice(0, 10);
  }

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

// PATCH: 廃材送信を修正
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...patch } = body;
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const existing = await prisma.kaitaiWasteDispatch.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "廃材記録が見つかりません" }, { status: 404 });
  }

  // Sanitize numeric fields
  if (patch.quantity != null) patch.quantity = Number(patch.quantity);
  if (patch.cost != null) patch.cost = Number(patch.cost);

  const updated = await prisma.kaitaiWasteDispatch.update({
    where: { id },
    data: patch,
  });

  return NextResponse.json({ ok: true, dispatch: updated });
}

// DELETE: 廃材送信を削除
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const existing = await prisma.kaitaiWasteDispatch.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "廃材記録が見つかりません" }, { status: 404 });
  }

  // Also delete related operation log
  await prisma.kaitaiOperationLog.deleteMany({
    where: {
      companyId: session.companyId,
      action: { startsWith: "waste_dispatch:" },
      siteId: existing.siteId,
      createdAt: {
        gte: new Date(existing.createdAt.getTime() - 120_000),
        lte: new Date(existing.createdAt.getTime() + 120_000),
      },
    },
  });

  await prisma.kaitaiWasteDispatch.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
