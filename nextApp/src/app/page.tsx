import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isPendingTwoFactorToken, SESSION_COOKIE } from "@/lib/session";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token && !isPendingTwoFactorToken(token)) {
    const session = await prisma.sessions.findFirst({
      where: {
        token,
        expires_at: { gt: new Date() },
      },
      select: { id: true },
    });

    if (session) redirect("/dashboard");
  }

  redirect("/login");
}
