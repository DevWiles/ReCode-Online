import { NextResponse, type NextRequest } from "next/server";

import { PUBLIC_PATHS, SESSION_COOKIE, verifySessionToken } from "@/lib/session";


/**
 * Redirect to a path on the host the visitor actually typed.
 *
 * Next rejects a relative Location, and request.nextUrl carries the server's
 * own listen address behind a reverse proxy, which would send visitors to
 * https://localhost:3200. The forwarded headers are the real origin.
 */
const redirectTo = (request: NextRequest, path: string) => {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");

  const origin = host ? `${proto}://${host}` : request.nextUrl.origin;

  return NextResponse.redirect(new URL(path, origin));
};

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

    return redirectTo(request, `/login${next}`);
  }

  if (session && isPublic) {
    return redirectTo(request, "/home");
  }

  // The root layout loads the signed-in user on every page except the public
  // ones; it needs to know when it is wrapping one of those
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpe?g|gif|svg|webp|ico|woff2?)$).*)",
  ],
};
