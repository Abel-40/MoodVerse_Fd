"use client";

import { useCallback, useEffect, useState } from "react";

import { maskToken, send } from "@/lib/api";
import { randomEmail } from "@/lib/endpoints";
import { useSession } from "@/lib/session";

type Health = "unknown" | "checking" | "up" | "down";

const HEALTH_TONE: Record<Health, string> = {
  unknown: "bg-ink-600",
  checking: "bg-warn animate-pulse",
  up: "bg-ok",
  down: "bg-bad",
};

/** Outside the component so the mount probe and the button share one call. */
async function probe(baseUrl: string): Promise<Health> {
  const exchange = await send({
    baseUrl,
    method: "GET",
    path: "/health",
    endpointId: "health",
    label: "GET /health",
  });
  return exchange.response?.ok ? "up" : "down";
}

function TokenChip({
  label,
  token,
  onClear,
}: {
  label: string;
  token: string | null;
  onClear: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }, [token]);

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-ink-800 bg-ink-900 px-2 py-1">
      <span className="text-[10px] uppercase tracking-wide text-ink-500">{label}</span>
      {token ? (
        <>
          <code className="font-mono text-[11px] text-ink-300">{maskToken(token)}</code>
          <button
            type="button"
            onClick={copy}
            title={`Copy the full ${label} token`}
            className="text-[10px] text-accent hover:underline"
          >
            {copied ? "copied" : "copy"}
          </button>
          <button
            type="button"
            onClick={onClear}
            title="Forget this token"
            className="text-[10px] text-ink-500 hover:text-bad"
          >
            ✕
          </button>
        </>
      ) : (
        <span className="font-mono text-[11px] text-ink-600">none</span>
      )}
    </div>
  );
}

export function TopBar() {
  const session = useSession();
  const [health, setHealth] = useState<Health>("checking");
  const [draftUrl, setDraftUrl] = useState(session.baseUrl);
  const [busy, setBusy] = useState(false);

  const { baseUrl, absorb } = session;

  const checkHealth = useCallback(async () => {
    setHealth("checking");
    setHealth(await probe(baseUrl));
  }, [baseUrl]);

  // Probes on mount and whenever the base URL changes. The indicator already
  // starts as "checking", so only the outcome is written, after the await.
  useEffect(() => {
    let cancelled = false;
    void probe(baseUrl).then((result) => {
      if (!cancelled) setHealth(result);
    });
    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  /** Register a throwaway account and read it back, so the protected
   *  endpoints below are usable without filling two forms first. */
  const quickSignIn = useCallback(async () => {
    setBusy(true);
    const registration = await send({
      baseUrl,
      method: "POST",
      path: "/auth/register",
      json: {
        email: randomEmail(),
        password: "testpassword123",
        display_name: "Console",
      },
      endpointId: "register",
      label: "POST /auth/register (quick sign-in)",
    });
    absorb(registration);

    const token = (registration.response?.json as { access_token?: string })?.access_token;
    if (token) {
      const me = await send({
        baseUrl,
        method: "GET",
        path: "/auth/me",
        bearer: token,
        endpointId: "me",
        label: "GET /auth/me (quick sign-in)",
      });
      absorb(me);
    }
    setBusy(false);
  }, [baseUrl, absorb]);

  return (
    <header className="sticky top-0 z-20 border-b border-ink-800 bg-ink-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-ink-100">
            MoodVerse API console
          </h1>
          <p className="text-[11px] text-ink-500">
            every endpoint, and the raw exchange behind it
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${HEALTH_TONE[health]}`} />
          <input
            type="text"
            value={draftUrl}
            onChange={(event) => setDraftUrl(event.target.value)}
            onBlur={() => session.setBaseUrl(draftUrl.trim() || "http://localhost:8080")}
            spellCheck={false}
            className="!w-64"
            aria-label="API base URL"
          />
          <button
            type="button"
            onClick={checkHealth}
            className="rounded-md border border-ink-700 px-2 py-1 text-xs text-ink-300 hover:bg-ink-800 hover:text-ink-100"
          >
            {health === "checking" ? "…" : "check"}
          </button>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {session.user ? (
            <span className="flex items-center gap-2 rounded-md border border-ink-800 bg-ink-900 px-2 py-1 text-xs">
              <span className="text-ink-200">{session.user.email}</span>
              <span
                className={
                  session.user.email_verified ? "text-ok" : "text-warn"
                }
                title={
                  session.user.email_verified
                    ? "email verified"
                    : "email not verified - nothing gates on it yet"
                }
              >
                {session.user.email_verified ? "verified" : "unverified"}
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={quickSignIn}
              disabled={busy || health === "down"}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-ink-950 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              title="Registers a throwaway account so the protected endpoints are ready to use"
            >
              {busy ? "signing in…" : "quick sign-in"}
            </button>
          )}

          <TokenChip
            label="access"
            token={session.accessToken}
            onClear={() => session.setAccessToken(null)}
          />
          <TokenChip
            label="refresh"
            token={session.refreshToken}
            onClear={() => session.setRefreshToken(null)}
          />

          {session.user && (
            <button
              type="button"
              onClick={session.signOut}
              className="rounded-md border border-ink-700 px-2 py-1 text-xs text-ink-400 hover:bg-ink-800 hover:text-bad"
            >
              forget
            </button>
          )}
        </div>
      </div>

      {health === "down" && (
        <p className="border-t border-bad/30 bg-bad/10 px-5 py-2 text-center font-mono text-xs text-bad">
          {session.baseUrl} is not answering /health. Start the stack:{" "}
          <span className="text-ink-200">docker compose up -d</span>
        </p>
      )}
    </header>
  );
}
