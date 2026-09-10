import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Reachable without a session
const PUBLIC_PATHS = ["/login"];

/**
 * A relative Location header. NextResponse.redirect() needs an absolute URL,
 * and behind nginx Next builds that from its own listen address, which sends
 * visitors to https://localhost:3200. Relative redirects sidestep it entirely.
 */
const redirectTo = (path: string) =>
  new NextResponse(null, { status: 307, headers: { Location: path } });

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value
  );

  if (!session && !isPublic) {
    // Come back to whatever was originally asked for
    const next =
      pathname === "/"
        ? ""
        : `?next=${encodeURIComponent(`${pathname}${search}`)}`;

    return redirectTo(`/login${next}`);
  }

  if (session && isPublic) {
    return redirectTo("/home");
  }

  // The root layout renders onboarding when no user exists; it needs to know
  // when it is wrapping the login page so it does not swallow it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpe?g|gif|svg|webp|ico|woff2?)$).*)",
  ],
};
