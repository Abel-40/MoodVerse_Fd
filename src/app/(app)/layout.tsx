import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { SessionExpiredDialog } from "@/components/auth/SessionExpiredDialog";
import { OfflineBanner } from "@/components/mv/OfflineBanner";
import { Sidebar, type Account } from "@/components/mv/Sidebar";
import { getAccount } from "@/lib/server/account";

/** The signed-in (or guest) app: sidebar plus a pane that scrolls on its own. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const state = await getAccount();
  if (state.kind === "none") redirect("/welcome");
  if (state.kind === "expired") redirect("/api/auth/expired");

  const account: Account =
    state.kind === "guest" ? { kind: "guest" } : { kind: "user", email: state.user?.email ?? null };

  return (
    <div className="mv-shell">
      <Sidebar account={account} />
      <main id="content" tabIndex={-1} className="mv-pane">
        <OfflineBanner />
        {children}
      </main>
      {account.kind === "user" && <SessionExpiredDialog />}
    </div>
  );
}
