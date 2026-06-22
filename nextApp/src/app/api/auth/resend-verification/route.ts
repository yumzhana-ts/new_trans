import { NextRequest, NextResponse } from "next/server";
import { resendVerificationEmail } from "@/lib/emailVerification";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email : "";

    if (!email.trim()) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const result = await resendVerificationEmail(email);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
