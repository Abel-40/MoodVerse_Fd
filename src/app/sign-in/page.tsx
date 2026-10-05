import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthBackdrop } from "@/components/auth/AuthBackdrop";
import { getSessionKind } from "@/lib/server/session";

import { SignInCard, type SignInError } from "./SignInCard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.nav");
  return { title: t("signIn") };
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if ((await getSessionKind()) === "user") redirect("/reflect");

  const { error } = await searchParams;
  const initialError: SignInError | null = error === "link" || error === "google" ? error : null;

  return (
    <AuthBackdrop>
      <SignInCard initialError={initialError} />
    </AuthBackdrop>
  );
}
