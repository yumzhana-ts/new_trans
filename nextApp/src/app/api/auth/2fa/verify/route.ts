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
import { logger } from "@/lib/logger";

function logTwoFactor(req: NextRequest, email: string, ip: string, status: number, event: string) {
  logger.info({
    type: "request",
    path: req.url,
    method: req.method,
    email,
    ip,
    status,
    event,
  });
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  try {
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code : "";
    const pendingToken = req.cookies.get(PENDING_2FA_COOKIE)?.value;

    if (!pendingToken || !isPendingTwoFactorToken(pendingToken)) {
      logTwoFactor(req, "undefined", ip, 401, "two_factor_not_in_progress");
      return NextResponse.json({ error: "2FA verification is not in progress." }, { status: 401 });
    }

    if (!code.trim()) {
      logTwoFactor(req, "undefined", ip, 400, "two_factor_code_missing");
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
      logTwoFactor(req, "undefined", ip, 401, "two_factor_expired");
      return NextResponse.json({ error: "2FA verification has expired." }, { status: 401 });
    }

    const email = pendingSession.users.email;

    const credential = await prisma.twoFactorCredential.findUnique({
      where: { user_id: pendingSession.user_id },
    });

    if (!credential || !credential.enabled_at) {
      logTwoFactor(req, email, ip, 400, "two_factor_not_enabled");
      return NextResponse.json({ error: "2FA is not enabled for this user." }, { status: 400 });
    }

    if (!verifyTotpCode(credential.secret, code)) {
      logTwoFactor(req, email, ip, 401, "two_factor_invalid_code");
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

    logTwoFactor(req, email, ip, 200, "two_factor_verified");

    const res = NextResponse.json({
      id: pendingSession.user_id,
      redirect_to: pendingSession.users.role === "admin" ? "/admin/users" : "/profile",
    });
    clearCookie(res, PENDING_2FA_COOKIE);
    appendSessionCookie(res, token);
    return res;
  } catch (err) {
    logger.error({
      type: "request",
      path: req.url,
      method: req.method,
      ip,
      status: 500,
      event: "two_factor_error",
      error: err instanceof Error ? err.message : "unknown",
    });
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
