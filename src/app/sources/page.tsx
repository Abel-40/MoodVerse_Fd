import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Card } from "@/components/mv/Surfaces";
import { Wordmark } from "@/components/mv/Wordmark";
import { TRANSLATIONS, type Tradition } from "@/lib/scripture";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sources");
  return { title: t("title") };
}

/** "About our scripture sources": what the store serves, and under what licence. */
export default async function SourcesPage() {
  const t = await getTranslations();
  const rows = (Object.keys(TRANSLATIONS) as Tradition[]).flatMap((tradition) =>
    TRANSLATIONS[tradition].map((translation) => ({ tradition, ...translation })),
  );

  return (
    <div className="mv-sky-wash min-h-dvh px-[clamp(20px,5vw,96px)] py-8">
      <div className="mx-auto flex max-w-[860px] flex-col gap-8">
        <Link href="/" aria-label={t("app.home")} className="flex min-h-11 items-center self-start">
          <Wordmark />
        </Link>
        <div className="flex flex-col gap-3.5">
          <h1 className="font-serif text-[clamp(38px,4.4vw,56px)] leading-[1.04] font-medium tracking-[-0.02em]">
            {t("sources.title")}
          </h1>
          <p className="max-w-[640px] text-[17px] leading-[1.6] text-ink-2">{t("sources.intro")}</p>
        </div>
        <Card bordered className="overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead>
              <tr className="border-b border-line text-[13px] text-ink-3">
                <th scope="col" className="px-6 py-4 font-bold">{t("sources.tradition")}</th>
                <th scope="col" className="px-6 py-4 font-bold">{t("sources.translation")}</th>
                <th scope="col" className="px-6 py-4 font-bold">{t("sources.licence")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-b-0">
                  <td className="px-6 py-4 font-bold">{t(`tradition.${row.tradition}`)}</td>
                  <td className="px-6 py-4">{row.name}</td>
                  <td className="px-6 py-4 text-ink-2">
                    {row.licence === "publicDomain" ? t("sources.publicDomain") : t("sources.pending")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
