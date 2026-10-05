import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import { ButtonLink } from "@/components/mv/Button";
import { GlassPanel } from "@/components/mv/Surfaces";
import { Wordmark } from "@/components/mv/Wordmark";
import { cx } from "@/lib/cx";

import { GUTTER, H2 } from "./Sections";
import { StoreBadges } from "./StoreBadges";

const QUESTIONS = ["ai", "who", "background", "account", "serious"] as const;

/** Native <details> disclosures: keyboard and screen-reader support for free. */
export function Faq() {
  const t = useTranslations("landing.faq");

  return (
    <section id="faq" aria-labelledby="faq-title" className={cx("scroll-mt-28 py-[104px]", GUTTER)}>
      <div className="mv-reveal mx-auto flex max-w-[860px] flex-col gap-9">
        <h2 id="faq-title" className={cx(H2, "text-center")}>
          {t("title")}
        </h2>
        <div className="flex flex-col gap-3">
          {QUESTIONS.map((key, index) => (
            <details key={key} open={index === 0} className="mv-card mv-card-line group px-6">
              <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                {t(`${key}.q`)}
                <ChevronDown
                  size={20}
                  strokeWidth={1.8}
                  className="shrink-0 transition-transform duration-[400ms] ease-mv group-open:rotate-180"
                />
              </summary>
              <p className="pr-8 pb-6 text-base leading-[1.65] text-ink-2">{t(`${key}.a`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ browserHref }: { browserHref: string }) {
  const t = useTranslations("landing.cta");

  return (
    <section aria-labelledby="cta-title" className="px-[clamp(16px,4vw,64px)] pb-4">
      <div className="mv-reveal relative mx-auto flex min-h-[480px] max-w-[1312px] items-center justify-center overflow-hidden rounded-[40px] px-6 py-16 max-[860px]:px-6 max-[860px]:py-6">
        <Image src="/images/hero-dawn.jpg" alt="" fill sizes="(min-width: 1400px) 1312px, 100vw" className="mv-drift object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-[rgba(18,16,56,.28)]" />
        <GlassPanel className="relative flex max-w-[640px] flex-col items-center gap-[22px] rounded-sheet px-[clamp(24px,4vw,48px)] py-10 text-center">
          <h2 id="cta-title" className="font-serif text-[clamp(38px,4.4vw,60px)] leading-[1.02] font-medium tracking-[-0.02em]">
            {t("title")}
          </h2>
          <p className="text-[17px] leading-[1.6] text-ink-2">{t("body")}</p>
          <StoreBadges className="justify-center" />
          <ButtonLink href={browserHref}>{t("start")}</ButtonLink>
        </GlassPanel>
      </div>
    </section>
  );
}

const FOOTER_LINKS = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
  { key: "sources", href: "/sources" },
  { key: "contact", href: "/contact" },
] as const;

export function LandingFooter() {
  const t = useTranslations("landing.footer");

  return (
    <footer className={cx("pt-6 pb-12", GUTTER)}>
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-5 border-t border-line pt-6">
        <div className="flex items-center gap-2.5">
          <Wordmark size={22} labelClassName="text-xl!" />
          <span className="ml-1.5 text-[13px] text-ink-3">{t("copyright", { year: new Date().getFullYear() })}</span>
        </div>
        <nav aria-label={t("label")} className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold text-ink-2">
          {FOOTER_LINKS.map(({ key, href }) => (
            <Link key={key} href={href} className="flex min-h-11 items-center">
              {t(key)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
