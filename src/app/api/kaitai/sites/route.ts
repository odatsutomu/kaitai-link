import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { PLAN_CONFIG, isValidPlan } from "@/lib/kaitai/plans";
import { prisma } from "@/lib/prisma";

// 財務フィールド（一般ユーザーのレスポンスから除外）
const FINANCIAL_FIELDS = [
  "contractAmount", "costAmount", "profit", "profitMargin",
  "budget", "wasteCost", "laborCost", "breakdown",
] as const;

type SiteRecord = Record<string, unknown>;

function sanitizeForWorker(site: SiteRecord): SiteRecord {
  const result = { ...site };
  for (const field of FINANCIAL_FIELDS) {
    delete result[field];
  }
  return result;
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const sites = await prisma.kaitaiSite.findMany({
    where:   { companyId: session.companyId },
    orderBy: { createdAt: "desc" },
  });

  // 管理者以外は財務データをレスポンスから除外
  const isAdmin = session.authLevel === "admin";
  const payload = isAdmin
    ? sites
    : sites.map(s => sanitizeForWorker(s as SiteRecord));

  return NextResponse.json(
    { ok: true, sites: payload },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  // プラン制限チェック
  const plan   = isValidPlan(session.plan) ? session.plan : "free";
  const config = PLAN_CONFIG[plan];
  const count  = await prisma.kaitaiSite.count({ where: { companyId: session.companyId } });

  if (config.maxSites !== Infinity && count >= config.maxSites) {
    return NextResponse.json({
      error:   `現在のプラン（${config.label}）では現場を${config.maxSites}件までしか登録できません`,
      upgrade: true,
    }, { status: 403 });
  }

  const body = await req.json();
  const { name, address, status, startDate, endDate, contractAmount, costAmount, clientId, notes, lat, lng, structureType, progressPct } = body;

  if (!name || !address) {
    return NextResponse.json({ error: "現場名と住所は必須です" }, { status: 400 });
  }

  const site = await prisma.kaitaiSite.create({
    data: {
      companyId:      session.companyId,
      name,
      address,
      status:         status         ?? "着工前",
      startDate:      startDate      ?? null,
      endDate:        endDate        ?? null,
      contractAmount: contractAmount ?? 0,
      costAmount:     costAmount     ?? 0,
      clientId:       clientId       ?? null,
      notes:          notes          ?? null,
      lat:            lat != null ? Number(lat) : null,
      lng:            lng != null ? Number(lng) : null,
      structureType:  structureType  ?? null,
      progressPct:    Number(progressPct) || 0,
    },
  });

  await prisma.kaitaiOperationLog.create({
    data: {
      companyId: session.companyId,
      action:    `site_create:${name}`,
      user:      session.adminName,
      siteId:    site.id,
      device:    req.headers.get("user-agent")?.slice(0, 120) ?? "",
    },
  });

  return NextResponse.json({ ok: true, site }, { status: 201 });
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

  // Ensure we only update sites belonging to this company
  const existing = await prisma.kaitaiSite.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "現場が見つかりません" }, { status: 404 });
  }

  const site = await prisma.kaitaiSite.update({
    where: { id },
    data:  patch,
  });

  return NextResponse.json({ ok: true, site });
}
