import { cookies } from "next/headers";

/** httpOnly cookies holding the backend's JWT pair. */
export const ACCESS_COOKIE = "mv-at";
export const REFRESH_COOKIE = "mv-rt";
/** Set to "1" when someone chooses "Continue as guest". */
export const GUEST_COOKIE = "guest";

export type SessionKind = "user" | "guest" | "none";

/**
 * Whether this visitor is signed in, a guest, or new. Only cookie presence is
 * checked; whether the tokens are still valid is the backend's call. A
 * cleared cookie can still be present with an empty value during the request
 * that cleared it, so presence means a non-empty value.
 */
export async function getSessionKind(): Promise<SessionKind> {
  const jar = await cookies();
  if (jar.get(REFRESH_COOKIE)?.value) return "user";
  if (jar.get(GUEST_COOKIE)?.value === "1") return "guest";
  return "none";
}

/** Where "Reflect in your browser" leads: straight in for returning visitors. */
export async function reflectEntryHref(): Promise<string> {
  return (await getSessionKind()) === "none" ? "/welcome" : "/reflect";
}
