import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/kaitai/run-migration
 * Admin-only: applies pending DB schema changes via raw SQL.
 * Safe to call multiple times (all statements use IF NOT EXISTS / IF EXISTS).
 *
 * Current migrations:
 *   1. Add `direction` column to KaitaiProcessorPrice (default 'cost')
 *   2. Create KaitaiWasteCategory table
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const results: string[] = [];

  // 1. Add direction column to KaitaiProcessorPrice
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "KaitaiProcessorPrice"
      ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'cost'
    `);
    results.push("✅ KaitaiProcessorPrice.direction カラム追加（または既存）");
  } catch (e) {
    results.push(`⚠️ direction カラム: ${(e as Error).message}`);
  }

  // 2. Create KaitaiWasteCategory table
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "KaitaiWasteCategory" (
        id          TEXT        NOT NULL,
        "companyId" TEXT        NOT NULL,
        name        TEXT        NOT NULL,
        "sortOrder" INTEGER     NOT NULL DEFAULT 0,
        "isDefault" BOOLEAN     NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "KaitaiWasteCategory_pkey" PRIMARY KEY (id)
      )
    `);
    results.push("✅ KaitaiWasteCategory テーブル作成（または既存）");
  } catch (e) {
    results.push(`⚠️ KaitaiWasteCategory テーブル: ${(e as Error).message}`);
  }

  // 3. Foreign key constraint
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "KaitaiWasteCategory"
      ADD CONSTRAINT "KaitaiWasteCategory_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "KaitaiCompany"(id)
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    results.push("✅ 外部キー制約追加");
  } catch (e) {
    // Likely already exists — not critical
    const msg = (e as Error).message;
    if (msg.includes("already exists")) {
      results.push("✅ 外部キー制約（既存）");
    } else {
      results.push(`⚠️ 外部キー: ${msg}`);
    }
  }

  // 4. Unique index: companyId + name
  try {
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "KaitaiWasteCategory_companyId_name_key"
      ON "KaitaiWasteCategory"("companyId", name)
    `);
    results.push("✅ ユニークインデックス (companyId, name)");
  } catch (e) {
    results.push(`⚠️ ユニークインデックス: ${(e as Error).message}`);
  }

  // 5. Index: companyId
  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "KaitaiWasteCategory_companyId_idx"
      ON "KaitaiWasteCategory"("companyId")
    `);
    results.push("✅ インデックス (companyId)");
  } catch (e) {
    results.push(`⚠️ インデックス: ${(e as Error).message}`);
  }

  return NextResponse.json({ ok: true, results });
}
