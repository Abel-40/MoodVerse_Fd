import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { backendFetch, clearTokens, isSameOrigin, refreshTokens, writeTokens } from "@/lib/server/backend";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/server/session";

// Only these backend paths are reachable through the proxy.
const ALLOWED = [/^auth\/me(\/preferences)?$/, /^api\/v1\/[\w\-/]+$/];

function failure(error: "signedOut" | "unreachable" | "notFound" | "forbidden", status: number) {
  return NextResponse.json({ error }, { status });
}

/**
 * Same-origin proxy to the backend for client components: /api/mv/<path>
 * goes to <backend>/<path> with the session's bearer token. A 401 triggers
 * one refresh-and-retry, so callers never handle token expiry themselves.
 */
async function forward(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (request.method !== "GET" && !isSameOrigin(request)) return failure("forbidden", 403);

  const target = (await params).path.join("/");
  if (!ALLOWED.some((pattern) => pattern.test(target))) return failure("notFound", 404);

  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!access && !refresh) return failure("signedOut", 401);

  const body = request.method === "GET" ? undefined : await request.arrayBuffer();
  const path = `/${target}${new URL(request.url).search}`;
  const send = (token: string) =>
    backendFetch(path, {
      method: request.method,
      body,
      contentType: request.headers.get("content-type") ?? undefined,
      token,
    });

  try {
    let response = access ? await send(access) : null;

    if (!response || response.status === 401) {
      if (!refresh) {
        clearTokens(jar);
        return failure("signedOut", 401);
      }
      const refreshed = await refreshTokens(refresh);
      if (!refreshed.ok) {
        if (refreshed.reason === "rejected") clearTokens(jar);
        return refreshed.reason === "rejected" ? failure("signedOut", 401) : failure("unreachable", 502);
      }
      writeTokens(jar, refreshed.tokens);
      response = await send(refreshed.tokens.access_token);
    }

    return new NextResponse(response.status === 204 ? null : response.body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return failure("unreachable", 502);
  }
}

export { forward as GET, forward as POST, forward as PATCH, forward as DELETE };
