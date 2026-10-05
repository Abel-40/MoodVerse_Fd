import type { Passage } from "@/lib/scripture";

import type { AnalysisDto, Emotion, Need, Reflection, ReflectionDto, VerseDto } from "./types";

// The backend's analysis vocabulary, mapped onto the kit's. Anything not
// listed is left off rather than shown under a guessed label.
const EMOTIONS: Record<string, Emotion> = {
  anger: "anger",
  anxiety: "anxiety",
  awe: "awe",
  confusion: "confusion",
  despair: "despair",
  doubt: "doubt",
  exhaustion: "weariness",
  fear: "fear",
  gratitude: "gratitude",
  grief: "grief",
  guilt: "guilt",
  hope: "hope",
  joy: "joy",
  loneliness: "loneliness",
  peace: "peace",
  sadness: "sadness",
  shame: "shame",
};

const NEEDS: Record<string, Need> = {
  comfort: "comfort",
  assurance: "reassurance",
  encouragement: "reassurance",
  hope: "reassurance",
  peace: "calm",
  strength: "strength",
  perseverance: "strength",
  patience: "strength",
  forgiveness: "forgiveness",
  repentance: "forgiveness",
  guidance: "direction",
  instruction: "direction",
  wisdom: "direction",
  warning: "direction",
  gratitude: "thanks",
  praise: "thanks",
  lament: "support",
};

export function toPassage(verse: VerseDto): Passage {
  return {
    id: verse.canonical_id,
    tradition: verse.religion,
    reference: verse.reference,
    translation: verse.translation,
    text: verse.text,
    arabic: verse.arabic ?? null,
  };
}

/** Primary emotion first, then the rest; known labels only, no repeats, at most three. */
export function toEmotions(analysis: AnalysisDto | null): Emotion[] {
  if (!analysis) return [];
  const mapped = [analysis.primary_emotion, ...analysis.secondary_emotions]
    .map((emotion) => EMOTIONS[emotion])
    .filter((emotion): emotion is Emotion => emotion !== undefined);
  return Array.from(new Set(mapped)).slice(0, 3);
}

export function toNeed(analysis: AnalysisDto | null): Need | null {
  return (analysis && NEEDS[analysis.intent]) ?? null;
}

export function toReflection(dto: ReflectionDto): Reflection {
  return {
    id: dto.id,
    createdAt: dto.created_at,
    text: dto.text,
    tradition: dto.religion,
    status: dto.status,
    passages: [...dto.results].sort((a, b) => a.rank - b.rank).map((result) => toPassage(result.verse)),
    emotions: toEmotions(dto.analysis),
    need: toNeed(dto.analysis),
    support: dto.analysis?.crisis_signals ?? false,
    why: dto.why?.trim() || null,
  };
}
