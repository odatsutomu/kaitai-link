import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

// GET /api/kaitai/sites/contract?siteId=xxx
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId が必要です" }, { status: 400 });

  // Verify site belongs to company
  const site = await prisma.kaitaiSite.findFirst({
    where: { id: siteId, companyId: session.companyId },
  });
  if (!site) return NextResponse.json({ error: "現場が見つかりません" }, { status: 404 });

  let data = await prisma.kaitaiContractData.findUnique({ where: { siteId } });

  // Auto-create with site defaults if not yet saved
  if (!data) {
    data = await prisma.kaitaiContractData.create({
      data: {
        companyId:      session.companyId,
        siteId,
        projectName:    site.name,
        projectAddress: site.address,
      },
    });
  }

  return NextResponse.json({ ok: true, data });
}

// PATCH /api/kaitai/sites/contract
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { siteId, ...fields } = body;
  if (!siteId) return NextResponse.json({ error: "siteId が必要です" }, { status: 400 });

  // Verify site belongs to company
  const site = await prisma.kaitaiSite.findFirst({
    where: { id: siteId, companyId: session.companyId },
  });
  if (!site) return NextResponse.json({ error: "現場が見つかりません" }, { status: 404 });

  // Whitelist updatable fields
  const allowed = [
    "clientName", "clientZip", "clientAddress", "clientContact",
    "paymentTerms", "expiryDays", "projectName", "projectAddress",
    "estimateItems", "invoiceItems", "notes",
    "landAddress", "houseNo", "structureKind",
    "floor1Area", "floor2Area", "floor3Area",
    "photoIds",
  ];
  const updateData: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in fields) updateData[key] = fields[key];
  }

  const data = await prisma.kaitaiContractData.upsert({
    where: { siteId },
    update: updateData,
    create: {
      companyId: session.companyId,
      siteId,
      projectName:    site.name,
      projectAddress: site.address,
      ...updateData,
    },
  });

  return NextResponse.json({ ok: true, data });
}
