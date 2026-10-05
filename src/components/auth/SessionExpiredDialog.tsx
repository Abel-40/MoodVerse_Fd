"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/mv/ConfirmDialog";
import { SIGNED_OUT_EVENT } from "@/lib/api/client";

/**
 * Asks a signed-in person to sign in again when the backend stops accepting
 * their session mid-visit (the proxy couldn't refresh it). Drafts live in
 * IndexedDB, so nothing being written is lost on the way through sign-in.
 */
export function SessionExpiredDialog() {
  const t = useTranslations("session");
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(SIGNED_OUT_EVENT, show);
    return () => window.removeEventListener(SIGNED_OUT_EVENT, show);
  }, []);

  return (
    <ConfirmDialog
      open={open}
      tone="primary"
      title={t("title")}
      body={t("body")}
      confirmLabel={t("signIn")}
      cancelLabel={t("notNow")}
      busy={leaving}
      onConfirm={() => {
        setLeaving(true);
        // A route handler, not a page: it clears the dead cookies, then
        // redirects to sign-in, so this needs a full navigation.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/api/auth/expired");
      }}
      onClose={() => setOpen(false)}
    />
  );
}
