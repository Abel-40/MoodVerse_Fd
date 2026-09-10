"use client";

/** Every exchange this session, newest first, as a drawer over the page. */

import { useState } from "react";

import { useSession } from "@/lib/session";

import { ResponseView, statusTone } from "./ResponseView";

function time(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, { hour12: false });
}

export function LogPanel() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-30 rounded-full border border-ink-700 bg-ink-850 px-4 py-2 text-xs text-ink-200 shadow-lg shadow-black/40 hover:bg-ink-800"
      >
        exchange log
        <span className="ml-2 rounded-full bg-ink-700 px-1.5 py-0.5 font-mono text-[10px]">
          {session.log.length}
        </span>
      </button>

      {open && (
        <aside className="fixed inset-y-0 right-0 z-30 flex w-full max-w-xl flex-col border-l border-ink-800 bg-ink-950 shadow-2xl shadow-black/60">
          <div className="flex items-center gap-3 border-b border-ink-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-ink-100">Exchange log</h2>
            <span className="text-xs text-ink-500">{session.log.length} calls</span>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={session.clearLog}
                className="rounded border border-ink-700 px-2 py-1 text-xs text-ink-400 hover:text-bad"
              >
                clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-ink-700 px-2 py-1 text-xs text-ink-300 hover:bg-ink-800"
              >
                close
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {session.log.length === 0 && (
              <p className="text-sm text-ink-500">
                Nothing yet. Every request the console makes is recorded here, including
                the polls it runs for you.
              </p>
            )}

            <ul className="space-y-2">
              {session.log.map((exchange) => {
                const isOpen = expanded === exchange.id;
                return (
                  <li
                    key={exchange.id}
                    className="rounded-lg border border-ink-800 bg-ink-900/50"
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : exchange.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left"
                    >
                      <span className="font-mono text-[11px] text-ink-500">
                        {time(exchange.at)}
                      </span>
                      <span className="truncate font-mono text-xs text-ink-200">
                        {exchange.label}
                      </span>
                      <span
                        className={`ml-auto shrink-0 font-mono text-xs ${
                          exchange.response
                            ? statusTone(exchange.response.status)
                            : "text-bad"
                        }`}
                      >
                        {exchange.response ? exchange.response.status : "ERR"}
                      </span>
                      {exchange.response && (
                        <span className="shrink-0 font-mono text-[11px] text-ink-600">
                          {exchange.response.durationMs}ms
                        </span>
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-3 pb-3">
                        <ResponseView
                          exchange={exchange}
                          expect={exchange.response?.status ?? 0}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      )}
    </>
  );
}
