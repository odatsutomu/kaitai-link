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
  // Fetch ALL company expenses for monthly chart (not limited to filtered sites)
  const allExpenses = await prisma.kaitaiExpenseLog.findMany({
    where: { companyId: session.companyId },
  });

  const monthlyData: Record<string, { revenue: number; cost: number; paid: number }> = {};
  for (const log of allExpenses) {
    if (!log.date) continue;
    const monthKey = log.date.slice(0, 7); // "YYYY-MM"
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, cost: 0, paid: 0 };
    monthlyData[monthKey].cost += log.amount ?? 0;
  }
  // Add paid amounts from sites by their completion/payment timing
  for (const s of allSites) {
    if (s.paidAmount > 0) {
      // Use endDate or startDate as proxy for when revenue was recognized
      const dateKey = (s.endDate || s.startDate || s.createdAt?.toISOString()?.slice(0, 7) || "");
      const mk = dateKey.slice(0, 7);
      if (mk) {
        if (!monthlyData[mk]) monthlyData[mk] = { revenue: 0, cost: 0, paid: 0 };
        monthlyData[mk].revenue += s.contractAmount;
        monthlyData[mk].paid += s.paidAmount;
      }
    }
  }

  // ── Previous period totals (for trend comparison) ──
  let prevTotals: { contractAmount: number; paidAmount: number; totalCost: number; profit: number; profitRate: number } | null = null;
  if (yearParam && monthParam) {
    const pm = parseInt(monthParam, 10) - 1;
    const py = pm === 0 ? parseInt(yearParam, 10) - 1 : parseInt(yearParam, 10);
    const prevMonth = pm === 0 ? 12 : pm;
    const prevStart = `${py}-${String(prevMonth).padStart(2, "0")}-01`;
    const prevEnd = `${py}-${String(prevMonth).padStart(2, "0")}-31`;

    const prevSites = allSites.filter(s => {
      const sStart = s.startDate || "2000-01-01";
      const sEnd = s.endDate || "2099-12-31";
      return sStart <= prevEnd && sEnd >= prevStart;
    });
    const prevSiteIds = prevSites.map(s => s.id);
    const prevExpenses = allExpenses.filter(e => prevSiteIds.includes(e.siteId ?? ""));
    const prevContract = prevSites.reduce((sum, s) => sum + s.contractAmount, 0);
    const prevPaid = prevSites.reduce((sum, s) => sum + s.paidAmount, 0);
    const prevCost = prevExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
    const prevProfit = prevPaid - prevCost;
    const prevProfitRate = prevPaid > 0 ? Math.round((prevProfit / prevPaid) * 1000) / 10 : 0;
    prevTotals = { contractAmount: prevContract, paidAmount: prevPaid, totalCost: prevCost, profit: prevProfit, profitRate: prevProfitRate };
  }

  // Active site count
  const activeStatuses = ["着工・内装解体", "上屋解体・基礎", "施工中", "解体中"];
  const activeSiteCount = sites.filter(s => activeStatuses.includes(s.status)).length;

  return NextResponse.json({
    ok: true,
    totals: {
      contractAmount: totalContract,
      paidAmount: totalPaid,
      remainingAmount: totalRemaining,
      totalCost,
      profit,
      profitRate,
      wasteCost,
      laborCost,
      vehicleCost,
      materialCost,
      otherCost,
    },
    prevTotals,
    sites: siteSummaries,
    expenseByCategory,
    monthlyData,
    activeSiteCount,
    totalSiteCount: sites.length,
  });
}
