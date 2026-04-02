import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, sessionCookieOptions } from "@/lib/kaitai/session";
import { isValidPlan } from "@/lib/kaitai/plans";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, address, phone, adminName, adminEmail, password1, password2, plan } = body;

    // バリデーション
    if (!name || !address || !phone || !adminName || !adminEmail || !password1 || !password2) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }
    if (password1.length < 4 || password2.length < 4) {
      return NextResponse.json({ error: "パスワードは4文字以上で設定してください" }, { status: 400 });
    }
    if (!adminEmail.includes("@")) {
      return NextResponse.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
    }

    // 同じメールアドレスが既に存在するかチェック
    const existing = await prisma.kaitaiCompany.findFirst({ where: { adminEmail } });
    if (existing) {
      return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 });
    }

    // パスワードをハッシュ化
    const [password1Hash, password2Hash] = await Promise.all([
      bcrypt.hash(password1, 12),
      bcrypt.hash(password2, 12),
    ]);

    // Stripe Customer ID（モック）- 本番では Stripe SDK で発行
    const stripeCustomerId = `cus_${Date.now().toString(36).toUpperCase()}`;

    const validPlan = isValidPlan(plan) ? plan : "free";

    const company = await prisma.kaitaiCompany.create({
      data: {
        name, address, phone,
        adminName, adminEmail,
        password1Hash, password2Hash,
        plan: validPlan,
        stripeCustomerId,
      },
    });

    // 操作ログ
    await prisma.kaitaiOperationLog.create({
      data: {
        companyId: company.id,
        action:    "signup_complete",
        user:      adminEmail,
        device:    req.headers.get("user-agent")?.slice(0, 120) ?? "",
      },
    });

    // セッション発行（ワーカーレベル）
    const token = await createSession(company.id, "worker");
    const opts  = sessionCookieOptions(token);

    const res = NextResponse.json({
      ok: true,
      company: {
        id:              company.id,
        name:            company.name,
        adminName:       company.adminName,
        plan:            company.plan,
        stripeCustomerId: company.stripeCustomerId,
      },
    }, { status: 201 });

    res.cookies.set(opts);
    return res;

  } catch (err) {
    console.error("kaitai/signup error:", err);
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}
