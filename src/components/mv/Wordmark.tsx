import { useTranslations } from "next-intl";

import { cx } from "@/lib/cx";

interface WordmarkProps {
  /** Mark size in px. The name scales with it (24 px text at the 28 px mark). */
  size?: number;
  /** color: the two brand blues, in both themes. white: for imagery. */
  tone?: "color" | "white";
  /** Hide the "MoodVerse" text and keep only the mark. */
  markOnly?: boolean;
  /** Classes for the name, e.g. `mv-navlabel` in the sidebar. */
  labelClassName?: string;
  className?: string;
}

/** The two-page mark beside "MoodVerse" in Newsreader. */
export function Wordmark({ size = 28, tone = "color", markOnly, labelClassName, className }: WordmarkProps) {
  const t = useTranslations("app");
  const [left, right] = tone === "color" ? ["#2F5BEA", "#6A4DE8"] : ["#FFFFFF", "rgba(255,255,255,.72)"];

  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <path
          d="M3 8.5c0-1 .9-1.6 1.8-1.3L14 10.6c.9.3 1.5 1.2 1.5 2.1V27c0 .8-.8 1.3-1.5 1L4.6 23.6C3.6 23.2 3 22.3 3 21.3z"
          fill={left}
        />
        <path
          d="M29 8.5c0-1-.9-1.6-1.8-1.3L18 10.6c-.9.3-1.5 1.2-1.5 2.1V27c0 .8.8 1.3 1.5 1l9.4-4.4c1-.4 1.6-1.3 1.6-2.3z"
          fill={right}
        />
      </svg>
      {!markOnly && (
        <span
          className={cx("font-serif font-semibold", labelClassName)}
          style={{ fontSize: Math.round((size * 24) / 28) }}
        >
          {t("name")}
        </span>
      )}
    </span>
  );
}
