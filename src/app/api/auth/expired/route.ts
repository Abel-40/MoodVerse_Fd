import { NextResponse } from "next/server";

import { clearTokens, requestOrigin } from "@/lib/server/backend";

/**
 * Where a page sends someone whose session the backend no longer accepts.
 * Clears the dead cookies (pages can't) and goes to sign-in. Nothing here is
 * worth forging: it only signs out a session that already stopped working.
 */
export function GET(request: Request) {
  const response = NextResponse.redirect(`${requestOrigin(request)}/sign-in`);
  clearTokens(response.cookies);
  return response;
}
