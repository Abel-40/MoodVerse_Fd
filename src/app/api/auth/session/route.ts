import { authError, forbiddenUnlessSameOrigin, readJson, signedIn } from "@/lib/server/auth-routes";
import { backendFetch } from "@/lib/server/backend";

interface SessionBody {
  access_token: string;
  refresh_token: string;
}

/**
 * Adopt the token pair Google sign-in handed to /auth/google in the URL
 * fragment. The access token is checked with the backend first, so only a
 * pair it actually issued becomes a session.
 */
export async function POST(request: Request) {
  const forbidden = forbiddenUnlessSameOrigin(request);
  if (forbidden) return forbidden;

  const body = await readJson<SessionBody>(request);
  if (typeof body?.access_token !== "string" || typeof body.refresh_token !== "string") {
    return authError("google", 400);
  }

  try {
    const me = await backendFetch("/auth/me", { token: body.access_token });
    if (!me.ok) return authError("google", 401);
    // Ask the backend for a fresh pair rather than trusting expires_in from
    // the URL; this also spends the refresh token that travelled in it.
    const refreshed = await backendFetch("/auth/refresh", { json: { refresh_token: body.refresh_token } });
    if (!refreshed.ok) return authError("google", 401);
    return signedIn(await refreshed.json());
  } catch {
    return authError("unreachable", 502);
  }
}
