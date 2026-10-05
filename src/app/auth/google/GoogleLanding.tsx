"use client";

import { FinishingSignIn } from "@/components/auth/FinishingSignIn";

// The fragment never reaches a server. Read the pair, scrub it from the
// address bar, and hand it to /api/auth/session to become cookies.
function takeTokens() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  window.history.replaceState(null, "", "/auth/google");
  const access = params.get("access_token");
  const refresh = params.get("refresh_token");
  return access && refresh ? { key: refresh, body: { access_token: access, refresh_token: refresh } } : null;
}

export function GoogleLanding() {
  return <FinishingSignIn takeCredential={takeTokens} endpoint="/api/auth/session" failureHref="/sign-in?error=google" />;
}
