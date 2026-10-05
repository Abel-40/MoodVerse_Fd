import { describe, expect, it } from "vitest";

import { countWords, excerpt, isLongEnough } from "./reflection-draft";

describe("isLongEnough", () => {
  it.each([
    ["", false],
    ["sad", false],
    ["so very sad", false],
    ["I feel so alone", true],
    ["overwhelmedandexhausted", true],
    ["   tired   ", false],
  ])("%j -> %s", (text, expected) => {
    expect(isLongEnough(text)).toBe(expected);
  });
});

describe("countWords", () => {
  it("counts words separated by any whitespace", () => {
    expect(countWords("  I moved\nto a  new city ")).toBe(6);
    expect(countWords("   ")).toBe(0);
  });
});

describe("excerpt", () => {
  it("ends at the first sentence when it finishes late enough", () => {
    expect(
      excerpt("I moved to a new city for work and I feel so alone. I keep wondering if I made the wrong choice."),
    ).toBe("I moved to a new city for work and I feel so alone…");
  });

  it("otherwise ends at a word, never mid-word", () => {
    expect(excerpt("Some days the quiet in this apartment is louder than anything else I can remember")).toBe(
      "Some days the quiet in this apartment is louder than…",
    );
  });

  it("leaves short text alone", () => {
    expect(excerpt("  I feel tired  ")).toBe("I feel tired");
  });
});
