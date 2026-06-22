'use server'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// PUT — update user
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const authUser = auth.user;

  let targetUserId: number;
  if (id === "me") {
    targetUserId = authUser.id;
  } else {
    targetUserId = Number(id);
    if (!Number.isInteger(targetUserId) || targetUserId <= 0)
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    if (authUser.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { username, email } = body;
    if (!username || !email)
      return NextResponse.json({ error: "username and email are required" }, { status: 400 });

    const existingUser = await prisma.users.findUnique({ where: { id: targetUserId } });
    if (!existingUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const duplicate = await prisma.users.findFirst({
      where: {
        OR: [{ username }, { email }],
        NOT: { id: targetUserId },
      },
    });
    if (duplicate) return NextResponse.json({ error: "Email or username already in use" }, { status: 409 });

    const data: Partial<{ username: string; email: string }> = { username, email };

    const updatedUser = await prisma.users.update({ where: { id: targetUserId }, data });
    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — delete user
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const authUser = auth.user;

  let targetUserId: number;
  if (id === "me") {
    targetUserId = authUser.id;
  } else {
    targetUserId = Number(id);
    if (!Number.isInteger(targetUserId) || targetUserId <= 0)
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    if (authUser.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const existingUser = await prisma.users.findUnique({ where: { id: targetUserId } });
    if (!existingUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.users.delete({ where: { id: targetUserId } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
