import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SavedScreen } from "./SavedScreen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("saved");
  return { title: t("title") };
}

export default function SavedPage() {
  return <SavedScreen />;
}
