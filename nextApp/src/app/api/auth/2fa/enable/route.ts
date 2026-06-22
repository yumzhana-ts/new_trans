import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTotpCode } from "@/lib/twoFactor";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code : "";

    if (!code.trim()) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    const credential = await prisma.twoFactorCredential.findUnique({
      where: { user_id: auth.user.id },
    });

    if (!credential) {
      return NextResponse.json({ error: "2FA setup is required first." }, { status: 400 });
    }

    if (credential.enabled_at) {
      return NextResponse.json({ error: "2FA is already enabled." }, { status: 400 });
    }

    if (!verifyTotpCode(credential.secret, code)) {
      return NextResponse.json({ error: "Invalid 2FA code." }, { status: 401 });
    }

    await prisma.twoFactorCredential.update({
      where: { user_id: auth.user.id },
      data: { enabled_at: new Date() },
    });

    return NextResponse.json({ message: "2FA enabled successfully." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
