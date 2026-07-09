import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildOtpAuthUrl, generateTwoFactorSecret } from "@/lib/twoFactor";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const user = await prisma.users.findUnique({
      where: { id: auth.user.id },
      select: { must_set_password: true },
    });

    if (!user || user.must_set_password) {
      return NextResponse.json(
        { error: "Set a password before enabling 2FA." },
        { status: 403 }
      );
    }

    const existing = await prisma.twoFactorCredential.findUnique({
      where: { user_id: auth.user.id },
    });

    if (existing?.enabled_at) {
      return NextResponse.json({ error: "2FA is already enabled. Disable it first." }, { status: 400 });
    }

    const secret = generateTwoFactorSecret();
    const credential = await prisma.twoFactorCredential.upsert({
      where: { user_id: auth.user.id },
      update: {
        secret,
        enabled_at: null,
      },
      create: {
        user_id: auth.user.id,
        secret,
      },
    });

    return NextResponse.json({
      secret: credential.secret,
      otpauth_url: buildOtpAuthUrl(auth.user.email, credential.secret),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
