import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { uploadKaitaiImageBinary } from "@/lib/kaitai/storage";
import { calcImageExpiry } from "@/lib/kaitai/plans";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30; // Vercel function timeout

// GET /api/kaitai/upload?siteId=xxx — list images for a site
// GET /api/kaitai/upload?recent=1&days=30 — list all recent images for the company
// GET /api/kaitai/upload?uploadedBy=xxx&reportType=xxx&from=xxx&to=xxx — list images by filters
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const siteId     = req.nextUrl.searchParams.get("siteId");
  const uploadedBy = req.nextUrl.searchParams.get("uploadedBy");
  const reportType = req.nextUrl.searchParams.get("reportType");
  const from       = req.nextUrl.searchParams.get("from");
  const to         = req.nextUrl.searchParams.get("to");
  const recent     = req.nextUrl.searchParams.get("recent");
  const days       = parseInt(req.nextUrl.searchParams.get("days") ?? "30") || 30;

  // "recent" mode — fetch all images for the company within N days
  if (recent === "1") {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const images = await prisma.kaitaiImage.findMany({
      where: {
        companyId: session.companyId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, reportType: true, uploadedBy: true, createdAt: true },
      take: 500,
    });

    return NextResponse.json({ ok: true, images });
  }

  // At least one filter required
  if (!siteId && !uploadedBy && !reportType) {
    return NextResponse.json({ error: "siteId, uploadedBy, または reportType が必要です" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { companyId: session.companyId };
  if (siteId)     where.siteId     = siteId;
  if (uploadedBy) where.uploadedBy = uploadedBy;
  if (reportType) where.reportType = reportType;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to);
  }

  const images = await prisma.kaitaiImage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, reportType: true, uploadedBy: true, createdAt: true },
    take: 50,
  });

  return NextResponse.json({ ok: true, images });
}

export async function POST(req: NextRequest) {
  // ── Step 1: 認証 ──
  let session;
  try {
    session = await getSessionFromRequest(req);
  } catch (err) {
    console.error("upload auth error:", err);
    return NextResponse.json({ error: "認証処理エラー", detail: String(err) }, { status: 500 });
  }
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // ── Step 2: リクエストボディ解析 ──
  let buffer: Buffer;
  let mimeType = "image/jpeg";
  let siteId: string | undefined;
  let reportType: string | undefined;
  let uploadedBy: string | undefined;

  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      // ── FormData (binary) ──
      const formData = await req.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: "ファイルが不正です" }, { status: 400 });
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "画像サイズが大きすぎます（最大10MB）" }, { status: 413 });
      }

      siteId     = formData.get("siteId")?.toString() || undefined;
      reportType = formData.get("reportType")?.toString() || undefined;
      uploadedBy = formData.get("uploadedBy")?.toString() || undefined;
      mimeType   = file.type || "image/jpeg";
      buffer     = Buffer.from(await file.arrayBuffer());

    } else {
      // ── JSON (base64 dataURL) ──
      const body = await req.json();
      const { dataUrl } = body;
      siteId     = body.siteId;
      reportType = body.reportType;
      uploadedBy = body.uploadedBy;

      if (!dataUrl || typeof dataUrl !== "string") {
        return NextResponse.json({ error: "画像データが不正です" }, { status: 400 });
      }
      if (dataUrl.length > 14_000_000) {
        return NextResponse.json({ error: "画像サイズが大きすぎます（最大10MB）" }, { status: 413 });
      }

      const match = dataUrl.match(/^data:(image\/[\w+]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: "画像データ形式が不正です" }, { status: 400 });
      }
      mimeType = match[1];
      buffer   = Buffer.from(match[2], "base64");
    }
  } catch (err) {
    console.error("upload parse error:", err);
    return NextResponse.json(
      { error: "リクエスト解析エラー", detail: String(err) },
      { status: 400 },
    );
  }

  // ── Step 3: R2 にアップロード ──
  let uploadResult: { key: string; url: string };
  try {
    uploadResult = await uploadKaitaiImageBinary(buffer, mimeType, session.companyId, {
      siteId,
      reportType,
    });
  } catch (err) {
    console.error("upload R2 error:", err);
    return NextResponse.json(
      { error: "ストレージアップロードエラー", detail: String(err) },
      { status: 500 },
    );
  }

  // ── Step 4: DB に保存 ──
  try {
    const plan      = session.plan as Parameters<typeof calcImageExpiry>[0];
    const expiresAt = calcImageExpiry(plan);

    const image = await prisma.kaitaiImage.create({
      data: {
        companyId:  session.companyId,
        siteId:     siteId   ?? null,
        reportType: reportType ?? null,
        r2Key:      uploadResult.key,
        url:        uploadResult.url,
        expiresAt,
        uploadedBy: uploadedBy ?? session.adminName,
      },
    });

    // ログ記録（失敗しても画像保存自体は成功扱い）
    try {
      await prisma.kaitaiOperationLog.create({
        data: {
          companyId: session.companyId,
          action:    `image_upload:${reportType ?? "misc"}`,
          user:      uploadedBy ?? session.adminName,
          siteId:    siteId ?? null,
          device:    req.headers.get("user-agent")?.slice(0, 120) ?? "",
        },
      });
    } catch { /* ログ失敗は無視 */ }

    return NextResponse.json({
      ok: true,
      image: { id: image.id, url: image.url, expiresAt: image.expiresAt },
    }, { status: 201 });

  } catch (err) {
    console.error("upload DB error:", err);
    return NextResponse.json(
      { error: "データベース保存エラー", detail: String(err) },
      { status: 500 },
    );
  }
}
