import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearAuthCookies, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const tokens = [
      req.cookies.get(SESSION_COOKIE)?.value,
    ].filter(Boolean) as string[];

    if (tokens.length > 0) {
      await prisma.sessions.deleteMany({ where: { token: { in: tokens } } });
    }

    const res = NextResponse.json({ message: "Logged out successfully" });
    clearAuthCookies(res);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
