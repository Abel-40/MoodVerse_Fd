import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, pickLocale } from "./locales";

/**
 * No locale routing: the language comes from Settings' cookie, and only when
 * more than one is enabled (otherwise pages needn't read cookies for it). The
 * root layout derives `lang` and `dir` from the result.
 */
export default getRequestConfig(async () => {
  const locale = LOCALES.length > 1 ? pickLocale((await cookies()).get(LOCALE_COOKIE)?.value) : DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
