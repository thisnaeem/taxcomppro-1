import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Pages anyone can visit without being logged in
const PUBLIC_PAGES = new Set([
  "/",
  "/login",
  "/register",
  "/about",
  "/terms",
  "/privacy",
  "/cookie-policy",
  "/community-guidelines",
  "/contact",
  "/courses",
  "/toolkits",
  "/tools",
  "/marketplace",
  "/communities",
  "/find-a-pro",
  "/pro-hub",
  "/pro-marketing",
  "/pro-talks",
  "/connect",
  "/verify-certificate",
  "/security",
  "/apply-professional",
]);

// Prefix-based public paths (any sub-path is also public)
const PUBLIC_PREFIXES = [
  "/courses/",
  "/toolkits/",
  "/tools/",
  "/marketplace/",
  "/communities/",
  "/find-a-pro/",
  "/pro-hub/",
  "/pro-talks/",
  "/connect/",
  "/pro/",
  "/verify-certificate/",
];

// Auth pages — logged-in users get bounced away from these
const AUTH_PAGES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always pass through: static assets & all API routes (auth is enforced at the route level)
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Do not issue middleware redirects for client prefetch requests
  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("x-middleware-prefetch") === "1";

  if (isPrefetch) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: request.headers });

  // Logged-in user hits landing page → send to feed
  if (session && pathname === "/") {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // Logged-in user tries to visit login/register → send to feed
  if (session && AUTH_PAGES.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // Not logged in & page is NOT public → send to login
  if (!session && !PUBLIC_PAGES.has(pathname) && !PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    const dest = new URL("/login", request.url);
    dest.searchParams.set("next", pathname);
    return NextResponse.redirect(dest);
  }

  // Admin-only routes
  if (pathname.startsWith("/admin")) {
    const u = session?.user as unknown as { role?: string } | undefined;
    if (!session || u?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/feed", request.url));
    }
  }

  // ── Referral cookie ─────────────────────────────────────────
  const ref = request.nextUrl.searchParams.get("ref");
  const response = NextResponse.next();
  if (ref && /^[a-zA-Z0-9_-]{6,32}$/.test(ref)) {
    response.cookies.set("ref_code", ref, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
