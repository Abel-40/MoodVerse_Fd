import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader, Noto_Naskh_Arabic, Plus_Jakarta_Sans } from "next/font/google";
import { LucideProvider } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { AppProviders } from "@/components/AppProviders";
import { PREFERENCES_SCRIPT } from "@/lib/preferences";
import { PreferencesSync } from "@/lib/use-preferences";
import "./globals.css";

// Loaded as variable fonts: one file per family covers the 400-800 range, and
// Newsreader keeps its optical-size axis, which the designs use for display.
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const naskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-naskh",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return { title: t("name"), description: t("description") };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    // The script sets data-theme (and maybe data-motion) before hydration,
    // which React would otherwise report as a mismatch.
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      className={`${newsreader.variable} ${jakarta.variable} ${naskh.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <LucideProvider strokeWidth={1.75}>
            <AppProviders>{children}</AppProviders>
          </LucideProvider>
        </NextIntlClientProvider>
        <PreferencesSync />
      </body>
    </html>
  );
}
