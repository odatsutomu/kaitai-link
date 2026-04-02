// セッション管理（DB トークン方式）

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME  = "kaitai_session";
const SESSION_DAYS = 30;

export interface KaitaiSessionPayload {
  companyId:  string;
  authLevel:  "worker" | "admin";
  plan:       string;
  adminName:  string;
  companyName: string;
}

/** セッションを作成してトークンを返す */
export async function createSession(
  companyId: string,
  authLevel: "worker" | "admin"
): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  const session = await prisma.kaitaiSession.create({
    data: { companyId, authLevel, expiresAt },
  });
  return session.token;
}

/** トークンからセッションを検証して会社情報を返す */
export async function verifySession(
  token: string
): Promise<KaitaiSessionPayload | null> {
  const session = await prisma.kaitaiSession.findUnique({
    where: { token },
    include: { company: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.kaitaiSession.delete({ where: { id: session.id } });
    return null;
  }

  return {
    companyId:   session.companyId,
    authLevel:   session.authLevel as "worker" | "admin",
    plan:        session.company.plan,
    adminName:   session.company.adminName,
    companyName: session.company.name,
  };
}

/** Cookie からトークンを読んでセッション検証 */
export async function getSessionFromCookies(): Promise<KaitaiSessionPayload | null> {
  const jar   = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Request の Cookie からトークンを読んでセッション検証 */
export async function getSessionFromRequest(
  req: NextRequest
): Promise<KaitaiSessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Cookie にセッショントークンをセット */
export function sessionCookieOptions(token: string) {
  return {
    name:     COOKIE_NAME,
    value:    token,
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path:     "/",
    maxAge:   SESSION_DAYS * 24 * 60 * 60,
  };
}

/** セッション削除 */
export async function deleteSession(token: string) {
  await prisma.kaitaiSession.deleteMany({ where: { token } });
}

/** 期限切れセッションを一括削除（cron で呼ぶ） */
export async function cleanExpiredSessions() {
  await prisma.kaitaiSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
