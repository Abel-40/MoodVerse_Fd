import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";

import { ButtonLink } from "@/components/mv/Button";
import { MessagePanel } from "@/components/mv/MessagePanel";

/** Unknown URLs, and anything that calls notFound(). */
export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main id="content" tabIndex={-1} className="grid min-h-dvh">
      <MessagePanel
        alert={false}
        icon={<Compass size={28} />}
        title={t("title")}
        body={t("body")}
        actions={
          <>
            <ButtonLink href="/" variant="secondary">
              {t("home")}
            </ButtonLink>
            <ButtonLink href="/reflect">{t("reflect")}</ButtonLink>
          </>
        }
      />
    </main>
  );
}
