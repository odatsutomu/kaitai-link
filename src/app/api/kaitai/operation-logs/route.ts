import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type");

  const where: Record<string, unknown> = { companyId: session.companyId };

  // Filter by action type prefix
  if (type === "skill") {
    where.action = { startsWith: "skill_achieve:" };
  }

  const logs = await prisma.kaitaiOperationLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ ok: true, logs }, { headers: { "Cache-Control": "no-store" } });
}
