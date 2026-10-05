import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { SAMPLE_PASSAGES } from "./fixtures";

// SHA-256 of the exact text in design-kit/docs/PRODUCT-BRIEF.md. If one of
// these fails, a fixture's scripture was edited: restore it, don't update the hash.
const BRIEF_SHA256 = {
  kjv: "a3c908d84e8f64793366924209832e0d2f38346d5f5e1f37efb2fa329a35783b",
  arabic: "cc1dde01eed2d0eb8c33d8a45451377c40b0ebf1a98c64d036efc7325e955050",
  pickthall: "49d54902e5425da73f924185318a26973bf42120cdf44f52749b1c00fb5de1ce",
};

const sha256 = (text: string | null) => createHash("sha256").update(text ?? "").digest("hex");

describe("scripture fixtures", () => {
  it("match the brief's Psalm 34:18 (KJV) exactly", () => {
    expect(sha256(SAMPLE_PASSAGES.bible.text)).toBe(BRIEF_SHA256.kjv);
  });

  it("match the brief's Ash-Sharh 94:5–6, Arabic and Pickthall, exactly", () => {
    expect(sha256(SAMPLE_PASSAGES.quran.arabic)).toBe(BRIEF_SHA256.arabic);
    expect(sha256(SAMPLE_PASSAGES.quran.text)).toBe(BRIEF_SHA256.pickthall);
  });
});
