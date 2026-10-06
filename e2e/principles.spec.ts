import { expect, test, type Page } from "@playwright/test";

import { BRIEF_SHA256, SAMPLE_PASSAGES, SAMPLE_REFLECTION, reflect, sha256, signIn } from "./support";

test.beforeEach(async ({ context }) => {
  await signIn(context);
});

/** The English and (for the Quran) Arabic text inside `scope`, exactly as in the DOM. */
async function scripture(page: Page, scope: string) {
  const english = await page.locator(`${scope} [lang=en]`).first().textContent();
  const arabic = await page.locator(`${scope} [lang=ar]`).first().textContent({ timeout: 1000 }).catch(() => null);
  return { english: english ?? "", arabic };
}

test.describe("every passage shown matches the stored text, character for character", () => {
  test("Bible: result, history detail, saved and share card", async ({ page }) => {
    const id = await reflect(page, SAMPLE_REFLECTION, "Holy Bible");
    const expectBible = async (scope: string) => {
      const { english } = await scripture(page, scope);
      expect(english).toBe(SAMPLE_PASSAGES.bible.text);
      expect(sha256(english)).toBe(BRIEF_SHA256.kjv);
    };

    await expectBible("[role=article]");
    await page.getByRole("button", { name: "Save passage" }).click();
    await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

    await page.goto(`/history/${id}`);
    await expectBible("section[aria-label='Selected reflection'] figure");

    await page.goto("/saved");
    await expectBible("ul[aria-label='Saved passages'] [role=img]");

    await page.goto(`/r/${id}/share`);
    await expectBible("main [role=img]");
  });

  test("Quran: Arabic and Pickthall on the result and share card", async ({ page }) => {
    const id = await reflect(page, SAMPLE_REFLECTION, "Holy Quran");
    for (const scope of ["[role=article]", `main [role=img]`]) {
      if (scope !== "[role=article]") await page.goto(`/r/${id}/share`);
      const { english, arabic } = await scripture(page, scope);
      expect(sha256(english)).toBe(BRIEF_SHA256.pickthall);
      expect(sha256(arabic ?? "")).toBe(BRIEF_SHA256.arabic);
    }
  });
});

test("reference and translation are visible wherever a passage is", async ({ page }) => {
  const { reference, translation } = SAMPLE_PASSAGES.bible;
  const id = await reflect(page);
  const expectAttribution = async (scope: string) => {
    await expect(page.locator(scope).getByText(reference, { exact: true }).first()).toBeVisible();
    await expect(page.locator(scope).getByText(translation, { exact: true }).first()).toBeVisible();
  };

  await expectAttribution("[role=article]");
  await page.getByRole("button", { name: "Save passage" }).click();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
  await page.goto(`/history/${id}`);
  await expectAttribution("section[aria-label='Selected reflection'] figure");
  await page.goto("/saved");
  await expectAttribution("ul[aria-label='Saved passages'] li");

  await page.goto(`/r/${id}/share`);
  const card = page.locator("main [role=img]").first();
  await expect(card.getByText(reference, { exact: true })).toBeVisible();
  await expect(card.getByText(translation, { exact: true })).toBeVisible();
  // Turning attribution off is the one case where they may go.
  await page.getByRole("switch", { name: "Show reference & translation" }).click();
  await expect(card.getByText(reference, { exact: true })).toHaveCount(0);
});

test("reflection text never leaves its own request or reaches the URL, logs or the share card", async ({ page }) => {
  const marker = "Kestrelmarker";
  const words = `I moved to a new city and I feel so alone. ${marker} I keep wondering if I made the wrong choice.`;
  const urls: string[] = [];
  const bodies: Array<{ url: string; body: string }> = [];
  const logs: string[] = [];
  const beacons: string[] = [];

  await page.addInitScript(() => {
    // Analytics go through sendBeacon; record anything that would be sent.
    const original = navigator.sendBeacon?.bind(navigator);
    (window as unknown as { __beacons: string[] }).__beacons = [];
    navigator.sendBeacon = (url, data) => {
      (window as unknown as { __beacons: string[] }).__beacons.push(`${url} ${String(data)}`);
      return original ? original(url, data) : true;
    };
  });
  page.on("request", (request) => {
    urls.push(request.url());
    const body = request.postData();
    if (body) bodies.push({ url: request.url(), body });
  });
  page.on("framenavigated", (frame) => urls.push(frame.url()));
  page.on("console", (message) => logs.push(message.text()));

  const id = await reflect(page, words);
  await page.getByRole("button", { name: "Not quite" }).click();
  await page.getByRole("button", { name: "Didn’t fit how I feel" }).click();
  await page.goto(`/r/${id}/share`);
  const cardHtml = await page.locator("main [role=img]").first().evaluate((node) => node.outerHTML);
  beacons.push(...(await page.evaluate(() => (window as unknown as { __beacons: string[] }).__beacons)));
  await page.goto(`/history/${id}`);

  expect(urls.filter((url) => decodeURIComponent(url).includes(marker))).toEqual([]);
  // Only the submission itself carries the words.
  expect(bodies.filter(({ body }) => body.includes(marker)).map(({ url }) => new URL(url).pathname)).toEqual([
    "/api/mv/api/v1/recommendations",
  ]);
  expect(cardHtml).not.toContain(marker);
  expect(logs.filter((line) => line.includes(marker))).toEqual([]);
  expect(beacons.filter((line) => line.includes(marker))).toEqual([]);
});

test("the support card appears alongside the passage, never instead of it", async ({ page }) => {
  await reflect(page, "Everything is too heavy and some nights I don't want to live anymore. I feel so alone.");
  await expect(page.getByRole("article")).toBeVisible();
  await expect(page.locator("[role=article] [lang=en]")).toHaveText(SAMPLE_PASSAGES.bible.text);
  await expect(page.getByRole("heading", { name: "You don’t have to carry this alone" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Find support near you/ })).toBeVisible();
});
