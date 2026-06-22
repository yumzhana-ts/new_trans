import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma"; // singleton Prisma client

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "username, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const exists = await prisma.users.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (exists) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.users.create({
      data: { username, email, password_hash: passwordHash, role: "user" },
    });

    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
