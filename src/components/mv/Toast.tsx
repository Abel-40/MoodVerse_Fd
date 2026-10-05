"use client";

import { useEffect } from "react";

import { cx } from "@/lib/cx";

/** A short confirmation at the bottom of the screen. It clears itself. */
export function Toast({ message, onDone, className }: { message: string | null; onDone: () => void; className?: string }) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDone, 2600);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4">
      {message && (
        <span
          role="status"
          className={cx(
            "mv-fade-in rounded-full bg-ink px-5 py-3 text-sm font-bold text-bg shadow-sheet",
            className,
          )}
        >
          {message}
        </span>
      )}
    </div>
  );
}
