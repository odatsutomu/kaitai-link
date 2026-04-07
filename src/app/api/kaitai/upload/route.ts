import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { uploadKaitaiImage } from "@/lib/kaitai/storage";
import { calcImageExpiry } from "@/lib/kaitai/plans";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30; // Vercel function timeout

// GET /api/kaitai/upload?siteId=xxx — list images for a site
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId が必要です" }, { status: 400 });

  const images = await prisma.kaitaiImage.findMany({
    where: { companyId: session.companyId, siteId },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, reportType: true, uploadedBy: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, images });
}

export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await req.json();
    const { dataUrl, siteId, reportType, uploadedBy } = body;

    if (!dataUrl || typeof dataUrl !== "string") {
      return NextResponse.json({ error: "画像データが不正です" }, { status: 400 });
    }

    // サイズ制限（10MB base64 ≒ 7.5MB 実データ）
    if (dataUrl.length > 14_000_000) {
      return NextResponse.json({ error: "画像サイズが大きすぎます（最大10MB）" }, { status: 413 });
    }

    // R2 にアップロード
    const { key, url } = await uploadKaitaiImage(dataUrl, session.companyId, {
      siteId,
      reportType,
    });

    // DB に保存（プランに応じた有効期限）
    const plan      = session.plan as Parameters<typeof calcImageExpiry>[0];
    const expiresAt = calcImageExpiry(plan);

    const image = await prisma.kaitaiImage.create({
      data: {
        companyId:  session.companyId,
        siteId:     siteId   ?? null,
        reportType: reportType ?? null,
        r2Key:      key,
        url,
        expiresAt,
        uploadedBy: uploadedBy ?? session.adminName,
      },
    });

    await prisma.kaitaiOperationLog.create({
      data: {
        companyId: session.companyId,
        action:    `image_upload:${reportType ?? "misc"}`,
        user:      uploadedBy ?? session.adminName,
        siteId:    siteId ?? null,
        device:    req.headers.get("user-agent")?.slice(0, 120) ?? "",
      },
    });

    return NextResponse.json({
      ok: true,
      image: { id: image.id, url: image.url, expiresAt: image.expiresAt },
    }, { status: 201 });

  } catch (err) {
    console.error("kaitai/upload error:", err);
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}
