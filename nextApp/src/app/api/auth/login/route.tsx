import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";
import {
  appendPendingTwoFactorCookie,
  appendSessionCookie,
  clearCookie,
  createPendingTwoFactorToken,
  createSessionToken,
  getPendingTwoFactorExpiry,
  getSessionExpiry,
  PENDING_2FA_COOKIE,
  SESSION_COOKIE,
} from "@/lib/session";

// ----------------- Rate limiter -----------------
type RateEntry = { count: number; resetAt: number };
const WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, RateEntry>();

function checkRateLimit(ip: string, email: string): boolean {
  const key = `${ip}:${email}`;
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) return false;

  entry.count++;
  return true;
}

function clearRateLimit(ip: string, email: string) {
  attempts.delete(`${ip}:${email}`);
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  try {
    const { email, password } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    // Rate limiting
    if (!checkRateLimit(ip, normalizedEmail)) {
      return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
    }

    // Find user
    const user = await prisma.users.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      logger.info({
        type: "request",
        path: req.url,
        method: req.method,
        email,
        ip,
        status: 401,
        event: "user_not_found",
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    // Check password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid){
      logger.info({
        type: "request",
        path: req.url,
        method: req.method,
        email,
        ip,
        status: 401,
        event: "invalid_password",
      });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.email_verified_at) {
      logger.info({
        type: "request",
        path: req.url,
        method: req.method,
        email,
        ip,
        status: 403,
        event: "email_not_verified",
      });
      return NextResponse.json(
        {
          code: "EMAIL_NOT_VERIFIED",
          email: user.email,
          error: "Please verify your email first.",
        },
        { status: 403 }
      );
    }

    const twoFactorCredential = await prisma.twoFactorCredential.findUnique({
      where: { user_id: user.id },
    });

    // Clear rate limit on success
    clearRateLimit(ip, normalizedEmail);

    const token = createSessionToken();
    const expiresAt = getSessionExpiry();

    await prisma.sessions.create({
      data: { user_id: user.id, token, expires_at: expiresAt },
    });

    logger.info({
      type: "request",
      path: req.url,
      method: req.method,
      email,
      ip,
      status: 200,
      event: "login_success",
    });

    const res = NextResponse.json({
      id: user.id,
      redirect_to: user.role === "admin" ? "/admin/users" : "/profile",
    },
    { status: 200 }
    );
    appendSessionCookie(res, token);
    clearCookie(res, PENDING_2FA_COOKIE);
    return res;

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
