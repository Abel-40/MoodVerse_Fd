import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ResultScreen } from "./ResultScreen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("result");
  return { title: t("why") };
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <ResultScreen id={id} />;
}
