import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

import { pngInfo, reflect, signIn } from "./support";

test.beforeEach(async ({ context }) => {
  await signIn(context);
});

/** The alpha channel's minimum, read back through a canvas. */
async function minAlpha(page: Page, png: Buffer) {
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let min = 255;
    for (let i = 3; i < data.length; i += 4) if (data[i] < min) min = data[i];
    return min;
  }, png.toString("base64"));
}

async function download(page: Page) {
  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /^Download/ }).click()]);
  return readFile((await file.path())!);
}

test("save → appears in /saved with the chosen background → unsave", async ({ page }) => {
  const id = await reflect(page);
  await page.getByRole("button", { name: "Save passage" }).click();
  await expect(page.getByRole("button", { name: "Saved" })).toHaveAttribute("aria-pressed", "true");

  // Choose a background in the share editor; the saved card follows it.
  await page.goto(`/r/${id}/share`);
  await page.getByRole("radio", { name: "Starry night" }).click();
  await expect(page.getByRole("radio", { name: "Starry night" })).toHaveAttribute("aria-checked", "true");

  await page.goto("/saved");
  const card = page.locator("ul[aria-label='Saved passages'] li").first();
  await expect(card.locator("img").first()).toHaveAttribute("src", /starry-night/);

  await card.getByRole("button", { name: "Remove from saved" }).click();
  await expect(page.getByText("Removed from saved")).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove from saved" })).toHaveCount(0);
  await expect(page.getByText("Passages you save from a result appear here.")).toBeVisible();
});

test("every background downloads a 1080 × 1920 PNG; transparent keeps its alpha", async ({ page }) => {
  test.setTimeout(180_000);
  const id = await reflect(page);
  await page.goto(`/r/${id}/share`);
  const tiles = page.getByRole("radiogroup", { name: /Background/ }).getByRole("radio");
  await expect(tiles).toHaveCount(12);
  const names = (await tiles.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label") ?? ""))).filter(
    (name) => name !== "Your photo",
  );
  expect(names).toHaveLength(11);

  for (const name of names) {
    await page.getByRole("radio", { name, exact: true }).click();
    const png = await download(page);
    const info = pngInfo(png);
    expect({ name, width: info.width, height: info.height }).toEqual({ name, width: 1080, height: 1920 });
    if (name === "Transparent PNG") {
      expect(info.colorType).toBe(6); // RGBA
      expect(await minAlpha(page, png)).toBe(0);
    }
  }
});

test("a photo background stays in the browser", async ({ page }) => {
  const id = await reflect(page);
  await page.goto(`/r/${id}/share`);
  const sent: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" || (request.postDataBuffer()?.length ?? 0) > 0) sent.push(`${request.method()} ${request.url()}`);
  });

  // A small JPEG made in the page, then given to the file input.
  const photo = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1600;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#6a8caf";
    context.fillRect(0, 0, 900, 1600);
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8));
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });
  await page.locator("input[type=file]").setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: Buffer.from(photo) });
  await expect(page.getByRole("radio", { name: "Your photo" })).toHaveAttribute("aria-checked", "true");

  const png = await download(page);
  expect(pngInfo(png)).toMatchObject({ width: 1080, height: 1920 });
  expect(sent).toEqual([]);
});
