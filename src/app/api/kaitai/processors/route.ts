import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const processors = await prisma.kaitaiProcessor.findMany({
    where:   { companyId: session.companyId },
    include: { prices: { orderBy: { wasteType: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, processors });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { name, address, notes, prices } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "処理場名は必須です" }, { status: 400 });
  }

  const processor = await prisma.kaitaiProcessor.create({
    data: {
      companyId: session.companyId,
      name:      name.trim(),
      address:   address?.trim() ?? null,
      notes:     notes?.trim()   ?? null,
      prices: prices?.length
        ? {
            create: (prices as { wasteType: string; unit: string; unitPrice: number }[])
              .filter(p => p.wasteType?.trim())
              .map(p => ({
                companyId: session.companyId,
                wasteType: p.wasteType.trim(),
                unit:      p.unit ?? "kg",
                unitPrice: Number(p.unitPrice) || 0,
              })),
          }
        : undefined,
    },
    include: { prices: { orderBy: { wasteType: "asc" } } },
  });

  return NextResponse.json({ ok: true, processor }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { id, name, address, notes, prices } = body;
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const existing = await prisma.kaitaiProcessor.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) return NextResponse.json({ error: "処理場が見つかりません" }, { status: 404 });

  // Update processor + replace all prices
  const processor = await prisma.$transaction(async (tx) => {
    await tx.kaitaiProcessorPrice.deleteMany({ where: { processorId: id } });

    return tx.kaitaiProcessor.update({
      where: { id },
      data: {
        name:    name?.trim()    ?? existing.name,
        address: address?.trim() ?? null,
        notes:   notes?.trim()   ?? null,
        prices: prices?.length
          ? {
              create: (prices as { wasteType: string; unit: string; unitPrice: number }[])
                .filter(p => p.wasteType?.trim())
                .map(p => ({
                  companyId: session.companyId,
                  wasteType: p.wasteType.trim(),
                  unit:      p.unit ?? "kg",
                  unitPrice: Number(p.unitPrice) || 0,
                })),
            }
          : undefined,
      },
      include: { prices: { orderBy: { wasteType: "asc" } } },
    });
  });

  return NextResponse.json({ ok: true, processor });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const existing = await prisma.kaitaiProcessor.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) return NextResponse.json({ error: "処理場が見つかりません" }, { status: 404 });

  await prisma.kaitaiProcessor.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
