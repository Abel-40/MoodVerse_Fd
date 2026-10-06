"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Info, Mic, WifiOff } from "lucide-react";

import { Banner } from "@/components/mv/Banner";
import { Button } from "@/components/mv/Button";
import { Field } from "@/components/mv/Field";
import { Greeting, RelativeDay, TodayDate } from "@/components/mv/LocalTime";
import { SceneImage } from "@/components/mv/SceneImage";
import { Segmented } from "@/components/mv/Segmented";
import { ShareCard } from "@/components/mv/ShareCard";
import { GlassPanel } from "@/components/mv/Surfaces";
import { useConnection } from "@/lib/client/connection";
import { VOICE_ENABLED, useDictation } from "@/lib/client/dictation";
import { countWords, isLongEnough, loadDraft, saveDraft, stagePendingReflection } from "@/lib/client/reflection-draft";
import { readDefaultTradition } from "@/lib/client/session";
import { cx } from "@/lib/cx";
import type { Passage, Tradition } from "@/lib/scripture";

interface LastReflection {
  id: number;
  createdAt: string;
  passage: Passage;
}

interface ReflectScreenProps {
  /** The account's default; null for guests, whose default lives in this browser. */
  accountTradition: Tradition | null;
  /** The newest reflection that found a passage, for the "Last time" rail. */
  last: LastReflection | null;
}

const noSubscription = () => () => {};
// Heights of the decorative level meter's bars while listening, in px.
const LEVELS = [10, 20, 28, 16, 24, 30, 18, 12];

function formatElapsed(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ReflectScreen({ accountTradition, last }: ReflectScreenProps) {
  const t = useTranslations();
  const router = useRouter();
  const ids = { hint: useId(), shortcut: useId(), rail: useId(), voiceTip: useId() };
  const field = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [askedTooSoon, setAskedTooSoon] = useState(false);
  const storedTradition = useSyncExternalStore(noSubscription, readDefaultTradition, () => null);
  const [picked, setPicked] = useState<Tradition | null>(null);
  const tradition = picked ?? accountTradition ?? storedTradition ?? "bible";
  const { online, retry } = useConnection();
  const dictation = useDictation();

  const words = countWords(text);
  const ready = isLongEnough(text);
  const showTooShort = askedTooSoon && !ready;

  // Restore an unsent reflection from this browser.
  useEffect(() => {
    let cancelled = false;
    loadDraft().then((draft) => {
      if (cancelled) return;
      if (draft) setText((current) => current || draft);
      setDraftLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the draft half a second behind the typing. Waits for the restore,
  // so an empty first render can't wipe a saved draft.
  useEffect(() => {
    if (!draftLoaded) return;
    const timer = window.setTimeout(() => saveDraft(text), 500);
    return () => window.clearTimeout(timer);
  }, [text, draftLoaded]);

  // Grow with the text up to half the viewport, then scroll.
  useLayoutEffect(() => {
    const element = field.current;
    if (!element) return;
    element.style.height = "auto";
    const limit = window.innerHeight * 0.5;
    element.style.height = `${Math.min(element.scrollHeight, limit)}px`;
    element.style.overflowY = element.scrollHeight > limit ? "auto" : "hidden";
  }, [text, dictation.listening]);

  // Screen readers hear the word count, but at most every two seconds.
  const [announced, setAnnounced] = useState(words);
  const lastAnnounced = useRef(0);
  useEffect(() => {
    const wait = Math.max(0, 2000 - (Date.now() - lastAnnounced.current));
    const timer = window.setTimeout(() => {
      lastAnnounced.current = Date.now();
      setAnnounced(words);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [words]);

  function submit() {
    if (dictation.listening) return;
    if (!ready) {
      setAskedTooSoon(true);
      field.current?.focus();
      return;
    }
    if (!online) return;
    // Keep the words even if the debounce hasn't run, so Cancel and
    // "Edit reflection" always come back to them.
    void saveDraft(text);
    // The text travels in sessionStorage, never in the URL.
    stagePendingReflection({ text: text.trim(), tradition });
    router.push("/reflect/finding");
  }

  function onFieldKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
  }

  function stopListening() {
    const heard = dictation.finish();
    if (heard) setText((current) => (current.trim() ? `${current.trim()} ${heard}` : heard));
  }

  // The field comes back once the recogniser has actually stopped; put the
  // cursor in it then, so editing the transcript is one keystroke away.
  const wasListening = useRef(false);
  useEffect(() => {
    if (wasListening.current && !dictation.listening) field.current?.focus();
    wasListening.current = dictation.listening;
  }, [dictation.listening]);

  const voiceAvailable = VOICE_ENABLED && dictation.supported;
  const voiceButton = voiceAvailable ? (
    <button
      type="button"
      onClick={dictation.start}
      aria-label={t("reflect.voiceStartLabel")}
      className="flex h-11 items-center gap-1.5 rounded-full bg-surface-2 pe-3.5 ps-2.5 text-[13px] font-bold text-ink-2 transition-colors hover:text-ink"
    >
      <Mic size={20} />
      {t("reflect.voiceStart")}
    </button>
  ) : (
    <span className="group relative">
      <button
        type="button"
        aria-disabled="true"
        aria-describedby={ids.voiceTip}
        className="flex h-11 cursor-default items-center gap-1.5 rounded-full bg-surface-2 pe-3.5 ps-2.5 text-[13px] font-bold text-ink-3"
      >
        <Mic size={20} />
        {t("reflect.voice")}
      </button>
      <span
        id={ids.voiceTip}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full start-0 mb-2 rounded-xl bg-ink px-3 py-2 text-xs font-semibold whitespace-nowrap text-bg opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {VOICE_ENABLED ? t("reflect.voiceUnavailable") : t("reflect.voiceLabel")}
      </span>
    </span>
  );

  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[440px] overflow-hidden">
        <SceneImage
          src="/images/band-misty.jpg"
          preload
          loading="eager"
          sizes="(max-width: 900px) 100vw, calc(100vw - 256px)"
          className="object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_10%,var(--mv-bg)_92%)]" />
      </div>

      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] gap-8 px-[clamp(24px,4vw,64px)] pt-[clamp(36px,6vh,72px)] pb-12 max-[1180px]:grid-cols-1">
        <div className="flex justify-center">
          <div className="flex w-full max-w-[740px] flex-col gap-[22px]">
            {!online && (
              <Banner
                icon={<WifiOff size={22} />}
                title={t("reflect.offline.title")}
                action={
                  <Button variant="secondary" size="sm" onClick={retry}>
                    {t("reflect.offline.retry")}
                  </Button>
                }
              >
                {t("reflect.offline.body")}
              </Banner>
            )}

            <GlassPanel as="span" className="flex h-9 items-center self-start rounded-full px-3.5 text-sm font-bold">
              <TodayDate />
            </GlassPanel>
            <div className="flex flex-col gap-2">
              <Greeting
                labels={{
                  morning: t("reflect.greeting.morning"),
                  afternoon: t("reflect.greeting.afternoon"),
                  evening: t("reflect.greeting.evening"),
                }}
                className="text-[17px] font-bold text-ink dark:text-white"
              />
              <h1 className="font-serif text-[clamp(44px,4.4vw,64px)] leading-[1.02] font-medium tracking-[-0.025em] text-ink dark:text-white">
                {t.rich("reflect.title", { accent: (chunks) => <span className="mv-grad-text">{chunks}</span> })}
              </h1>
            </div>

            {dictation.listening ? (
              <>
                {/* The live transcript; lighter words may still change. */}
                <div aria-live="polite" className="mv-field is-focus flex flex-col">
                  <p dir="auto" className="min-h-[200px] px-[26px] pt-6 pb-2 text-[19px] leading-[29px]">
                    {text.trim() && `${text.trim()} `}
                    {dictation.finalText}
                    {dictation.interimText && <span className="text-ink-3"> {dictation.interimText}</span>}
                    <span aria-hidden="true" className="mv-caret" />
                  </p>
                  <div className="flex items-center gap-3.5 pt-2.5 pe-3 pb-3 ps-[18px]">
                    <span className="flex items-center gap-2 text-sm font-extrabold text-primary">
                      <span aria-hidden="true" className="mv-breathe size-2 rounded-full bg-grad [animation-duration:2s]" />
                      <span role="status">{t("reflect.listening")}</span>
                      <span aria-hidden="true">{t("reflect.listeningTime", { time: formatElapsed(dictation.elapsedSeconds) })}</span>
                    </span>
                    <span aria-hidden="true" className="flex h-8 grow items-center gap-1">
                      {LEVELS.map((height, index) => (
                        <span
                          key={index}
                          className="mv-level-bar"
                          style={{ height, animationDelay: `${-((index * 0.7) % 2.2).toFixed(1)}s` }}
                        />
                      ))}
                    </span>
                    <Button size="sm" onClick={stopListening}>
                      <span aria-hidden="true" className="size-3 rounded-[3px] bg-current" />
                      {t("reflect.done")}
                    </Button>
                  </div>
                </div>
                <p className="text-[13px] text-ink-3">{t("reflect.voiceNote")}</p>
              </>
            ) : (
              <Field
                ref={field}
                label={t("reflect.fieldLabel")}
                placeholder={t("reflect.placeholder")}
                dir="auto"
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={onFieldKeyDown}
                aria-describedby={cx(showTooShort && ids.hint, ids.shortcut) || undefined}
                footer={
                  <>
                    {voiceButton}
                    <span className="pe-2 text-[13px] text-ink-3">
                      {online ? t("reflect.wordCount", { n: words }) : t("reflect.offline.saved")}
                    </span>
                  </>
                }
              />
            )}
            <span id={ids.shortcut} className="sr-only">
              {t("reflect.submitHint")}
            </span>
            <span aria-live="polite" className="sr-only">
              {t("reflect.wordCount", { n: announced })}
            </span>

            {showTooShort && (
              <p
                id={ids.hint}
                role="status"
                className="mv-fade-in flex gap-2.5 rounded-[18px] bg-accent-soft px-4 py-3 text-[15px] leading-[22px]"
              >
                <Info size={20} className="mt-px shrink-0 text-primary" />
                {t("reflect.tooShort")}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Segmented
                aria-label={t("tradition.pick")}
                options={[
                  { value: "bible", label: t("tradition.bible") },
                  { value: "quran", label: t("tradition.quran") },
                ]}
                value={tradition}
                onChange={setPicked}
                className="w-[340px] max-w-full"
              />
              {!dictation.listening &&
                (online ? (
                  // Stays operable while too short, so pressing it can explain why.
                  <Button aria-disabled={!ready || undefined} onClick={submit} className="h-14 px-[30px]">
                    {t("reflect.cta")}
                    {ready && <ArrowRight size={18} strokeWidth={2} className="rtl:-scale-x-100" />}
                  </Button>
                ) : (
                  <Button aria-disabled="true" className="h-14 px-[30px]">
                    {t("reflect.offline.waiting")}
                  </Button>
                ))}
            </div>
          </div>
        </div>

        {last && (
          <section aria-labelledby={ids.rail} className="mv-rail flex w-[300px] flex-col gap-3.5 pt-[58px]">
            <h2 id={ids.rail} className="mv-overline text-ink-3">
              {t.rich("reflect.lastTime", {
                day: () => (
                  <RelativeDay
                    iso={last.createdAt}
                    labels={{ today: t("reflect.today"), yesterday: t("reflect.yesterday") }}
                  />
                ),
              })}
            </h2>
            <Link
              href={`/r/${last.id}`}
              aria-label={t("reflect.lastLink", { reference: last.passage.reference })}
              className="block overflow-hidden rounded-card shadow-sheet"
            >
              <ShareCard
                passage={last.passage}
                background={last.passage.tradition === "quran" ? "misty" : "dawn"}
                width={300}
              />
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
