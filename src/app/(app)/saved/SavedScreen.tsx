"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bookmark, Share } from "lucide-react";

import { ButtonLink } from "@/components/mv/Button";
import { Segmented } from "@/components/mv/Segmented";
import { ShareCard } from "@/components/mv/ShareCard";
import { IconBadge } from "@/components/mv/Surfaces";
import { Toast } from "@/components/mv/Toast";
import { useSaved, useToggleSave } from "@/lib/api/hooks";
import { dayName } from "@/lib/client/dates";
import type { SavedItem } from "@/lib/client/saved-store";
import { cardFileName, renderCardPng, shareBlob } from "@/lib/client/share-export";
import type { Tradition } from "@/lib/scripture";

type Filter = "all" | Tradition;
const CARD_WIDTH = 225;

export function SavedScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const saved = useSaved();
  const toggle = useToggleSave();
  const [filter, setFilter] = useState<Filter>("all");
  const [sharing, setSharing] = useState<SavedItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const exportNode = useRef<HTMLDivElement>(null);

  const items = saved.data ?? [];
  const shown = filter === "all" ? items : items.filter((item) => item.passage.tradition === filter);

  // Share straight from the grid: render the stored card off screen, then
  // hand the PNG to the share sheet (or download it).
  useEffect(() => {
    if (!sharing) return;
    const node = exportNode.current?.firstElementChild;
    if (!(node instanceof HTMLElement)) return;
    let cancelled = false;
    renderCardPng(node)
      .then((blob) => shareBlob(blob, cardFileName(sharing.passage.reference), sharing.passage.reference))
      .catch((error: unknown) => {
        if (!cancelled && !(error instanceof DOMException && error.name === "AbortError")) setToast(t("share.failed"));
      })
      .finally(() => {
        if (!cancelled) setSharing(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sharing, t]);

  function unsave(item: SavedItem) {
    toggle.mutate({ passage: item.passage, background: item.background, reflectionId: item.reflectionId });
    setToast(t("saved.removed"));
  }

  return (
    <div className="mv-sky-wash min-h-full">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6 px-[clamp(24px,4vw,56px)] pt-9 pb-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-serif text-[46px] leading-none font-medium tracking-[-0.02em]">{t("saved.title")}</h1>
            <span className="text-sm text-ink-3">{t("saved.summary", { n: items.length })}</span>
          </div>
          <Segmented<Filter>
            size="sm"
            aria-label={t("history.traditionLabel")}
            options={[
              { value: "all", label: t("history.all") },
              { value: "bible", label: t("tradition.bible") },
              { value: "quran", label: t("tradition.quran") },
            ]}
            value={filter}
            onChange={setFilter}
            className="w-[360px] max-w-full"
          />
        </div>

        <ul aria-label={t("saved.listLabel")} className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
          {shown.map((item) => {
            const quran = item.passage.tradition === "quran";
            const translation = item.passage.translationShort ?? item.passage.translation;
            const editor = item.reflectionId
              ? `/r/${item.reflectionId}/share?p=${encodeURIComponent(item.passage.id)}`
              : null;
            const card = <ShareCard passage={item.passage} background={item.background} width={CARD_WIDTH} />;
            return (
              <li key={item.passage.id} className="flex flex-col gap-3">
                <div className="relative w-fit">
                  <div className="overflow-hidden rounded-3xl shadow-sheet">{card}</div>
                  {editor && (
                    <Link
                      href={editor}
                      aria-label={t("saved.open", { reference: item.passage.reference })}
                      className="absolute inset-0 rounded-3xl"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between" style={{ width: CARD_WIDTH }}>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-extrabold">{item.passage.reference}</span>
                    <span className="text-[13px] text-ink-3">
                      {t("saved.meta", {
                        translation: quran ? item.passage.translation : translation,
                        day: dayName(item.savedAt, locale, { today: t("saved.today"), yesterday: t("saved.yesterday") }),
                      })}
                    </span>
                  </div>
                  <div className="flex shrink-0">
                    <button
                      type="button"
                      aria-label={t("saved.share")}
                      aria-disabled={sharing !== null || undefined}
                      onClick={() => sharing === null && setSharing(item)}
                      className="flex size-11 items-center justify-center rounded-xl text-ink-2"
                    >
                      <Share size={20} />
                    </button>
                    <button
                      type="button"
                      aria-label={t("saved.remove")}
                      onClick={() => unsave(item)}
                      className="flex size-11 items-center justify-center rounded-xl text-primary"
                    >
                      <Bookmark size={20} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
          <li
            className="flex flex-col items-center justify-center gap-3 rounded-3xl p-6 text-center shadow-[inset_0_0_0_2px_var(--mv-line)]"
            style={{ width: CARD_WIDTH, height: (CARD_WIDTH * 16) / 9 }}
          >
            <IconBadge>
              <Bookmark size={22} />
            </IconBadge>
            <p className="text-sm leading-[21px] text-ink-2">{t("saved.tile")}</p>
            <ButtonLink href="/reflect" variant="secondary" size="sm">
              {t("saved.newReflection")}
            </ButtonLink>
          </li>
        </ul>
      </div>

      {sharing && (
        <div ref={exportNode} aria-hidden="true" inert className="pointer-events-none fixed top-0 -left-[10000px]">
          <ShareCard passage={sharing.passage} background={sharing.background} width={360} forExport />
        </div>
      )}
      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}
