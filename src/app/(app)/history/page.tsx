import { getTranslations } from "next-intl/server";

// Placeholder until prompt 09 builds the History screen.
export default async function HistoryPage() {
  const t = await getTranslations("history");
  return (
    <main className="px-[clamp(24px,4vw,56px)] py-9">
      <h1 className="font-serif text-[46px] leading-none font-medium tracking-[-0.02em]">{t("title")}</h1>
    </main>
  );
}
