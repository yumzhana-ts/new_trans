import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { clearAuthCookies } from "@/lib/session";

function serializeUser(user: {
  id: number;
  username: string | null;
  email: string;
  role: string | null;
  created_at: Date | null;
  must_set_password: boolean;
  two_factor_credential?: { enabled_at: Date | null } | null;
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    must_set_password: user.must_set_password,
    two_factor_enabled: Boolean(user.two_factor_credential?.enabled_at),
  };
}

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
        must_set_password: true,
        two_factor_credential: {
          select: {
            enabled_at: true,
          },
        },
      },
    });

    if (!user) {
      const res = NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    return NextResponse.json(serializeUser(user));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.response) return auth.response;
    const authUser = auth.user;

    const body = await req.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";

    if (!username) {
      return NextResponse.json({ error: "username is required" }, { status: 400 });
    }

    const duplicate = await prisma.users.findFirst({
      where: {
        username,
        NOT: { id: authUser.id },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: "Username already in use" }, { status: 409 });
    }

    const updatedUser = await prisma.users.update({
      where: { id: authUser.id },
      data: { username },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
        must_set_password: true,
        two_factor_credential: {
          select: {
            enabled_at: true,
          },
        },
      },
    });

    return NextResponse.json(serializeUser(updatedUser));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.response) return auth.response;
    const authUser = auth.user;

    const existingUser = await prisma.users.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        is_protected: true,
      },
    });

    if (!existingUser) {
      const res = NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    if (existingUser.is_protected) {
      return NextResponse.json(
        { error: "Protected admin cannot be deleted" },
        { status: 403 }
      );
    }

    await prisma.$transaction([
      prisma.sessions.deleteMany({ where: { user_id: authUser.id } }),
      prisma.users.delete({ where: { id: authUser.id } }),
    ]);

    const res = NextResponse.json({ message: "Profile deleted" });
    clearAuthCookies(res);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
