"use client";

import { FinishingSignIn } from "@/components/auth/FinishingSignIn";

// Read the single-use token, then drop it from the address bar so it isn't
// left in history.
function takeToken() {
  const token = new URLSearchParams(window.location.search).get("token");
  window.history.replaceState(null, "", "/auth/magic");
  return token ? { key: token, body: { token } } : null;
}

export function MagicLinkLanding() {
  return (
    <FinishingSignIn takeCredential={takeToken} endpoint="/api/auth/magic-link/verify" failureHref="/sign-in?error=link" />
  );
}
