import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ShareEditor } from "./ShareEditor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("share");
  return { title: t("title") };
}

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  // `p` picks which of the reflection's passages to share ("Show another").
  const { p } = await searchParams;
  return <ShareEditor id={id} passageId={p ?? null} />;
}
