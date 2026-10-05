import { describe, expect, it } from "vitest";

import { countWords, isLongEnough } from "./reflection-draft";

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
