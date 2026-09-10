"use client";

/**
 * Follows a submitted reflection to its conclusion.
 *
 * Both submit routes return 202 and hand the work to a Celery worker, so the
 * interesting part of the API is only visible by polling. Doing it here turns
 * the two-step contract into one thing to watch, and makes the most common
 * failure - no worker draining the heavy queue, so the status never moves -
 * obvious rather than mysterious.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { send, type Exchange } from "@/lib/api";
import { useSession } from "@/lib/session";

const INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 40;

interface Verse {
  canonical_id: string;
  religion: string;
  reference: string;
  text: string;
}

interface Result {
  verse: Verse;
  rank: number;
  similarity: number | null;
  final_score: number | null;
  served_with_context: boolean;
}

interface Reflection {
  id: number;
  status: string;
  text: string | null;
  religion: string;
  error: string | null;
  analysis: Record<string, unknown> | null;
  results: Result[];
}

const STATUS_TONE: Record<string, string> = {
  pending: "border-ink-600 bg-ink-800 text-ink-300",
  processing: "border-info/40 bg-info/10 text-info",
  completed: "border-ok/40 bg-ok/10 text-ok",
  failed: "border-bad/40 bg-bad/10 text-bad",
};

export function ReflectionPoll({ reflectionId }: { reflectionId: number }) {
  const session = useSession();
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [polling, setPolling] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const cancelled = useRef(false);
  const { baseUrl, accessToken, absorb } = session;

  const settled = reflection?.status === "completed" || reflection?.status === "failed";

  const poll = useCallback(async (): Promise<Exchange> => {
    return send({
      baseUrl,
      method: "GET",
      path: `/api/v1/reflections/${reflectionId}`,
      bearer: accessToken,
      endpointId: "reflection",
      label: `GET /api/v1/reflections/${reflectionId} (poll)`,
    });
  }, [baseUrl, accessToken, reflectionId]);

  useEffect(() => {
    cancelled.current = false;
    let attempt = 0;

    const run = async () => {
      while (!cancelled.current && attempt < MAX_ATTEMPTS) {
        attempt += 1;
        setAttempts(attempt);

        const exchange = await poll();
        if (cancelled.current) return;

        if (!exchange.response?.ok) {
          // Only the final state reaches the log; forty polling rows would
          // bury the calls actually made by hand.
          absorb(exchange);
          setNote(exchange.error ?? `poll failed with ${exchange.response?.status}`);
          setPolling(false);
          return;
        }

        const body = exchange.response.json as Reflection;
        setReflection(body);

        if (body.status === "completed" || body.status === "failed") {
          absorb(exchange);
          setPolling(false);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
      }

      if (!cancelled.current) {
        setPolling(false);
        setNote(
          `still ${reflection?.status ?? "pending"} after ${MAX_ATTEMPTS} attempts. ` +
            "Nothing is draining the heavy queue - check: docker compose ps",
        );
      }
    };

    void run();
    return () => {
      cancelled.current = true;
    };
    // Intentionally keyed on the reflection alone: re-running on every status
    // change would start a second polling loop against the same id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflectionId]);

  const status = reflection?.status ?? "pending";

  return (
    <div className="mt-3 rounded-lg border border-accent-dim/50 bg-accent/5 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-ink-400">
          watching reflection <span className="font-mono text-ink-200">#{reflectionId}</span>
        </span>
        <span
          className={`rounded border px-2 py-0.5 font-mono text-[11px] ${
            STATUS_TONE[status] ?? STATUS_TONE.pending
          }`}
        >
          {status}
        </span>
        {polling && (
          <span className="flex items-center gap-2 text-xs text-ink-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            poll {attempts}/{MAX_ATTEMPTS}
          </span>
        )}
        {settled && (
          <span className="text-xs text-ink-500">settled after {attempts} polls</span>
        )}
      </div>

      {note && <p className="mt-2 font-mono text-xs text-warn">{note}</p>}

      {reflection?.error && (
        <p className="mt-2 rounded border border-bad/40 bg-bad/10 px-3 py-2 font-mono text-xs text-bad">
          {reflection.error}
        </p>
      )}

      {reflection?.text && (
        <p className="mt-3 border-l-2 border-ink-700 pl-3 text-sm text-ink-300 italic">
          {reflection.text}
        </p>
      )}

      {reflection?.analysis && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowAnalysis((value) => !value)}
            className="text-xs text-accent hover:underline"
          >
            {showAnalysis ? "hide" : "show"} model analysis
          </button>
          {showAnalysis && (
            <pre className="mt-2 max-h-60 overflow-auto rounded border border-ink-800 bg-ink-950 p-3 font-mono text-[11px] whitespace-pre-wrap">
              {JSON.stringify(reflection.analysis, null, 2)}
            </pre>
          )}
        </div>
      )}

      {reflection && reflection.results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {reflection.results.map((result) => (
            <li
              key={result.verse.canonical_id}
              className="rounded-md border border-ink-800 bg-ink-900/70 p-3"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-medium text-ink-100">
                  {result.verse.reference}
                </span>
                <code className="font-mono text-[11px] text-ink-500">
                  {result.verse.canonical_id}
                </code>
                <span className="ml-auto font-mono text-[11px] text-ink-500">
                  rank {result.rank}
                  {result.final_score !== null && ` · score ${result.final_score.toFixed(3)}`}
                  {result.similarity !== null && ` · sim ${result.similarity.toFixed(3)}`}
                  {result.served_with_context && " · with context"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">{result.verse.text}</p>
            </li>
          ))}
        </ul>
      )}

      {settled && reflection?.results.length === 0 && (
        <p className="mt-3 text-xs text-ink-400">
          Completed with no verses. That is default-deny working: nothing in the corpus
          passed the serving constraints for this reflection. Only 28 verses are currently
          annotated as servable.
        </p>
      )}
    </div>
  );
}
