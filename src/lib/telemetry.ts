import type { ShareBackground } from "@/components/mv/ShareCard";
import type { Tradition } from "@/lib/scripture";

/*
 * Privacy rules for anything that leaves the browser besides the app's own
 * API calls. No error tracker or analytics service is installed yet; these
 * are the guards to use when one is.
 */

// ---------------------------------------------------------------------------
// Error tracking: pass `scrubEvent` as Sentry's `beforeSend` (and
// `beforeSendTransaction`). It drops request bodies, cookies and headers, and
// any field that could hold what someone wrote, wherever it is nested.

const PRIVATE_KEYS = /^(text|reflection|transcript|body|data|note|draft|query_string|cookies?|headers)$/i;

function strip(value: unknown, depth = 0): unknown {
  if (depth > 8 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => strip(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !PRIVATE_KEYS.test(key))
      .map(([key, child]) => [key, strip(child, depth + 1)]),
  );
}

export function scrubEvent<T extends object>(event: T): T {
  const scrubbed = strip(event) as T & { breadcrumbs?: Array<{ category?: string; message?: string }> };
  // Console breadcrumbs repeat whatever was logged, which could be anything.
  if (Array.isArray(scrubbed.breadcrumbs)) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs.filter((crumb) => crumb.category !== "console");
  }
  return scrubbed;
}

// ---------------------------------------------------------------------------
// Analytics: only these counts, with no user, reflection or passage ids.
// Sent as a beacon to NEXT_PUBLIC_ANALYTICS_URL; nothing is sent when unset.

export type AnalyticsEvent =
  | { name: "reflection_tradition"; tradition: Tradition }
  | { name: "feedback_value"; helped: boolean }
  | { name: "share_background"; background: ShareBackground };

const ANALYTICS_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL;

/** The exact fields an event may carry; anything else is dropped. */
export function analyticsPayload(event: AnalyticsEvent): Record<string, string> {
  switch (event.name) {
    case "reflection_tradition":
      return { event: event.name, tradition: event.tradition };
    case "feedback_value":
      return { event: event.name, value: event.helped ? "helped" : "not_quite" };
    case "share_background":
      return { event: event.name, background: event.background };
  }
}

export function track(event: AnalyticsEvent) {
  if (!ANALYTICS_URL || typeof navigator === "undefined" || !navigator.sendBeacon) return;
  navigator.sendBeacon(ANALYTICS_URL, JSON.stringify(analyticsPayload(event)));
}
