import { describe, expect, it } from "vitest";

import { analyticsPayload, scrubEvent } from "./telemetry";

const WORDS = "I feel so alone since I moved";

describe("scrubEvent", () => {
  it("drops request bodies, cookies, headers and anything named like text", () => {
    const event = {
      message: "Failed to fetch",
      request: { url: "/api/mv/api/v1/recommendations", method: "POST", data: { text: WORDS }, cookies: { "mv-at": "x" }, headers: { Cookie: "x" } },
      extra: { pending: { text: WORDS, tradition: "bible" }, attempts: 2 },
      contexts: { reflection: { text: WORDS } },
    };
    const scrubbed = scrubEvent(event);

    expect(JSON.stringify(scrubbed)).not.toContain(WORDS);
    expect(JSON.stringify(scrubbed)).not.toContain("mv-at");
    expect(scrubbed.request).toEqual({ url: "/api/mv/api/v1/recommendations", method: "POST" });
    expect(scrubbed.extra).toEqual({ pending: { tradition: "bible" }, attempts: 2 });
    expect(scrubbed.message).toBe("Failed to fetch");
  });

  it("drops console breadcrumbs and fetch bodies in the rest", () => {
    const scrubbed = scrubEvent({
      breadcrumbs: [
        { category: "console", message: WORDS },
        { category: "fetch", data: { url: "/api/mv/x", body: WORDS } },
        { category: "navigation", message: "/reflect" },
      ],
    });

    expect(JSON.stringify(scrubbed)).not.toContain(WORDS);
    expect(scrubbed.breadcrumbs.map((crumb) => crumb.category)).toEqual(["fetch", "navigation"]);
  });
});

describe("analyticsPayload", () => {
  it("carries only the counted value, never ids", () => {
    const sneaky = { name: "feedback_value", helped: false, passageId: "psalm-34-18", reflectionId: 9 } as const;
    expect(analyticsPayload(sneaky)).toEqual({ event: "feedback_value", value: "not_quite" });
    expect(analyticsPayload({ name: "reflection_tradition", tradition: "quran" })).toEqual({
      event: "reflection_tradition",
      tradition: "quran",
    });
    expect(analyticsPayload({ name: "share_background", background: "misty" })).toEqual({
      event: "share_background",
      background: "misty",
    });
  });
});
