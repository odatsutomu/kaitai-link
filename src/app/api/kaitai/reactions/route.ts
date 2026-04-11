import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

// GET /api/kaitai/reactions?logIds=id1,id2,id3
// Batch fetch reactions for multiple operation logs
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const logIdsParam = req.nextUrl.searchParams.get("logIds");
  if (!logIdsParam) {
    return NextResponse.json({ error: "logIds が必要です" }, { status: 400 });
  }

  const logIds = logIdsParam.split(",").filter(Boolean);
  if (logIds.length === 0) {
    return NextResponse.json({ ok: true, reactions: [] });
  }

  const reactions = await prisma.kaitaiReportReaction.findMany({
    where: {
      companyId: session.companyId,
      logId: { in: logIds },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, reactions });
}

// POST /api/kaitai/reactions
// Create or update a reaction on a report
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const body = await req.json();
  const { logId, status, comment } = body;

  if (!logId || !status) {
    return NextResponse.json({ error: "logId と status は必須です" }, { status: 400 });
  }

  const validStatuses = ["confirmed", "approved", "action_required", "call_required"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
  }

  // Verify the log belongs to this company
  const log = await prisma.kaitaiOperationLog.findFirst({
    where: { id: logId, companyId: session.companyId },
  });
  if (!log) {
    return NextResponse.json({ error: "報告が見つかりません" }, { status: 404 });
  }

  // Upsert: replace previous reaction from same admin on same log
  const existing = await prisma.kaitaiReportReaction.findFirst({
    where: { logId, companyId: session.companyId },
  });

  let reaction;
  if (existing) {
    reaction = await prisma.kaitaiReportReaction.update({
      where: { id: existing.id },
      data: {
        status,
        comment: comment ?? null,
        adminName: session.adminName,
      },
    });
  } else {
    reaction = await prisma.kaitaiReportReaction.create({
      data: {
        companyId: session.companyId,
        logId,
        status,
        comment: comment ?? null,
        adminName: session.adminName,
      },
    });
  }

  return NextResponse.json({ ok: true, reaction }, { status: 201 });
}
