import { useTranslations } from "next-intl";

import { cx } from "@/lib/cx";

// Store listings, set per environment. Until the app is listed a badge
// renders without a link rather than pointing nowhere.
const STORES = [
  { key: "appStore", href: process.env.NEXT_PUBLIC_APP_STORE_URL },
  { key: "play", href: process.env.NEXT_PUBLIC_PLAY_STORE_URL },
] as const;

/**
 * The App Store and Google Play badges. These are the design's placeholders;
 * swap in the official badge artwork before launch, per each store's
 * guidelines.
 */
export function StoreBadges({ id, className }: { id?: string; className?: string }) {
  const t = useTranslations("landing.stores");

  return (
    <div id={id} className={cx("flex flex-wrap gap-3", className)}>
      {STORES.map(({ key, href }) => {
        const content = (
          <>
            <span className="text-[11px] font-medium opacity-80">{t(`${key}Line1`)}</span>
            <span className="text-lg leading-[1.1] font-extrabold">{t(`${key}Line2`)}</span>
            {!href && <span className="sr-only">, {t("comingSoon")}</span>}
          </>
        );
        const badge =
          "flex h-[58px] flex-col items-start justify-center rounded-[18px] bg-[#0B0D14] px-[22px] text-white";
        return href ? (
          <a key={key} href={href} className={badge}>
            {content}
          </a>
        ) : (
          <span key={key} className={badge}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
