import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

/** Worker-accessible endpoint to update site progress percentage */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { siteId, progressPct } = await req.json();
  if (!siteId || typeof progressPct !== "number") {
    return NextResponse.json({ error: "siteId と progressPct が必要です" }, { status: 400 });
  }

  const clamped = Math.max(0, Math.min(100, Math.round(progressPct)));

  const existing = await prisma.kaitaiSite.findFirst({
    where: { id: siteId, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "現場が見つかりません" }, { status: 404 });
  }

  await prisma.kaitaiSite.update({
    where: { id: siteId },
    data: { progressPct: clamped },
  });

  return NextResponse.json({ ok: true, progressPct: clamped });
}
