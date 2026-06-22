import { NextRequest, NextResponse } from "next/server";
import {
  applySocialLoginCookies,
  clearSocialStateCookie,
  finishSocialCallback,
  isSupportedSocialProvider,
} from "@/lib/socialAuth";

const APP_URL = process.env.APP_URL?.trim() || "https://localhost:8443";

function loginRedirect(error: string) {
  const url = new URL("/login", APP_URL);
  url.searchParams.set("social", error);
  return NextResponse.redirect(url);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;

  if (!isSupportedSocialProvider(provider)) {
    return loginRedirect("unsupported");
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(`oauth_state_${provider}`)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    const res = loginRedirect("invalid_state");
    clearSocialStateCookie(res, provider);
    return res;
  }

  try {
    const result = await finishSocialCallback(provider, code);
    const res = NextResponse.redirect(result.redirectTo);
    applySocialLoginCookies(res, provider, result.sessionToken, result.pendingTwoFactor);
    return res;
  } catch (err) {
    console.error(err);
    const res = loginRedirect("oauth_failed");
    clearSocialStateCookie(res, provider);
    return res;
  }
}
