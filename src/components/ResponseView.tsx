"use client";

/** Renders one exchange: status, timing, and the raw request and response. */

import { useState } from "react";

import type { Exchange } from "@/lib/api";

type Tab = "response" | "request" | "headers";

export function statusTone(status: number): string {
  if (status >= 500) return "text-bad";
  if (status >= 400) return "text-warn";
  if (status >= 200 && status < 300) return "text-ok";
  return "text-info";
}

/** Minimal JSON colouring - enough to scan a payload, no dependency. */
function highlight(source: string) {
  const pattern =
    /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\btrue\b|\bfalse\b)|(\bnull\b)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) nodes.push(source.slice(lastIndex, match.index));

    const [text, propertyKey, str, num, bool, nul] = match;
    let className = "";
    if (propertyKey) className = "text-accent";
    else if (str) className = "text-ok";
    else if (num) className = "text-info";
    else if (bool) className = "text-warn";
    else if (nul) className = "text-ink-500";

    nodes.push(
      <span key={`t${key++}`} className={className}>
        {text}
      </span>,
    );
    lastIndex = match.index + text.length;
  }

  if (lastIndex < source.length) nodes.push(source.slice(lastIndex));
  return nodes;
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-md border border-ink-800 bg-ink-950 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
      {children}
    </pre>
  );
}

function headerLines(headers: Record<string, string>): string {
  const entries = Object.entries(headers);
  if (entries.length === 0) return "(none)";
  return entries.map(([key, value]) => `${key}: ${value}`).join("\n");
}

export function ResponseView({
  exchange,
  expect,
}: {
  exchange: Exchange;
  expect: number;
}) {
  const [tab, setTab] = useState<Tab>("response");
  const { response, error } = exchange;

  const bodyText = response
    ? response.json !== undefined
      ? JSON.stringify(response.json, null, 2)
      : response.raw || "(empty body)"
    : "";

  const unexpected = response !== undefined && response.status !== expect;

  return (
    <div className="mt-3 rounded-lg border border-ink-800 bg-ink-900/60">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-ink-800 px-3 py-2 text-xs">
        {error ? (
          <span className="font-mono font-semibold text-bad">request failed</span>
        ) : (
          response && (
            <>
              <span className={`font-mono font-semibold ${statusTone(response.status)}`}>
                {response.status} {response.statusText}
              </span>
              <span className="text-ink-500">{response.durationMs} ms</span>
              <span className="text-ink-500">
                {new Blob([response.raw]).size} B
              </span>
              {unexpected && (
                <span className="rounded border border-warn/40 bg-warn/10 px-1.5 py-0.5 text-[11px] text-warn">
                  expected {expect}
                </span>
              )}
            </>
          )
        )}

        <div className="ml-auto flex gap-1">
          {(["response", "request", "headers"] as Tab[]).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                tab === name
                  ? "bg-ink-700 text-ink-100"
                  : "text-ink-400 hover:bg-ink-800 hover:text-ink-200"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3">
        {error && (
          <p className="mb-3 rounded-md border border-bad/40 bg-bad/10 px-3 py-2 font-mono text-xs text-bad">
            {error}
          </p>
        )}

        {tab === "response" && response && <Pre>{highlight(bodyText)}</Pre>}
        {tab === "response" && !response && !error && (
          <p className="font-mono text-xs text-ink-500">no response</p>
        )}

        {tab === "request" && (
          <Pre>
            {`${exchange.request.method} ${exchange.request.url}\n\n` +
              `${headerLines(exchange.request.headers)}\n\n` +
              `${exchange.request.body ?? "(no body)"}`}
          </Pre>
        )}

        {tab === "headers" && (
          <Pre>{response ? headerLines(response.headers) : "(no response)"}</Pre>
        )}
      </div>
    </div>
  );
}
