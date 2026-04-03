import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

// Admin-only: GET evaluations for a given month
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const month = req.nextUrl.searchParams.get("month"); // "2026-04"
  if (!month) {
    return NextResponse.json({ error: "month パラメータが必要です" }, { status: 400 });
  }

  const evals = await prisma.kaitaiMonthlyEval.findMany({
    where: { companyId: session.companyId, month },
  });

  return NextResponse.json(
    { ok: true, evaluations: evals },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// Admin-only: Bulk upsert evaluations
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { month, evaluations } = body as {
    month: string;
    evaluations: {
      memberId: string;
      score1: number; score2: number; score3: number; score4: number; score5: number;
      memo?: string;
    }[];
  };

  if (!month || !Array.isArray(evaluations)) {
    return NextResponse.json({ error: "month と evaluations が必要です" }, { status: 400 });
  }

  const results = await Promise.all(
    evaluations.map((ev) =>
      prisma.kaitaiMonthlyEval.upsert({
        where: {
          companyId_memberId_month: {
            companyId: session.companyId,
            memberId: ev.memberId,
            month,
          },
        },
        create: {
          companyId: session.companyId,
          memberId: ev.memberId,
          month,
          score1: ev.score1,
          score2: ev.score2,
          score3: ev.score3,
          score4: ev.score4,
          score5: ev.score5,
          memo: ev.memo ?? null,
          confirmed: true,
        },
        update: {
          score1: ev.score1,
          score2: ev.score2,
          score3: ev.score3,
          score4: ev.score4,
          score5: ev.score5,
          memo: ev.memo ?? null,
          confirmed: true,
        },
      }),
    ),
  );

  await prisma.kaitaiOperationLog.create({
    data: {
      companyId: session.companyId,
      action: `monthly_eval:${month}:${results.length}名`,
      user: session.adminName,
      device: req.headers.get("user-agent")?.slice(0, 120) ?? "",
    },
  });

  return NextResponse.json({ ok: true, count: results.length }, { status: 200 });
}
