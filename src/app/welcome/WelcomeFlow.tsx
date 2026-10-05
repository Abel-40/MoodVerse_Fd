"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, Heart, Lock, Pencil, ShieldCheck } from "lucide-react";

import { Button, ButtonLink } from "@/components/mv/Button";
import { Card, GlassPanel, IconBadge } from "@/components/mv/Surfaces";
import { Wordmark } from "@/components/mv/Wordmark";
import { readDefaultTradition, storeDefaultTradition } from "@/lib/client/session";
import { cx } from "@/lib/cx";
import type { Tradition } from "@/lib/scripture";

type Step = 1 | 2 | 3;

// One landscape per step; they cross-fade as the step changes.
const IMAGES: Record<Step, string> = {
  1: "/images/dawn-lake.jpg",
  2: "/images/band-misty.jpg",
  3: "/images/soft-clouds.jpg",
};

const VALUES = [
  { key: "scripture", Icon: ShieldCheck },
  { key: "chatbot", Icon: Pencil },
  { key: "therapy", Icon: Heart },
  { key: "private", Icon: Lock },
] as const;

const TRADITION_CARDS: Array<{ value: Tradition; image: string }> = [
  { value: "bible", image: "/images/calm-sea.jpg" },
  { value: "quran", image: "/images/misty-morning.jpg" },
];

const TITLE = "font-serif text-[clamp(38px,3.8vw,54px)] leading-[1.04] font-medium tracking-[-0.02em]";

// localStorage has no change event worth following here; read it once.
const noSubscription = () => () => {};

function parseStep(value: string | null): Step {
  return value === "2" ? 2 : value === "3" ? 3 : 1;
}

export function WelcomeFlow() {
  const t = useTranslations();
  const router = useRouter();
  const step = parseStep(useSearchParams().get("step"));
  // A tradition chosen on an earlier visit, once hydrated; then the user's pick.
  const stored = useSyncExternalStore(noSubscription, readDefaultTradition, () => null);
  const [picked, setTradition] = useState<Tradition | null>(null);
  const tradition = picked ?? stored ?? "bible";
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const cards = useRef<Array<HTMLButtonElement | null>>([]);

  // Screen-reader and keyboard users land on the new step's heading.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  // Native history keeps Back working and skips a server round trip.
  function goTo(next: Step) {
    window.history.pushState(null, "", `/welcome?step=${next}`);
  }

  function finish() {
    storeDefaultTradition(tradition);
    router.push("/sign-in");
  }

  function onCardKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "Enter") {
      event.preventDefault();
      finish();
      return;
    }
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
    const next = (index + (rtl && horizontal ? -step : step) + TRADITION_CARDS.length) % TRADITION_CARDS.length;
    setTradition(TRADITION_CARDS[next].value);
    cards.current[next]?.focus();
  }

  return (
    <div className="grid h-dvh grid-cols-2 bg-bg text-ink max-[960px]:h-auto max-[960px]:min-h-dvh max-[960px]:grid-cols-1 max-[960px]:grid-rows-[280px_minmax(0,1fr)]">
      <div className="relative flex flex-col justify-between overflow-hidden p-8 text-white">
        {([1, 2, 3] as const).map((key) => (
          <Image
            key={key}
            src={IMAGES[key]}
            alt=""
            fill
            preload={key === step}
            loading={key === step ? "eager" : "lazy"}
            sizes="(max-width: 960px) 100vw, 50vw"
            className={cx(
              "mv-drift object-cover transition-opacity duration-[800ms] ease-mv",
              key === step ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,16,56,.25),rgba(18,16,56,0)_40%,rgba(18,16,56,.45))]"
        />
        <Link href="/" aria-label={t("app.home")} className="relative flex min-h-11 items-center self-start">
          <Wordmark tone="white" labelClassName="text-[26px]!" />
        </Link>
        <GlassPanel
          as="p"
          variant="glass-dark"
          className="relative max-w-[420px] self-start rounded-3xl px-[22px] py-[18px] font-serif text-2xl leading-[1.3] max-[960px]:hidden"
        >
          {t("welcome.caption")}
        </GlassPanel>
      </div>

      <main className="relative flex flex-col overflow-y-auto px-[clamp(24px,5vw,80px)] py-8">
        <div className="flex min-h-11 items-center justify-between">
          <div role="img" aria-label={t("welcome.progress", { n: step })} className="flex gap-1.5">
            {([1, 2, 3] as const).map((key) => (
              <span
                key={key}
                className={cx(
                  "h-1.5 rounded-[9px] transition-[width] duration-[400ms] ease-mv",
                  key === step ? "w-7 bg-grad" : "w-1.5 bg-line",
                )}
              />
            ))}
          </div>
          <ButtonLink href="/sign-in" variant="ghost">
            {t("welcome.skip")}
          </ButtonLink>
        </div>

        <div className="mx-auto flex w-full max-w-[560px] grow flex-col justify-center py-8">
          <div key={step} className="mv-fade-in flex flex-col gap-[22px]">
            {step === 1 && (
              <>
                <span className="mv-eyebrow self-start">{t("welcome.step1.eyebrow")}</span>
                <h1
                  ref={heading}
                  tabIndex={-1}
                  className="font-serif text-[clamp(44px,4.6vw,68px)] leading-none font-medium tracking-[-0.025em] outline-none"
                >
                  {t.rich("welcome.step1.title", {
                    accent: (chunks) => <span className="mv-grad-text">{chunks}</span>,
                  })}
                </h1>
                <p className="text-lg leading-[1.6] text-ink-2">{t("welcome.step1.body")}</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <Button onClick={() => goTo(2)}>
                    {t("welcome.step1.cta")}
                    <ArrowRight size={18} strokeWidth={2} className="rtl:-scale-x-100" />
                  </Button>
                  <ButtonLink href="/sign-in" variant="secondary">
                    {t("welcome.step1.secondary")}
                  </ButtonLink>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <span className="mv-overline">{t("welcome.step2.overline")}</span>
                <h1 ref={heading} tabIndex={-1} className={cx(TITLE, "outline-none")}>
                  {t("welcome.step2.title")}
                </h1>
                <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3.5">
                  {VALUES.map(({ key, Icon }) => (
                    <Card as="li" key={key} bordered className="flex flex-col gap-2.5 p-[18px]">
                      <IconBadge>
                        <Icon size={22} />
                      </IconBadge>
                      <h2 className="text-base font-extrabold">{t(`welcome.step2.${key}.title`)}</h2>
                      <p className="text-sm leading-[21px] text-ink-2">{t(`welcome.step2.${key}.body`)}</p>
                    </Card>
                  ))}
                </ul>
                <div className="mt-1 flex gap-3">
                  <Button variant="secondary" onClick={() => goTo(1)}>
                    {t("welcome.back")}
                  </Button>
                  <Button onClick={() => goTo(3)}>{t("welcome.continue")}</Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <span className="mv-overline">{t("welcome.step3.overline")}</span>
                <h1 ref={heading} tabIndex={-1} className={cx(TITLE, "outline-none")}>
                  {t("welcome.step3.title")}
                </h1>
                <p className="text-[17px] leading-[1.6] text-ink-2">{t("welcome.step3.body")}</p>
                <div
                  role="radiogroup"
                  aria-label={t("welcome.step3.label")}
                  className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3.5"
                >
                  {TRADITION_CARDS.map(({ value, image }, index) => {
                    const checked = value === tradition;
                    return (
                      <button
                        key={value}
                        ref={(element) => {
                          cards.current[index] = element;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        tabIndex={checked ? 0 : -1}
                        onClick={() => setTradition(value)}
                        onKeyDown={(event) => onCardKey(event, index)}
                        className={cx(
                          "relative flex min-h-[230px] flex-col justify-end overflow-hidden rounded-card text-left text-white transition-shadow duration-[400ms]",
                          checked
                            ? "shadow-[0_0_0_3px_var(--mv-bg),0_0_0_5px_var(--mv-primary),0_20px_40px_-16px_rgba(47,91,234,.5)]"
                            : "shadow-card",
                        )}
                      >
                        <Image
                          src={image}
                          alt=""
                          fill
                          loading="eager"
                          sizes="(max-width: 960px) 100vw, 280px"
                          className="object-cover"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,18,56,.1),rgba(14,18,56,.7))]"
                        />
                        {checked && (
                          <span
                            aria-hidden="true"
                            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-white text-primary shadow-card rtl:right-auto rtl:left-4"
                          >
                            <Check size={18} strokeWidth={2.4} />
                          </span>
                        )}
                        <span className="relative flex flex-col gap-1 p-5">
                          <span className="font-serif text-[32px] font-medium">{t(`tradition.${value}`)}</span>
                          <span className="text-sm opacity-92">{t(`welcome.step3.${value}`)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-1 flex gap-3">
                  <Button variant="secondary" onClick={() => goTo(2)}>
                    {t("welcome.back")}
                  </Button>
                  <Button onClick={finish}>{t("welcome.continue")}</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
