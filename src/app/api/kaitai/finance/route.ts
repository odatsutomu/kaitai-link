import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/kaitai/finance
 *
 * Returns financial summary computed from real DB data:
 * - sites: contractAmount, paidAmount, costAmount per site
 * - expenses: aggregated from KaitaiExpenseLog by category
 * - totals: overall見込み受注額, 売上額, 原価, 粗利
 *
 * Optional query params:
 *   year=2026  — filter to sites active in that year
 *   month=4   — filter to sites active in that month (requires year)
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  if (session.authLevel !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const url = new URL(req.url);
  const yearParam = url.searchParams.get("year");
  const monthParam = url.searchParams.get("month");

  // ── Fetch all sites ──
  const allSites = await prisma.kaitaiSite.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "desc" },
  });

  // ── Period filter ──
  let sites = allSites;
  if (yearParam) {
    const year = parseInt(yearParam, 10);
    const month = monthParam ? parseInt(monthParam, 10) : null;
    const periodStart = month
      ? `${year}-${String(month).padStart(2, "0")}-01`
      : `${year}-01-01`;
    const periodEnd = month
      ? `${year}-${String(month).padStart(2, "0")}-31`
      : `${year}-12-31`;

    sites = allSites.filter(s => {
      const sStart = s.startDate || "2000-01-01";
      const sEnd = s.endDate || "2099-12-31";
      return sStart <= periodEnd && sEnd >= periodStart;
    });
  }

  // ── Expense logs by category ──
  const siteIds = sites.map(s => s.id);
  const expenseLogs = siteIds.length > 0
    ? await prisma.kaitaiExpenseLog.findMany({
        where: {
          companyId: session.companyId,
          siteId: { in: siteIds },
        },
      })
    : [];

  // Also fetch expenses not tied to specific sites (company-wide)
  const generalExpenses = await prisma.kaitaiExpenseLog.findMany({
    where: {
      companyId: session.companyId,
      siteId: null,
    },
  });

  // ── Aggregate expenses by category ──
  const expenseByCategory: Record<string, number> = {};
  const expenseBySite: Record<string, number> = {};
  for (const log of [...expenseLogs, ...generalExpenses]) {
    const cat = log.category ?? "その他";
    expenseByCategory[cat] = (expenseByCategory[cat] ?? 0) + (log.amount ?? 0);
    if (log.siteId) {
      expenseBySite[log.siteId] = (expenseBySite[log.siteId] ?? 0) + (log.amount ?? 0);
    }
  }

  // ── Site-level summary ──
  const siteSummaries = sites.map(s => ({
    id: s.id,
    name: s.name,
    status: s.status,
    contractAmount: s.contractAmount,    // 契約金額（見込み受注額）
    paidAmount: s.paidAmount,            // 入金済み（売上額）
    remainingAmount: s.contractAmount - s.paidAmount, // 未入金残高
    costAmount: s.costAmount,            // 手入力原価
    expenseTotal: expenseBySite[s.id] ?? 0, // 報告経費合計
    startDate: s.startDate,
    endDate: s.endDate,
    progressPct: s.progressPct,
  }));

  // ── Company totals ──
  const totalContract = sites.reduce((sum, s) => sum + s.contractAmount, 0);
  const totalPaid = sites.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalRemaining = totalContract - totalPaid;
  const totalExpense = [...expenseLogs, ...generalExpenses].reduce(
    (sum, log) => sum + (log.amount ?? 0), 0
  );

  // Cost categories
  const wasteCost = expenseByCategory["燃料費"] ?? 0;
  const laborCost = 0; // 労務費は経費カテゴリには含まれない（将来拡張用）
  const vehicleCost = expenseByCategory["交通費"] ?? 0;
  const materialCost = (expenseByCategory["資材購入"] ?? 0) + (expenseByCategory["工具・消耗品"] ?? 0);
  const otherCost = (expenseByCategory["食費・雑費"] ?? 0) + (expenseByCategory["その他"] ?? 0);
  const totalCost = totalExpense;

  const profit = totalPaid - totalCost;
  const profitRate = totalPaid > 0 ? Math.round((profit / totalPaid) * 1000) / 10 : 0;

  // ── Monthly breakdown (for charts) ──
  const monthlyData: Record<string, { revenue: number; cost: number; paid: number }> = {};
  for (const log of [...expenseLogs, ...generalExpenses]) {
    if (!log.date) continue;
    const monthKey = log.date.slice(0, 7); // "YYYY-MM"
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, cost: 0, paid: 0 };
    monthlyData[monthKey].cost += log.amount ?? 0;
  }

  // Active site count
  const activeStatuses = ["着工・内装解体", "上屋解体・基礎", "施工中", "解体中"];
  const activeSiteCount = sites.filter(s => activeStatuses.includes(s.status)).length;

  return NextResponse.json({
    ok: true,
    totals: {
      contractAmount: totalContract,  // 見込み受注額合計
      paidAmount: totalPaid,          // 売上額合計（入金済み）
      remainingAmount: totalRemaining, // 未入金残高
      totalCost,                       // 原価合計（経費リアルタイム）
      profit,                          // 粗利（売上 - 原価）
      profitRate,                      // 粗利率
      wasteCost,
      laborCost,
      vehicleCost,
      materialCost,
      otherCost,
    },
    sites: siteSummaries,
    expenseByCategory,
    activeSiteCount,
    totalSiteCount: sites.length,
  });
}
