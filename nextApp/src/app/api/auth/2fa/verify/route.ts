import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PENDING_2FA_COOKIE,
  appendSessionCookie,
  clearCookie,
  createSessionToken,
  getSessionExpiry,
  isPendingTwoFactorToken,
} from "@/lib/session";
import { verifyTotpCode } from "@/lib/twoFactor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code : "";
    const pendingToken = req.cookies.get(PENDING_2FA_COOKIE)?.value;

    if (!pendingToken || !isPendingTwoFactorToken(pendingToken)) {
      return NextResponse.json({ error: "2FA verification is not in progress." }, { status: 401 });
    }

    if (!code.trim()) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    const pendingSession = await prisma.sessions.findFirst({
      where: {
        token: pendingToken,
        expires_at: { gt: new Date() },
      },
      include: { users: true },
    });

    if (!pendingSession) {
      return NextResponse.json({ error: "2FA verification has expired." }, { status: 401 });
    }

    const credential = await prisma.twoFactorCredential.findUnique({
      where: { user_id: pendingSession.user_id },
    });

    if (!credential || !credential.enabled_at) {
      return NextResponse.json({ error: "2FA is not enabled for this user." }, { status: 400 });
    }

    if (!verifyTotpCode(credential.secret, code)) {
      return NextResponse.json({ error: "Invalid 2FA code." }, { status: 401 });
    }

    const token = createSessionToken();
    const expiresAt = getSessionExpiry();

    await prisma.$transaction([
      prisma.sessions.delete({
        where: { id: pendingSession.id },
      }),
      prisma.sessions.create({
        data: {
          user_id: pendingSession.user_id,
          token,
          expires_at: expiresAt,
        },
      }),
    ]);

    const res = NextResponse.json({
      id: pendingSession.user_id,
      redirect_to: pendingSession.users.role === "admin" ? "/admin/users" : "/profile",
    });
    clearCookie(res, PENDING_2FA_COOKIE);
    appendSessionCookie(res, token);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
