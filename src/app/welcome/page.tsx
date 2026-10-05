import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { WelcomeFlow } from "./WelcomeFlow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("welcome.step1");
  return { title: t("eyebrow") };
}

/**
 * First run, three steps on one route: /welcome?step=1|2|3. Reading
 * searchParams here renders each step on the server; without it the page
 * is prerendered and the step would only appear after hydration.
 */
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  await searchParams;
  return <WelcomeFlow />;
}
