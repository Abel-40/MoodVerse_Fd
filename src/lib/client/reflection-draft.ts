"use client";

import { del, get, set } from "idb-keyval";

import type { Tradition } from "@/lib/scripture";

// The unsent reflection lives only in this browser's IndexedDB. It is never
// sent anywhere until the person chooses to find a passage.
const DRAFT_KEY = "draft:reflect";

// The reflection on its way to the finding screen. sessionStorage keeps it out
// of the URL and drops it when the tab closes.
const PENDING_KEY = "mv-pending-reflection";

export async function loadDraft(): Promise<string> {
  try {
    const value = await get<string>(DRAFT_KEY);
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

export async function saveDraft(text: string): Promise<void> {
  try {
    if (text.trim()) await set(DRAFT_KEY, text);
    else await del(DRAFT_KEY);
  } catch {
    // IndexedDB unavailable (private mode, blocked): the draft just isn't kept.
  }
}

/** Call once a passage has actually been found for the draft. */
export async function clearDraft(): Promise<void> {
  try {
    await del(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
}

export interface PendingReflection {
  text: string;
  tradition: Tradition;
}

export function stagePendingReflection(pending: PendingReflection) {
  window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

/** The staged reflection as stored, or "" when there is none. */
export function readPendingReflection(): string {
  try {
    return window.sessionStorage.getItem(PENDING_KEY) ?? "";
  } catch {
    return "";
  }
}

export function parsePendingReflection(raw: string): PendingReflection | null {
  try {
    const value = JSON.parse(raw) as Partial<PendingReflection>;
    return typeof value.text === "string" && (value.tradition === "bible" || value.tradition === "quran")
      ? { text: value.text, tradition: value.tradition }
      : null;
  } catch {
    return null;
  }
}

export function discardPendingReflection() {
  try {
    window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Nothing staged.
  }
}

/** At least about 4 words or 20 characters, as the matcher needs. */
export function isLongEnough(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length >= 20 || countWords(trimmed) >= 4;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * The opening of a reflection for a quiet preview (about `max` characters):
 * ends at a sentence when one finishes late enough, otherwise at a word.
 */
export function excerpt(text: string, max = 60): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  const head = trimmed.slice(0, max + 1);
  const sentenceEnd = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "));
  if (sentenceEnd >= max / 2) return `${head.slice(0, sentenceEnd)}…`;
  const wordEnd = head.lastIndexOf(" ");
  return `${(wordEnd > 0 ? head.slice(0, wordEnd) : trimmed.slice(0, max)).replace(/[,;:]$/, "")}…`;
}
