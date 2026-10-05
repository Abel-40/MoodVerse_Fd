"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";

import { cx } from "@/lib/cx";

import { Button } from "./Button";
import { IconBadge } from "./Surfaces";

// A maintained international helpline directory. The backend doesn't supply
// regional resources yet; override per deployment.
const SUPPORT_DIRECTORY = process.env.NEXT_PUBLIC_SUPPORT_DIRECTORY_URL ?? "https://findahelpline.com";

/**
 * Shown alongside the passage, never instead of it, when a reflection
 * suggests someone may be at risk. "Not now" shrinks it to one line.
 */
export function SupportCard({ className }: { className?: string }) {
  const t = useTranslations("support");
  const titleId = useId();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <a
        href={SUPPORT_DIRECTORY}
        target="_blank"
        rel="noopener noreferrer"
        className={cx("flex min-h-11 items-center gap-2 text-sm font-bold text-primary", className)}
      >
        <Heart size={18} />
        {t("cta")}
      </a>
    );
  }

  // Fixed warm colours in both themes, like the design.
  return (
    <section
      aria-labelledby={titleId}
      className={cx(
        "mv-fade-in flex flex-col gap-3 rounded-card bg-[linear-gradient(160deg,#FFF0E6_0%,#F3EDFF_100%)] p-[22px] text-[#131A33]",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <IconBadge className="bg-white text-[#2F5BEA]">
          <Heart size={22} />
        </IconBadge>
        <h2 id={titleId} className="font-serif text-2xl leading-[1.15] font-medium">
          {t("title")}
        </h2>
      </div>
      <p className="text-[15px] leading-[23px] text-[#4A5372]">{t("body")}</p>
      <div className="flex items-center gap-2">
        <a
          href={SUPPORT_DIRECTORY}
          target="_blank"
          rel="noopener noreferrer"
          className="mv-btn mv-btn-primary mv-btn-sm grow"
        >
          {t("cta")}
        </a>
        <Button variant="ghost" className="text-[#4A5372]" onClick={() => setCollapsed(true)}>
          {t("notNow")}
        </Button>
      </div>
    </section>
  );
}
