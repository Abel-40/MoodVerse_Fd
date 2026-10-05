import { AuthBackdrop } from "@/components/auth/AuthBackdrop";

import { GoogleLanding } from "./GoogleLanding";

/** Where the backend returns after Google sign-in, tokens in the URL fragment. */
export default function GoogleReturnPage() {
  return (
    <AuthBackdrop>
      <GoogleLanding />
    </AuthBackdrop>
  );
}
