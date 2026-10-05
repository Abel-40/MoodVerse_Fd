"use client";

import { get, set } from "idb-keyval";

import type { ShareBackground } from "@/components/mv/ShareCard";
import type { Passage } from "@/lib/scripture";

// The backend has no saved-passages endpoint yet, so saved cards live in this
// browser for everyone. They don't sync across devices.
const SAVED_KEY = "saved:passages";

export interface SavedItem {
  passage: Passage;
  /** The share-card background last chosen for it. */
  background: ShareBackground;
  reflectionId: number | null;
  savedAt: string;
}

export async function listSaved(): Promise<SavedItem[]> {
  try {
    return (await get<SavedItem[]>(SAVED_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function writeSaved(items: SavedItem[]) {
  await set(SAVED_KEY, items);
  return items;
}

/** Save the passage, or unsave it if it's already saved. Newest first. */
export async function toggleSaved(item: Omit<SavedItem, "savedAt">): Promise<SavedItem[]> {
  const items = await listSaved();
  const existing = items.some((saved) => saved.passage.id === item.passage.id);
  return writeSaved(
    existing
      ? items.filter((saved) => saved.passage.id !== item.passage.id)
      : [{ ...item, savedAt: new Date().toISOString() }, ...items],
  );
}

/** Remember a new share-card background for a saved passage. */
export async function updateSavedBackground(passageId: string, background: ShareBackground): Promise<SavedItem[]> {
  const items = await listSaved();
  return writeSaved(items.map((saved) => (saved.passage.id === passageId ? { ...saved, background } : saved)));
}
