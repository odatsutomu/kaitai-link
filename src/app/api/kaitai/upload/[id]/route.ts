import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/kaitai/session";
import { deleteKaitaiImage } from "@/lib/kaitai/storage";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;

    const image = await prisma.kaitaiImage.findFirst({
      where: { id, companyId: session.companyId },
    });

    if (!image) {
      return NextResponse.json({ error: "画像が見つかりません" }, { status: 404 });
    }

    // Delete from R2
    await deleteKaitaiImage(image.r2Key);

    // Delete DB record
    await prisma.kaitaiImage.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("kaitai/upload/[id] DELETE error:", err);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
