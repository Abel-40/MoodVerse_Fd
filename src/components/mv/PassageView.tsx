import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { cx } from "@/lib/cx";
import type { Passage } from "@/lib/scripture";

interface PassageViewProps {
  passage: Passage;
  /**
   * onImage: the result hero, centred white text over a landscape.
   * surface: a card in lists and panels, on surface colours.
   */
  tone?: "onImage" | "surface";
  /** Leave the label to a labelled wrapper, so it isn't read twice. */
  unlabelled?: boolean;
  className?: string;
}

/**
 * One verified passage with its reference, translation and "Verified text"
 * mark. The variant follows `passage.tradition`: Bible text is set in
 * Newsreader; Quran text is the Arabic (right to left, Noto Naskh), a short
 * rule, then the translation in italics.
 */
export function PassageView({ passage, tone = "surface", unlabelled = false, className }: PassageViewProps) {
  const t = useTranslations();
  const onImage = tone === "onImage";
  const quran = passage.tradition === "quran";
  const translation = quran ? t("passage.translationName", { name: passage.translation }) : passage.translation;
  const label = unlabelled ? undefined : t("passage.label", { reference: passage.reference, translation });

  const body = quran ? (
    <>
      <p
        lang="ar"
        dir="rtl"
        className={cx(
          "font-arabic font-medium",
          onImage ? "text-center text-[calc(clamp(36px,3.6vw,54px)*var(--mv-text-scale,1))] leading-[1.9]" : "text-start text-[calc(30px*var(--mv-text-scale,1))] leading-[1.95]",
        )}
      >
        {passage.arabic}
      </p>
      <span
        aria-hidden="true"
        className={cx("h-0.5 rounded-sm", onImage ? "w-8 self-center bg-white/80" : "w-7 bg-line-strong")}
      />
      <blockquote
        lang="en"
        dir="ltr"
        className={cx(
          "font-serif font-medium italic text-balance",
          onImage ? "text-[calc(clamp(28px,2.6vw,40px)*var(--mv-text-scale,1))] leading-[1.3]" : "text-[calc(21px*var(--mv-text-scale,1))] leading-[1.4] text-ink-2",
        )}
      >
        {passage.text}
      </blockquote>
    </>
  ) : (
    <blockquote
      lang="en"
      dir="ltr"
      className={cx(
        "font-serif font-medium text-balance",
        onImage ? "text-[calc(clamp(34px,3.4vw,52px)*var(--mv-text-scale,1))] leading-[1.22] tracking-[-0.01em]" : "text-[calc(25px*var(--mv-text-scale,1))] leading-[1.35]",
      )}
    >
      {passage.text}
    </blockquote>
  );

  if (onImage) {
    return (
      <figure
        aria-label={label}
        className={cx(
          "flex flex-col justify-center gap-[22px] text-center text-white [text-shadow:0_1px_18px_rgba(8,10,30,.35)]",
          className,
        )}
      >
        {body}
        <figcaption className="flex flex-wrap items-center justify-center gap-3">
          <cite className="text-sm font-extrabold tracking-[.14em] uppercase not-italic">{passage.reference}</cite>
          <span className="text-sm opacity-90">{translation}</span>
          <span className="inline-flex h-[26px] items-center gap-1 rounded-full bg-white/18 px-2.5 text-xs font-bold [text-shadow:none]">
            <ShieldCheck size={14} />
            {t("passage.verified")}
          </span>
        </figcaption>
      </figure>
    );
  }

  return (
    <figure aria-label={label} className={cx("flex flex-col gap-[18px]", className)}>
      <span className="mv-overline">{t(`tradition.${passage.tradition}`)}</span>
      {body}
      <figcaption className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3.5">
        <span className="flex flex-col gap-0.5">
          <cite className="text-[13px] font-extrabold tracking-[.1em] uppercase not-italic">{passage.reference}</cite>
          <span className="text-[13px] text-ink-3">{translation}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-primary">
          <ShieldCheck size={16} />
          {t("passage.verified")}
        </span>
      </figcaption>
    </figure>
  );
}
