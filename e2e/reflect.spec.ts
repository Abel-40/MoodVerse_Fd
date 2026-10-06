import { expect, test } from "@playwright/test";

import { SAMPLE_PASSAGES, SAMPLE_REFLECTION, SAMPLE_WHY, openReflect, reflect, signIn, submitReflection } from "./support";

test("landing → browser → welcome (3 steps) → guest → reflect → finding", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Or reflect in your browser" }).first().click();
  await page.waitForURL("**/welcome");

  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page.getByRole("heading", { name: "What MoodVerse is, and what it isn’t" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Where would you like to begin?" })).toBeVisible();
  await page.getByRole("radio", { name: /Holy Quran/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/sign-in");

  await page.getByRole("button", { name: "Continue as guest" }).click();
  await page.waitForURL("**/reflect");
  // The tradition picked during onboarding is the default.
  await expect(page.getByRole("radio", { name: "Holy Quran" })).toHaveAttribute("aria-checked", "true");

  await page.getByRole("textbox", { name: "Your reflection" }).fill(SAMPLE_REFLECTION);
  await page.getByRole("button", { name: "Find a passage" }).click();
  await page.waitForURL("**/reflect/finding");
  // The API matches only signed-in people for now, so guests are asked to
  // sign in here, with their words kept (see the notes in CLAUDE.md).
  await expect(page.getByRole("heading", { name: "Sign in to find a passage" })).toBeVisible();
  await page.getByRole("link", { name: "Back to my reflection" }).click();
  await expect(page.getByRole("textbox", { name: "Your reflection" })).toHaveValue(SAMPLE_REFLECTION);
});

test.describe("signed in", () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context);
  });

  test("reflect → finding → result", async ({ page }) => {
    await page.goto("/reflect");
    await page.getByRole("textbox", { name: "Your reflection" }).fill(SAMPLE_REFLECTION);
    await page.getByRole("button", { name: "Find a passage" }).click();
    await expect(page.getByRole("status").getByRole("heading", { name: "Finding a passage" })).toBeVisible();
    await page.waitForURL(/\/r\/\d+$/);
    await expect(page.getByRole("article")).toBeVisible();
  });

  for (const [tradition, key] of [
    ["Holy Bible", "bible"],
    ["Holy Quran", "quran"],
  ] as const) {
    test(`the sample reflection with ${tradition} gives the brief's passage and "why"`, async ({ page }) => {
      await reflect(page, SAMPLE_REFLECTION, tradition);
      const passage = SAMPLE_PASSAGES[key];
      await expect(page.getByRole("article")).toHaveAccessibleName(new RegExp(passage.reference));
      await expect(page.locator("[role=article] [lang=en]")).toHaveText(passage.text);
      await expect(page.getByText(SAMPLE_WHY[key], { exact: true })).toBeVisible();
    });
  }

  test("show another walks the ranked passages", async ({ page }) => {
    // The mock ranks one passage per reflection (the brief allows only two),
    // so rank a second one here: the other sample, purely to test the walk.
    await openReflect(page);
    await page.evaluate(
      ({ passages, text, why }) => {
        const { worker, http, HttpResponse } = window.__msw!;
        worker.use(
          http.get("/api/mv/api/v1/reflections/:id", ({ params }) => {
            if (params.id === "history") return undefined;
            return HttpResponse.json({
              id: Number(params.id),
              created_at: new Date().toISOString(),
              text,
              religion: "bible",
              status: "completed",
              error: null,
              analysis: { primary_emotion: "loneliness", secondary_emotions: ["doubt"], intensity: 2, intent: "comfort", themes: [], crisis_signals: false },
              results: passages.map((p, index) => ({
                verse: { canonical_id: p.id, religion: p.tradition, reference: p.reference, translation: p.translation, text: p.text, arabic: p.arabic },
                rank: index + 1,
                similarity: 0.8,
                final_score: 0.9,
                served_with_context: false,
              })),
              why,
            });
          }),
        );
      },
      { passages: [SAMPLE_PASSAGES.bible, SAMPLE_PASSAGES.quran], text: SAMPLE_REFLECTION, why: SAMPLE_WHY.bible },
    );
    await submitReflection(page);
    await expect(page.locator("[role=article] [lang=en]")).toHaveText(SAMPLE_PASSAGES.bible.text);
    await page.getByRole("button", { name: "Show another" }).click();
    await expect(page.locator("[role=article] [lang=en]")).toHaveText(SAMPLE_PASSAGES.quran.text);
    // The end of the list: nothing further to show.
    await expect(page.getByRole("button", { name: "Show another" })).toHaveAttribute("aria-disabled", "true");
  });

  test("show another is unavailable when only one passage was ranked", async ({ page }) => {
    await reflect(page);
    await expect(page.getByRole("button", { name: "Show another" })).toHaveAttribute("aria-disabled", "true");
  });

  test('feedback "Not quite" → reason → thank-you', async ({ page }) => {
    const id = await reflect(page);
    const sent = page.waitForRequest(
      (request) => request.url().endsWith(`/api/v1/reflections/${id}/feedback`) && request.method() === "POST",
    );
    await page.getByRole("button", { name: "Not quite" }).click();
    await page.getByRole("button", { name: "Hard to understand" }).click();
    const body = (await sent).postDataJSON();
    expect(body).toMatchObject({ canonical_id: SAMPLE_PASSAGES.bible.id, helpful: false });
    await expect(page.getByText("Thank you for telling us.")).toBeVisible();
  });

  test("offline: the button waits, the draft is kept, nothing submits by itself", async ({ page, context }) => {
    await page.goto("/reflect");
    const field = page.getByRole("textbox", { name: "Your reflection" });
    await expect(field).toBeVisible();
    await context.setOffline(true);
    await expect(page.getByText("You’re offline")).toBeVisible();

    const posts: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST") posts.push(request.url());
    });
    await field.fill(SAMPLE_REFLECTION);
    const waiting = page.getByRole("button", { name: "Waiting for a connection" });
    await expect(waiting).toHaveAttribute("aria-disabled", "true");
    // Pressing it, or the keyboard shortcut, does nothing while offline.
    await waiting.click({ force: true });
    await field.press("Control+Enter");
    await expect(page.locator(".mv-field").getByText("Saved in this browser")).toBeVisible();

    await context.setOffline(false);
    await expect(page.getByRole("button", { name: "Find a passage" })).toBeVisible();
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/\/reflect$/);
    expect(posts).toEqual([]);

    // The words survive a reload.
    await page.reload();
    await expect(page.getByRole("textbox", { name: "Your reflection" })).toHaveValue(SAMPLE_REFLECTION);
  });
});
