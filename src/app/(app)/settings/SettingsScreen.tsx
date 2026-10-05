"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BookOpen, ChevronRight, ShieldCheck, User } from "lucide-react";

import { Button, ButtonLink } from "@/components/mv/Button";
import { ConfirmDialog } from "@/components/mv/ConfirmDialog";
import { SceneImage } from "@/components/mv/SceneImage";
import { Segmented } from "@/components/mv/Segmented";
import { Slider } from "@/components/mv/Slider";
import { Card, GlassPanel, IconBadge } from "@/components/mv/Surfaces";
import { Toast } from "@/components/mv/Toast";
import { Toggle } from "@/components/mv/Toggle";
import { LOCALE_COOKIE, LOCALES, type Locale } from "@/i18n/locales";
import { useSetDefaultTradition } from "@/lib/api/hooks";
import { deleteMyData, exportFileName, exportMyData } from "@/lib/client/my-data";
import { readDefaultTradition, storeDefaultTradition } from "@/lib/client/session";
import { downloadBlob } from "@/lib/client/share-export";
import { cx } from "@/lib/cx";
import type { ThemePreference } from "@/lib/preferences";
import { TRANSLATIONS, type Tradition } from "@/lib/scripture";
import { usePreferences } from "@/lib/use-preferences";

export type SettingsAccount =
  | { kind: "user"; email: string | null; google: boolean; defaultTradition: Tradition | null }
  | { kind: "guest" };

const SECTIONS = ["reading", "appearance", "privacy", "account", "about"] as const;
type Section = (typeof SECTIONS)[number];

const noSubscription = () => () => {};

function readTranslation(tradition: Tradition): string {
  try {
    return window.localStorage.getItem(`mv-translation-${tradition}`) ?? TRANSLATIONS[tradition][0].id;
  } catch {
    return TRANSLATIONS[tradition][0].id;
  }
}

/** One setting: label (and note) on the left, its control on the right. */
function Row({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "flex min-h-16 items-center justify-between gap-4 border-t border-line px-[22px] py-3 first-of-type:border-t-0 max-[560px]:flex-wrap",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Label({ id, title, note, danger }: { id?: string; title: ReactNode; note?: ReactNode; danger?: boolean }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span id={id} className={cx("text-[15px] font-bold", danger && "text-danger")}>
        {title}
      </span>
      {note && <span className="text-[13px] text-ink-3">{note}</span>}
    </span>
  );
}

export function SettingsScreen({ account }: { account: SettingsAccount }) {
  const t = useTranslations();
  const router = useRouter();
  const signedIn = account.kind === "user";
  const ids = {
    tradition: useId(),
    bible: useId(),
    quran: useId(),
    size: useId(),
    language: useId(),
    theme: useId(),
    motion: useId(),
  };
  const locale = useLocale() as Locale;
  const { theme, setTheme, gentleMotion, setGentleMotion, textSize, setTextSize } = usePreferences();
  const setDefaultTradition = useSetDefaultTradition();
  const guestTradition = useSyncExternalStore(noSubscription, readDefaultTradition, () => null);
  const [tradition, setTradition] = useState<Tradition | null>(null);
  const defaultTradition = tradition ?? (signedIn ? account.defaultTradition : guestTradition) ?? "bible";
  const bibleTranslation = useSyncExternalStore(noSubscription, () => readTranslation("bible"), () => TRANSLATIONS.bible[0].id);
  const quranTranslation = useSyncExternalStore(noSubscription, () => readTranslation("quran"), () => TRANSLATIONS.quran[0].id);
  const [current, setCurrent] = useState<Section>("reading");
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [working, setWorking] = useState(false);
  const textSizes = t.raw("settings.textSizes") as string[];

  const saved = useCallback(() => setToast(t("settings.saved")), [t]);

  // Highlight the section in view in the side nav.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setCurrent(visible[0].target.id as Section);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    SECTIONS.forEach((section) => {
      const element = document.getElementById(section);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  function chooseTradition(next: Tradition) {
    setTradition(next);
    storeDefaultTradition(next);
    if (signedIn) setDefaultTradition.mutate(next);
    saved();
  }

  function chooseTranslation(which: Tradition, id: string) {
    try {
      window.localStorage.setItem(`mv-translation-${which}`, id);
    } catch {
      // Not remembered.
    }
    saved();
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  }

  async function exportData() {
    setWorking(true);
    try {
      downloadBlob(await exportMyData(signedIn), exportFileName());
      setToast(t("settings.privacy.exported"));
    } catch {
      setToast(t("share.failed"));
    } finally {
      setWorking(false);
    }
  }

  async function deleteData() {
    setWorking(true);
    const outcome = await deleteMyData(signedIn);
    setWorking(false);
    setConfirmDelete(false);
    if (outcome === "localOnly") {
      setToast(t("settings.privacy.deletedLocalOnly"));
      return;
    }
    setToast(t("settings.privacy.deleted"));
    if (signedIn) await signOut();
  }

  return (
    <div className="mv-sky-wash min-h-full">
      <div className="mx-auto flex max-w-[1040px] flex-col gap-7 px-[clamp(24px,4vw,56px)] pt-9 pb-16">
        <h1 className="font-serif text-[46px] leading-none font-medium tracking-[-0.02em]">{t("settings.title")}</h1>
        <div className="grid grid-cols-[200px_minmax(0,1fr)] items-start gap-10 max-[760px]:grid-cols-1 max-[760px]:gap-5">
          <nav
            aria-label={t("settings.navLabel")}
            className="sticky top-6 flex flex-col gap-1 max-[760px]:static max-[760px]:flex-row max-[760px]:overflow-x-auto"
          >
            {SECTIONS.map((section) => (
              <a
                key={section}
                href={`#${section}`}
                aria-current={current === section ? "true" : undefined}
                className={cx(
                  "flex h-10 shrink-0 items-center rounded-xl px-3 text-sm font-semibold text-ink-2",
                  current === section && "bg-surface font-extrabold text-ink shadow-card",
                )}
              >
                {t(`settings.sections.${section}`)}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-[22px]">
            <section
              id="account"
              aria-label={t("settings.sections.account")}
              className="relative flex scroll-mt-6 flex-wrap items-center gap-4 overflow-hidden rounded-card px-6 py-[22px] text-white"
            >
              <SceneImage
                src="/images/dawn-lake.jpg"
                loading="eager"
                sizes="(max-width: 760px) 100vw, 800px"
                className="object-cover object-[center_40%]"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-[rgba(18,16,52,.42)]" />
              <GlassPanel
                as="span"
                variant="glass-dark"
                aria-hidden="true"
                className="relative flex size-[60px] items-center justify-center rounded-full text-[22px] font-extrabold"
              >
                {signedIn && account.email ? account.email.charAt(0).toUpperCase() : <User size={26} />}
              </GlassPanel>
              <div className="relative flex min-w-0 grow flex-col gap-0.5">
                <span className="truncate text-lg font-extrabold">
                  {signedIn ? (account.email ?? t("account.signedIn")) : t("settings.profile.guest")}
                </span>
                {signedIn && (
                  <span className="text-sm opacity-90">
                    {account.google ? t("settings.profile.google") : t("settings.profile.email")}
                  </span>
                )}
              </div>
              {signedIn ? (
                <Button variant="glass" size="sm" className="relative" onClick={signOut}>
                  {t("settings.profile.signOut")}
                </Button>
              ) : (
                <ButtonLink href="/sign-in" variant="glass" size="sm" className="relative">
                  {t("settings.profile.signIn")}
                </ButtonLink>
              )}
            </section>

            <Card as="section" id="reading" aria-labelledby="s-reading" className="scroll-mt-6 overflow-hidden">
              <h2 id="s-reading" className="px-[22px] pt-5 pb-1 text-lg font-extrabold">
                {t("settings.sections.reading")}
              </h2>
              <Row>
                <Label id={ids.tradition} title={t("settings.reading.defaultTradition")} note={t("settings.reading.defaultTraditionNote")} />
                <Segmented<Tradition>
                  size="sm"
                  aria-labelledby={ids.tradition}
                  options={[
                    { value: "bible", label: t("tradition.bible") },
                    { value: "quran", label: t("tradition.quran") },
                  ]}
                  value={defaultTradition}
                  onChange={chooseTradition}
                  className="w-[280px] max-w-full"
                />
              </Row>
              {(["bible", "quran"] as const).map((which) => (
                <Row key={which}>
                  <label htmlFor={ids[which]} className="text-[15px] font-bold">
                    {t(which === "bible" ? "settings.reading.bibleTranslation" : "settings.reading.quranTranslation")}
                  </label>
                  <select
                    id={ids[which]}
                    defaultValue={which === "bible" ? bibleTranslation : quranTranslation}
                    onChange={(event) => chooseTranslation(which, event.target.value)}
                    className="h-11 rounded-xl bg-surface-2 px-3 text-sm font-semibold"
                  >
                    {TRANSLATIONS[which].map((translation) => (
                      <option key={translation.id} value={translation.id}>
                        {translation.name}
                      </option>
                    ))}
                  </select>
                </Row>
              ))}
              <Row>
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
                  onChange={(event) => {
                    setTextSize(Number(event.target.value));
                    saved();
                  }}
                  valueText={textSizes[textSize - 1]}
                  rowClassName="w-[280px] max-w-full"
                />
              </Row>
            </Card>

            <Card as="section" id="appearance" aria-labelledby="s-appearance" className="scroll-mt-6 overflow-hidden">
              <h2 id="s-appearance" className="px-[22px] pt-5 pb-1 text-lg font-extrabold">
                {t("settings.sections.appearance")}
              </h2>
              {LOCALES.length > 1 && (
                <Row>
                  <Label id={ids.language} title={t("settings.language.label")} />
                  <Segmented<Locale>
                    size="sm"
                    aria-labelledby={ids.language}
                    options={LOCALES.map((value) => ({
                      value,
                      // Each language is named in itself, and read out that way.
                      label: <span lang={value}>{t(`settings.language.${value}`)}</span>,
                    }))}
                    value={locale}
                    onChange={(next) => {
                      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
                      // The server picks the messages, lang and dir for the new language.
                      router.refresh();
                    }}
                    className="w-[320px] max-w-full"
                  />
                </Row>
              )}
              <Row>
                <Label id={ids.theme} title={t("settings.theme.label")} />
                <Segmented<ThemePreference>
                  size="sm"
                  aria-labelledby={ids.theme}
                  options={[
                    { value: "system", label: t("settings.theme.system") },
                    { value: "light", label: t("settings.theme.light") },
                    { value: "dark", label: t("settings.theme.dark") },
                  ]}
                  value={theme}
                  onChange={(next) => {
                    setTheme(next);
                    saved();
                  }}
                  className="w-[320px] max-w-full"
                />
              </Row>
              <Row>
                <Label id={ids.motion} title={t("settings.motion.label")} note={t("settings.motion.body")} />
                <Toggle
                  checked={gentleMotion}
                  aria-labelledby={ids.motion}
                  onCheckedChange={(on) => {
                    setGentleMotion(on);
                    saved();
                  }}
                />
              </Row>
            </Card>

            <Card as="section" id="privacy" aria-labelledby="s-privacy" className="scroll-mt-6 overflow-hidden">
              <h2 id="s-privacy" className="px-[22px] pt-5 pb-1 text-lg font-extrabold">
                {t("settings.sections.privacy")}
              </h2>
              <Row className="justify-start">
                <IconBadge className="size-[38px] rounded-xl">
                  <ShieldCheck size={20} />
                </IconBadge>
                <span className="text-sm leading-[21px] text-ink-2">{t("settings.privacy.note")}</span>
              </Row>
              <Row>
                <Label title={t("settings.privacy.export")} note={t("settings.privacy.exportBody")} />
                <Button variant="secondary" size="sm" aria-disabled={working || undefined} onClick={exportData}>
                  {t("settings.privacy.exportButton")}
                </Button>
              </Row>
              <Row>
                <Label danger title={t("settings.privacy.delete")} note={t("settings.privacy.deleteBody")} />
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                  {t("settings.privacy.deleteButton")}
                </Button>
              </Row>
            </Card>

            <Card as="section" id="about" aria-labelledby="s-about" className="scroll-mt-6 overflow-hidden">
              <h2 id="s-about" className="px-[22px] pt-5 pb-1 text-lg font-extrabold">
                {t("settings.sections.about")}
              </h2>
              {[
                { href: "/sources", label: t("settings.about.sources"), icon: true },
                { href: "/privacy", label: t("settings.about.privacy") },
                { href: "/terms", label: t("settings.about.terms") },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-16 items-center justify-between gap-4 border-t border-line px-[22px] py-3 first-of-type:border-t-0"
                >
                  <span className="flex items-center gap-3 text-[15px] font-bold">
                    {link.icon && (
                      <IconBadge className="size-[38px] rounded-xl">
                        <BookOpen size={20} />
                      </IconBadge>
                    )}
                    {link.label}
                  </span>
                  <ChevronRight size={20} className="shrink-0 text-ink-3 rtl:-scale-x-100" />
                </Link>
              ))}
            </Card>

            <p className="text-center text-xs text-ink-3">{t("settings.about.version")}</p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={t("settings.privacy.deleteTitle")}
        body={t("settings.privacy.deleteConfirmBody", { word: t("settings.privacy.deleteWord") })}
        confirmLabel={t("settings.privacy.deleteConfirm")}
        cancelLabel={t("history.cancel")}
        typedConfirmation={{
          word: t("settings.privacy.deleteWord"),
          label: t("settings.privacy.deleteInput", { word: t("settings.privacy.deleteWord") }),
        }}
        busy={working}
        onConfirm={deleteData}
        onClose={() => setConfirmDelete(false)}
      />
      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}
