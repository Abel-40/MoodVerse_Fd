"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck } from "lucide-react";

import type { FeedbackReason } from "@/lib/api/types";
import { cx } from "@/lib/cx";

import { Button } from "./Button";
import { FilterChip } from "./Chip";

export type FeedbackAnswer = { helped: true } | { helped: false; reason?: FeedbackReason };
type Answer = FeedbackAnswer;

const REASONS: FeedbackReason[] = ["didnt_fit", "hard_to_understand", "other"];

// The backend stores feedback but doesn't return it, so remember the answer
// here too, to show it again on the next visit.
function storageKey(reflectionId: number, passageId: string) {
  return `mv-feedback:${reflectionId}:${passageId}`;
}

/** The answer given for a passage on this browser, if any. */
export function readFeedback(reflectionId: number, passageId: string): FeedbackAnswer | null {
  try {
    return readAnswer(storageKey(reflectionId, passageId));
  } catch {
    return null;
  }
}

function readAnswer(key: string): Answer | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Answer) : null;
  } catch {
    return null;
  }
}

const noSubscription = () => () => {};

interface FeedbackBoxProps {
  reflectionId: number;
  passageId: string;
  /** Send the answer to the backend. */
  onAnswer: (answer: Answer) => void;
  className?: string;
}

/** "Did this help?" After an answer it says thank you, and the answer can still change. */
export function FeedbackBox({ reflectionId, passageId, onAnswer, className }: FeedbackBoxProps) {
  const t = useTranslations("result.feedback");
  const reasonsId = useId();
  const key = storageKey(reflectionId, passageId);
  const stored = useSyncExternalStore(
    noSubscription,
    () => window.localStorage.getItem(key),
    () => null,
  );
  const [answer, setAnswer] = useState<Answer | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const current = answer === undefined ? (stored ? readAnswer(key) : null) : answer;

  function choose(next: Answer) {
    setAnswer(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Not remembered locally; the backend still has it.
    }
    onAnswer(next);
    // "Not quite" stays open for an optional reason; "This helped" is done.
    setEditing(!next.helped && next.reason === undefined);
  }

  const box = "flex flex-col gap-2.5 rounded-3xl bg-sky p-4";

  if (current && !editing) {
    return (
      <section aria-label={t("question")} className={cx(box, className)}>
        <div role="status" className="flex flex-wrap items-center gap-2.5">
          <span className="mv-btn mv-btn-primary mv-btn-sm pointer-events-none">
            {current.helped && <CircleCheck size={18} strokeWidth={1.8} />}
            {current.helped ? t("helped") : t("notQuite")}
          </span>
          <span className="text-sm text-ink-2">{t("thanks")}</span>
        </div>
        <Button variant="ghost" size="sm" className="self-start px-2 text-sm" onClick={() => setEditing(true)}>
          {t("change")}
        </Button>
      </section>
    );
  }

  return (
    <section aria-label={t("question")} className={cx(box, className)}>
      <span className="text-sm font-semibold text-ink-2">{t("question")}</span>
      <div className="flex flex-wrap gap-2">
        <FilterChip pressed={current?.helped === true} className="h-11" onClick={() => choose({ helped: true })}>
          {t("helped")}
        </FilterChip>
        <FilterChip
          pressed={current?.helped === false}
          className="h-11"
          aria-expanded={current?.helped === false}
          aria-controls={reasonsId}
          onClick={() => choose({ helped: false })}
        >
          {t("notQuite")}
        </FilterChip>
      </div>
      {current?.helped === false && (
        <div id={reasonsId} className="mv-fade-in flex flex-col gap-2.5">
          <span className="text-[13px] font-bold text-ink-3">{t("reasonsLabel")}</span>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((reason) => (
              <FilterChip
                key={reason}
                pressed={current.reason === reason}
                onClick={() => choose({ helped: false, reason })}
              >
                {t(`reasons.${reason}`)}
              </FilterChip>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
