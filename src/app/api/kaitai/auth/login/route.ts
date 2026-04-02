import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, sessionCookieOptions } from "@/lib/kaitai/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "メールアドレスとパスワードを入力してください" }, { status: 400 });
    }

    const company = await prisma.kaitaiCompany.findFirst({ where: { adminEmail: email } });
    if (!company) {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
    }

    // 第二パスワード（管理者）を先にチェック
    const isAdmin  = await bcrypt.compare(password, company.password2Hash);
    const isWorker = !isAdmin && await bcrypt.compare(password, company.password1Hash);

    if (!isAdmin && !isWorker) {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
    }

    const authLevel = isAdmin ? "admin" : "worker";
    const token     = await createSession(company.id, authLevel);

    await prisma.kaitaiOperationLog.create({
      data: {
        companyId: company.id,
        action:    `login_${authLevel}`,
        user:      email,
        device:    req.headers.get("user-agent")?.slice(0, 120) ?? "",
      },
    });

    const res = NextResponse.json({
      ok: true,
      authLevel,
      company: {
        id:          company.id,
        name:        company.name,
        adminName:   company.adminName,
        adminEmail:  company.adminEmail,
        plan:        company.plan,
        stripeCustomerId: company.stripeCustomerId,
      },
    });

    res.cookies.set(sessionCookieOptions(token));
    return res;

  } catch (err) {
    console.error("kaitai/login error:", err);
    return NextResponse.json({ error: "ログインに失敗しました" }, { status: 500 });
  }
}
