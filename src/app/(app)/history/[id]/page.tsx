import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getSessionKind } from "@/lib/server/session";

import { HistoryScreen } from "../HistoryScreen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("history");
  return { title: t("title") };
}

export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <HistoryScreen selectedId={id} guest={(await getSessionKind()) === "guest"} />;
}
