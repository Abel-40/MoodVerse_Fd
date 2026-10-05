import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getAccount, getLastReflection } from "@/lib/server/account";

import { ReflectScreen } from "./ReflectScreen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("reflect") };
}

export default async function ReflectPage() {
  const account = await getAccount();
  const signedIn = account.kind === "user";

  return (
    <ReflectScreen
      accountTradition={signedIn ? (account.user?.preferred_religion ?? null) : null}
      last={signedIn ? await getLastReflection() : null}
    />
  );
}
