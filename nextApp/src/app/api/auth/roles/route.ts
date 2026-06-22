import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AVAILABLE_ROLES } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  if (auth.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(AVAILABLE_ROLES);
}
