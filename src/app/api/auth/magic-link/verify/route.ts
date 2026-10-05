import { authError, forbiddenUnlessSameOrigin, readJson, signedIn } from "@/lib/server/auth-routes";
import { backendFetch, type TokenPair } from "@/lib/server/backend";

/** Spend the token from an emailed link and sign this browser in. */
export async function POST(request: Request) {
  const forbidden = forbiddenUnlessSameOrigin(request);
  if (forbidden) return forbidden;

  const body = await readJson<{ token: string }>(request);
  if (typeof body?.token !== "string") return authError("link", 400);

  try {
    const response = await backendFetch("/auth/magic-link/verify", { json: { token: body.token } });
    if (!response.ok) return authError(response.status >= 500 ? "generic" : "link", response.status);
    return signedIn((await response.json()) as TokenPair);
  } catch {
    return authError("unreachable", 502);
  }
}
