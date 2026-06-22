import { NextRequest, NextResponse } from "next/server";
import {
  appendSocialStateCookie,
  buildSocialStartUrl,
  createSocialState,
  isSupportedSocialProvider,
} from "@/lib/socialAuth";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;

  if (!isSupportedSocialProvider(provider)) {
    return NextResponse.json({ error: "Unsupported social provider" }, { status: 400 });
  }

  try {
    const state = createSocialState();
    const res = NextResponse.redirect(buildSocialStartUrl(provider, state));
    appendSocialStateCookie(res, provider, state);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL("/login?social=error", process.env.APP_URL?.trim() || "https://localhost:8443"));
  }
}
