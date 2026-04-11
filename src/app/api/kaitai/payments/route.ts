import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/kaitai/payments?siteId=xxx
 * Returns payment history for a site (or all sites if no siteId).
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const siteId = req.nextUrl.searchParams.get("siteId");

  const where: Record<string, unknown> = { companyId: session.companyId };
  if (siteId) where.siteId = siteId;

  const payments = await prisma.kaitaiPayment.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ ok: true, payments });
}

/**
 * POST /api/kaitai/payments
 * Create a new payment record and update site.paidAmount.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { siteId, amount, date, note } = body;

  if (!siteId || !amount || !date) {
    return NextResponse.json({ error: "siteId, amount, date は必須です" }, { status: 400 });
  }

  // Verify site belongs to company
  const site = await prisma.kaitaiSite.findFirst({
    where: { id: siteId, companyId: session.companyId },
  });
  if (!site) {
    return NextResponse.json({ error: "現場が見つかりません" }, { status: 404 });
  }

  // Create payment record
  const payment = await prisma.kaitaiPayment.create({
    data: {
      companyId: session.companyId,
      siteId,
      amount: Math.round(Number(amount)),
      date,
      note: note ?? null,
    },
  });

  // Recalculate paidAmount from all payments
  const allPayments = await prisma.kaitaiPayment.findMany({
    where: { siteId, companyId: session.companyId },
  });
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

  await prisma.kaitaiSite.update({
    where: { id: siteId },
    data: { paidAmount: totalPaid },
  });

  return NextResponse.json({ ok: true, payment, totalPaid }, { status: 201 });
}

/**
 * PATCH /api/kaitai/payments
 * Edit an existing payment record and recalculate site.paidAmount.
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { id, amount, date, note } = body;

  if (!id) {
    return NextResponse.json({ error: "id は必須です" }, { status: 400 });
  }

  const existing = await prisma.kaitaiPayment.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "入金記録が見つかりません" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (amount !== undefined) updateData.amount = Math.round(Number(amount));
  if (date !== undefined) updateData.date = date;
  if (note !== undefined) updateData.note = note;

  const payment = await prisma.kaitaiPayment.update({
    where: { id },
    data: updateData,
  });

  // Recalculate paidAmount
  const allPayments = await prisma.kaitaiPayment.findMany({
    where: { siteId: existing.siteId, companyId: session.companyId },
  });
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

  await prisma.kaitaiSite.update({
    where: { id: existing.siteId },
    data: { paidAmount: totalPaid },
  });

  return NextResponse.json({ ok: true, payment, totalPaid });
}

/**
 * DELETE /api/kaitai/payments
 * Delete a payment record and recalculate site.paidAmount.
 */
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "id は必須です" }, { status: 400 });
  }

  const existing = await prisma.kaitaiPayment.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "入金記録が見つかりません" }, { status: 404 });
  }

  await prisma.kaitaiPayment.delete({ where: { id } });

  // Recalculate paidAmount
  const allPayments = await prisma.kaitaiPayment.findMany({
    where: { siteId: existing.siteId, companyId: session.companyId },
  });
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

  await prisma.kaitaiSite.update({
    where: { id: existing.siteId },
    data: { paidAmount: totalPaid },
  });

  return NextResponse.json({ ok: true, totalPaid });
}
