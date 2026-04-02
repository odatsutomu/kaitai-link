// Vercel Cron: 毎日 3:00 JST に実行
// vercel.json で設定

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteKaitaiImages } from "@/lib/kaitai/storage";
import { cleanExpiredSessions } from "@/lib/kaitai/session";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel Cron の認証
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // 1. 期限切れ画像を DB から取得
  const expiredImages = await prisma.kaitaiImage.findMany({
    where: {
      expiresAt: { not: null, lt: now },
    },
    select: { id: true, r2Key: true },
    take: 500, // 1回あたり最大500件
  });

  let deletedCount = 0;

  if (expiredImages.length > 0) {
    const keys = expiredImages.map(img => img.r2Key);
    const ids  = expiredImages.map(img => img.id);

    // R2 から削除
    await deleteKaitaiImages(keys);

    // DB から削除
    await prisma.kaitaiImage.deleteMany({ where: { id: { in: ids } } });
    deletedCount = expiredImages.length;
  }

  // 2. 期限切れセッションをクリーンアップ
  await cleanExpiredSessions();

  // 3. ログ
  await prisma.kaitaiOperationLog.create({
    data: {
      action: `cron_cleanup: ${deletedCount} images deleted`,
      user:   "system",
      device: "vercel-cron",
    },
  });

  return NextResponse.json({
    ok:           true,
    deletedImages: deletedCount,
    timestamp:    now.toISOString(),
  });
}
