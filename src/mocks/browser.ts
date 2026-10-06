import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";

import { handlers, mockOptions } from "./handlers";

let started: Promise<unknown> | null = null;

declare global {
  interface Window {
    /** Mock mode only: lets end-to-end tests add handlers (`worker.use`). */
    __msw?: {
      worker: ReturnType<typeof setupWorker>;
      http: typeof http;
      HttpResponse: typeof HttpResponse;
      options: typeof mockOptions;
    };
  }
}

/**
 * Start answering /api/mv calls from the mocks. Anything else goes to the
 * network. Safe to call twice (React runs effects twice in development); a
 * second worker would answer every request twice.
 */
export function startMocking() {
  if (!started) {
    const worker = setupWorker(...handlers);
    // The service worker answers these requests, so Playwright's page.route
    // never sees them; tests override responses through this instead.
    window.__msw = { worker, http, HttpResponse, options: mockOptions };
    started = worker.start({ onUnhandledRequest: "bypass", quiet: true });
  }
  return started;
}
