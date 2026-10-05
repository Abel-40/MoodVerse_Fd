"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { GlassPanel } from "@/components/mv/Surfaces";
import { finishSignIn } from "@/lib/client/session";

// Each credential can be spent once. Remember what this page load already
// sent so React's dev double-mount can't send it twice and fail the second.
const started = new Set<string>();

interface FinishingSignInProps {
  /** Pull the credential out of the URL and scrub it from the address bar. */
  takeCredential: () => { key: string; body: unknown } | null;
  /** The route that turns the credential into a session. */
  endpoint: string;
  /** Where to send people when it fails: /sign-in?error=… */
  failureHref: string;
}

/** The brief "Signing you in…" screen a magic link or Google lands on. */
export function FinishingSignIn({ takeCredential, endpoint, failureHref }: FinishingSignInProps) {
  const t = useTranslations("auth");
  const router = useRouter();

  useEffect(() => {
    const credential = takeCredential();
    if (!credential) {
      router.replace(failureHref);
      return;
    }
    if (started.has(credential.key)) return;
    started.add(credential.key);

    (async () => {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credential.body),
        });
        if (!response.ok) throw new Error(String(response.status));
        await finishSignIn((href) => router.replace(href));
      } catch {
        router.replace(failureHref);
      }
    })();
  }, [endpoint, failureHref, router, takeCredential]);

  return (
    <GlassPanel className="mv-fade-in relative flex flex-col items-center gap-5 rounded-[36px] px-12 py-10">
      <span aria-hidden="true" className="relative size-16">
        <span className="mv-breathe absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_var(--mv-primary)]" />
        <span className="absolute inset-[22px] rounded-full bg-grad" />
      </span>
      <p role="status" className="font-serif text-[22px]">
        {t("signingIn")}
      </p>
    </GlassPanel>
  );
}
