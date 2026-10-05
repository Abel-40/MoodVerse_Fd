import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getSessionKind } from "@/lib/server/session";

import { FindingScreen } from "./FindingScreen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("finding");
  return { title: t("title") };
}

export default async function FindingPage() {
  // Guests have no backend session to match with yet.
  return <FindingScreen guest={(await getSessionKind()) === "guest"} />;
}
