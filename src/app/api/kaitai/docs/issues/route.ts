import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

// GET /api/kaitai/docs/issues?siteId=xxx
// Returns all issue records for a site (optionally filtered by docType)
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const siteId  = req.nextUrl.searchParams.get("siteId");
  const docType = req.nextUrl.searchParams.get("docType");

  const where: Record<string, unknown> = { companyId: session.companyId };
  if (siteId)  where.siteId  = siteId;
  if (docType) where.docType = docType;

  const issues = await prisma.kaitaiDocIssue.findMany({
    where,
    orderBy: { issuedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ ok: true, issues });
}

// POST /api/kaitai/docs/issues
// Creates a new issue record (called when PDF is downloaded)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const body = await req.json();
  const { siteId, docType, docNo, snapshot } = body;

  if (!siteId || !docType || !docNo) {
    return NextResponse.json({ error: "siteId, docType, docNo が必要です" }, { status: 400 });
  }

  const issue = await prisma.kaitaiDocIssue.create({
    data: {
      companyId: session.companyId,
      siteId,
      docType,
      docNo,
      snapshot: snapshot ?? {},
    },
  });

  return NextResponse.json({ ok: true, issue });
}
