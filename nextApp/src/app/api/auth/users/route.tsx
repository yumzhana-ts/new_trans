import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const authUser = auth.user;

  if (authUser.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
      },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(users);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const authUser = auth.user;

  if (authUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const role = typeof body?.role === "string" && body.role.trim() ? body.role.trim() : "user";

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "username, email and password are required" },
        { status: 400 }
      );
    }

    const [existingEmailUser, existingUsernameUser] = await prisma.$transaction([
      prisma.users.findUnique({
        where: { email },
        select: { id: true },
      }),
      prisma.users.findFirst({
        where: { username },
        select: { id: true },
      }),
    ]);

    if (existingEmailUser) {
      return NextResponse.json(
        { error: "This email is already linked to an existing account." },
        { status: 409 }
      );
    }

    if (existingUsernameUser) {
      return NextResponse.json(
        { error: "This username is already taken." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        username,
        email,
        password_hash: passwordHash,
        role,
        email_verified_at: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
        email_verified_at: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
