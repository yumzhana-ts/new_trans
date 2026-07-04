import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/profile", "/game"];
const adminRoutes = ["/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = protectedRoutes.some((path) => pathname.startsWith(path));
  const isAdminRoute = adminRoutes.some((path) => pathname.startsWith(path));

  if (!isProtected && !isAdminRoute) {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get("session")?.value;

  if (!sessionToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // For /admin, you still need server-side role check in /admin/layout.tsx
  // because middleware should not trust only cookie existence.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/game/:path*", "/admin/:path*"],
};