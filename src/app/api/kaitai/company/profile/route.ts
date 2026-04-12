import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

// GET /api/kaitai/company/profile
// Returns company profile (self-company info for documents) + stampUrl
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const company = await prisma.kaitaiCompany.findUnique({
    where: { id: session.companyId },
    select: { profile: true, stampUrl: true, name: true, address: true, phone: true },
  });

  if (!company) return NextResponse.json({ error: "会社が見つかりません" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    profile: company.profile ?? {},
    stampUrl: company.stampUrl ?? null,
    // Fallback to basic company fields if profile is empty
    defaults: {
      name: company.name,
      address: company.address,
      tel: company.phone,
    },
  });
}

// PATCH /api/kaitai/company/profile
// Updates company profile and/or stampUrl (admin only)
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { profile, stampUrl } = body;

  const data: Record<string, unknown> = {};
  if (profile !== undefined) data.profile = profile;
  if (stampUrl !== undefined) data.stampUrl = stampUrl;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "更新データがありません" }, { status: 400 });
  }

  const company = await prisma.kaitaiCompany.update({
    where: { id: session.companyId },
    data,
    select: { profile: true, stampUrl: true },
  });

  return NextResponse.json({ ok: true, profile: company.profile, stampUrl: company.stampUrl });
}
