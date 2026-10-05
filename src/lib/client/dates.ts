/** Dates for lists, in the reader's locale and time zone. Client-side only. */

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Whole days between `iso` and today (0 = today). */
export function daysAgo(iso: string, now = new Date()): number {
  return Math.round((startOfDay(now) - startOfDay(new Date(iso))) / 86400000);
}

/** "8:12 AM" */
export function timeOfDay(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
}

/**
 * A row's timestamp: today and yesterday by name (via `labels`), the past
 * week by weekday and time ("Tue, 10:40 PM"), older ones by date ("Sep 21").
 */
export function rowTime(
  iso: string,
  locale: string,
  labels: { today: (time: string) => string; yesterday: (time: string) => string },
): string {
  const days = daysAgo(iso);
  const time = timeOfDay(iso, locale);
  if (days === 0) return labels.today(time);
  if (days === 1) return labels.yesterday(time);
  const date = new Date(iso);
  if (days < 7) return `${date.toLocaleDateString(locale, { weekday: "short" })}, ${time}`;
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

/** "today", "yesterday", "Tuesday" or "Sep 21". */
export function dayName(iso: string, locale: string, labels: { today: string; yesterday: string }): string {
  const days = daysAgo(iso);
  if (days === 0) return labels.today;
  if (days === 1) return labels.yesterday;
  const date = new Date(iso);
  return days < 7
    ? date.toLocaleDateString(locale, { weekday: "long" })
    : date.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

/** "Thursday, 1 October · 8:12 AM" */
export function longDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })} · ${timeOfDay(iso, locale)}`;
}
