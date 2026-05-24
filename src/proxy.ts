import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ── Protected route patterns ──────────────────────────────────────────────────
const PROTECTED_PREFIXES = ["/dashboard", "/planner", "/admin"];
const ADMIN_PREFIXES     = ["/admin"];
const AUTH_PAGES         = ["/login", "/register"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Skip Next.js internals and static assets ──────────────────────────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")   ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token   = req.cookies.get("chronos_token")?.value;
  const secret  = process.env.NEXTAUTH_SECRET;
  let   payload: { userId: string; role: string } | null = null;

  if (token && secret) {
    try {
      const secretKey = new TextEncoder().encode(secret);
      const { payload: jwtPayload } = await jwtVerify(token, secretKey);
      payload = jwtPayload as unknown as { userId: string; role: string };
    } catch {
      // Invalid or expired token — treat as unauthenticated
      payload = null;
    }
  }

  const isAuthenticated = payload !== null;
  const isProtected     = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdminRoute    = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage      = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // ── Redirect unauthenticated users away from protected routes ────────────
  if (isProtected && !isAuthenticated) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Redirect non-admins away from admin routes ────────────────────────────
  if (isAdminRoute && payload?.role !== "ADMIN") {
    const dashUrl = req.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashUrl);
  }

  // ── Redirect already-authenticated users away from auth pages ────────────
  if (isAuthPage && isAuthenticated) {
    const dashUrl = req.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
