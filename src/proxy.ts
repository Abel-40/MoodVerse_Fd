import { NextResponse, type NextRequest } from "next/server";

import { clearTokens, refreshTokens, writeTokens } from "@/lib/server/backend";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/server/session";

/** The request's headers with its Cookie header rewritten, so this render sees the change. */
function withCookies(request: NextRequest, changes: Record<string, string | null>): Headers {
  const jar = new Map(request.cookies.getAll().map(({ name, value }) => [name, value]));
  for (const [name, value] of Object.entries(changes)) {
    if (value === null) jar.delete(name);
    else jar.set(name, value);
  }
  const headers = new Headers(request.headers);
  headers.set("cookie", Array.from(jar, ([name, value]) => `${name}=${value}`).join("; "));
  return headers;
}

/**
 * Keeps a signed-in session alive. When the short-lived access cookie has
 * expired but the refresh cookie remains, swap it for a new pair before the
 * page renders. The new tokens go on the request, so this render already
 * sees them, and on the response, so the browser keeps them.
 */
export async function proxy(request: NextRequest) {
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh || request.cookies.get(ACCESS_COOKIE)?.value) return NextResponse.next();

  const result = await refreshTokens(refresh);

  if (result.ok) {
    const headers = withCookies(request, {
      [ACCESS_COOKIE]: result.tokens.access_token,
      [REFRESH_COOKIE]: result.tokens.refresh_token,
    });
    const response = NextResponse.next({ request: { headers } });
    writeTokens(response.cookies, result.tokens);
    return response;
  }

  if (result.reason === "rejected") {
    // Revoked or expired: sign out cleanly rather than fail on every request.
    const headers = withCookies(request, { [ACCESS_COOKIE]: null, [REFRESH_COOKIE]: null });
    const response = NextResponse.next({ request: { headers } });
    clearTokens(response.cookies);
    return response;
  }

  // Backend unreachable: leave the session alone and let the page cope.
  return NextResponse.next();
}

export const config = {
  // Pages and the API proxy; not static files, images or the auth routes,
  // which manage their own cookies.
  matcher: ["/((?!_next/|images/|api/auth/|favicon.ico|opengraph-image).*)"],
};
