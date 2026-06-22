import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";
import type { Users } from "@prisma/client";
import { isPendingTwoFactorToken } from "./session";

type AuthSuccess = {
  user: Users;
  response: null;
};

type AuthFailure = {
  user: null;
  response: NextResponse;
};

export async function requireAuth(req: NextRequest): Promise<AuthSuccess | AuthFailure> {
  const token = req.cookies.get("session")?.value;
  if (!token || isPendingTwoFactorToken(token)) {
    return {
      user: null,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  const session = await prisma.sessions.findFirst({
    where: {
      token,
      expires_at: { gt: new Date() },
    },
    include: { users: true },
  });

  if (!session) {
    return {
      user: null,
      response: NextResponse.json({ error: "Invalid or expired session" }, { status: 401 }),
    };
  }

  return { user: session.users, response: null };
}
