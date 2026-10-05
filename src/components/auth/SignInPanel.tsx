import { useTranslations } from "next-intl";
import { LogIn } from "lucide-react";

import { ButtonLink } from "@/components/mv/Button";
import { MessagePanel } from "@/components/mv/MessagePanel";

/**
 * What a screen shows when the backend won't answer without a session: an
 * invitation for guests, or "sign in again" when a signed-in session ended.
 */
export function SignInPanel({ expired }: { expired: boolean }) {
  const t = useTranslations();

  return (
    <MessagePanel
      icon={<LogIn size={28} />}
      title={expired ? t("session.title") : t("finding.guest.title")}
      body={expired ? t("session.body") : t("finding.guest.body")}
      actions={
        <>
          <ButtonLink href="/reflect" variant="secondary">
            {t("finding.guest.back")}
          </ButtonLink>
          {expired ? (
            // A route handler, not a page: it clears the dead cookies first.
            <a href="/api/auth/expired" className="mv-btn mv-btn-primary">
              {t("session.signIn")}
            </a>
          ) : (
            <ButtonLink href="/sign-in">{t("finding.guest.signIn")}</ButtonLink>
          )}
        </>
      }
    />
  );
}
