import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/emailVerification";
import { logger } from "@/lib/logger";

const APP_URL = process.env.APP_URL?.trim() || "https://localhost:8443";

function loginRedirect(status: string) {
  const url = new URL("/login", APP_URL);
  url.searchParams.set("verification", status);
  return NextResponse.redirect(url);
}

function logVerification(req: NextRequest, ip: string, status: number, event: string) {
  logger.info({
    type: "request",
    path: req.url,
    method: req.method,
    email: "undefined",
    ip,
    status,
    event,
  });
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      logVerification(req, ip, 400, "email_verification_token_invalid");
      return loginRedirect("invalid");
    }

    await verifyEmailToken(token);
    logVerification(req, ip, 200, "email_verified");
    return loginRedirect("success");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error(err);

    if (message.includes("already been used")) {
      logVerification(req, ip, 400, "email_verification_token_used");
      return loginRedirect("used");
    }

    if (message.includes("expired")) {
      logVerification(req, ip, 400, "email_verification_token_expired");
      return loginRedirect("expired");
    }

    if (message.includes("token")) {
      logVerification(req, ip, 400, "email_verification_token_invalid");
      return loginRedirect("invalid");
    }

    logger.error({
      type: "request",
      path: req.url,
      method: req.method,
      email: "undefined",
      ip,
      status: 500,
      event: "email_verification_error",
      error: message,
    });
    return loginRedirect("error");
  }
}
