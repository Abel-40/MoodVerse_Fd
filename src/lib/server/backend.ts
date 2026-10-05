/**
 * Server-side access to the MoodVerse FastAPI backend.
 *
 * The browser never holds the backend's tokens: route handlers and the proxy
 * keep them in httpOnly cookies (ACCESS_COOKIE / REFRESH_COOKIE) and attach
 * them here, so page scripts can't read or leak them.
 */

import { ACCESS_COOKIE, GUEST_COOKIE, REFRESH_COOKIE } from "./session";

const BACKEND_URL = (
  process.env.MOODVERSE_API_URL ??
  process.env.NEXT_PUBLIC_MOODVERSE_API_URL ??
  "http://127.0.0.1:8080"
).replace(/\/+$/, "");

/** The backend as the browser reaches it, for top-level redirects (Google). */
export const BACKEND_PUBLIC_URL = (process.env.NEXT_PUBLIC_MOODVERSE_API_URL ?? BACKEND_URL).replace(/\/+$/, "");

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface BackendUser {
  id: number;
  email: string;
  display_name: string | null;
  email_verified: boolean;
  preferred_religion: "bible" | "quran" | null;
}

interface FetchOptions {
  method?: string;
  json?: unknown;
  form?: Record<string, string>;
  body?: BodyInit;
  contentType?: string;
  token?: string;
}

/** Call the backend. Throws only when it can't be reached at all. */
export async function backendFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let body: BodyInit | undefined = options.body;
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  } else if (options.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(options.form);
  } else if (options.contentType) {
    headers["Content-Type"] = options.contentType;
  }
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  return fetch(`${BACKEND_URL}${path}`, {
    method: options.method ?? (body === undefined ? "GET" : "POST"),
    headers,
    body,
    cache: "no-store",
  });
}

/** Seconds until a JWT's `exp`, read without verifying it (that's the backend's job). */
function secondsUntilExpiry(token: string, fallback: number): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as { exp?: number };
    if (typeof payload.exp === "number") return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
  } catch {
    // Not a JWT we can read; use the fallback.
  }
  return fallback;
}

interface CookieWriter {
  set(name: string, value: string, options: Record<string, unknown>): unknown;
}

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

/**
 * Store a fresh token pair. The access cookie expires a little before the
 * token does, so its absence is the signal to refresh.
 */
export function writeTokens(jar: CookieWriter, tokens: TokenPair) {
  jar.set(ACCESS_COOKIE, tokens.access_token, {
    ...COOKIE_BASE,
    maxAge: Math.max(tokens.expires_in - 30, 30),
  });
  jar.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...COOKIE_BASE,
    maxAge: secondsUntilExpiry(tokens.refresh_token, 60 * 60 * 24 * 30),
  });
  jar.set(GUEST_COOKIE, "", { path: "/", maxAge: 0 });
}

export function clearTokens(jar: CookieWriter) {
  jar.set(ACCESS_COOKIE, "", { ...COOKIE_BASE, maxAge: 0 });
  jar.set(REFRESH_COOKIE, "", { ...COOKIE_BASE, maxAge: 0 });
}

export type RefreshResult = { ok: true; tokens: TokenPair } | { ok: false; reason: "rejected" | "unreachable" };

// Rotation spends a refresh token, so two requests refreshing with the same
// one at once would sign the user out. Share one attempt per token.
const inFlight = new Map<string, Promise<RefreshResult>>();

export function refreshTokens(refreshToken: string): Promise<RefreshResult> {
  const pending = inFlight.get(refreshToken);
  if (pending) return pending;

  const attempt = (async (): Promise<RefreshResult> => {
    try {
      const response = await backendFetch("/auth/refresh", { json: { refresh_token: refreshToken } });
      if (!response.ok) return { ok: false, reason: response.status >= 500 ? "unreachable" : "rejected" };
      return { ok: true, tokens: (await response.json()) as TokenPair };
    } catch {
      return { ok: false, reason: "unreachable" };
    }
  })();
  inFlight.set(refreshToken, attempt);
  // Keep the settled result briefly for requests that arrive just after.
  attempt.finally(() => setTimeout(() => inFlight.delete(refreshToken), 10_000));
  return attempt;
}

/**
 * The origin the browser actually used. Next can report `request.url` as
 * localhost when the page was opened on 127.0.0.1, so trust the Host header.
 */
export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  return host ? `${url.protocol}//${host}` : url.origin;
}

/** Reject cross-site form posts: every mutating route checks this first. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === requestOrigin(request);
}
