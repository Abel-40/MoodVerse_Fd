import { cache } from "react";
import { cookies } from "next/headers";

import type { Passage, Tradition } from "@/lib/scripture";

import { backendFetch, type BackendUser } from "./backend";
import { ACCESS_COOKIE, getSessionKind } from "./session";

export type AccountState =
  | { kind: "user"; user: BackendUser | null }
  | { kind: "guest" }
  | { kind: "none" }
  | { kind: "expired" };

/**
 * Who is using the app, once per request. A signed-in user whose profile
 * can't be loaded because the backend is down still counts as signed in
 * (`user: null`); one the backend rejects is "expired".
 */
export const getAccount = cache(async (): Promise<AccountState> => {
  const kind = await getSessionKind();
  if (kind !== "user") return { kind };

  // The proxy has already refreshed an expired access token by this point.
  const access = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!access) return { kind: "user", user: null };

  try {
    const response = await backendFetch("/auth/me", { token: access });
    if (response.status === 401) return { kind: "expired" };
    if (!response.ok) return { kind: "user", user: null };
    return { kind: "user", user: (await response.json()) as BackendUser };
  } catch {
    return { kind: "user", user: null };
  }
});

export interface LastReflection {
  id: number;
  createdAt: string;
  passage: Passage;
}

interface HistoryItem {
  id: number;
  created_at: string;
  status: string;
  results: Array<{ verse: { canonical_id: string; religion: Tradition; reference: string; translation: string; text: string } }>;
}

/** The most recent reflection that found a passage, for Reflect's "Last time" rail. */
export const getLastReflection = cache(async (): Promise<LastReflection | null> => {
  const access = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!access) return null;
  try {
    const response = await backendFetch("/api/v1/reflections/history?limit=10", { token: access });
    if (!response.ok) return null;
    const { items } = (await response.json()) as { items: HistoryItem[] };
    const last = items.find((item) => item.status === "completed" && item.results.length > 0);
    if (!last) return null;
    const verse = last.results[0].verse;
    return {
      id: last.id,
      createdAt: last.created_at,
      passage: {
        id: verse.canonical_id,
        tradition: verse.religion,
        reference: verse.reference,
        translation: verse.translation,
        text: verse.text,
        arabic: null,
      },
    };
  } catch {
    return null;
  }
});
