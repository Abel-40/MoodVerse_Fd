"use client";

import { useLocale, useTranslations } from "next-intl";

import type { Emotion, Need } from "@/lib/api/types";
import { cx } from "@/lib/cx";

import { Chip, NeedChip } from "./Chip";

interface WhyCardProps {
  /** The server's note, if it wrote one. */
  why: string | null;
  emotions: Emotion[];
  need: Need | null;
  className?: string;
}

/**
 * "Why this passage" and what was noticed. Without a server-written note, the
 * sentence comes from the kit's reviewed template and fixed vocabulary only.
 */
export function WhyCard({ why, emotions, need, className }: WhyCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const listed = new Intl.ListFormat(locale, { type: "conjunction" }).format(
    emotions.slice(0, 2).map((emotion) => t(`emotions.${emotion}`).toLocaleLowerCase(locale)),
  );
  const needWord = need ? t(`whyNeed.${need}`) : null;
  const sentence =
    why ??
    (listed && needWord
      ? t("result.whyTemplate", { emotions: listed, need: needWord })
      : listed
        ? t("result.whyEmotionsOnly", { emotions: listed })
        : needWord
          ? t("result.whyNeedOnly", { need: needWord })
          : null);

  if (!sentence && emotions.length === 0) return null;

  return (
    <section className={cx("flex flex-col gap-3", className)}>
      <h2 className="mv-overline">{t("result.why")}</h2>
      {sentence && <p className="text-[17px] leading-[27px] text-ink">{sentence}</p>}
      {(emotions.length > 0 || need) && (
        <ul aria-label={t("result.noticed")} className="flex flex-wrap gap-2">
          {emotions.map((emotion) => (
            <Chip as="li" key={emotion}>
              {t(`emotions.${emotion}`)}
            </Chip>
          ))}
          {need && <NeedChip as="li">{t(`needs.${need}`)}</NeedChip>}
        </ul>
      )}
    </section>
  );
}
