import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { forbiddenUnlessSameOrigin } from "@/lib/server/auth-routes";
import { backendFetch, clearTokens } from "@/lib/server/backend";
import { REFRESH_COOKIE } from "@/lib/server/session";

/** Sign out: revoke the refresh token on the backend, then drop the cookies. */
export async function POST(request: Request) {
  const forbidden = forbiddenUnlessSameOrigin(request);
  if (forbidden) return forbidden;

  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    try {
      await backendFetch("/auth/logout", { json: { refresh_token: refresh } });
    } catch {
      // Unreachable backend: the cookies still go, so this browser is signed out.
    }
  }
  clearTokens(jar);
  return NextResponse.json({ ok: true });
}
