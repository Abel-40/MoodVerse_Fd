import type { Passage, Tradition } from "./scripture";

/**
 * The only scripture allowed in fixtures and mocks (design-kit/docs/
 * PRODUCT-BRIEF.md). Do not add other passages here.
 */
export const SAMPLE_PASSAGES: Record<Tradition, Passage> = {
  bible: {
    id: "psa_34_18_kjv",
    tradition: "bible",
    reference: "Psalm 34:18",
    translation: "King James Version",
    translationShort: "KJV",
    text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.",
    arabic: null,
  },
  quran: {
    id: "quran_94_5-6_pickthall",
    tradition: "quran",
    reference: "Surah Ash-Sharh · 94:5–6",
    translation: "Pickthall",
    text: "But lo! with hardship goeth ease, lo! with hardship goeth ease.",
    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾",
  },
};

export const SAMPLE_REFLECTION =
  "I moved to a new city for work and I feel so alone. I keep wondering if I made the wrong choice.";
