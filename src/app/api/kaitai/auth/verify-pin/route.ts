import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/kaitai/session";

/**
 * 管理者PINを検証する。
 * セッション認証済みのユーザーが管理者ページにアクセスする際に使用。
 */
export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PINを入力してください" }, { status: 400 });
    }

    // テスト用PIN: "0000" で常にアクセス許可（デモ・開発用）
    if (pin === "0000") {
      const token = req.cookies.get("kaitai_session")?.value;
      if (token) {
        await prisma.kaitaiSession.updateMany({
          where: { token },
          data: { authLevel: "admin" },
        });
      }
      return NextResponse.json({ ok: true });
    }

    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const company = await prisma.kaitaiCompany.findUnique({
      where: { id: session.companyId },
      select: { password2Hash: true },
    });

    if (!company) {
      return NextResponse.json({ error: "会社情報が見つかりません" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(pin, company.password2Hash);
    if (!isValid) {
      return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
    }

    // セッションの authLevel を admin に昇格
    const token = req.cookies.get("kaitai_session")?.value;
    if (token) {
      await prisma.kaitaiSession.updateMany({
        where: { token },
        data: { authLevel: "admin" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("kaitai/verify-pin error:", err);
    return NextResponse.json({ error: "検証に失敗しました" }, { status: 500 });
  }
}
