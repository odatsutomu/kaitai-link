import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

export type FeatureToggles = {
  clockIn:  boolean;
  break:    boolean;
  clockOut: boolean;
  report:   boolean;
  waste:    boolean;
  finish:   boolean;
};

export const DEFAULT_TOGGLES: FeatureToggles = {
  clockIn:  true,
  break:    true,
  clockOut: true,
  report:   true,
  waste:    true,
  finish:   true,
};

// GET: 現在のトグル設定を取得
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const company = await prisma.kaitaiCompany.findUnique({
    where: { id: session.companyId },
    select: { featureToggles: true },
  });

  const toggles = (company?.featureToggles as FeatureToggles | null) ?? DEFAULT_TOGGLES;

  return NextResponse.json({ ok: true, toggles });
}

// PATCH: トグル設定を更新（管理者のみ）
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const body = await req.json();
  const current = await prisma.kaitaiCompany.findUnique({
    where: { id: session.companyId },
    select: { featureToggles: true },
  });

  const currentToggles = (current?.featureToggles as FeatureToggles | null) ?? DEFAULT_TOGGLES;
  const updated = { ...currentToggles, ...body };

  await prisma.kaitaiCompany.update({
    where: { id: session.companyId },
    data: { featureToggles: updated },
  });

  return NextResponse.json({ ok: true, toggles: updated });
}
