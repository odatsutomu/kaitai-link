import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type");
  const siteId = req.nextUrl.searchParams.get("siteId");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 500, 1000);

  const where: Record<string, unknown> = { companyId: session.companyId };

  // Filter by siteId if provided
  if (siteId) {
    where.siteId = siteId;
  }

  // Filter by action type prefix
  if (type === "skill") {
    where.action = { startsWith: "skill_" };
  } else if (type === "reports") {
    // All report-related actions
    where.action = {
      in: undefined, // Will use OR below
    };
    // Use Prisma OR for multiple prefixes
    delete where.action;
    where.OR = [
      { action: { startsWith: "start:" } },
      { action: { startsWith: "break_" } },
      { action: { startsWith: "clockout:" } },
      { action: { startsWith: "daily_report:" } },
      { action: { startsWith: "finish:" } },
      { action: { startsWith: "expense_log:" } },
      { action: { startsWith: "fuel_log:" } },
      { action: { startsWith: "waste_dispatch:" } },
      { action: { startsWith: "irregular" } },
    ];
  }

  const logs = await prisma.kaitaiOperationLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ ok: true, logs }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const body = await req.json();
  const { action, user, device, siteId, imageIds } = body;

  if (!action) {
    return NextResponse.json({ error: "actionは必須です" }, { status: 400 });
  }

  const log = await prisma.kaitaiOperationLog.create({
    data: {
      companyId: session.companyId,
      action,
      user: user ?? "system",
      device: device ?? "",
      siteId: siteId ?? null,
      imageIds: Array.isArray(imageIds) ? imageIds : [],
    },
  });

  return NextResponse.json({ ok: true, log }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const existing = await prisma.kaitaiOperationLog.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "ログが見つかりません" }, { status: 404 });
  }

  // Cascade-delete related records based on action type
  const action = existing.action;
  const ts = existing.createdAt;
  const windowMs = 120_000; // ±2 minutes for timestamp matching
  const tMin = new Date(ts.getTime() - windowMs);
  const tMax = new Date(ts.getTime() + windowMs);

  if (action.startsWith("expense_log:") || action.startsWith("fuel_log:")) {
    // Delete related KaitaiExpenseLog matched by timestamp + reporter + company
    await prisma.kaitaiExpenseLog.deleteMany({
      where: {
        companyId: session.companyId,
        reporter: existing.user,
        createdAt: { gte: tMin, lte: tMax },
        ...(existing.siteId ? { siteId: existing.siteId } : {}),
      },
    });
  } else if (action.startsWith("waste_dispatch:")) {
    // Delete related KaitaiWasteDispatch matched by timestamp + reporter + company
    await prisma.kaitaiWasteDispatch.deleteMany({
      where: {
        companyId: session.companyId,
        reporter: existing.user,
        createdAt: { gte: tMin, lte: tMax },
        ...(existing.siteId ? { siteId: existing.siteId } : {}),
      },
    });
  }

  await prisma.kaitaiOperationLog.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
