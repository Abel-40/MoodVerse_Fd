import type messages from "../../../messages/en.json";

import type { Passage, Tradition } from "@/lib/scripture";

/* ---- What the FastAPI backend sends (through the /api/mv proxy) ---------- */

export interface VerseDto {
  canonical_id: string;
  religion: Tradition;
  reference: string;
  translation: string;
  text: string;
  /** Not in the backend's store yet; set by the mock layer for Quran samples. */
  arabic?: string | null;
}

export interface AnalysisDto {
  primary_emotion: string;
  secondary_emotions: string[];
  intensity: number;
  intent: string;
  themes: string[];
  crisis_signals: boolean;
}

export type ReflectionStatus = "pending" | "processing" | "completed" | "failed";

export interface ReflectionDto {
  id: number;
  created_at: string;
  /** Null only while a voice reflection waits for transcription. */
  text: string | null;
  religion: Tradition;
  status: ReflectionStatus;
  error: string | null;
  analysis: AnalysisDto | null;
  results: Array<{
    verse: VerseDto;
    rank: number;
    similarity: number | null;
    final_score: number | null;
    served_with_context: boolean;
  }>;
  /** A server-written "Why this passage" note. The current backend doesn't send one. */
  why?: string | null;
}

export interface HistoryDto {
  items: ReflectionDto[];
  limit: number;
  offset: number;
}

export interface SubmitDto {
  reflection_id: number;
  status: "pending";
}

export interface UserDto {
  id: number;
  email: string;
  display_name: string | null;
  email_verified: boolean;
  preferred_religion: Tradition | null;
}

/* ---- What the screens work with ------------------------------------------ */

export type Emotion = keyof (typeof messages)["emotions"];
export type Need = keyof (typeof messages)["needs"];
export type FeedbackReason = "didnt_fit" | "hard_to_understand" | "other";

export interface Reflection {
  id: number;
  createdAt: string;
  /** The person's own words. Show only to them; never log or share. */
  text: string | null;
  tradition: Tradition;
  status: ReflectionStatus;
  /** Ranked best first. The first is shown; the rest power "Show another". */
  passages: Passage[];
  /** Up to three, most prominent first. */
  emotions: Emotion[];
  need: Need | null;
  /** Show the support card alongside the passage. */
  support: boolean;
  /** Server-written note when present; otherwise the screen uses the reviewed template. */
  why: string | null;
}
