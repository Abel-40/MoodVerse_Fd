export type Tradition = "bible" | "quran";

/**
 * A passage exactly as the verified scripture store returns it. Nothing in the
 * app may write, shorten or rephrase `text` or `arabic`.
 */
export interface Passage {
  id: string;
  tradition: Tradition;
  /** As displayed, e.g. "Psalm 34:18" or "Surah Ash-Sharh · 94:5–6". */
  reference: string;
  /** Translation name, e.g. "King James Version" or "Pickthall". */
  translation: string;
  /** Short form for tight spaces, e.g. "KJV". Falls back to `translation`. */
  translationShort?: string;
  /** The English text. */
  text: string;
  /** The original Arabic; Quran passages only. */
  arabic: string | null;
}
