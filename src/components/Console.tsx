"use client";

import { EndpointCard } from "@/components/EndpointCard";
import { LogPanel } from "@/components/LogPanel";
import { TopBar } from "@/components/TopBar";
import { ENDPOINTS_BY_GROUP } from "@/lib/endpoints";
import { SessionProvider } from "@/lib/session";

const METHOD_COLOR: Record<string, string> = {
  GET: "text-info",
  POST: "text-ok",
  PATCH: "text-warn",
  DELETE: "text-bad",
};

function Sidebar() {
  return (
    <nav className="hidden lg:block">
      <div className="sticky top-24 space-y-5 pr-2">
        {ENDPOINTS_BY_GROUP.map(({ group, endpoints }) => (
          <div key={group.id}>
            <a
              href={`#group-${group.id}`}
              className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 hover:text-ink-200"
            >
              {group.title}
            </a>
            <ul className="mt-1.5 space-y-0.5">
              {endpoints.map((endpoint) => (
                <li key={endpoint.id}>
                  <a
                    href={`#${endpoint.id}`}
                    className="flex items-baseline gap-2 rounded px-2 py-1 text-xs text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-100"
                  >
                    <span
                      className={`font-mono text-[10px] ${
                        METHOD_COLOR[endpoint.method] ?? "text-ink-400"
                      }`}
                    >
                      {endpoint.method}
                    </span>
                    <span className="truncate">{endpoint.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

function Intro() {
  return (
    <section className="rounded-xl border border-ink-800 bg-ink-900/40 p-5">
      <h2 className="text-base font-semibold text-ink-100">Start here</h2>
      <ol className="mt-3 space-y-2 text-sm leading-relaxed text-ink-300">
        <li>
          <span className="font-mono text-ink-500">1.</span> Check the dot next to the base
          URL above is green. If it is not, the API is not running:{" "}
          <code className="font-mono text-xs text-ink-200">docker compose up -d</code>
        </li>
        <li>
          <span className="font-mono text-ink-500">2.</span> Press{" "}
          <span className="text-accent">quick sign-in</span> to register a throwaway account.
          The token pair it returns is captured and sent on every{" "}
          <span className="text-accent">bearer</span> endpoint below - nothing to copy by
          hand.
        </li>
        <li>
          <span className="font-mono text-ink-500">3.</span> Submit a reflection. It returns{" "}
          <code className="font-mono text-xs text-ink-200">202 pending</code> and the console
          polls it for you until the worker finishes.
        </li>
        <li>
          <span className="font-mono text-ink-500">4.</span> Ids flow forward: the reflection
          you submit fills the poll and feedback forms, and the first verse returned fills
          the scripture lookup.
        </li>
      </ol>
      <p className="mt-3 text-xs leading-relaxed text-ink-500">
        This is a development tool for the API, not the product. The real client is a
        separate React Native app; nothing here is meant to ship.
      </p>
    </section>
  );
}

function Console() {
  return (
    <>
      <TopBar />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <Sidebar />

        <main className="min-w-0 space-y-10">
          <Intro />

          {ENDPOINTS_BY_GROUP.map(({ group, endpoints }) => (
            <section key={group.id} id={`group-${group.id}`} className="scroll-mt-24">
              <h2 className="text-lg font-semibold tracking-tight text-ink-100">
                {group.title}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-400">
                {group.blurb}
              </p>

              <div className="mt-4 space-y-4">
                {endpoints.map((endpoint) => (
                  <EndpointCard key={endpoint.id} spec={endpoint} />
                ))}
              </div>
            </section>
          ))}

          <footer className="border-t border-ink-800 pt-5 pb-16 text-xs text-ink-600">
            Scripture is served from the curated corpus in the database, never generated.
            The runtime model only ever analyses what the user wrote.
          </footer>
        </main>
      </div>

      <LogPanel />
    </>
  );
}

export default function ConsoleApp() {
  return (
    <SessionProvider>
      <Console />
    </SessionProvider>
  );
}
