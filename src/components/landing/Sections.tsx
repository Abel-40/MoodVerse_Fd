import Image from "next/image";
import { useTranslations } from "next-intl";
import { BookOpen, Bookmark, Heart, Lock, ShieldCheck } from "lucide-react";

import { ButtonLink } from "@/components/mv/Button";
import { Chip, NeedChip } from "@/components/mv/Chip";
import { ShareCard, type ShareBackground } from "@/components/mv/ShareCard";
import { Card, GlassPanel, IconBadge } from "@/components/mv/Surfaces";
import { cx } from "@/lib/cx";
import { SAMPLE_PASSAGES } from "@/lib/fixtures";
import type { Tradition } from "@/lib/scripture";

export const GUTTER = "px-[clamp(20px,5vw,96px)]";
export const H2 = "font-serif text-[clamp(38px,4.4vw,64px)] leading-[1.02] font-medium tracking-[-0.02em]";

export function Highlights() {
  const t = useTranslations("landing.highlights");
  const items = [
    { key: "feel", Icon: Heart },
    { key: "verified", Icon: ShieldCheck },
    { key: "traditions", Icon: BookOpen },
    { key: "return", Icon: Bookmark },
  ] as const;

  return (
    <section aria-label={t("label")} className={cx("mv-reveal pt-6 pb-[72px]", GUTTER)}>
      <ul className="mx-auto grid max-w-content grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
        {items.map(({ key, Icon }) => (
          <Card as="li" key={key} bordered className="flex flex-col gap-3 p-6">
            <IconBadge>
              <Icon size={22} />
            </IconBadge>
            <h3 className="text-lg font-extrabold">{t(`${key}.title`)}</h3>
            <p className="text-[15px] leading-[1.55] text-ink-2">{t(`${key}.body`)}</p>
          </Card>
        ))}
      </ul>
    </section>
  );
}

export function HowItWorks() {
  const t = useTranslations();
  const passage = SAMPLE_PASSAGES.bible;
  // The design trims the verse at its first clause for this small vignette.
  const opening = `${passage.text.split(";")[0]}…`;
  const steps = [
    {
      key: "reflect",
      vignette: (
        <div className="relative flex h-60 items-end overflow-hidden p-6">
          <Image src="/images/misty-morning.jpg" alt="" fill sizes="(min-width: 1100px) 33vw, 100vw" className="object-cover object-[center_40%]" />
          <GlassPanel className="relative w-full rounded-[20px] p-4 text-sm leading-[21px]">
            {t("landing.how.snippet")}
            <span className="ms-0.5 inline-block h-4 w-0.5 bg-primary align-[-3px]" />
          </GlassPanel>
        </div>
      ),
    },
    {
      key: "understand",
      vignette: (
        <div className="relative flex h-60 items-center justify-center overflow-hidden p-6">
          <Image src="/images/soft-clouds.jpg" alt="" fill sizes="(min-width: 1100px) 33vw, 100vw" className="object-cover" />
          <GlassPanel className="relative flex flex-col gap-2.5 rounded-[20px] p-4">
            <span className="text-[11px] font-extrabold tracking-[.12em] text-ink-3 uppercase">{t("result.noticed")}</span>
            <span className="flex flex-wrap gap-1.5">
              <Chip>{t("emotions.loneliness")}</Chip>
              <Chip>{t("emotions.doubt")}</Chip>
              <NeedChip>{t("needs.comfort")}</NeedChip>
            </span>
          </GlassPanel>
        </div>
      ),
    },
    {
      key: "receive",
      vignette: (
        <div className="relative flex h-60 flex-col justify-end overflow-hidden p-6 text-white">
          <Image src="/images/dawn-lake.jpg" alt="" fill sizes="(min-width: 1100px) 33vw, 100vw" className="object-cover object-[center_55%]" />
          <div className="mv-scrim absolute inset-0" />
          <p lang="en" dir="ltr" className="relative font-serif text-[22px] leading-[1.3] font-medium">{opening}</p>
          <span className="relative mt-2 text-[11px] font-extrabold tracking-[.12em] uppercase">
            {passage.reference} · {passage.translationShort ?? passage.translation}
          </span>
        </div>
      ),
    },
  ] as const;

  return (
    <section id="how" aria-labelledby="how-title" className={cx("scroll-mt-28 bg-sky py-24", GUTTER)}>
      <div className="mv-reveal mx-auto flex max-w-content flex-col gap-[52px]">
        <div className="flex max-w-[700px] flex-col gap-3.5">
          <span className="mv-overline">{t("landing.how.overline")}</span>
          <h2 id="how-title" className={H2}>
            {t("landing.how.titleLine1")}
            <br />
            <span className="mv-grad-text">{t("landing.how.titleLine2")}</span>
          </h2>
        </div>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(330px,100%),1fr))] gap-5">
          {steps.map(({ key, vignette }, index) => (
            <Card as="li" key={key} className="flex flex-col overflow-hidden">
              <div aria-hidden="true">{vignette}</div>
              <div className="flex flex-col gap-2 px-[26px] pt-6 pb-7">
                <span className="mv-overline">{t("landing.how.step", { n: index + 1 })}</span>
                <h3 className="text-[22px] font-extrabold">{t(`landing.how.${key}.title`)}</h3>
                <p className="text-base leading-[1.6] text-ink-2">{t(`landing.how.${key}.body`)}</p>
              </div>
            </Card>
          ))}
        </ol>
      </div>
    </section>
  );
}

const TRADITION_CARDS: Record<Tradition, { image: string; scrim: string }> = {
  bible: {
    image: "/images/calm-sea.jpg",
    scrim: "bg-[linear-gradient(180deg,rgba(14,18,56,.35),rgba(14,18,56,.25)_40%,rgba(14,18,56,.7))]",
  },
  quran: {
    image: "/images/misty-morning.jpg",
    scrim: "bg-[linear-gradient(180deg,rgba(14,18,56,.35),rgba(14,18,56,.3)_40%,rgba(14,18,56,.72))]",
  },
};

export function Traditions() {
  const t = useTranslations();

  return (
    <section id="traditions" aria-labelledby="trad-title" className={cx("scroll-mt-28 py-[104px]", GUTTER)}>
      <div className="mv-reveal mx-auto flex max-w-content flex-col gap-[52px]">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <span className="mv-overline">{t("landing.traditions.overline")}</span>
          <h2 id="trad-title" className={cx(H2, "max-w-[820px] text-balance")}>
            {t("landing.traditions.title")}
          </h2>
          <p className="max-w-[600px] text-[17px] leading-[1.6] text-ink-2">{t("landing.traditions.body")}</p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] gap-5">
          {(["bible", "quran"] as const).map((tradition) => {
            const passage = SAMPLE_PASSAGES[tradition];
            const quran = tradition === "quran";
            const translation = quran ? t("passage.translationName", { name: passage.translation }) : passage.translation;
            return (
              <article
                key={tradition}
                aria-label={t("landing.traditions.cardLabel", {
                  tradition: t(`tradition.${tradition}`),
                  reference: passage.reference,
                  translation,
                })}
                className="relative flex min-h-[540px] flex-col justify-between gap-7 overflow-hidden rounded-[36px] p-[clamp(28px,4vw,48px)] text-white"
              >
                <Image
                  src={TRADITION_CARDS[tradition].image}
                  alt=""
                  fill
                  sizes="(min-width: 960px) 50vw, 100vw"
                  className="object-cover"
                />
                <div aria-hidden="true" className={cx("absolute inset-0", TRADITION_CARDS[tradition].scrim)} />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-serif text-4xl font-medium">{t(`tradition.${tradition}`)}</h3>
                  <span className="mv-glass-dark flex h-8 items-center rounded-full px-3 text-[13px] font-bold">
                    {quran ? t("landing.traditions.quranBadge", { translation: passage.translation }) : passage.translation}
                  </span>
                </div>
                <div className="relative flex flex-col gap-4 [text-shadow:0_1px_16px_rgba(8,10,30,.35)]">
                  {quran && (
                    <p
                      lang="ar"
                      dir="rtl"
                      className="text-start font-arabic text-[clamp(30px,2.8vw,40px)] leading-[1.9] font-medium"
                    >
                      {passage.arabic}
                    </p>
                  )}
                  <blockquote
                    lang="en"
                    dir="ltr"
                    className={cx(
                      "font-serif font-medium",
                      quran
                        ? "text-[clamp(22px,2vw,28px)] leading-[1.38] italic"
                        : "text-[clamp(28px,2.6vw,38px)] leading-[1.28]",
                    )}
                  >
                    {passage.text}
                  </blockquote>
                  <cite className="text-[13px] font-extrabold tracking-[.14em] uppercase not-italic">
                    {passage.reference}
                  </cite>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Trust() {
  const t = useTranslations("landing.trust");
  const points = [
    { key: "verified", Icon: ShieldCheck },
    { key: "never", Icon: BookOpen },
    { key: "private", Icon: Lock },
  ] as const;

  return (
    <section id="trust" aria-labelledby="trust-title" className={cx("relative scroll-mt-28 overflow-hidden py-28", GUTTER)}>
      <Image src="/images/band-misty.jpg" alt="" fill sizes="100vw" className="object-cover" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,#FFFFFF_0%,rgba(255,255,255,.2)_30%,rgba(255,255,255,0)_60%,rgba(10,20,60,.25)_100%)]"
      />
      <div className="mv-reveal relative mx-auto flex max-w-content flex-col gap-12">
        <div className="flex max-w-[720px] flex-col gap-3.5">
          <span className="mv-overline">{t("overline")}</span>
          <h2 id="trust-title" className={cx(H2, "text-balance")}>
            {t("title")}
          </h2>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
          {points.map(({ key, Icon }) => (
            <GlassPanel as="li" key={key} className="flex flex-col gap-3 rounded-card p-7">
              <IconBadge>
                <Icon size={22} />
              </IconBadge>
              <h3 className="text-xl font-extrabold">{t(`${key}.title`)}</h3>
              <p className="text-[15px] leading-[1.6] text-ink-2">{t(`${key}.body`)}</p>
            </GlassPanel>
          ))}
        </ul>
        <ButtonLink href="/sources" variant="secondary" className="self-start">
          {t("sources")}
        </ButtonLink>
      </div>
    </section>
  );
}

const GALLERY: Array<{ background: ShareBackground; tradition: Tradition; label?: "transparentPng" }> = [
  { background: "dawn", tradition: "bible" },
  { background: "misty", tradition: "quran" },
  { background: "clouds", tradition: "bible" },
  { background: "night", tradition: "quran" },
  { background: "photo", tradition: "bible" },
  { background: "transparent", tradition: "quran", label: "transparentPng" },
];

export function Gallery() {
  const t = useTranslations();

  return (
    <section aria-labelledby="gallery-title" className="mv-reveal py-[104px]">
      <div className={GUTTER}>
        <div className="mx-auto flex max-w-content flex-wrap items-end justify-between gap-5">
          <div className="flex max-w-[640px] flex-col gap-3.5">
            <span className="mv-overline">{t("landing.gallery.overline")}</span>
            <h2 id="gallery-title" className={H2}>
              {t("landing.gallery.title")}
            </h2>
          </div>
          <p className="max-w-[420px] text-base leading-[1.6] text-ink-2">{t("landing.gallery.body")}</p>
        </div>
      </div>
      {/* Focusable so keyboard users can scroll the row sideways. */}
      <div
        role="region"
        aria-labelledby="gallery-title"
        tabIndex={0}
        className={cx("mt-11 overflow-x-auto pt-2 pb-8 [scrollbar-width:thin]", GUTTER)}
      >
        <ul className="flex gap-5">
          {GALLERY.map(({ background, tradition, label }, index) => (
            <li key={background} className={cx("flex shrink-0 flex-col gap-2.5", index % 2 === 1 && "translate-y-7")}>
              <ShareCard
                passage={SAMPLE_PASSAGES[tradition]}
                background={background}
                checkerboard={background === "transparent"}
                width={198}
                className="rounded-[22px] shadow-sheet"
              />
              <span className="ps-1 text-[13px] font-bold text-ink-2">
                {label ? t(`landing.gallery.${label}`) : t(`share.bg.${background}`)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Limits() {
  const t = useTranslations("landing.limits");

  return (
    <section aria-labelledby="not-title" className={cx("bg-sky py-24", GUTTER)}>
      <div className="mv-reveal mx-auto flex max-w-content flex-col gap-10">
        <div className="flex max-w-[700px] flex-col gap-3.5">
          <span className="mv-overline">{t("overline")}</span>
          <h2 id="not-title" className={H2}>
            {t("title")}
          </h2>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
          {(["chatbot", "therapy", "authority"] as const).map((key) => (
            <Card as="li" key={key} className="flex flex-col gap-2.5 p-7">
              <h3 className="font-serif text-[28px] font-medium">{t(`${key}.title`)}</h3>
              <p className="text-base leading-[1.6] text-ink-2">{t(`${key}.body`)}</p>
            </Card>
          ))}
        </ul>
      </div>
    </section>
  );
}
