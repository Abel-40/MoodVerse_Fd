"use client";

import type { Tradition } from "@/lib/scripture";

// Chosen on the welcome screen before there is an account to store it in.
// Guests keep it here; after sign-in it moves to the backend.
const DEFAULT_TRADITION_KEY = "mv-default-tradition";

export function readDefaultTradition(): Tradition | null {
  try {
    const value = window.localStorage.getItem(DEFAULT_TRADITION_KEY);
    return value === "bible" || value === "quran" ? value : null;
  } catch {
    return null;
  }
}

export function storeDefaultTradition(tradition: Tradition) {
  try {
    window.localStorage.setItem(DEFAULT_TRADITION_KEY, tradition);
  } catch {
    // Storage blocked: the choice simply isn't remembered.
  }
}

/** "Continue as guest": everything stays in this browser. */
export function startGuestSession() {
  document.cookie = `guest=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/**
 * After any sign-in: carry over a tradition picked during onboarding, then
 * go to Reflect. Saving the preference is best-effort; Settings can redo it.
 */
export async function finishSignIn(navigate: (href: string) => void) {
  const tradition = readDefaultTradition();
  if (tradition) {
    try {
      await fetch("/api/mv/auth/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_religion: tradition }),
      });
    } catch {
      // Keep going; the local copy still seeds Reflect.
    }
  }
  navigate("/reflect");
}
