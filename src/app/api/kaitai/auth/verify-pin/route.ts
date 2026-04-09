import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, createSession, sessionCookieOptions } from "@/lib/kaitai/session";

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
      const existingToken = req.cookies.get("kaitai_session")?.value;

      if (existingToken) {
        // 既存セッションがあればadminに昇格
        const updated = await prisma.kaitaiSession.updateMany({
          where: { token: existingToken },
          data: { authLevel: "admin" },
        });
        if (updated.count > 0) {
          return NextResponse.json({ ok: true });
        }
      }

      // セッションが無い or 無効 → テスト会社を探すか作成してセッション発行
      let testCompany = await prisma.kaitaiCompany.findFirst({
        where: { adminEmail: "test@kaitai-link.demo" },
      });

      if (!testCompany) {
        testCompany = await prisma.kaitaiCompany.create({
          data: {
            name:          "テスト解体工業",
            adminName:     "テスト管理者",
            adminEmail:    "test@kaitai-link.demo",
            address:       "岡山県岡山市北区1-1-1",
            phone:         "086-000-0000",
            password1Hash: await bcrypt.hash("test1234", 10),
            password2Hash: await bcrypt.hash("0000", 10),
            plan:          "pro",
          },
        });
      }

      const token = await createSession(testCompany.id, "admin");
      const res = NextResponse.json({ ok: true });
      res.cookies.set(sessionCookieOptions(token));
      return res;
    }

    // 通常のPIN検証フロー
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
