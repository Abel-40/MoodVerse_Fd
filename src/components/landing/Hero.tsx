import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Bookmark, ChevronLeft, RefreshCw, Share, ShieldCheck } from "lucide-react";

import { ButtonLink } from "@/components/mv/Button";
import { Chip, NeedChip } from "@/components/mv/Chip";
import { Wordmark } from "@/components/mv/Wordmark";
import { SAMPLE_PASSAGES } from "@/lib/fixtures";

import { StoreBadges } from "./StoreBadges";

const ANCHORS = ["how", "traditions", "trust", "faq"] as const;

/** The floating glass bar. It stays put while the page scrolls under it. */
export function LandingNav() {
  const t = useTranslations("landing.nav");

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 px-[clamp(16px,4vw,64px)] pt-5">
      <nav
        aria-label={t("label")}
        className="mv-glass pointer-events-auto mx-auto flex min-h-[72px] max-w-[1312px] items-center justify-between gap-5 rounded-[26px] pe-3 ps-6"
      >
        <Link href="/" className="flex min-h-11 items-center">
          <Wordmark size={30} labelClassName="text-[25px]! tracking-[-0.01em]" />
        </Link>
        <div className="flex items-center gap-[30px] text-[15px] font-semibold text-ink-2 max-[860px]:hidden">
          {ANCHORS.map((anchor) => (
            <a key={anchor} href={`#${anchor}`} className="flex min-h-11 items-center">
              {t(anchor)}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <ButtonLink href="/sign-in" variant="ghost" className="text-ink max-[860px]:hidden">
            {t("signIn")}
          </ButtonLink>
          <a href="#download" className="mv-btn mv-btn-primary mv-btn-sm">
            {t("getApp")}
          </a>
        </div>
      </nav>
    </header>
  );
}

/**
 * A phone showing the Bible result screen. Purely illustrative: it is one
 * labelled image to assistive tech, and nothing inside it can take focus.
 */
function PhoneMockup() {
  const t = useTranslations();
  const passage = SAMPLE_PASSAGES.bible;

  return (
    <figure
      role="img"
      aria-label={t("landing.hero.mockupLabel")}
      className="mv-float relative h-[678px] w-[324px] shrink-0 rounded-[56px] bg-[#12131A] p-2.5 shadow-[0_50px_100px_-30px_rgba(30,30,90,.55),inset_0_0_0_1.5px_#3A3B48]"
    >
      <div className="relative h-[658px] w-[304px] overflow-hidden rounded-[46px]">
        <div
          inert
          aria-hidden="true"
          className="relative h-[844px] w-[390px] origin-top-left scale-[0.7795] overflow-hidden bg-bg"
        >
          <div className="absolute inset-0">
            <div className="relative flex h-[500px] flex-col justify-end overflow-hidden px-[26px] pb-[62px] text-white">
              <Image
                src="/images/calm-sea.jpg"
                alt=""
                fill
                sizes="304px"
                className="mv-drift object-cover object-[center_45%]"
              />
              <div className="mv-scrim absolute inset-0" />
              <p lang="en" dir="ltr" className="relative font-serif text-[29px] leading-[1.3] font-medium tracking-[-0.01em] [text-shadow:0_1px_16px_rgba(8,10,30,.35)]">
                {passage.text}
              </p>
              <p className="relative mt-4 flex flex-wrap items-center gap-2.5">
                <span className="text-[13px] font-extrabold tracking-[.12em] uppercase">{passage.reference}</span>
                <span className="text-[13px] opacity-90">{passage.translation}</span>
                <span className="inline-flex h-6 items-center gap-1 rounded-full bg-white/18 px-2 text-[11px] font-bold">
                  <ShieldCheck size={12} strokeWidth={2.2} />
                  {t("landing.hero.mockupVerified")}
                </span>
              </p>
            </div>

            <div className="relative -mt-8 flex flex-col gap-5 rounded-t-[32px] bg-bg px-6 pt-[26px] pb-[120px]">
              <div className="flex flex-col gap-2.5">
                <span className="mv-overline">{t("result.why")}</span>
                <p className="text-base leading-[25px] text-ink-2">{t("landing.hero.mockupWhy")}</p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  <Chip as="li">{t("emotions.loneliness")}</Chip>
                  <Chip as="li">{t("emotions.doubt")}</Chip>
                  <NeedChip as="li">{t("needs.comfort")}</NeedChip>
                </ul>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 rounded-3xl bg-sky py-2.5 pe-2.5 ps-4">
                <span className="text-sm font-semibold text-ink-2">{t("landing.hero.mockupFeedback")}</span>
                <span className="flex gap-1.5">
                  <span className="mv-chip-filter h-11! px-3.5!">{t("landing.hero.mockupHelped")}</span>
                  <span className="mv-chip-filter h-11! px-3.5!">{t("landing.hero.mockupNotQuite")}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-4 top-[54px] flex items-center justify-between">
            <span className="mv-btn mv-btn-glass mv-btn-icon size-11!">
              <ChevronLeft size={22} strokeWidth={1.8} className="rtl:-scale-x-100" />
            </span>
            <span className="mv-glass-dark flex h-[34px] items-center rounded-full px-3.5 text-xs font-extrabold tracking-[.12em] uppercase">
              {t("tradition.bible")}
            </span>
            <span className="w-11" />
          </div>

          <div className="mv-glass absolute inset-x-4 bottom-6 grid grid-cols-3 rounded-[28px] p-1.5">
            {[
              { Icon: Bookmark, label: t("result.actions.save") },
              { Icon: Share, label: t("result.actions.share") },
              { Icon: RefreshCw, label: t("result.actions.showAnother") },
            ].map(({ Icon, label }) => (
              <span
                key={label}
                className="flex min-h-14 flex-col items-center justify-center gap-[3px] rounded-[22px] text-xs font-bold text-ink"
              >
                <Icon size={22} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <span
        aria-hidden="true"
        className="absolute top-5 left-1/2 -ml-12 h-7 w-24 rounded-[20px] bg-[#12131A]"
      />
    </figure>
  );
}

export function Hero({ browserHref }: { browserHref: string }) {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-full max-[860px]:h-[420px]">
        <Image
          src="/images/hero-dawn.jpg"
          alt=""
          fill
          preload
          loading="eager"
          sizes="100vw"
          className="mv-drift object-cover object-[70%_50%]"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,#FFFFFF_0%,rgba(255,255,255,.92)_30%,rgba(255,255,255,.35)_52%,rgba(255,255,255,0)_66%)] max-[860px]:bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_30%,#FFFFFF_46%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[140px] bg-[linear-gradient(180deg,rgba(255,255,255,0),#FFFFFF)]"
      />

      <div className="relative z-[1] px-[clamp(20px,5vw,96px)] pt-[164px] pb-24 max-[860px]:pt-[452px]">
        <div className="mx-auto grid max-w-content grid-cols-[repeat(auto-fit,minmax(min(480px,100%),1fr))] items-center gap-12">
          <div className="mv-fade-in flex max-w-[600px] flex-col gap-[26px]">
            <span className="mv-eyebrow self-start bg-[rgba(233,238,255,.9)]">{t("eyebrow")}</span>
            <h1 className="font-serif text-[clamp(52px,6.6vw,100px)] leading-[0.98] font-medium tracking-[-0.03em]">
              <span className="whitespace-nowrap">{t("titleLine1")}</span>
              <br />
              <span className="mv-grad-text whitespace-nowrap">{t("titleLine2")}</span>
            </h1>
            <p className="max-w-[500px] text-[clamp(17px,1.4vw,20px)] leading-[1.6] text-ink-2">{t("body")}</p>
            <StoreBadges id="download" className="scroll-mt-32" />
            <Link
              href={browserHref}
              className="inline-flex min-h-11 items-center gap-2 self-start text-base font-bold text-primary"
            >
              {t("browser")}
              <ArrowRight size={18} strokeWidth={2} className="rtl:-scale-x-100" />
            </Link>
          </div>
          <div className="flex justify-center">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
