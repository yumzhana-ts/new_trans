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

    if (!credential || !credential.enabled_at) {
      return NextResponse.json({ error: "2FA is not enabled." }, { status: 400 });
    }

    if (!verifyTotpCode(credential.secret, code)) {
      return NextResponse.json({ error: "Invalid 2FA code." }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.twoFactorCredential.delete({
        where: { user_id: auth.user.id },
      }),
      prisma.sessions.deleteMany({
        where: {
          user_id: auth.user.id,
          token: { startsWith: "p2fa_" },
        },
      }),
    ]);

    return NextResponse.json({ message: "2FA disabled successfully." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
