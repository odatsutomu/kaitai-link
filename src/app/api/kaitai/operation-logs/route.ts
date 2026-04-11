import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 500, 1000);

  const where: Record<string, unknown> = { companyId: session.companyId };

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
