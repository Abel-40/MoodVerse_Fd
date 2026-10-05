import { describe, expect, it } from "vitest";

import { toEmotions, toNeed, toReflection } from "./mapping";
import type { AnalysisDto, ReflectionDto } from "./types";

const analysis = (overrides: Partial<AnalysisDto> = {}): AnalysisDto => ({
  primary_emotion: "loneliness",
  secondary_emotions: ["doubt"],
  intensity: 2,
  intent: "comfort",
  themes: ["change"],
  crisis_signals: false,
  ...overrides,
});

const verse = (id: string) => ({
  canonical_id: id,
  religion: "bible" as const,
  reference: id,
  translation: "American King James Version",
  text: "text",
});

describe("toEmotions", () => {
  it("puts the primary emotion first and caps at three", () => {
    expect(toEmotions(analysis({ secondary_emotions: ["doubt", "fear", "grief"] }))).toEqual([
      "loneliness",
      "doubt",
      "fear",
    ]);
  });

  it("uses the kit's word for the backend's terms and drops unknown ones", () => {
    expect(toEmotions(analysis({ primary_emotion: "exhaustion", secondary_emotions: ["boredom", "anxiety"] }))).toEqual([
      "weariness",
      "anxiety",
    ]);
  });

  it("doesn't repeat an emotion", () => {
    expect(toEmotions(analysis({ secondary_emotions: ["loneliness"] }))).toEqual(["loneliness"]);
  });

  it("is empty before analysis", () => {
    expect(toEmotions(null)).toEqual([]);
  });
});

describe("toNeed", () => {
  it.each([
    ["comfort", "comfort"],
    ["assurance", "reassurance"],
    ["peace", "calm"],
    ["guidance", "direction"],
    ["praise", "thanks"],
    ["lament", "support"],
  ])("maps %s to %s", (intent, need) => {
    expect(toNeed(analysis({ intent }))).toBe(need);
  });

  it("is null for an intent outside the vocabulary", () => {
    expect(toNeed(analysis({ intent: "something-new" }))).toBeNull();
  });
});

describe("toReflection", () => {
  const dto: ReflectionDto = {
    id: 7,
    created_at: "2026-10-01T08:00:00Z",
    text: "words",
    religion: "bible",
    status: "completed",
    error: null,
    analysis: analysis({ crisis_signals: true }),
    results: [
      { verse: verse("second"), rank: 2, similarity: null, final_score: null, served_with_context: false },
      { verse: verse("first"), rank: 1, similarity: null, final_score: null, served_with_context: false },
    ],
  };

  it("orders passages by rank", () => {
    expect(toReflection(dto).passages.map((passage) => passage.id)).toEqual(["first", "second"]);
  });

  it("carries the support flag alongside the passage", () => {
    const reflection = toReflection(dto);
    expect(reflection.support).toBe(true);
    expect(reflection.passages).toHaveLength(2);
  });

  it("has no why until the server sends one", () => {
    expect(toReflection(dto).why).toBeNull();
    expect(toReflection({ ...dto, why: "  A note.  " }).why).toBe("A note.");
  });
});
