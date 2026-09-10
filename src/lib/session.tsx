"use client";

/**
 * Console state: which API to talk to, the tokens in hand, and the log of every
 * exchange made this session.
 *
 * `absorb` is the part worth knowing about. Rather than making you copy a token
 * out of one response and paste it into the next request, it reads each
 * response as it arrives and picks up anything later calls will need - the
 * token pair, the id of a submitted reflection, the canonical id of the first
 * verse that came back. Testing a chain of endpoints then takes one click each.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Exchange } from "./api";
import { pick, pickNumber, pickString } from "./api";

const STORAGE_KEY = "moodverse-console";
const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_MOODVERSE_API_URL ?? "http://localhost:8080";

/** Enough of GET /auth/me to render the signed-in chip. */
export interface CurrentUser {
  id: number;
  email: string;
  display_name: string | null;
  email_verified: boolean;
  preferred_religion: "bible" | "quran" | null;
}

interface Persisted {
  baseUrl: string;
  accessToken: string | null;
  refreshToken: string | null;
  reflectionId: string | null;
  canonicalId: string | null;
  user: CurrentUser | null;
}

const EMPTY: Persisted = {
  baseUrl: DEFAULT_BASE_URL,
  accessToken: null,
  refreshToken: null,
  reflectionId: null,
  canonicalId: null,
  user: null,
};

interface SessionValue extends Persisted {
  log: Exchange[];
  setBaseUrl: (value: string) => void;
  setAccessToken: (value: string | null) => void;
  setRefreshToken: (value: string | null) => void;
  setReflectionId: (value: string | null) => void;
  setCanonicalId: (value: string | null) => void;
  /** Record an exchange and harvest anything reusable from its response. */
  absorb: (exchange: Exchange) => void;
  clearLog: () => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

function readStored(): Persisted {
  try {
    if (typeof window === "undefined") return EMPTY;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Persisted>) };
  } catch {
    return EMPTY;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  // Safe to read during initialisation because this tree never renders on the
  // server - page.tsx loads it with ssr disabled - so there is no hydration
  // pass for a stored token to disagree with.
  const [state, setState] = useState<Persisted>(readStored);
  const [log, setLog] = useState<Exchange[]>([]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private browsing, or storage full. The console still works, it just
      // forgets the tokens on reload.
    }
  }, [state]);

  const patch = useCallback((next: Partial<Persisted>) => {
    setState((current) => ({ ...current, ...next }));
  }, []);

  const absorb = useCallback(
    (exchange: Exchange) => {
      setLog((current) => [exchange, ...current].slice(0, 100));

      const body = exchange.response?.json;
      if (!exchange.response?.ok || body === undefined) return;

      const next: Partial<Persisted> = {};

      const accessToken = pickString(body, "access_token");
      const refreshToken = pickString(body, "refresh_token");
      if (accessToken) next.accessToken = accessToken;
      if (refreshToken) next.refreshToken = refreshToken;

      const reflectionId = pickNumber(body, "reflection_id");
      if (reflectionId !== undefined) next.reflectionId = String(reflectionId);

      // GET /auth/me and the reflection routes share no shape, so identify
      // each by a field only it has rather than by which endpoint was called.
      if (pickString(body, "email") && pickNumber(body, "id") !== undefined) {
        next.user = body as unknown as CurrentUser;
      }

      const firstVerse = firstCanonicalId(body);
      if (firstVerse) next.canonicalId = firstVerse;

      if (Object.keys(next).length > 0) patch(next);
    },
    [patch],
  );

  const value = useMemo<SessionValue>(
    () => ({
      ...state,
      log,
      setBaseUrl: (baseUrl) => patch({ baseUrl }),
      setAccessToken: (accessToken) => patch({ accessToken }),
      setRefreshToken: (refreshToken) => patch({ refreshToken }),
      setReflectionId: (reflectionId) => patch({ reflectionId }),
      setCanonicalId: (canonicalId) => patch({ canonicalId }),
      absorb,
      clearLog: () => setLog([]),
      signOut: () =>
        patch({ accessToken: null, refreshToken: null, user: null }),
    }),
    [state, log, patch, absorb],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

/**
 * Find the first served verse in a reflection or history payload, so feedback
 * and the scripture lookup have a real canonical id to work with.
 */
function firstCanonicalId(body: unknown): string | undefined {
  const fromResults = (value: unknown): string | undefined => {
    const results = pick(value, "results");
    if (!Array.isArray(results) || results.length === 0) return undefined;
    const verse = pick(results[0], "verse");
    return pickString(verse, "canonical_id");
  };

  const direct = fromResults(body);
  if (direct) return direct;

  const items = pick(body, "items");
  if (Array.isArray(items)) {
    for (const item of items) {
      const found = fromResults(item);
      if (found) return found;
    }
  }

  return pickString(body, "canonical_id");
}
