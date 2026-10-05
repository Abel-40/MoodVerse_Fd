import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

let started: Promise<unknown> | null = null;

/**
 * Start answering /api/mv calls from the mocks. Anything else goes to the
 * network. Safe to call twice (React runs effects twice in development); a
 * second worker would answer every request twice.
 */
export function startMocking() {
  started ??= setupWorker(...handlers).start({ onUnhandledRequest: "bypass", quiet: true });
  return started;
}
