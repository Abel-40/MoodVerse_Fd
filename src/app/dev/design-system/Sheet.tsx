"use client";

// Development-only reference sheet. Product strings come from the messages
// file; the captions that describe the components are inline on purpose.

import Image from "next/image";
import { useId, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Bookmark, Heart, Mic, Share, ShieldCheck, WifiOff } from "lucide-react";

import { Banner } from "@/components/mv/Banner";
import { Button } from "@/components/mv/Button";
import { Chip, FilterChip, NeedChip } from "@/components/mv/Chip";
import { Field } from "@/components/mv/Field";
import { PassageView } from "@/components/mv/PassageView";
import { Segmented } from "@/components/mv/Segmented";
import { Slider } from "@/components/mv/Slider";
import { Card, GlassPanel, IconBadge } from "@/components/mv/Surfaces";
import { Toggle } from "@/components/mv/Toggle";
import { Wordmark } from "@/components/mv/Wordmark";
import { cx } from "@/lib/cx";
import { SAMPLE_PASSAGES, SAMPLE_REFLECTION } from "@/lib/fixtures";
import type { ThemePreference } from "@/lib/preferences";
import type { Tradition } from "@/lib/scripture";
import { usePreferences } from "@/lib/use-preferences";

const FILTERS = ["loneliness", "anxiety", "gratitude", "hope"] as const;
const TEXT_SIZES = ["Smaller", "Default", "Large", "Larger", "Largest"];

function Section({
  n,
  title,
  note,
  className,
  children,
}: {
  n: string;
  title: string;
  note?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx("flex flex-col gap-6", className)}>
      <div className="flex flex-wrap items-baseline gap-x-[18px] gap-y-1">
        <span className="mv-overline">{n}</span>
        <h2 className="font-serif text-[44px] leading-tight font-medium">{title}</h2>
        {note && <span className="text-[15px] text-ink-3">{note}</span>}
      </div>
      {children}
    </section>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <span className="text-[13px] font-bold text-ink-3">{children}</span>;
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function DesignSystemSheet() {
  const t = useTranslations();
  const { theme, setTheme, gentleMotion, setGentleMotion } = usePreferences();
  const [text, setText] = useState(SAMPLE_REFLECTION);
  const [tradition, setTradition] = useState<Tradition>("quran");
  const [rtlTradition, setRtlTradition] = useState<Tradition>("quran");
  const [filters, setFilters] = useState<ReadonlySet<string>>(new Set(["loneliness"]));
  const [textSize, setTextSize] = useState(2);
  const ids = { hint: useId(), theme: useId(), motion: useId(), size: useId() };

  const traditions = [
    { value: "bible", label: t("tradition.bible") },
    { value: "quran", label: t("tradition.quran") },
  ] as const;

  function toggleFilter(key: string) {
    setFilters((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <>
      <Section n="01" title="Buttons" note="Pill shapes · 52 primary, 44 compact · one gradient button per screen">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card bordered className="flex flex-wrap items-center gap-3.5 p-8">
            <Button>
              {t("reflect.cta")}
              <ArrowRight size={18} strokeWidth={2} className="rtl:-scale-x-100" />
            </Button>
            <Button variant="secondary">{t("result.actions.showAnother")}</Button>
            <Button variant="ghost">{t("auth.guest")}</Button>
            <Button variant="secondary" icon aria-label={t("result.actions.save")}>
              <Bookmark size={22} />
            </Button>
            <Button variant="danger" size="sm">
              {t("detail.delete")}
            </Button>
            <Button disabled>{t("reflect.cta")}</Button>
          </Card>
          <div className="relative flex flex-wrap items-center gap-3.5 overflow-hidden rounded-card p-8">
            <Image
              src="/images/dawn-lake.jpg"
              alt=""
              fill
              loading="eager"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[center_70%]"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-[rgba(14,14,44,.35)]" />
            <Button className="relative">{t("onboarding.3.cta")}</Button>
            <Button variant="glass" className="relative">
              {t("result.actions.showAnother")}
            </Button>
            <Button variant="glass" icon className="relative" aria-label={t("result.actions.share")}>
              <Share size={22} />
            </Button>
            <span className="relative text-[13px] text-white/90">Glass buttons are used only on imagery.</span>
          </div>
        </div>
      </Section>

      <Section n="02" title="Reflection field" note="Soft white card, 28 radius · rings on focus">
        <div className="grid gap-5 rounded-sheet bg-sky p-7 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-2.5">
            <Caption>Empty</Caption>
            <Field
              compact
              label={t("reflect.fieldLabel")}
              placeholder={t("reflect.placeholder")}
              fieldClassName="h-[176px]"
              className="h-full"
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <Caption>Focused</Caption>
            <Field
              compact
              focused
              label={t("reflect.fieldLabel")}
              defaultValue="I moved to a new city for work"
              fieldClassName="h-[176px]"
              className="h-full"
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <Caption>Filled</Caption>
            <Field
              compact
              label={t("reflect.fieldLabel")}
              defaultValue={SAMPLE_REFLECTION}
              fieldClassName="h-[176px]"
              className="h-full"
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <Caption>Too short</Caption>
            <Field
              compact
              focused
              label={t("reflect.fieldLabel")}
              defaultValue="sad"
              aria-describedby={ids.hint}
              fieldClassName="h-[120px]"
              className="h-full"
            />
            <p id={ids.hint} className="rounded-2xl bg-accent-soft px-3.5 py-2.5 text-[13px] leading-[19px]">
              {t("reflect.tooShort")}
            </p>
          </div>
        </div>
        <div className="max-w-[740px]">
          <Field
            label={t("reflect.fieldLabel")}
            placeholder={t("reflect.placeholder")}
            value={text}
            onChange={(event) => setText(event.target.value)}
            footer={
              <>
                <button
                  type="button"
                  aria-disabled="true"
                  aria-label={t("reflect.voiceLabel")}
                  className="flex h-11 items-center gap-1.5 rounded-full bg-surface-2 pe-3.5 ps-2.5 text-[13px] font-bold text-ink-3"
                >
                  <Mic size={20} />
                  {t("reflect.voice")}
                </button>
                <span className="pe-2 text-[13px] text-ink-3">{t("reflect.wordCount", { n: countWords(text) })}</span>
              </>
            }
          />
        </div>
      </Section>

      <div className="grid gap-x-5 gap-y-[88px] lg:grid-cols-2">
        <Section n="03" title="Emotion chips">
          <Card bordered className="flex flex-col gap-[22px] p-7">
            <div className="flex flex-col gap-2.5">
              <Caption>What we noticed · read-only</Caption>
              <ul aria-label={t("result.noticed")} className="flex flex-wrap gap-2">
                <Chip as="li">{t("emotions.loneliness")}</Chip>
                <Chip as="li">{t("emotions.doubt")}</Chip>
                <NeedChip as="li">{t("needs.comfort")}</NeedChip>
              </ul>
              <span className="text-[13px] text-ink-3">
                Emotions are neutral grey; the need carries the gradient dot.
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              <Caption>Filters · 40 tall, 44 touch area</Caption>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((key) => (
                  <FilterChip key={key} pressed={filters.has(key)} onClick={() => toggleFilter(key)}>
                    {t(`emotions.${key}`)}
                  </FilterChip>
                ))}
              </div>
            </div>
          </Card>
        </Section>

        <Section n="04" title="Tradition selector">
          <Card bordered className="flex flex-col gap-[22px] p-7">
            <Segmented
              aria-label={t("tradition.pick")}
              options={traditions}
              value={tradition}
              onChange={setTradition}
              className="max-w-[380px]"
            />
            <div className="flex flex-col gap-2.5">
              <Caption>Small, as in Settings · drives this page&apos;s theme</Caption>
              <span id={ids.theme} className="sr-only">
                {t("settings.theme.label")}
              </span>
              <Segmented<ThemePreference>
                size="sm"
                aria-labelledby={ids.theme}
                options={[
                  { value: "system", label: t("settings.theme.system") },
                  { value: "light", label: t("settings.theme.light") },
                  { value: "dark", label: t("settings.theme.dark") },
                ]}
                value={theme}
                onChange={setTheme}
                className="max-w-[320px]"
              />
            </div>
          </Card>
        </Section>
      </div>

      <Section n="05" title="Scripture" note="Immersive on results · card in lists · reference and translation always visible">
        <div className="grid gap-5 lg:grid-cols-2">
          {(["bible", "quran"] as const).map((key) => (
            <div
              key={key}
              className="relative flex min-h-[440px] flex-col justify-center overflow-hidden rounded-sheet px-9 py-12"
            >
              <Image
                src={key === "bible" ? "/images/calm-sea.jpg" : "/images/misty-morning.jpg"}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="mv-drift object-cover"
              />
              <div aria-hidden="true" className="mv-scrim absolute inset-0" />
              <PassageView passage={SAMPLE_PASSAGES[key]} tone="onImage" className="relative" />
            </div>
          ))}
          {(["bible", "quran"] as const).map((key) => (
            <Card key={key} bordered className="flex px-7 pt-8 pb-[22px]">
              <PassageView passage={SAMPLE_PASSAGES[key]} className="w-full" />
            </Card>
          ))}
        </div>
      </Section>

      <Section n="06" title="Surfaces" note="Card · glass · glass on imagery · icon badge">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Card className="flex min-h-[200px] flex-col gap-3 p-6">
            <IconBadge>
              <ShieldCheck size={22} />
            </IconBadge>
            <Caption>Card</Caption>
          </Card>
          <Card bordered className="flex min-h-[200px] flex-col gap-3 p-6">
            <IconBadge className="size-16 rounded-[22px]">
              <WifiOff size={30} />
            </IconBadge>
            <Caption>Card · bordered, large badge</Caption>
          </Card>
          <div className="relative flex min-h-[200px] items-end overflow-hidden rounded-card p-5">
            <Image src="/images/soft-clouds.jpg" alt="" fill sizes="25vw" className="object-cover" />
            <GlassPanel className="relative rounded-[22px] px-4 py-3 text-sm font-bold">Glass</GlassPanel>
          </div>
          <div className="relative flex min-h-[200px] items-end overflow-hidden rounded-card p-5">
            <Image src="/images/starry-night.jpg" alt="" fill sizes="25vw" className="object-cover" />
            <GlassPanel variant="glass-dark" className="relative rounded-full px-3.5 py-2 text-xs font-extrabold tracking-[.12em] uppercase">
              {t("tradition.quran")}
            </GlassPanel>
          </div>
        </div>
      </Section>

      <div className="grid gap-x-5 gap-y-[88px] lg:grid-cols-2">
        <Section n="07" title="Controls" note="Toggle · slider">
          <Card bordered className="overflow-hidden">
            <div className="mv-row min-h-16 px-[22px] py-3">
              <span className="flex flex-col gap-0.5">
                <span id={ids.motion} className="text-[15px] font-bold">
                  {t("settings.motion.label")}
                </span>
                <span className="text-[13px] text-ink-3">{t("settings.motion.body")}</span>
              </span>
              <Toggle checked={gentleMotion} onCheckedChange={setGentleMotion} aria-labelledby={ids.motion} />
            </div>
            <div className="mv-row min-h-16 px-[22px] py-3">
              <span className="flex flex-col gap-0.5">
                <label htmlFor={ids.size} className="text-[15px] font-bold">
                  {t("settings.textSize.label")}
                </label>
                <span className="text-[13px] text-ink-3">{t("settings.textSize.body")}</span>
              </span>
              <Slider
                id={ids.size}
                min={1}
                max={5}
                step={1}
                value={textSize}
                onChange={(event) => setTextSize(Number(event.target.value))}
                valueText={TEXT_SIZES[textSize - 1]}
                rowClassName="w-[240px]"
              />
            </div>
          </Card>
        </Section>

        <Section n="08" title="Banner" note="Status, above the content">
          <Banner
            icon={<WifiOff size={22} />}
            title={t("reflect.offline.title")}
            action={
              <Button variant="secondary" size="sm">
                {t("reflect.offline.retry")}
              </Button>
            }
          >
            {t("reflect.offline.body")}
          </Banner>
          <Banner icon={<Heart size={22} />} title="Icon, title, body and an optional action" />
        </Section>
      </div>

      <div className="grid gap-x-5 gap-y-[88px] lg:grid-cols-2">
        <Section n="09" title="Wordmark">
          <Card bordered className="flex flex-wrap items-center gap-8 p-7">
            <Wordmark />
            <Wordmark size={40} />
            <Wordmark markOnly />
            <div className="relative overflow-hidden rounded-2xl px-5 py-4">
              <Image src="/images/starry-night.jpg" alt="" fill sizes="200px" className="object-cover" />
              <Wordmark tone="white" size={26} className="relative text-white" />
            </div>
          </Card>
        </Section>

        <Section n="10" title="RTL interface">
          <Card bordered dir="rtl" lang="ar" className="flex flex-col gap-4 p-7 font-arabic">
            <p className="text-[30px] leading-normal font-semibold">كيف تشعر الآن؟</p>
            <Field
              compact
              label="تأملك"
              placeholder="أشعر بـ…"
              className="h-[122px] px-5 py-4 font-arabic text-[20px] leading-[1.7]"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                aria-label="التقليد"
                options={[
                  { value: "bible", label: "الكتاب المقدس" },
                  { value: "quran", label: "القرآن الكريم" },
                ]}
                value={rtlTradition}
                onChange={setRtlTradition}
                className="grow"
              />
              <Button>
                ابحث عن آية
                <ArrowRight size={18} strokeWidth={2} className="rtl:-scale-x-100" />
              </Button>
            </div>
          </Card>
        </Section>
      </div>
    </>
  );
}
