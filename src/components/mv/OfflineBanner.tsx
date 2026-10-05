"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";

import { useConnection } from "@/lib/client/connection";

import { Banner } from "./Banner";
import { Button } from "./Button";

/**
 * The offline notice for every app screen but Reflect, which has its own.
 * It floats over the top of the pane instead of pushing the screen down.
 */
export function OfflineBanner() {
  const t = useTranslations("offline");
  const pathname = usePathname();
  const { online, retry } = useConnection();

  if (online || pathname === "/reflect") return null;

  return (
    <div className="pointer-events-none sticky top-4 z-30 h-0 px-4">
      <Banner
        icon={<WifiOff size={22} />}
        title={t("title")}
        action={
          <Button variant="secondary" size="sm" onClick={retry}>
            {t("retry")}
          </Button>
        }
        className="pointer-events-auto mx-auto max-w-[560px] shadow-sheet"
      >
        {t("body")}
      </Banner>
    </div>
  );
}
