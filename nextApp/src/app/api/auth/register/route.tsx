import { NextRequest, NextResponse } from "next/server";
import { createEmailVerificationToken } from "@/lib/emailVerification";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  try {
    const body = await req.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !email || !password) {
      logger.info({
        type: "request",
        path: req.url,
        method: req.method,
        email,
        ip,
        status: 400,
        event: "auth_missing_required_fields",
      });
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

    if (existingEmailUser && existingUsernameUser) {
      logger.info({
        type: "request",
        path: req.url,
        method: req.method,
        email,
        ip,
        status: 409,
        event: "email_or_username_in_use",
      });
      return NextResponse.json(
        { error: "This email and username are already in use." },
        { status: 409 }
      );
    }

    if (existingEmailUser) {
      logger.info({
        type: "request",
        path: req.url,
        method: req.method,
        email,
        ip,
        status: 409,
        event: "email_conflict",
      });
      return NextResponse.json(
        { error: "This email is already linked to an existing account." },
        { status: 409 }
      );
    }

    if (existingUsernameUser) {
      logger.info({
        type: "request",
        path: req.url,
        method: req.method,
        email,
        ip,
        status: 409,
        event: "username_conflict",
      });
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
        role: "user",
		email_verified_at: null,
      },
    });

    await createEmailVerificationToken(user.id, user.email);

    logger.info({
      type: "request",
      path: req.url,
      method: req.method,
      email,
      ip,
      status: 201,
      event: "registration_completed",
    });

  return NextResponse.json(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at, // if exists
    },
    { status: 201 }
  );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
