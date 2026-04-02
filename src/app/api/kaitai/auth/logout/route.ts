import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/kaitai/session";

const COOKIE_NAME = "kaitai_session";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token) {
    await deleteSession(token).catch(() => {});
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: COOKIE_NAME, value: "", maxAge: 0, path: "/" });
  return res;
}
