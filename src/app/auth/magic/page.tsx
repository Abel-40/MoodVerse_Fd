import { AuthBackdrop } from "@/components/auth/AuthBackdrop";

import { MagicLinkLanding } from "./MagicLinkLanding";

/** Where the emailed sign-in link opens. */
export default function MagicLinkPage() {
  return (
    <AuthBackdrop>
      <MagicLinkLanding />
    </AuthBackdrop>
  );
}
