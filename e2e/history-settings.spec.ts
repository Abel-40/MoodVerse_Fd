import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

import { SAMPLE_REFLECTION, reflect, signIn } from "./support";

test.beforeEach(async ({ context }) => {
  await signIn(context);
});

const rows = "ol[aria-label='Past reflections'] > li";

test("history: search, filters, and delete with confirmation", async ({ page }) => {
  await reflect(page, SAMPLE_REFLECTION, "Holy Bible");
  await reflect(page, "Exams start next week and I can’t sleep. Everything feels like too much at once.", "Holy Quran");
  await page.goto("/history");
  await expect(page.locator(rows)).toHaveCount(2);

  await page.getByRole("radio", { name: "Holy Quran" }).click();
  await expect(page.locator(rows)).toHaveCount(1);
  await page.getByRole("radio", { name: "All" }).click();

  await page.getByRole("searchbox", { name: "Search reflections" }).fill("city");
  await expect(page.locator(rows)).toHaveCount(1);
  await page.getByRole("searchbox", { name: "Search reflections" }).fill("");

  await page.getByRole("button", { name: "Grief" }).click();
  await expect(page.getByText("No reflections match these filters.")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(rows)).toHaveCount(2);

  // Cancel keeps it.
  await page.locator(rows).first().getByRole("button", { name: "Delete this reflection" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this reflection?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(rows)).toHaveCount(2);

  // The backend has no delete route yet (405): say so and keep the row.
  await page.locator(rows).first().getByRole("button", { name: "Delete this reflection" }).click();
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Deleting isn’t available yet, so your reflection is still saved.")).toBeVisible();
  await expect(page.locator(rows)).toHaveCount(2);

  // Once it exists, a confirmed delete removes the row.
  await page.evaluate(() => {
    window.__msw!.options.deleteSupported = true;
  });
  await page.locator(rows).first().getByRole("button", { name: "Delete this reflection" }).click();
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Reflection deleted")).toBeVisible();
  await expect(page.locator(rows)).toHaveCount(1);
});

test("settings: theme, motion, tradition, translations, text size, export, delete", async ({ page }) => {
  await reflect(page);
  await page.goto("/settings");
  const html = page.locator("html");

  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("radio", { name: "Light" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");

  await page.getByRole("switch", { name: "Gentle motion" }).click();
  await expect(html).toHaveAttribute("data-motion", "reduced");
  await page.getByRole("switch", { name: "Gentle motion" }).click();
  await expect(html).not.toHaveAttribute("data-motion", "reduced");

  const saved = page.waitForRequest((request) => request.url().endsWith("/auth/me/preferences") && request.method() === "PATCH");
  await page.getByRole("radiogroup", { name: "Default tradition" }).getByRole("radio", { name: "Holy Quran" }).click();
  expect((await saved).postDataJSON()).toEqual({ preferred_religion: "quran" });

  const bible = page.getByRole("combobox", { name: "Bible translation" });
  const options = await bible.locator("option").allTextContents();
  await bible.selectOption({ label: options[options.length - 1] });
  await page.getByRole("slider", { name: "Text size" }).press("ArrowRight");
  const scale = await html.evaluate((node) => node.style.getPropertyValue("--mv-text-scale"));
  expect(Number(scale)).toBeGreaterThan(1);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Bible translation" })).toHaveValue(await bible.inputValue());
  expect(await html.evaluate((node) => node.style.getPropertyValue("--mv-text-scale"))).toBe(scale);

  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export" }).click()]);
  expect(file.suggestedFilename()).toMatch(/^moodverse-.*\.json$/);
  const data = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(JSON.stringify(data)).toContain(SAMPLE_REFLECTION);
  expect(JSON.stringify(data)).not.toMatch(/mv-at|mv-rt|access_token|refresh_token/);

  await page.getByRole("button", { name: "Delete…" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete your data?" });
  const confirm = dialog.getByRole("button", { name: "Delete my data" });
  await expect(confirm).toHaveAttribute("aria-disabled", "true");
  await dialog.getByRole("textbox").fill("delete");
  await confirm.click();
  await expect(page.getByText(/Your data in this browser has been deleted/)).toBeVisible();
});
