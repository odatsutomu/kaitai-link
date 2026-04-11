import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/kaitai/reset-all
 * Deletes ALL kaitai data from the database (full reset for production launch).
 * Uses TRUNCATE CASCADE so order doesn't matter.
 * Protected by a one-time secret key.
 */
const RESET_KEY = "kaitai-reset-production-2026";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: NextRequest) {
  const key = req.headers.get("x-reset-key");
  if (key !== RESET_KEY) {
    return NextResponse.json({ error: "不正なキーです" }, { status: 403 });
  }

  const tables = [
    "KaitaiWasteDispatch",
    "KaitaiContractData",
    "KaitaiExpenseLog",
    "KaitaiOperationLog",
    "KaitaiMonthlyEval",
    "KaitaiUserSkill",
    "KaitaiSkill",
    "KaitaiSkillCategory",
    "KaitaiEquipment",
    "KaitaiImage",
    "KaitaiWasteCategory",
    "KaitaiProcessorPrice",
    "KaitaiProcessor",
    "KaitaiSite",
    "KaitaiClient",
    "KaitaiMember",
    "KaitaiSession",
    "KaitaiCompany",
  ];

  const results: string[] = [];

  for (const table of tables) {
    try {
      const deleted = await prisma.$executeRawUnsafe(
        `DELETE FROM "${table}"`
      );
      results.push(`✅ ${table}: ${deleted}件削除`);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("does not exist")) {
        results.push(`⚠️ ${table}: テーブルなし（スキップ）`);
      } else {
        results.push(`❌ ${table}: ${msg}`);
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
