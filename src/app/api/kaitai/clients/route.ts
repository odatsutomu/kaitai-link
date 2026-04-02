import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const clients = await prisma.kaitaiClient.findMany({
    where:   { companyId: session.companyId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, clients });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { name, contactName, phone, email, address, memo, status } = await req.json();
  if (!name) return NextResponse.json({ error: "元請け名は必須です" }, { status: 400 });

  const client = await prisma.kaitaiClient.create({
    data: {
      companyId:   session.companyId,
      name,
      contactName: contactName ?? null,
      phone:       phone       ?? null,
      email:       email       ?? null,
      address:     address     ?? null,
      memo:        memo        ?? null,
      status:      status      ?? "active",
    },
  });

  return NextResponse.json({ ok: true, client }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { id, ...patch } = await req.json();
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const client = await prisma.kaitaiClient.update({ where: { id }, data: patch });
  return NextResponse.json({ ok: true, client });
}
