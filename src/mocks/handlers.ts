import { http, HttpResponse } from "msw";

import type { ReflectionDto, SubmitDto, UserDto } from "@/lib/api/types";
import { SAMPLE_PASSAGES, SAMPLE_WHY } from "@/lib/fixtures";
import type { Tradition } from "@/lib/scripture";

/*
 * Dev-only stand-ins for the backend, answering the same /api/mv paths the
 * app calls. Only the brief's two sample passages are ever returned.
 */

interface MockReflection {
  id: number;
  text: string;
  religion: Tradition;
  createdAt: string;
  polls: number;
}

const reflections = new Map<number, MockReflection>();
let nextId = 9001;

// Words that make the mock flag a reflection for the support card.
const CRISIS_WORDS = /hurt myself|end it|kill myself|don't want to live/i;

function toDto(reflection: MockReflection): ReflectionDto {
  // The first poll says "processing", like the real background worker.
  const done = reflection.polls > 1;
  const passage = SAMPLE_PASSAGES[reflection.religion];
  return {
    id: reflection.id,
    created_at: reflection.createdAt,
    text: reflection.text,
    religion: reflection.religion,
    status: done ? "completed" : "processing",
    error: null,
    analysis: done
      ? {
          primary_emotion: "loneliness",
          secondary_emotions: ["doubt"],
          intensity: 2,
          intent: reflection.religion === "quran" ? "assurance" : "comfort",
          themes: ["change", "isolation"],
          crisis_signals: CRISIS_WORDS.test(reflection.text),
        }
      : null,
    results: done
      ? [
          {
            verse: {
              canonical_id: passage.id,
              religion: passage.tradition,
              reference: passage.reference,
              translation: passage.translation,
              text: passage.text,
              arabic: passage.arabic,
            },
            rank: 1,
            similarity: 0.82,
            final_score: 0.9,
            served_with_context: false,
          },
        ]
      : [],
    why: done ? SAMPLE_WHY[reflection.religion] : null,
  };
}

const user: UserDto = {
  id: 1,
  email: "you@example.com",
  display_name: null,
  email_verified: true,
  preferred_religion: "bible",
};

export const handlers = [
  http.post("/api/mv/api/v1/recommendations", async ({ request }) => {
    const body = (await request.json()) as { text: string; religion: Tradition };
    const reflection: MockReflection = {
      id: nextId++,
      text: body.text,
      religion: body.religion,
      createdAt: new Date().toISOString(),
      polls: 0,
    };
    reflections.set(reflection.id, reflection);
    return HttpResponse.json<SubmitDto>({ reflection_id: reflection.id, status: "pending" }, { status: 202 });
  }),

  // Listed before /:id so "history" isn't read as an id.
  http.get("/api/mv/api/v1/reflections/history", () =>
    HttpResponse.json({
      items: [...reflections.values()].reverse().map((reflection) => toDto({ ...reflection, polls: 2 })),
      limit: 20,
      offset: 0,
    }),
  ),

  http.get("/api/mv/api/v1/reflections/:id", ({ params }) => {
    const reflection = reflections.get(Number(params.id));
    if (!reflection) return HttpResponse.json({ detail: "No reflection with that id." }, { status: 404 });
    reflection.polls += 1;
    return HttpResponse.json(toDto(reflection));
  }),

  http.post("/api/mv/api/v1/reflections/:id/feedback", () => HttpResponse.json({ ok: true }, { status: 201 })),

  http.get("/api/mv/auth/me", () => HttpResponse.json(user)),

  http.patch("/api/mv/auth/me/preferences", async ({ request }) => {
    const body = (await request.json()) as { preferred_religion: Tradition };
    user.preferred_religion = body.preferred_religion;
    return HttpResponse.json(user);
  }),
];
