"use client";

import { useId } from "react";

/*
 * Text that depends on the visitor's clock, time zone and locale: today's
 * date, the greeting, "Tuesday". The server can't know these, so (following
 * Next's "preventing flash before hydration" guide) the server renders its
 * own value and an inline script replaces it before first paint. React then
 * hydrates against the corrected text.
 *
 * Each formatter is a self-contained function, embedded in the script with
 * toString() so the script and the render can't disagree. Keep them free of
 * imports and outer variables.
 */

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

function formatGreeting(labels: { morning: string; afternoon: string; evening: string }): string {
  const hour = new Date().getHours();
  return hour < 12 ? labels.morning : hour < 18 ? labels.afternoon : labels.evening;
}

function formatDay(iso: string, labels: { today: string; yesterday: string }): string {
  const then = new Date(iso);
  const now = new Date();
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime()) /
      86400000,
  );
  if (days === 0) return labels.today;
  if (days === 1) return labels.yesterday;
  if (days < 7) return then.toLocaleDateString(undefined, { weekday: "long" });
  return then.toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

/** Rendered on the server only; the client keeps whatever text is in place. */
function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function LocalText<A extends unknown[]>({
  format,
  args,
  className,
}: {
  format: (...args: A) => string;
  args: A;
  className?: string;
}) {
  const id = useId();
  const call = `(${format.toString()}).apply(null, ${JSON.stringify(args)})`;
  return (
    <>
      <span id={id} className={className} suppressHydrationWarning>
        {format(...args)}
      </span>
      <InlineScript html={`{var n=document.getElementById(${JSON.stringify(id)});if(n)n.textContent=${call}}`} />
    </>
  );
}

/** "Thursday, 1 October", in the visitor's locale. */
export function TodayDate({ className }: { className?: string }) {
  return <LocalText format={formatToday} args={[]} className={className} />;
}

/** Good morning / afternoon / evening, by the visitor's local time. */
export function Greeting({
  labels,
  className,
}: {
  labels: { morning: string; afternoon: string; evening: string };
  className?: string;
}) {
  return <LocalText format={formatGreeting} args={[labels]} className={className} />;
}

/** Today, Yesterday, a weekday within the last week, or a date. */
export function RelativeDay({
  iso,
  labels,
  className,
}: {
  iso: string;
  labels: { today: string; yesterday: string };
  className?: string;
}) {
  return <LocalText format={formatDay} args={[iso, labels]} className={className} />;
}
