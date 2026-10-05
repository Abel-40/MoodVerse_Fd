import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getAccount } from "@/lib/server/account";

import { SettingsScreen, type SettingsAccount } from "./SettingsScreen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function SettingsPage() {
  const state = await getAccount();
  const account: SettingsAccount =
    state.kind === "user"
      ? {
          kind: "user",
          email: state.user?.email ?? null,
          google: state.user?.linked_providers?.includes("google") ?? false,
          defaultTradition: state.user?.preferred_religion ?? null,
        }
      : { kind: "guest" };
  return <SettingsScreen account={account} />;
}
