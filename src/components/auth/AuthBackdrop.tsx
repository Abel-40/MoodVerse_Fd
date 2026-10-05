import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Wordmark } from "@/components/mv/Wordmark";

/** Full-bleed calm sea with the wordmark, behind the sign-in card. */
export function AuthBackdrop({ children }: { children: ReactNode }) {
  const t = useTranslations("app");

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      <Image
        src="/images/calm-sea.jpg"
        alt=""
        fill
        preload
        loading="eager"
        sizes="100vw"
        className="mv-drift object-cover object-[center_55%]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[rgba(20,22,64,.18)]" />
      {/* Floats top-left on wide screens; on phones it sits above the card. */}
      <Link
        href="/"
        aria-label={t("home")}
        className="absolute top-7 left-[clamp(20px,4vw,48px)] flex min-h-11 items-center text-white max-[600px]:relative max-[600px]:top-0 max-[600px]:left-0 max-[600px]:mb-6 max-[600px]:self-start"
      >
        <Wordmark tone="white" labelClassName="text-[26px]!" />
      </Link>
      {children}
    </div>
  );
}
