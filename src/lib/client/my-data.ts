"use client";

import { clear } from "idb-keyval";

import { apiFetch } from "@/lib/api/client";
import type { HistoryDto } from "@/lib/api/types";
import { MOTION_COOKIE, TEXT_COOKIE, THEME_COOKIE } from "@/lib/preferences";

import { listSaved } from "./saved-store";

// Everything MoodVerse keeps in this browser starts with this prefix.
const LOCAL_PREFIX = "mv-";

function localEntries(): Record<string, string> {
  const entries: Record<string, string> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(LOCAL_PREFIX)) entries[key] = window.localStorage.getItem(key) ?? "";
    }
  } catch {
    // Storage blocked: nothing to include.
  }
  return entries;
}

/** All of a person's data as JSON: reflections from the account, plus what this browser holds. */
export async function exportMyData(signedIn: boolean): Promise<Blob> {
  const reflections: HistoryDto["items"] = [];
  if (signedIn) {
    for (let offset = 0; ; offset += 100) {
      const page = await apiFetch<HistoryDto>(`api/v1/reflections/history?limit=100&offset=${offset}`);
      reflections.push(...page.items);
      if (page.items.length < page.limit) break;
    }
  }

  const data = {
    exportedAt: new Date().toISOString(),
    reflections: reflections.map((item) => ({
      id: item.id,
      createdAt: item.created_at,
      text: item.text,
      tradition: item.religion,
      status: item.status,
      analysis: item.analysis,
      passages: item.results.map((result) => result.verse),
    })),
    saved: await listSaved(),
    browser: localEntries(),
  };
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
}

export function exportFileName(): string {
  return `moodverse-export-${new Date().toISOString().slice(0, 10)}.json`;
}

/**
 * Remove everything this browser holds, then ask the backend to delete the
 * account's data. "localOnly" means the backend couldn't (it has no delete
 * route yet), so the person can be told honestly.
 */
export async function deleteMyData(signedIn: boolean): Promise<"all" | "localOnly"> {
  try {
    await clear();
  } catch {
    // IndexedDB unavailable: nothing stored there.
  }
  try {
    for (const key of Object.keys(localEntries())) window.localStorage.removeItem(key);
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith(LOCAL_PREFIX)) window.sessionStorage.removeItem(key);
    }
  } catch {
    // Storage blocked: nothing stored there either.
  }
  for (const cookie of [THEME_COOKIE, MOTION_COOKIE, TEXT_COOKIE]) {
    document.cookie = `${cookie}=; path=/; max-age=0`;
  }

  if (!signedIn) return "all";
  try {
    await apiFetch("auth/me", { method: "DELETE" });
    return "all";
  } catch {
    return "localOnly";
  }
}
