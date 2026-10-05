import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getSessionKind } from "@/lib/server/session";

import { HistoryScreen } from "./HistoryScreen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("history");
  return { title: t("title") };
}

export default async function HistoryPage() {
  return <HistoryScreen selectedId={null} guest={(await getSessionKind()) === "guest"} />;
}
