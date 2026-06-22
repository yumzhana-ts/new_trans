import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/emailVerification";
import { logger } from "@/lib/logger";

const APP_URL = process.env.APP_URL?.trim() || "https://localhost:8443";

function loginRedirect(status: string) {
  const url = new URL("/login", APP_URL);
  url.searchParams.set("verification", status);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return loginRedirect("invalid");
    }

    await verifyEmailToken(token);

    logger.info({
      type: "request",
      path: req.url,
      method: req.method,
      email: "undefined",
      ip,
      status: 200,
      event: "email_verified",
    });

    return loginRedirect("success");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error(err);

    let event = "email_verification_error";
    let redirect = "error";

    if (message.includes("already been used")) {
      event = "email_verification_token_used";
      redirect = "used";
    } else if (message.includes("expired")) {
      event = "email_verification_token_expired";
      redirect = "expired";
    } else if (message.includes("token")) {
      event = "email_verification_token_invalid";
      redirect = "invalid";
    }

    logger.info({
      type: "request",
      path: req.url,
      method: req.method,
      email: "undefined",
      ip,
      status: 400,
      event,
    });

    return loginRedirect(redirect);
  }
}
