"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { MOTION_COOKIE, THEME_COOKIE, type ThemePreference } from "./preferences";

const ONE_YEAR = 60 * 60 * 24 * 365;
const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1];
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  listeners.forEach((listener) => listener());
}

function readTheme(): ThemePreference {
  const value = readCookie(THEME_COOKIE);
  return value === "light" || value === "dark" ? value : "system";
}

function readGentleMotion(): boolean {
  return readCookie(MOTION_COOKIE) !== "reduced";
}

function applyTheme(preference: ThemePreference) {
  const resolved =
    preference === "system"
      ? window.matchMedia(DARK_QUERY).matches
        ? "dark"
        : "light"
      : preference;
  document.documentElement.setAttribute("data-theme", resolved);
}

/**
 * Read and change the theme and Gentle motion preferences. The server always
 * renders the defaults (system theme, gentle motion on); the stored values take
 * over straight after hydration.
 */
export function usePreferences() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as const);
  const gentleMotion = useSyncExternalStore(subscribe, readGentleMotion, () => true);

  const setTheme = useCallback((preference: ThemePreference) => {
    applyTheme(preference);
    writeCookie(THEME_COOKIE, preference);
  }, []);

  const setGentleMotion = useCallback((on: boolean) => {
    if (on) document.documentElement.removeAttribute("data-motion");
    else document.documentElement.setAttribute("data-motion", "reduced");
    writeCookie(MOTION_COOKIE, on ? "full" : "reduced");
  }, []);

  return { theme, setTheme, gentleMotion, setGentleMotion };
}

/** Follows the OS between light and dark while the preference is "system". */
export function PreferencesSync() {
  const { theme } = usePreferences();

  useEffect(() => {
    if (theme !== "system") return;
    const query = window.matchMedia(DARK_QUERY);
    const follow = () => applyTheme("system");
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, [theme]);

  return null;
}
