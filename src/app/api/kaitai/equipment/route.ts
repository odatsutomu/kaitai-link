import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const equipment = await prisma.kaitaiEquipment.findMany({
    where:   { companyId: session.companyId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, equipment });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { name, category, type, supplier, unitPrice, status, returnDeadline, notes } = body;

  if (!name || !category || !type) {
    return NextResponse.json({ error: "機材名・区分・種別は必須です" }, { status: 400 });
  }

  const equipment = await prisma.kaitaiEquipment.create({
    data: {
      companyId:     session.companyId,
      name,
      category,
      type,
      supplier:      supplier      ?? null,
      unitPrice:     Number(unitPrice) || 0,
      status:        status        ?? "待機中",
      returnDeadline: returnDeadline ?? null,
      notes:         notes         ?? null,
    },
  });

  await prisma.kaitaiOperationLog.create({
    data: {
      companyId: session.companyId,
      action:    `equipment_add:${name}`,
      user:      session.adminName,
      device:    req.headers.get("user-agent")?.slice(0, 120) ?? "",
    },
  });

  return NextResponse.json({ ok: true, equipment }, { status: 201 });
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

  const existing = await prisma.kaitaiEquipment.findFirst({ where: { id, companyId: session.companyId } });
  if (!existing) return NextResponse.json({ error: "機材が見つかりません" }, { status: 404 });

  const equipment = await prisma.kaitaiEquipment.update({
    where: { id },
    data:  patch,
  });

  return NextResponse.json({ ok: true, equipment });
}
