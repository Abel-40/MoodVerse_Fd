"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type DragEvent, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, Copy, Download, ImagePlus, Lock, Share } from "lucide-react";

import { Button, ButtonLink } from "@/components/mv/Button";
import { Segmented } from "@/components/mv/Segmented";
import { SHARE_BACKGROUNDS, ShareCard, shareBackgroundImage, type PhotoFrame, type ShareBackground } from "@/components/mv/ShareCard";
import { Slider } from "@/components/mv/Slider";
import { Card } from "@/components/mv/Surfaces";
import { Toast } from "@/components/mv/Toast";
import { Toggle } from "@/components/mv/Toggle";
import { useReflection, useSaved, useUpdateSavedBackground } from "@/lib/api/hooks";
import {
  cardFileName,
  copyBlob,
  downloadBlob,
  readLastBackground,
  rememberBackground,
  renderCardPng,
  shareBlob,
} from "@/lib/client/share-export";
import { cx } from "@/lib/cx";

type Tone = "light" | "dark";

// Swatch fills for the backgrounds without a landscape.
const SWATCH: Partial<Record<ShareBackground, string>> = {
  transparent: "repeating-conic-gradient(#C9CEDC 0% 25%, #FFFFFF 0% 50%) 0 0 / 12px 12px",
  sky: "linear-gradient(160deg, #2F5BEA, #8B6CF0)",
  daybreak: "linear-gradient(180deg, #FFE6D2, #FFD0D9 50%, #D8CEFF)",
  midnight: "radial-gradient(90% 55% at 50% 100%, #2B2F7A, #0A0F1F)",
  clean: "#FFFFFF",
};

const PREVIEW_WIDTH = 320;
const DEFAULT_FRAME: PhotoFrame = { x: 50, y: 50, zoom: 1 };
const noSubscription = () => () => {};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function ShareEditor({ id, passageId }: { id: number; passageId: string | null }) {
  const t = useTranslations();
  const ids = { background: useId(), tone: useId(), size: useId(), attribution: useId(), note: useId() };
  const { data: reflection } = useReflection(id);
  const saved = useSaved();
  const updateSavedBackground = useUpdateSavedBackground();
  const lastBackground = useSyncExternalStore(noSubscription, readLastBackground, () => null);

  const [picked, setPicked] = useState<ShareBackground | null>(null);
  const [tone, setTone] = useState<Tone>("light");
  const [textScale, setTextScale] = useState(1);
  const [showAttribution, setShowAttribution] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [frame, setFrame] = useState<PhotoFrame>(DEFAULT_FRAME);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const clearToast = useCallback(() => setToast(null), []);
  const fileInput = useRef<HTMLInputElement>(null);
  const exportNode = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const tiles = useRef<Array<HTMLButtonElement | null>>([]);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  const passage = reflection?.passages.find((item) => item.id === passageId) ?? reflection?.passages[0];
  const savedItem = saved.data?.find((item) => item.passage.id === passage?.id);
  const fallback: ShareBackground = passage?.tradition === "quran" ? "misty" : "dawn";
  const background: ShareBackground = picked ?? savedItem?.background ?? lastBackground ?? fallback;
  const editingPhoto = background === "photo" && photoUrl !== null;
  const userPicksTone = background === "transparent" || background === "photo";

  // The photo never leaves this browser; let go of it when it's replaced or we leave.
  useEffect(() => {
    if (!photoUrl) return;
    return () => URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  const choose = useCallback(
    (next: ShareBackground) => {
      setPicked(next);
      rememberBackground(next);
      if (savedItem && next !== "photo") {
        updateSavedBackground.mutate({ passageId: savedItem.passage.id, background: next });
      }
    },
    [savedItem, updateSavedBackground],
  );

  function loadPhoto(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setPhotoUrl(URL.createObjectURL(file));
    setFrame(DEFAULT_FRAME);
    choose("photo");
  }

  function onTileClick(next: ShareBackground) {
    if (next === "photo" && (!photoUrl || background === "photo")) fileInput.current?.click();
    else choose(next);
  }

  function onTileKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = { ArrowRight: 1, ArrowDown: 6, ArrowLeft: -1, ArrowUp: -6 }[event.key];
    const last = SHARE_BACKGROUNDS.length - 1;
    let next: number | null = null;
    if (step !== undefined) {
      const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
      const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
      next = clamp(index + (rtl && horizontal ? -step : step), 0, last);
    } else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    tiles.current[next]?.focus();
    // Moving onto "Photo" without a photo just focuses it; Enter opens the picker.
    const target = SHARE_BACKGROUNDS[next];
    if (target !== "photo" || photoUrl) choose(target);
  }

  // Dropping an image anywhere on the editor uses it as the photo.
  function onDrop(event: DragEvent) {
    event.preventDefault();
    loadPhoto(event.dataTransfer.files[0]);
  }

  // Reposition and zoom the photo: drag, pinch, wheel or keys.
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!editingPhoto) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous || !editingPhoto) return;
    const others = [...pointers.current.entries()].filter(([pointer]) => pointer !== event.pointerId);
    if (others.length === 1) {
      const [, other] = others[0];
      const before = Math.hypot(previous.x - other.x, previous.y - other.y);
      const after = Math.hypot(event.clientX - other.x, event.clientY - other.y);
      if (before > 0) setFrame((current) => ({ ...current, zoom: clamp(current.zoom * (after / before), 1, 3) }));
    } else {
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      setFrame((current) => ({
        ...current,
        x: clamp(current.x - (dx / PREVIEW_WIDTH) * (100 / current.zoom), 0, 100),
        y: clamp(current.y - (dy / ((PREVIEW_WIDTH * 16) / 9)) * (100 / current.zoom), 0, 100),
      }));
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
  }

  function onPreviewKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!editingPhoto) return;
    const move: Record<string, [number, number]> = { ArrowLeft: [2, 0], ArrowRight: [-2, 0], ArrowUp: [0, 2], ArrowDown: [0, -2] };
    if (move[event.key]) {
      event.preventDefault();
      const [dx, dy] = move[event.key];
      setFrame((current) => ({ ...current, x: clamp(current.x + dx, 0, 100), y: clamp(current.y + dy, 0, 100) }));
    } else if (event.key === "+" || event.key === "=" || event.key === "-") {
      event.preventDefault();
      const delta = event.key === "-" ? -0.1 : 0.1;
      setFrame((current) => ({ ...current, zoom: clamp(current.zoom + delta, 1, 3) }));
    }
  }

  // React's wheel listener is passive, so attach one that may cancel scrolling.
  useEffect(() => {
    const element = preview.current;
    if (!element || !editingPhoto) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setFrame((current) => ({ ...current, zoom: clamp(current.zoom - event.deltaY * 0.0015, 1, 3) }));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [editingPhoto]);

  const render = useCallback(() => {
    const node = exportNode.current?.firstElementChild;
    if (!(node instanceof HTMLElement)) throw new Error("export node missing");
    return renderCardPng(node);
  }, []);

  async function run(action: "download" | "copy" | "share") {
    if (!passage || busy) return;
    setBusy(true);
    const fileName = cardFileName(passage.reference);
    try {
      if (action === "copy") {
        try {
          await copyBlob(render());
          setToast(t("share.copied"));
        } catch {
          setToast(t("share.copyFailed"));
        }
      } else {
        const blob = await render();
        if (action === "download") downloadBlob(blob, fileName);
        else await shareBlob(blob, fileName, passage.reference);
      }
    } catch (error) {
      // Closing the share sheet isn't a failure.
      if (!(error instanceof DOMException && error.name === "AbortError")) setToast(t("share.failed"));
    } finally {
      setBusy(false);
    }
  }

  const cardProps = passage && {
    passage,
    background,
    tone: userPicksTone ? tone : undefined,
    photoUrl: photoUrl ?? undefined,
    photoFrame: frame,
    textScale,
    showAttribution,
  };
  const note = background === "transparent" ? "transparent" : background === "photo" ? "photo" : "default";

  return (
    <div className="mv-sky-wash min-h-full" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
      <div className="flex flex-col gap-[22px] px-[clamp(24px,4vw,56px)] pt-7 pb-10">
        <div className="flex items-center justify-between gap-4">
          <ButtonLink href={`/r/${id}`} variant="ghost" className="pe-2.5 ps-1 text-ink">
            <ChevronLeft size={20} strokeWidth={1.8} className="rtl:-scale-x-100" />
            {t("share.back")}
          </ButtonLink>
          <h1 className="font-serif text-[34px] font-medium tracking-[-0.01em]">{t("share.title")}</h1>
          <span className="mv-hide-sm w-[150px]" />
        </div>

        {cardProps && (
          <div className="flex flex-wrap items-start justify-center gap-9">
            <div className="flex flex-col items-center gap-3">
              <div
                ref={preview}
                role="img"
                aria-label={editingPhoto ? t("share.previewPhoto") : t("share.preview")}
                tabIndex={editingPhoto ? 0 : -1}
                onKeyDown={onPreviewKey}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className={cx(
                  "overflow-hidden rounded-card shadow-sheet",
                  editingPhoto && "cursor-grab touch-none active:cursor-grabbing",
                )}
              >
                <ShareCard {...cardProps} width={PREVIEW_WIDTH} checkerboard />
              </div>
              <span className="text-[13px] font-semibold text-ink-3">{t("share.size")}</span>
            </div>

            <Card as="section" aria-label={t("share.options")} className="flex w-[420px] max-w-full flex-col gap-[18px] p-6">
              <div className="flex flex-col gap-2.5">
                <span id={ids.background} className="text-sm font-extrabold">
                  {t("share.background")}{" "}
                  <span className="font-medium text-ink-3">· {t(`share.bg.${background}`)}</span>
                </span>
                <div role="radiogroup" aria-labelledby={ids.background} className="grid grid-cols-6 gap-2">
                  {SHARE_BACKGROUNDS.map((option, index) => {
                    const checked = option === background;
                    const image = option === "photo" ? photoUrl : shareBackgroundImage(option);
                    return (
                      <button
                        key={option}
                        ref={(element) => {
                          tiles.current[index] = element;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        aria-label={t(`share.bg.${option}`)}
                        title={t(`share.bg.${option}`)}
                        tabIndex={checked ? 0 : -1}
                        onClick={() => onTileClick(option)}
                        onKeyDown={(event) => onTileKey(event, index)}
                        className={cx(
                          "relative h-[92px] overflow-hidden rounded-[14px] bg-surface-2",
                          checked
                            ? "shadow-[0_0_0_2px_var(--mv-surface),0_0_0_4px_var(--mv-primary)]"
                            : "shadow-[inset_0_0_0_1px_rgba(19,26,51,.10)]",
                        )}
                        style={SWATCH[option] ? { background: SWATCH[option] } : undefined}
                      >
                        {image ? (
                          <Image src={image} alt="" fill sizes="64px" className="object-cover" unoptimized={image.startsWith("blob:")} />
                        ) : (
                          option === "photo" && (
                            <span
                              aria-hidden="true"
                              className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[10px] font-extrabold text-primary"
                            >
                              <ImagePlus size={20} />
                              {t("share.photoTile")}
                            </span>
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(event) => {
                    loadPhoto(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                {background === "photo" && <p className="text-[13px] text-ink-3">{t("share.dropHint")}</p>}
              </div>

              {userPicksTone && (
                <div className="flex items-center justify-between gap-3">
                  <span id={ids.tone} className="text-sm font-extrabold">
                    {t("share.textColor")}
                  </span>
                  <Segmented<Tone>
                    size="sm"
                    aria-labelledby={ids.tone}
                    options={[
                      { value: "light", label: t("share.light") },
                      { value: "dark", label: t("share.dark") },
                    ]}
                    value={tone}
                    onChange={setTone}
                    className="w-[220px] p-[3px]"
                  />
                </div>
              )}

              <div className="flex h-11 items-center gap-3">
                <label htmlFor={ids.size} className="w-[70px] shrink-0 text-sm font-extrabold">
                  {t("share.textSize")}
                </label>
                <Slider
                  id={ids.size}
                  min={0.8}
                  max={1.2}
                  step={0.05}
                  value={textScale}
                  onChange={(event) => setTextScale(Number(event.target.value))}
                  valueText={t("share.textSizeValue", { percent: Math.round(textScale * 100) })}
                  rowClassName="grow"
                />
              </div>

              <div className="flex min-h-11 items-center justify-between">
                <span id={ids.attribution} className="text-sm font-bold">
                  {t("share.attribution")}
                </span>
                <Toggle checked={showAttribution} onCheckedChange={setShowAttribution} aria-labelledby={ids.attribution} />
              </div>

              <div className="flex flex-col gap-2.5 border-t border-line pt-1.5">
                <Button className="mt-2.5 w-full" aria-disabled={busy || undefined} onClick={() => run("download")}>
                  <Download size={20} />
                  {background === "transparent" ? t("share.downloadTransparent") : t("share.download")}
                </Button>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button variant="secondary" size="sm" aria-disabled={busy || undefined} onClick={() => run("copy")}>
                    <Copy size={18} />
                    {t("share.copy")}
                  </Button>
                  <Button variant="secondary" size="sm" aria-disabled={busy || undefined} onClick={() => run("share")}>
                    <Share size={18} />
                    {t("share.share")}
                  </Button>
                </div>
                <p id={ids.note} className="flex items-center gap-2 text-[13px] leading-[18px] text-ink-3">
                  <Lock size={16} className="shrink-0" />
                  {t(`share.note.${note}`)}
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* The export copy: 360 × 640 off screen, rendered at 3× on demand. No
          ancestor paints a background, so a transparent card keeps its alpha. */}
      {cardProps && (
        <div ref={exportNode} aria-hidden="true" inert className="pointer-events-none fixed top-0 -left-[10000px]">
          <ShareCard {...cardProps} width={360} forExport />
        </div>
      )}

      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}
