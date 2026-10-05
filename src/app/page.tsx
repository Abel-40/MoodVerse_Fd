import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Faq, FinalCta, LandingFooter } from "@/components/landing/Closing";
import { Hero, LandingNav } from "@/components/landing/Hero";
import { RevealObserver } from "@/components/landing/RevealObserver";
import { Gallery, Highlights, HowItWorks, Limits, Traditions, Trust } from "@/components/landing/Sections";
import { reflectEntryHref } from "@/lib/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: { absolute: t("landing.meta.title") },
    description: t("app.description"),
    openGraph: { title: t("landing.meta.title"), description: t("app.description"), type: "website" },
  };
}

/** The public landing page. It is designed for light mode only. */
export default async function LandingPage() {
  const browserHref = await reflectEntryHref();

  return (
    <div data-theme="light" className="bg-bg text-ink">
      <LandingNav />
      <main id="content" tabIndex={-1}>
        <Hero browserHref={browserHref} />
        <Highlights />
        <HowItWorks />
        <Traditions />
        <Trust />
        <Gallery />
        <Limits />
        <Faq />
        <FinalCta browserHref={browserHref} />
      </main>
      <LandingFooter />
      <RevealObserver />
    </div>
  );
}
