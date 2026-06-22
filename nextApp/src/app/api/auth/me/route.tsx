import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.response) return auth.response;
    const authUser = auth.user;

    const user = await prisma.users.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
        two_factor_credential: {
          select: {
            enabled_at: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      two_factor_enabled: Boolean(user.two_factor_credential?.enabled_at),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
