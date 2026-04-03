import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });

  const { categoryId, name } = await req.json();
  if (!categoryId || !name?.trim()) return NextResponse.json({ error: "カテゴリIDとスキル名は必須です" }, { status: 400 });

  const cat = await prisma.kaitaiSkillCategory.findFirst({ where: { id: categoryId, companyId: session.companyId } });
  if (!cat) return NextResponse.json({ error: "カテゴリが見つかりません" }, { status: 404 });

  const count = await prisma.kaitaiSkill.count({ where: { categoryId } });
  const skill = await prisma.kaitaiSkill.create({
    data: { companyId: session.companyId, categoryId, name: name.trim(), sortOrder: count },
  });

  return NextResponse.json({ ok: true, skill }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });

  const { id, name } = await req.json();
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const existing = await prisma.kaitaiSkill.findFirst({ where: { id, companyId: session.companyId } });
  if (!existing) return NextResponse.json({ error: "スキルが見つかりません" }, { status: 404 });

  const skill = await prisma.kaitaiSkill.update({ where: { id }, data: { name: name.trim() } });
  return NextResponse.json({ ok: true, skill });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const existing = await prisma.kaitaiSkill.findFirst({ where: { id, companyId: session.companyId } });
  if (!existing) return NextResponse.json({ error: "スキルが見つかりません" }, { status: 404 });

  await prisma.kaitaiSkill.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
