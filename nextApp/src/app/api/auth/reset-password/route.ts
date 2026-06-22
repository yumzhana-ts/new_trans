import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/passwordReset";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!token || !password) {
      return NextResponse.json({ error: "token and password are required" }, { status: 400 });
    }

    const result = await resetPassword(token, password);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("token") ? 400 : 500;

    console.error(err);
    return NextResponse.json({ error: message }, { status });
  }
}
