import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

// PATCH /api/kaitai/sites/notes
// Allows any authenticated user (worker or admin) to update site notes
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const body = await req.json();
  const { id, notes } = body;
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  // Ensure we only update sites belonging to this company
  const existing = await prisma.kaitaiSite.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "現場が見つかりません" }, { status: 404 });
  }

  const site = await prisma.kaitaiSite.update({
    where: { id },
    data: { notes: notes ?? "" },
  });

  return NextResponse.json({ ok: true, site });
}
