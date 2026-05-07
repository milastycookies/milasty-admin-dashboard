import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE  = "milasty_access";
const REFRESH_COOKIE = "milasty_refresh";

// Decode JWT expiry without verifying the signature.
// Used only to decide whether to attempt a refresh — the backend performs
// full cryptographic verification on every protected API request.
function isTokenExpired(token: string): boolean {
  try {
    const [, b64] = token.split(".");
    const padded = b64.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((2 - b64.length % 4) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

async function attemptRefresh(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) return null;
  try {
    const res = await fetch(`${backendUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    return res.json() as Promise<{ accessToken: string; refreshToken: string }>;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Public paths — no auth required
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const accessToken  = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // No credentials → login
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Valid access token → fast path, no backend call needed
  if (accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.next();
  }

  // Expired/missing access token but refresh token present → rotate
  if (!refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const tokens = await attemptRefresh(refreshToken);
  if (!tokens) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(ACCESS_COOKIE);
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  }

  // Refresh succeeded — issue new cookies and proceed
  const isProd = process.env.NODE_ENV === "production";
  const res = NextResponse.next();
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 15 * 60,
    path: "/",
  });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}

export const config = {
  matcher: [
    // Match all app routes; skip Next.js internals and static files
    "/((?!_next/static|_next/image|api/icon|icons|manifest.webmanifest|sw.js|favicon.ico).*)",
  ],
};
