import { describe, expect, it } from "vitest";

import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key));
}

describe("messages", () => {
  it("has every English key in Arabic, and nothing else", () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });
});
