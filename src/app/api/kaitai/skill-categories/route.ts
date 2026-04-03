import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const categories = await prisma.kaitaiSkillCategory.findMany({
    where: { companyId: session.companyId },
    include: { skills: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ ok: true, categories }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "カテゴリ名は必須です" }, { status: 400 });

  const count = await prisma.kaitaiSkillCategory.count({ where: { companyId: session.companyId } });
  const category = await prisma.kaitaiSkillCategory.create({
    data: { companyId: session.companyId, name: name.trim(), sortOrder: count },
  });

  return NextResponse.json({ ok: true, category }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });

  const { id, name } = await req.json();
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const existing = await prisma.kaitaiSkillCategory.findFirst({ where: { id, companyId: session.companyId } });
  if (!existing) return NextResponse.json({ error: "カテゴリが見つかりません" }, { status: 404 });

  const category = await prisma.kaitaiSkillCategory.update({ where: { id }, data: { name: name.trim() } });
  return NextResponse.json({ ok: true, category });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const existing = await prisma.kaitaiSkillCategory.findFirst({ where: { id, companyId: session.companyId } });
  if (!existing) return NextResponse.json({ error: "カテゴリが見つかりません" }, { status: 404 });

  await prisma.kaitaiSkillCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
