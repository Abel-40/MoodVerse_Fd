import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isSameOrigin, writeTokens, type TokenPair } from "./backend";

/** Error codes the sign-in screens turn into copy (messages: auth.errors). */
export type AuthErrorCode =
  | "generic"
  | "unreachable"
  | "invalidEmail"
  | "wrongPassword"
  | "exists"
  | "passwordShort"
  | "link"
  | "google";

export function authError(code: AuthErrorCode, status: number) {
  return NextResponse.json({ error: code }, { status });
}

export function forbiddenUnlessSameOrigin(request: Request) {
  return isSameOrigin(request) ? null : authError("generic", 403);
}

/** Read a JSON body, or null when it isn't one. */
export async function readJson<T>(request: Request): Promise<Partial<T> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" ? (body as Partial<T>) : null;
  } catch {
    return null;
  }
}

/** Finish a sign-in: keep the tokens in cookies and drop guest mode. */
export async function signedIn(tokens: TokenPair) {
  writeTokens(await cookies(), tokens);
  return NextResponse.json({ ok: true });
}
