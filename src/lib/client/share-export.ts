"use client";

import { domToBlob } from "modern-screenshot";

import { SHARE_BACKGROUNDS, type ShareBackground } from "@/components/mv/ShareCard";

/**
 * Rasterise a 360 × 640 share card at 3× into a 1080 × 1920 PNG. Nothing in
 * the node may paint a background behind a transparent card, or the PNG loses
 * its alpha.
 */
export async function renderCardPng(node: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  await Promise.all(
    Array.from(node.querySelectorAll("img"), (img) => (img.complete ? Promise.resolve() : img.decode().catch(() => {}))),
  );
  const blob = await domToBlob(node, { scale: 3, type: "image/png", width: 360, height: 640 });
  if (!blob) throw new Error("export failed");
  return blob;
}

/** "Psalm 34:18" becomes moodverse-psalm-34-18.png. */
export function cardFileName(reference: string): string {
  const slug = reference
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `moodverse-${slug || "passage"}.png`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The system share sheet when it can take files; otherwise a download. */
export async function shareBlob(blob: Blob, fileName: string, title: string): Promise<"shared" | "downloaded"> {
  const file = new File([blob], fileName, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title });
    return "shared";
  }
  downloadBlob(blob, fileName);
  return "downloaded";
}

/** Copy as an image. The promise form keeps Safari's user-gesture window open. */
export async function copyBlob(blob: Promise<Blob>) {
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

// The last background someone chose, preselected next time.
const LAST_BACKGROUND_KEY = "mv-share-background";

export function readLastBackground(): ShareBackground | null {
  try {
    const value = window.localStorage.getItem(LAST_BACKGROUND_KEY);
    // A photo can't be restored (it was never stored), so it isn't remembered.
    return SHARE_BACKGROUNDS.includes(value as ShareBackground) && value !== "photo" ? (value as ShareBackground) : null;
  } catch {
    return null;
  }
}

export function rememberBackground(background: ShareBackground) {
  if (background === "photo") return;
  try {
    window.localStorage.setItem(LAST_BACKGROUND_KEY, background);
  } catch {
    // Not remembered; the default comes back next time.
  }
}
