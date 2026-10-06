import { createHash } from "node:crypto";
import { expect, type BrowserContext, type Page } from "@playwright/test";

import { SAMPLE_PASSAGES, SAMPLE_REFLECTION, SAMPLE_WHY } from "../src/lib/fixtures";

export { SAMPLE_PASSAGES, SAMPLE_REFLECTION, SAMPLE_WHY };

// SHA-256 of the brief's exact scripture (as in src/lib/fixtures.test.ts):
// what the passage store holds, so what the screen must show.
export const BRIEF_SHA256 = {
  kjv: "a3c908d84e8f64793366924209832e0d2f38346d5f5e1f37efb2fa329a35783b",
  arabic: "cc1dde01eed2d0eb8c33d8a45451377c40b0ebf1a98c64d036efc7325e955050",
  pickthall: "49d54902e5425da73f924185318a26973bf42120cdf44f52749b1c00fb5de1ce",
};

export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

const ORIGIN = "http://127.0.0.1:3200";

/** A signed-in session. The tokens are placeholders: the API is mocked. */
export async function signIn(context: BrowserContext) {
  await context.addCookies(
    ["mv-at", "mv-rt"].map((name) => ({ name, value: "e2e", url: ORIGIN, httpOnly: true, sameSite: "Lax" as const })),
  );
}

export type TraditionName = "Holy Bible" | "Holy Quran";

/** Open Reflect and wait until the mocked API is answering. */
export async function openReflect(page: Page) {
  await page.goto("/reflect");
  await page.waitForFunction(() => !!window.__msw);
}

/** Write a reflection on /reflect and wait for its result. */
export async function reflect(page: Page, text = SAMPLE_REFLECTION, tradition: TraditionName = "Holy Bible") {
  await openReflect(page);
  return submitReflection(page, text, tradition);
}

/** Submit from an already open Reflect screen (keeps any mock overrides). */
export async function submitReflection(page: Page, text = SAMPLE_REFLECTION, tradition: TraditionName = "Holy Bible") {
  await page.getByRole("textbox", { name: "Your reflection" }).fill(text);
  await page.getByRole("radio", { name: tradition }).click();
  await page.getByRole("button", { name: "Find a passage" }).click();
  await page.waitForURL(/\/r\/\d+$/);
  await expect(page.getByRole("article")).toBeVisible();
  return Number(new URL(page.url()).pathname.split("/").pop());
}

/** Text of an element exactly as rendered, without the typographic quotes some views add. */
export async function shownText(page: Page, selector: string) {
  return (await page.locator(selector).first().innerText()).trim();
}

/** Width, height and colour type from a PNG's IHDR chunk. */
export function pngInfo(png: Buffer) {
  expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20), colorType: png[25] };
}
