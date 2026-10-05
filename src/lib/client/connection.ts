"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Whether we can reach MoodVerse: the browser's own online flag, plus the
 * result of the last real request, since `navigator.onLine` can say "online"
 * on a network that goes nowhere. Report failed requests with `markFailed`.
 */
export function useConnection() {
  const browserOnline = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const [failed, setFailed] = useState(false);

  // Going offline and back clears an old failure along with it.
  const [lastBrowserOnline, setLastBrowserOnline] = useState(browserOnline);
  if (browserOnline !== lastBrowserOnline) {
    setLastBrowserOnline(browserOnline);
    if (browserOnline) setFailed(false);
  }

  const retry = useCallback(async () => {
    try {
      const response = await fetch("/", { method: "HEAD", cache: "no-store" });
      setFailed(!response.ok);
    } catch {
      setFailed(true);
    }
  }, []);

  const markFailed = useCallback(() => setFailed(true), []);

  return { online: browserOnline && !failed, retry, markFailed };
}
