import { getRequestConfig } from "next-intl/server";

/**
 * English only for now, without locale routing. Adding Arabic means adding
 * messages/ar.json and choosing the locale here (cookie or URL segment); the
 * root layout already derives `dir` from the locale.
 */
export default getRequestConfig(async () => {
  const locale = "en";
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
