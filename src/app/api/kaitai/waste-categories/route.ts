import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

// System default waste categories (seeded on first access per company)
const SYSTEM_DEFAULTS = [
  "コンクリートガラ（無筋）",
  "コンクリートガラ（有筋）",
  "アスファルトガラ",
  "木くず",
  "金属くず",
  "廃プラスチック類",
  "ガラス・陶磁器くず・瓦",
  "石膏ボード",
  "混合廃棄物（ミンチ）",
  "特別管理産業廃棄物（アスベスト等）",
];

// GET /api/kaitai/waste-categories — list (auto-seeds defaults on first access)
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const companyId = session.companyId;

  let categories = await prisma.kaitaiWasteCategory.findMany({
    where:   { companyId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  // Auto-seed system defaults on first access
  if (categories.length === 0) {
    await prisma.kaitaiWasteCategory.createMany({
      data: SYSTEM_DEFAULTS.map((name, i) => ({
        companyId,
        name,
        sortOrder: i,
        isDefault: true,
      })),
      skipDuplicates: true,
    });
    categories = await prisma.kaitaiWasteCategory.findMany({
      where:   { companyId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  return NextResponse.json({ ok: true, categories });
}

// POST /api/kaitai/waste-categories — add custom category
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "品目名は必須です" }, { status: 400 });

  // Get max sortOrder for custom items
  const last = await prisma.kaitaiWasteCategory.findFirst({
    where:   { companyId: session.companyId, isDefault: false },
    orderBy: { sortOrder: "desc" },
  });

  try {
    const category = await prisma.kaitaiWasteCategory.create({
      data: {
        companyId: session.companyId,
        name:      name.trim(),
        sortOrder: (last?.sortOrder ?? SYSTEM_DEFAULTS.length) + 1,
        isDefault: false,
      },
    });
    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "同じ名前の品目がすでに存在します" }, { status: 409 });
  }
}

// DELETE /api/kaitai/waste-categories?id=xxx — remove custom category
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const cat = await prisma.kaitaiWasteCategory.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!cat) return NextResponse.json({ error: "品目が見つかりません" }, { status: 404 });
  if (cat.isDefault) return NextResponse.json({ error: "システムデフォルト品目は削除できません" }, { status: 403 });

  await prisma.kaitaiWasteCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
