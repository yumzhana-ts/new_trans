import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isPendingTwoFactorToken, SESSION_COOKIE } from "@/lib/session";

export default async function AdminRouteLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token || isPendingTwoFactorToken(token)) {
    redirect("/login");
  }

  const session = await prisma.sessions.findFirst({
    where: {
      token,
      expires_at: { gt: new Date() },
    },
    include: { users: true },
  });

  if (!session) {
    redirect("/login");
  }

  if (session.users.role !== "admin") {
    redirect("/dashboard");
  }

  return children;
}
