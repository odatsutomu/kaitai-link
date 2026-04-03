import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

// 管理者のみ閲覧できるフィールド
const ADMIN_ONLY_FIELDS = [
  "address", "emergency", "birthDate", "dayRate",
] as const;

type MemberRecord = Record<string, unknown>;

function sanitizeForWorker(member: MemberRecord): MemberRecord {
  const result = { ...member };
  for (const field of ADMIN_ONLY_FIELDS) {
    delete result[field];
  }
  return result;
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const members = await prisma.kaitaiMember.findMany({
    where:   { companyId: session.companyId },
    orderBy: { createdAt: "desc" },
  });

  const isAdmin = session.authLevel === "admin";
  const payload = isAdmin
    ? members
    : members.map(m => sanitizeForWorker(m as MemberRecord));

  return NextResponse.json(
    { ok: true, members: payload },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { name, kana, type, company2, role, birthDate, hireDate, address, emergency, licenses, preYears, siteCount, dayRate, avatar } = body;

  if (!name) {
    return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
  }

  const member = await prisma.kaitaiMember.create({
    data: {
      companyId: session.companyId,
      name,
      kana:      kana      ?? null,
      type:      type      ?? "直用",
      company2:  company2  ?? null,
      role:      role      ?? "作業員",
      birthDate: birthDate ?? null,
      hireDate:  hireDate  ?? null,
      address:   address   ?? null,
      emergency: emergency ?? null,
      licenses:  licenses  ?? [],
      preYears:  Number(preYears)  || 0,
      siteCount: Number(siteCount) || 0,
      dayRate:   Number(dayRate)   || 0,
      avatar:    avatar    ?? null,
    },
  });

  await prisma.kaitaiOperationLog.create({
    data: {
      companyId: session.companyId,
      action:    `member_add:${name}`,
      user:      session.adminName,
      device:    req.headers.get("user-agent")?.slice(0, 120) ?? "",
    },
  });

  return NextResponse.json({ ok: true, member }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...patch } = body;
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  // Ensure we only update members belonging to this company
  const existing = await prisma.kaitaiMember.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "メンバーが見つかりません" }, { status: 404 });
  }

  const member = await prisma.kaitaiMember.update({
    where: { id },
    data:  patch,
  });

  return NextResponse.json({ ok: true, member });
}
