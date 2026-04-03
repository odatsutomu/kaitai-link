import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

// GET: fetch user skills for a member (or all)
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const memberId = req.nextUrl.searchParams.get("memberId");

  const where: Record<string, unknown> = { companyId: session.companyId };
  if (memberId) where.memberId = memberId;

  const userSkills = await prisma.kaitaiUserSkill.findMany({
    where,
    include: { skill: { include: { category: true } } },
    orderBy: { achievedAt: "desc" },
  });

  return NextResponse.json({ ok: true, userSkills }, { headers: { "Cache-Control": "no-store" } });
}

// POST: record a skill achievement
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { memberId, skillId, taughtBy } = await req.json();
  if (!memberId || !skillId) return NextResponse.json({ error: "memberId と skillId は必須です" }, { status: 400 });

  // Verify skill belongs to company
  const skill = await prisma.kaitaiSkill.findFirst({ where: { id: skillId, companyId: session.companyId } });
  if (!skill) return NextResponse.json({ error: "スキルが見つかりません" }, { status: 404 });

  const userSkill = await prisma.kaitaiUserSkill.upsert({
    where: { companyId_memberId_skillId: { companyId: session.companyId, memberId, skillId } },
    create: { companyId: session.companyId, memberId, skillId, taughtBy: taughtBy ?? null },
    update: { taughtBy: taughtBy ?? null, achievedAt: new Date() },
  });

  // Log the activity
  const member = await prisma.kaitaiMember.findFirst({ where: { id: memberId, companyId: session.companyId } });
  const teacher = taughtBy ? await prisma.kaitaiMember.findFirst({ where: { id: taughtBy, companyId: session.companyId } }) : null;

  await prisma.kaitaiOperationLog.create({
    data: {
      companyId: session.companyId,
      action: `skill_achieve:${teacher?.name ?? "自主"}→${member?.name ?? memberId}:${skill.name}`,
      user: session.adminName ?? member?.name ?? "",
      device: req.headers.get("user-agent")?.slice(0, 120) ?? "",
    },
  });

  return NextResponse.json({ ok: true, userSkill }, { status: 201 });
}

// DELETE: remove a skill achievement
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { memberId, skillId } = await req.json();
  if (!memberId || !skillId) return NextResponse.json({ error: "memberId と skillId は必須です" }, { status: 400 });

  const existing = await prisma.kaitaiUserSkill.findFirst({
    where: { companyId: session.companyId, memberId, skillId },
  });
  if (!existing) return NextResponse.json({ error: "記録が見つかりません" }, { status: 404 });

  await prisma.kaitaiUserSkill.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
