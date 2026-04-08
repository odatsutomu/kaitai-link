import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/kaitai/run-migration
 * Idempotent DB migration — safe to call multiple times.
 * Creates missing tables/columns for the processor & waste category features.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: NextRequest) {
  const results: string[] = [];

  // ── 0. Diagnose existing tables ────────────────────────────────────────────
  let existingTables: string[] = [];
  try {
    const rows = await prisma.$queryRawUnsafe<{ table_name: string }[]>(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    existingTables = rows.map(r => r.table_name);
    results.push(`📋 既存テーブル: ${existingTables.join(", ")}`);
  } catch (e) {
    results.push(`⚠️ テーブル一覧取得失敗: ${(e as Error).message}`);
  }

  const has = (name: string) =>
    existingTables.some(t => t === name || t.toLowerCase() === name.toLowerCase());

  // ── 1. KaitaiProcessor ────────────────────────────────────────────────────
  if (!has("KaitaiProcessor")) {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "KaitaiProcessor" (
          id          TEXT        NOT NULL,
          "companyId" TEXT        NOT NULL,
          name        TEXT        NOT NULL,
          address     TEXT,
          lat         DOUBLE PRECISION,
          lng         DOUBLE PRECISION,
          notes       TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "KaitaiProcessor_pkey" PRIMARY KEY (id)
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "KaitaiProcessor_companyId_idx"
        ON "KaitaiProcessor"("companyId")
      `);
      results.push("✅ KaitaiProcessor テーブル作成");
    } catch (e) {
      results.push(`⚠️ KaitaiProcessor 作成: ${(e as Error).message}`);
    }
  } else {
    results.push("✅ KaitaiProcessor テーブル（既存）");
  }

  // ── 2. KaitaiProcessorPrice ───────────────────────────────────────────────
  if (!has("KaitaiProcessorPrice")) {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "KaitaiProcessorPrice" (
          id            TEXT        NOT NULL,
          "companyId"   TEXT        NOT NULL,
          "processorId" TEXT        NOT NULL,
          "wasteType"   TEXT        NOT NULL,
          unit          TEXT        NOT NULL DEFAULT 't',
          "unitPrice"   INTEGER     NOT NULL DEFAULT 0,
          direction     TEXT        NOT NULL DEFAULT 'cost',
          "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "KaitaiProcessorPrice_pkey" PRIMARY KEY (id)
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "KaitaiProcessorPrice_processorId_wasteType_key"
        ON "KaitaiProcessorPrice"("processorId", "wasteType")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "KaitaiProcessorPrice_companyId_idx"
        ON "KaitaiProcessorPrice"("companyId")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "KaitaiProcessorPrice_processorId_idx"
        ON "KaitaiProcessorPrice"("processorId")
      `);
      results.push("✅ KaitaiProcessorPrice テーブル作成");
    } catch (e) {
      results.push(`⚠️ KaitaiProcessorPrice 作成: ${(e as Error).message}`);
    }
  } else {
    // Table exists — just ensure direction column is there
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "KaitaiProcessorPrice"
        ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'cost'
      `);
      results.push("✅ KaitaiProcessorPrice.direction カラム確認・追加");
    } catch (e) {
      results.push(`⚠️ direction カラム: ${(e as Error).message}`);
    }
  }

  // ── 3. KaitaiWasteCategory ────────────────────────────────────────────────
  if (!has("KaitaiWasteCategory")) {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "KaitaiWasteCategory" (
          id          TEXT        NOT NULL,
          "companyId" TEXT        NOT NULL,
          name        TEXT        NOT NULL,
          "sortOrder" INTEGER     NOT NULL DEFAULT 0,
          "isDefault" BOOLEAN     NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "KaitaiWasteCategory_pkey" PRIMARY KEY (id)
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "KaitaiWasteCategory_companyId_name_key"
        ON "KaitaiWasteCategory"("companyId", name)
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "KaitaiWasteCategory_companyId_idx"
        ON "KaitaiWasteCategory"("companyId")
      `);
      results.push("✅ KaitaiWasteCategory テーブル作成");
    } catch (e) {
      results.push(`⚠️ KaitaiWasteCategory 作成: ${(e as Error).message}`);
    }
  } else {
    results.push("✅ KaitaiWasteCategory テーブル（既存）");
  }

  // ── 4. Foreign keys (best-effort) ─────────────────────────────────────────
  const fks: [string, string][] = [
    [
      `ALTER TABLE "KaitaiProcessor" ADD CONSTRAINT "KaitaiProcessor_companyId_fkey"
       FOREIGN KEY ("companyId") REFERENCES "KaitaiCompany"(id) ON DELETE CASCADE`,
      "KaitaiProcessor.companyId FK",
    ],
    [
      `ALTER TABLE "KaitaiProcessorPrice" ADD CONSTRAINT "KaitaiProcessorPrice_companyId_fkey"
       FOREIGN KEY ("companyId") REFERENCES "KaitaiCompany"(id) ON DELETE CASCADE`,
      "KaitaiProcessorPrice.companyId FK",
    ],
    [
      `ALTER TABLE "KaitaiProcessorPrice" ADD CONSTRAINT "KaitaiProcessorPrice_processorId_fkey"
       FOREIGN KEY ("processorId") REFERENCES "KaitaiProcessor"(id) ON DELETE CASCADE`,
      "KaitaiProcessorPrice.processorId FK",
    ],
    [
      `ALTER TABLE "KaitaiWasteCategory" ADD CONSTRAINT "KaitaiWasteCategory_companyId_fkey"
       FOREIGN KEY ("companyId") REFERENCES "KaitaiCompany"(id) ON DELETE CASCADE`,
      "KaitaiWasteCategory.companyId FK",
    ],
  ];

  for (const [sql, label] of fks) {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push(`✅ ${label} 追加`);
    } catch (e) {
      const msg = (e as Error).message;
      results.push(msg.includes("already exists") ? `✅ ${label}（既存）` : `⚠️ ${label}: ${msg}`);
    }
  }

  return NextResponse.json({ ok: true, results });
}
