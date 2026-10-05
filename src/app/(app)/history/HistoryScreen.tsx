"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, Lock, Search, Trash2 } from "lucide-react";

import { Button, ButtonLink } from "@/components/mv/Button";
import { FilterChip } from "@/components/mv/Chip";
import { ConfirmDialog } from "@/components/mv/ConfirmDialog";
import { EmptyState } from "@/components/mv/EmptyState";
import { FeedbackBox, readFeedback } from "@/components/mv/FeedbackBox";
import { SceneImage } from "@/components/mv/SceneImage";
import { Segmented } from "@/components/mv/Segmented";
import { Card } from "@/components/mv/Surfaces";
import { Toast } from "@/components/mv/Toast";
import { useWhySentence } from "@/components/mv/WhyCard";
import { apiFetch } from "@/lib/api/client";
import { queryKeys, useDeleteReflection, useFeedback, useHistory, useReflection } from "@/lib/api/hooks";
import type { Emotion, Reflection, ReflectionDto } from "@/lib/api/types";
import { longDateTime, rowTime } from "@/lib/client/dates";
import { cx } from "@/lib/cx";
import type { Tradition } from "@/lib/scripture";

const FILTER_EMOTIONS: Emotion[] = ["loneliness", "anxiety", "grief", "doubt", "weariness", "hope", "overwhelm"];
// Each tradition keeps its own landscapes; rows alternate between them.
const THUMBNAILS: Record<Tradition, string[]> = {
  bible: ["/images/calm-sea.jpg", "/images/dawn-lake.jpg"],
  quran: ["/images/misty-morning.jpg", "/images/golden-hills.jpg"],
};
const PANEL_IMAGE: Record<Tradition, string> = { bible: "/images/calm-sea.jpg", quran: "/images/misty-morning.jpg" };

type TraditionFilter = "all" | Tradition;

function matches(reflection: Reflection, query: string, tradition: TraditionFilter, emotions: ReadonlySet<Emotion>) {
  if (tradition !== "all" && reflection.tradition !== tradition) return false;
  if (emotions.size > 0 && !reflection.emotions.some((emotion) => emotions.has(emotion))) return false;
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  const passage = reflection.passages[0];
  return [reflection.text, passage?.text, passage?.reference].some((field) => field?.toLocaleLowerCase().includes(needle));
}

export function HistoryScreen({ selectedId, guest }: { selectedId: number | null; guest: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const ids = { title: useId(), search: useId() };
  const history = useHistory(!guest);
  const remove = useDeleteReflection();
  const [query, setQuery] = useState("");
  const [tradition, setTradition] = useState<TraditionFilter>("all");
  const [emotions, setEmotions] = useState<ReadonlySet<Emotion>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const sentinel = useRef<HTMLDivElement>(null);

  const all = useMemo(
    () => (history.data ?? []).filter((reflection) => reflection.status === "completed" && reflection.passages.length > 0),
    [history.data],
  );
  const shown = useMemo(() => all.filter((reflection) => matches(reflection, query, tradition, emotions)), [all, query, tradition, emotions]);
  const fromList = selectedId === null ? shown[0] : all.find((reflection) => reflection.id === selectedId);
  // A deep link to a reflection that isn't loaded in the list yet.
  const direct = useReflection(selectedId !== null && !fromList ? selectedId : null);
  const selected = fromList ?? direct.data;

  // Load the next page as the end of the list scrolls into view.
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = history;
  useEffect(() => {
    const element = sentinel.current;
    if (!element || !hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && !isFetchingNextPage) fetchNextPage();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function prefetch(id: number) {
    queryClient.prefetchQuery({
      queryKey: queryKeys.reflection(id),
      queryFn: () => apiFetch<ReflectionDto>(`api/v1/reflections/${id}`),
    });
  }

  function clearFilters() {
    setQuery("");
    setTradition("all");
    setEmotions(new Set());
  }

  async function confirmDelete() {
    if (pendingDelete === null) return;
    const id = pendingDelete;
    try {
      const outcome = await remove.mutateAsync(id);
      setToast(outcome === "deleted" ? t("history.deleted") : t("history.deleteUnavailable"));
      if (outcome === "deleted" && selectedId === id) router.push("/history");
    } catch {
      setToast(t("history.deleteUnavailable"));
    } finally {
      setPendingDelete(null);
    }
  }

  const loading = !guest && history.isPending;
  const empty = guest || (!loading && all.length === 0);

  if (empty) {
    return (
      <div className="mv-sky-wash flex min-h-full flex-col">
        <div className="flex items-end justify-between px-[clamp(24px,4vw,56px)] pt-9">
          <h1 className="font-serif text-[46px] leading-none font-medium tracking-[-0.02em]">{t("history.title")}</h1>
          <span className="flex items-center gap-1.5 pb-1.5 text-[13px] font-semibold text-ink-3">
            <Lock size={16} />
            {t("history.private")}
          </span>
        </div>
        <EmptyState
          className="grow"
          title={t("history.empty.title")}
          body={t("history.empty.body")}
          action={<ButtonLink href="/reflect">{t("history.empty.cta")}</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="mv-split-list min-[901px]:h-full">
      <section
        aria-labelledby={ids.title}
        className={cx(
          "mv-sky-wash flex flex-col gap-4 overflow-y-auto px-[26px] pt-9 pb-10 border-e border-line min-[901px]:h-full",
          selectedId !== null && "max-[1180px]:hidden",
        )}
      >
        <div className="flex items-end justify-between">
          <h1 id={ids.title} className="font-serif text-[46px] leading-none font-medium tracking-[-0.02em]">
            {t("history.title")}
          </h1>
          <span className="pb-1.5 text-[13px] font-semibold text-ink-3">{t("history.count", { n: all.length })}</span>
        </div>

        <div className="relative">
          <label htmlFor={ids.search} className="sr-only">
            {t("history.searchLabel")}
          </label>
          <Search size={20} aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            id={ids.search}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("history.search")}
            className="h-12 w-full rounded-full bg-surface ps-12 pe-4 text-[15px] shadow-card"
          />
        </div>

        <Segmented<TraditionFilter>
          size="sm"
          aria-label={t("history.traditionLabel")}
          options={[
            { value: "all", label: t("history.all") },
            { value: "bible", label: t("tradition.bible") },
            { value: "quran", label: t("tradition.quran") },
          ]}
          value={tradition}
          onChange={setTradition}
        />

        <div role="group" aria-label={t("history.emotionLabel")} className="flex flex-wrap gap-2">
          {FILTER_EMOTIONS.map((emotion) => (
            <FilterChip
              key={emotion}
              pressed={emotions.has(emotion)}
              onClick={() =>
                setEmotions((current) => {
                  const next = new Set(current);
                  if (next.has(emotion)) next.delete(emotion);
                  else next.add(emotion);
                  return next;
                })
              }
            >
              {t(`emotions.${emotion}`)}
            </FilterChip>
          ))}
        </div>

        {loading ? (
          <div role="status" className="mt-1 flex flex-col gap-2.5">
            <span className="sr-only">{t("history.loadingList")}</span>
            {[0, 1, 2, 3].map((key) => (
              <div key={key} aria-hidden="true" className="flex gap-3.5 rounded-[22px] bg-surface py-3 ps-3 pe-[52px] shadow-card">
                <span className="mv-skeleton h-[76px] w-14 shrink-0 rounded-[14px]" />
                <span className="flex grow flex-col justify-center gap-2.5">
                  <span className="mv-skeleton h-2.5 w-28" />
                  <span className="mv-skeleton h-3 w-full" />
                  <span className="mv-skeleton h-3.5 w-36" />
                </span>
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className="mt-6 text-center text-[15px] text-ink-2">
            {t("history.noMatch")}{" "}
            <button type="button" onClick={clearFilters} className="font-bold text-primary underline-offset-2 hover:underline">
              {t("history.clear")}
            </button>
          </p>
        ) : (
          <ol aria-label={t("history.listLabel")} className="mt-1 flex flex-col gap-2.5">
            {shown.map((reflection) => {
              const passage = reflection.passages[0];
              const current = reflection.id === selected?.id;
              return (
                <li key={reflection.id} className="group relative">
                  <Link
                    href={`/history/${reflection.id}`}
                    aria-current={current ? "true" : undefined}
                    onPointerEnter={() => prefetch(reflection.id)}
                    onFocus={() => prefetch(reflection.id)}
                    className={cx(
                      "flex gap-3.5 rounded-[22px] bg-surface py-3 ps-3 pe-[52px] text-start",
                      current
                        ? "shadow-[inset_0_0_0_2px_var(--mv-primary),0_16px_36px_-16px_rgba(47,91,234,.45)]"
                        : "shadow-card",
                    )}
                  >
                    <span className="relative h-[76px] w-14 shrink-0 overflow-hidden rounded-[14px]">
                      <Image
                        src={THUMBNAILS[reflection.tradition][reflection.id % 2]}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </span>
                    <span className="flex min-w-0 flex-col gap-[5px]">
                      <span className="flex items-center gap-2.5">
                        <span className="text-[11px] font-extrabold tracking-[.12em] text-primary uppercase">
                          {t(`tradition.${reflection.tradition}`)}
                        </span>
                        <span className="text-xs text-ink-3">
                          {rowTime(reflection.createdAt, locale, {
                            today: (time) => t("history.today", { time }),
                            yesterday: (time) => t("history.yesterday", { time }),
                          })}
                        </span>
                      </span>
                      <span dir="auto" className="line-clamp-2 text-sm leading-5 text-ink-2">{reflection.text}</span>
                      <span className="font-serif text-[17px] font-semibold">{passage.reference}</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label={t("history.deleteRow")}
                    onClick={() => setPendingDelete(reflection.id)}
                    className="absolute end-2 top-2 flex size-11 items-center justify-center rounded-[14px] bg-[rgba(180,35,42,.08)] text-danger opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        <div ref={sentinel} aria-hidden="true" />
        {isFetchingNextPage && (
          <p role="status" className="text-center text-[13px] text-ink-3">
            {t("history.loading")}
          </p>
        )}
      </section>

      <section
        aria-label={t("history.detailLabel")}
        className={cx(
          "flex flex-col gap-6 overflow-y-auto px-[clamp(28px,4vw,64px)] pt-9 pb-12 min-[901px]:h-full max-[600px]:px-5",
          selectedId === null && "max-[1180px]:hidden",
        )}
      >
        {selectedId !== null && (
          <ButtonLink href="/history" variant="ghost" className="-ms-2 self-start ps-1 text-ink min-[1181px]:hidden">
            <ChevronLeft size={20} className="rtl:-scale-x-100" />
            {t("history.back")}
          </ButtonLink>
        )}
        {selected && <Detail reflection={selected} onDelete={() => setPendingDelete(selected.id)} />}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("history.deleteTitle")}
        body={t("history.deleteBody")}
        confirmLabel={t("history.delete")}
        cancelLabel={t("history.cancel")}
        busy={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}

function Detail({ reflection, onDelete }: { reflection: Reflection; onDelete: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const passage = reflection.passages[0];
  const why = useWhySentence(reflection.why, reflection.emotions, reflection.need);
  const sendFeedback = useFeedback(reflection.id);
  const [changingFeedback, setChangingFeedback] = useState(false);
  const [, rerender] = useState(0);
  const feedback = typeof window === "undefined" ? null : readFeedback(reflection.id, passage.id);
  const quran = passage.tradition === "quran";
  const translation = quran ? t("passage.translationName", { name: passage.translation }) : passage.translation;
  const noticed = [
    ...reflection.emotions.map((emotion) => t(`emotions.${emotion}`)),
    ...(reflection.need ? [t(`needs.${reflection.need}`)] : []),
  ].join(" · ");

  return (
    <>
      <div className="flex max-w-[760px] items-start justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <span className="mv-overline text-ink-3">{longDateTime(reflection.createdAt, locale)}</span>
          {reflection.text && (
            <p dir="auto" className="font-serif text-[calc(24px*var(--mv-text-scale,1))] leading-[1.4] text-ink italic">“{reflection.text}”</p>
          )}
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-3">
            <Lock size={16} />
            {t("history.onlyYou")}
          </span>
        </div>
        <Button variant="danger" size="sm" className="shrink-0" onClick={onDelete}>
          {t("history.delete")}
        </Button>
      </div>

      <figure
        aria-label={t("passage.label", { reference: passage.reference, translation })}
        className="relative flex min-h-[360px] max-w-[760px] flex-col justify-end gap-4 overflow-hidden rounded-sheet p-10 text-white max-[600px]:p-7"
      >
        <SceneImage
          src={PANEL_IMAGE[passage.tradition]}
          loading="eager"
          sizes="(max-width: 1180px) 100vw, 760px"
          className="object-cover"
        />
        <div aria-hidden="true" className="mv-scrim absolute inset-0" />
        <span className="relative text-xs font-extrabold tracking-[.14em] uppercase opacity-92">
          {t(`tradition.${passage.tradition}`)}
        </span>
        <div className="relative flex flex-col gap-3 [text-shadow:0_1px_16px_rgba(8,10,30,.35)]">
          {quran && passage.arabic && (
            <p lang="ar" dir="rtl" className="text-start font-arabic text-[calc(30px*var(--mv-text-scale,1))] leading-[1.9] font-medium">
              {passage.arabic}
            </p>
          )}
          <blockquote
            lang="en"
            dir="ltr"
            className={cx(
              "font-serif font-medium",
              quran ? "text-[calc(24px*var(--mv-text-scale,1))] leading-[1.38] italic" : "text-[calc(32px*var(--mv-text-scale,1))] leading-[1.3]",
            )}
          >
            {passage.text}
          </blockquote>
        </div>
        <figcaption className="relative flex flex-wrap items-center gap-2.5">
          <cite className="text-[13px] font-extrabold tracking-[.12em] uppercase not-italic">{passage.reference}</cite>
          <span className="text-[13px] opacity-90">{translation}</span>
        </figcaption>
      </figure>

      <div className="grid max-w-[760px] grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-4">
        <Card bordered as="section" className="flex flex-col gap-2 p-[22px]">
          <h2 className="mv-overline">{t("result.why")}</h2>
          {why && <p className="text-[15px] leading-6 text-ink-2">{why}</p>}
          {noticed && <p className="text-[13px] font-semibold text-ink-3">{noticed}</p>}
        </Card>
        <Card bordered as="section" className="flex flex-col gap-3 p-[22px]">
          <h2 className="mv-overline">{t("history.yourFeedback")}</h2>
          {changingFeedback ? (
            <FeedbackBox
              reflectionId={reflection.id}
              passageId={passage.id}
              onAnswer={(answer) => {
                sendFeedback.mutate({
                  passageId: passage.id,
                  helped: answer.helped,
                  reason: answer.helped ? undefined : answer.reason,
                });
                // "Not quite" stays open for an optional reason.
                if (answer.helped || answer.reason) setChangingFeedback(false);
                rerender((count) => count + 1);
              }}
              className="bg-transparent p-0"
            />
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-extrabold">
                {feedback
                  ? feedback.helped
                    ? t("result.feedback.helped")
                    : t("result.feedback.notQuite")
                  : t("history.noFeedback")}
              </p>
              <Button variant="ghost" size="sm" className="px-2 text-sm" onClick={() => setChangingFeedback(true)}>
                {t("result.feedback.change")}
              </Button>
            </div>
          )}
          <ButtonLink
            href={`/r/${reflection.id}/share?p=${encodeURIComponent(passage.id)}`}
            variant="secondary"
            size="sm"
            className="self-start"
          >
            {t("history.makeCard")}
          </ButtonLink>
        </Card>
      </div>
    </>
  );
}
