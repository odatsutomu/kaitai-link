import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";
import {
  computeAllScores,
  getWindowMonths,
  type MemberScoreInput,
} from "@/app/kaitai/lib/score-engine";

/**
 * GET /api/kaitai/scores?month=2026-04
 * Admin-only: returns computed decay scores for all members.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const month = req.nextUrl.searchParams.get("month");
  if (!month) {
    return NextResponse.json({ error: "month パラメータが必要です" }, { status: 400 });
  }

  // Fetch members
  const members = await prisma.kaitaiMember.findMany({
    where: { companyId: session.companyId },
    select: { id: true, name: true, licenses: true },
  });

  // Fetch evaluations within the 3-month window
  const windowMonths = getWindowMonths(month);
  const evals = await prisma.kaitaiMonthlyEval.findMany({
    where: {
      companyId: session.companyId,
      month: { in: windowMonths },
    },
  });

  // 90-day window for skill bonuses
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Fetch user skills within 90-day window for teaching & learning bonuses
  const recentSkills = await prisma.kaitaiUserSkill.findMany({
    where: {
      companyId: session.companyId,
      achievedAt: { gte: ninetyDaysAgo },
    },
    select: { memberId: true, taughtBy: true },
  });

  // Count teaching events per member (where they appear as taughtBy)
  const teachingCounts = new Map<string, number>();
  const learningCounts = new Map<string, number>();
  for (const skill of recentSkills) {
    // Learning count
    learningCounts.set(skill.memberId, (learningCounts.get(skill.memberId) ?? 0) + 1);
    // Teaching count
    if (skill.taughtBy) {
      teachingCounts.set(skill.taughtBy, (teachingCounts.get(skill.taughtBy) ?? 0) + 1);
    }
  }

  // Group evaluations by member
  const evalsByMember = new Map<string, typeof evals>();
  for (const ev of evals) {
    const list = evalsByMember.get(ev.memberId) ?? [];
    list.push(ev);
    evalsByMember.set(ev.memberId, list);
  }

  // Build input for scoring engine
  // Note: attendancePct and reportPct default to 95/90 as placeholder
  // until a real attendance tracking system is built
  const inputs: MemberScoreInput[] = members.map(m => ({
    memberId: m.id,
    licenses: m.licenses,
    evaluations: (evalsByMember.get(m.id) ?? []).map(ev => ({
      month: ev.month,
      score1: ev.score1,
      score2: ev.score2,
      score3: ev.score3,
      score4: ev.score4,
      score5: ev.score5,
    })),
    teachingCount: teachingCounts.get(m.id) ?? 0,
    learningCount: learningCounts.get(m.id) ?? 0,
    attendancePct: 95,
    reportPct: 90,
  }));

  const scores = computeAllScores(inputs, month);

  return NextResponse.json(
    { ok: true, scores },
    { headers: { "Cache-Control": "no-store" } },
  );
}
