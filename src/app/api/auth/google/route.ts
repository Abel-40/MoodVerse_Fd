import { NextResponse } from "next/server";

import { BACKEND_PUBLIC_URL, requestOrigin } from "@/lib/server/backend";

/**
 * Start Google sign-in. The backend runs the OIDC flow and comes back to
 * /auth/google with the tokens in the URL fragment. That return address must
 * be on the backend's OIDC_ALLOWED_APP_REDIRECTS list.
 */
export function GET(request: Request) {
  const returnTo = `${requestOrigin(request)}/auth/google`;
  const start = new URL(`${BACKEND_PUBLIC_URL}/auth/oidc/login`);
  start.searchParams.set("redirect_uri", returnTo);
  return NextResponse.redirect(start);
}
