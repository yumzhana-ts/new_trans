import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { isValidRole } from "@/lib/roles";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  if (auth.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetUserId = Number(id);
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const role = typeof body?.role === "string" ? body.role.trim() : "";

    if (!isValidRole(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existingUser = await prisma.users.findUnique({ where: { id: targetUserId } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingUser.id === auth.user.id && existingUser.role === "admin" && role !== "admin") {
      return NextResponse.json({ error: "You cannot remove your own admin role" }, { status: 400 });
    }

    const updatedUser = await prisma.users.update({
      where: { id: targetUserId },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
