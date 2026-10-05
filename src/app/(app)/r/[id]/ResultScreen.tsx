"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bookmark, ChevronDown, ChevronLeft, CircleAlert, Lock, LogIn, RefreshCw, Share, SearchX } from "lucide-react";

import { BreathingSun } from "@/components/mv/BreathingSun";
import { Button, ButtonLink } from "@/components/mv/Button";
import { FeedbackBox } from "@/components/mv/FeedbackBox";
import { MessagePanel } from "@/components/mv/MessagePanel";
import { PassageView } from "@/components/mv/PassageView";
import { SceneImage } from "@/components/mv/SceneImage";
import { SupportCard } from "@/components/mv/SupportCard";
import { GlassPanel } from "@/components/mv/Surfaces";
import { WhyCard } from "@/components/mv/WhyCard";
import { ApiError } from "@/lib/api/client";
import { useFeedback, useReflection, useSaved, useToggleSave } from "@/lib/api/hooks";
import { readLastBackground } from "@/lib/client/share-export";
import { cx } from "@/lib/cx";

// Each tradition has its own landscape; the support result gets the dawn lake.
const PANEL_IMAGE = { bible: "/images/calm-sea.jpg", quran: "/images/misty-morning.jpg" } as const;
const SUPPORT_IMAGE = "/images/dawn-lake.jpg";
const SIDE_SIZES = "(max-width: 1180px) 100vw, calc(100vw - 676px)";

export function ResultScreen({ id }: { id: number }) {
  const t = useTranslations();
  const { data: reflection, error, refetch } = useReflection(id);
  const saved = useSaved();
  const toggleSave = useToggleSave();
  const feedback = useFeedback(id);
  // Which of the ranked passages is showing; "Show another" moves along.
  const [index, setIndex] = useState(0);

  if (error) {
    if (error instanceof ApiError && error.signedOut) {
      return (
        <MessagePanel
          icon={<LogIn size={28} />}
          title={t("finding.guest.title")}
          body={t("finding.guest.body")}
          actions={
            <>
              <ButtonLink href="/reflect" variant="secondary">
                {t("finding.guest.back")}
              </ButtonLink>
              <ButtonLink href="/sign-in">{t("finding.guest.signIn")}</ButtonLink>
            </>
          }
        />
      );
    }
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <MessagePanel
        icon={missing ? <SearchX size={28} /> : <CircleAlert size={30} strokeWidth={1.5} />}
        title={missing ? t("error.notFound") : t("error.title")}
        body={missing ? undefined : t("error.body")}
        actions={
          <>
            <ButtonLink href="/reflect" variant="secondary">
              {t("error.backToReflect")}
            </ButtonLink>
            {!missing && <Button onClick={() => refetch()}>{t("error.retry")}</Button>}
          </>
        }
      />
    );
  }

  if (!reflection || reflection.status === "pending" || reflection.status === "processing") {
    return (
      <div
        aria-busy="true"
        className="relative flex h-full min-h-[640px] flex-col items-center justify-center gap-9 overflow-hidden px-6 py-10 text-white"
      >
        <SceneImage src="/images/hero-dawn.jpg" loading="eager" sizes={SIDE_SIZES} className="mv-drift object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-[rgba(16,14,48,.35)]" />
        <BreathingSun className="relative" />
        <p role="status" className="relative font-serif text-[40px] font-medium">
          {t("finding.title")}
        </p>
      </div>
    );
  }

  const passage = reflection.passages[index] ?? reflection.passages[0];
  if (reflection.status === "failed" || !passage) {
    return (
      <MessagePanel
        icon={<CircleAlert size={30} strokeWidth={1.5} />}
        title={t("error.title")}
        body={t("error.body")}
        actions={
          <ButtonLink href="/reflect" variant="secondary" className="col-span-full">
            {t("error.edit")}
          </ButtonLink>
        }
      />
    );
  }

  const quran = passage.tradition === "quran";
  const translation = quran ? t("passage.translationName", { name: passage.translation }) : passage.translation;
  const isSaved = saved.data?.some((item) => item.passage.id === passage.id) ?? false;
  const hasAnother = index + 1 < reflection.passages.length;

  return (
    <div className="mv-split h-full max-[1180px]:h-auto">
      <div className="relative flex min-h-[640px] flex-col overflow-hidden px-[clamp(24px,4vw,64px)] pt-7 pb-12 text-white max-[1180px]:min-h-[70vh]">
        <SceneImage
          src={reflection.support ? SUPPORT_IMAGE : PANEL_IMAGE[passage.tradition]}
          preload
          loading="eager"
          sizes={SIDE_SIZES}
          className="mv-drift object-cover object-[center_55%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,20,60,.25),rgba(14,20,60,.45)_45%,rgba(12,16,48,.72))]"
        />

        <div className="relative flex items-center justify-between gap-3">
          <ButtonLink href="/reflect" variant="glass" size="sm">
            <ChevronLeft size={18} strokeWidth={1.8} className="rtl:-scale-x-100" />
            {t("result.newReflection")}
          </ButtonLink>
          <GlassPanel
            as="span"
            variant="glass-dark"
            className="flex h-[34px] items-center rounded-full px-3.5 text-xs font-extrabold tracking-[.12em] uppercase"
          >
            {t(`tradition.${passage.tradition}`)}
          </GlassPanel>
        </div>

        {/* Keyed by passage so "Show another" fades the new one in. */}
        <div
          key={passage.id}
          role="article"
          aria-label={t("passage.label", { reference: passage.reference, translation })}
          className="mv-fade-in relative mx-auto flex w-full max-w-[800px] grow flex-col justify-center py-10"
        >
          <PassageView passage={passage} tone="onImage" unlabelled />
        </div>
      </div>

      <section
        aria-label={t("result.about")}
        className="flex flex-col gap-6 overflow-y-auto bg-bg px-8 py-9 max-[1180px]:overflow-visible max-[600px]:px-5"
      >
        {/* Alongside the passage, never instead of it. */}
        {reflection.support && <SupportCard />}

        <WhyCard why={reflection.why} emotions={reflection.emotions} need={reflection.need} />

        <FeedbackBox
          key={passage.id}
          reflectionId={reflection.id}
          passageId={passage.id}
          onAnswer={(answer) =>
            feedback.mutate({
              passageId: passage.id,
              helped: answer.helped,
              reason: answer.helped ? undefined : answer.reason,
            })
          }
        />

        <section aria-label={t("result.actions.label")} className="flex flex-col gap-2.5">
          <Button
            aria-pressed={isSaved}
            className="w-full"
            onClick={() =>
              toggleSave.mutate({
                passage,
                background: readLastBackground() ?? (quran ? "misty" : "dawn"),
                reflectionId: reflection.id,
              })
            }
          >
            <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
            {isSaved ? t("result.actions.saved") : t("result.actions.savePassage")}
          </Button>
          <div className="grid grid-cols-2 gap-2.5">
            <ButtonLink href={`/r/${reflection.id}/share?p=${encodeURIComponent(passage.id)}`} variant="secondary" size="sm">
              <Share size={18} />
              {t("result.actions.shareCard")}
            </ButtonLink>
            <Button
              variant="secondary"
              size="sm"
              aria-disabled={!hasAnother || undefined}
              onClick={() => hasAnother && setIndex(index + 1)}
            >
              <RefreshCw size={18} />
              {t("result.actions.showAnother")}
            </Button>
          </div>
        </section>

        {reflection.text && (
          <details className="group rounded-[22px] px-4 py-1 shadow-[inset_0_0_0_1px_var(--mv-line)]">
            <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-ink-2 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <Lock size={16} />
                {t("result.yourReflection")}
              </span>
              <ChevronDown size={18} className={cx("shrink-0 transition-transform duration-[400ms] ease-mv group-open:rotate-180")} />
            </summary>
            <p dir="auto" className="pb-3.5 font-serif text-[19px] leading-7 text-ink-2 italic">“{reflection.text}”</p>
          </details>
        )}
      </section>
    </div>
  );
}
