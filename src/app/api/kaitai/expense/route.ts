import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const url    = new URL(req.url);
  const siteId = url.searchParams.get("siteId");

  const logs = await prisma.kaitaiExpenseLog.findMany({
    where: {
      companyId: session.companyId,
      ...(siteId ? { siteId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ ok: true, logs });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const body = await req.json();
  const {
    siteId, siteName, category, amount, description,
    reporter, date, memo, equipmentId, equipmentName,
    liters, pricePerLiter,
  } = body;

  if (!category || !reporter || !date) {
    return NextResponse.json({ error: "カテゴリ・報告者・日付は必須です" }, { status: 400 });
  }

  const log = await prisma.kaitaiExpenseLog.create({
    data: {
      companyId:    session.companyId,
      siteId:       siteId       ?? null,
      siteName:     siteName     ?? null,
      category,
      amount:       Number(amount) || 0,
      description:  description  ?? null,
      reporter,
      date,
      memo:         memo         ?? null,
      equipmentId:  equipmentId  ?? null,
      equipmentName: equipmentName ?? null,
      liters:       liters        != null ? Number(liters) : null,
      pricePerLiter: pricePerLiter != null ? Number(pricePerLiter) : null,
    },
  });

  await prisma.kaitaiOperationLog.create({
    data: {
      companyId: session.companyId,
      action:    `expense_log:${category}:¥${amount}`,
      user:      reporter,
      siteId:    siteId ?? null,
      device:    req.headers.get("user-agent")?.slice(0, 120) ?? "",
    },
  });

  return NextResponse.json({ ok: true, log }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...patch } = body;
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const existing = await prisma.kaitaiExpenseLog.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "経費ログが見つかりません" }, { status: 404 });
  }

  // Sanitize numeric fields
  if (patch.amount != null) patch.amount = Number(patch.amount) || 0;
  if (patch.liters != null) patch.liters = Number(patch.liters);
  if (patch.pricePerLiter != null) patch.pricePerLiter = Number(patch.pricePerLiter);

  const updated = await prisma.kaitaiExpenseLog.update({
    where: { id },
    data: patch,
  });

  return NextResponse.json({ ok: true, log: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const existing = await prisma.kaitaiExpenseLog.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "経費ログが見つかりません" }, { status: 404 });
  }

  await prisma.kaitaiExpenseLog.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
