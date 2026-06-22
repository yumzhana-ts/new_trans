import { randomBytes } from "crypto";
import { serialize } from "cookie";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE = "session";
export const PENDING_2FA_COOKIE = "pending_2fa";
export const SESSION_TTL_DAYS = 7;
export const PENDING_2FA_TTL_MINUTES = 10;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function createPendingTwoFactorToken(): string {
  return `p2fa_${randomBytes(32).toString("hex")}`;
}

export function isPendingTwoFactorToken(token: string): boolean {
  return token.startsWith("p2fa_");
}

export function getSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function getPendingTwoFactorExpiry(): Date {
  return new Date(Date.now() + PENDING_2FA_TTL_MINUTES * 60 * 1000);
}

export function appendSessionCookie(res: NextResponse, token: string) {
  res.headers.append(
    "Set-Cookie",
    serialize(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_DAYS * 24 * 60 * 60))
  );
}

export function appendPendingTwoFactorCookie(res: NextResponse, token: string) {
  res.headers.append(
    "Set-Cookie",
    serialize(PENDING_2FA_COOKIE, token, cookieOptions(PENDING_2FA_TTL_MINUTES * 60))
  );
}

export function clearCookie(res: NextResponse, name: string) {
  res.headers.append(
    "Set-Cookie",
    serialize(name, "", {
      ...cookieOptions(0),
      maxAge: 0,
    })
  );
}

export function clearAuthCookies(res: NextResponse) {
  clearCookie(res, SESSION_COOKIE);
  clearCookie(res, PENDING_2FA_COOKIE);
}
