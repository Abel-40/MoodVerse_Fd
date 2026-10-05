import { getTranslations } from "next-intl/server";

// Placeholder until prompt 09 builds the Saved screen.
export default async function SavedPage() {
  const t = await getTranslations("saved");
  return (
    <main className="px-[clamp(24px,4vw,56px)] py-9">
      <h1 className="font-serif text-[46px] leading-none font-medium tracking-[-0.02em]">{t("title")}</h1>
    </main>
  );
}
