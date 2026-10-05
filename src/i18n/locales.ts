/**
 * The interface languages. Arabic is behind NEXT_PUBLIC_ARABIC=1 until
 * messages/ar.json (English placeholders for now) has a reviewed translation.
 * Chosen in Settings and kept in a cookie; safe to import on the client.
 */

export type Locale = "en" | "ar";

export const LOCALE_COOKIE = "mv-locale";
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALES: readonly Locale[] = process.env.NEXT_PUBLIC_ARABIC === "1" ? ["en", "ar"] : ["en"];

export function pickLocale(value: string | undefined): Locale {
  return LOCALES.find((locale) => locale === value) ?? DEFAULT_LOCALE;
}

export function isRtl(locale: string) {
  return locale === "ar";
}
