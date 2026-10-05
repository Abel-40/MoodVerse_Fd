"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bookmark, History, Pencil, Settings2, User } from "lucide-react";

import { Wordmark } from "./Wordmark";

/** `email` is null when the backend couldn't be reached to look it up. */
export type Account = { kind: "user"; email: string | null } | { kind: "guest" };

// `match` lists the route prefixes that light up each link: the finding,
// result and share screens all belong to Reflect.
const NAV = [
  { key: "reflect", href: "/reflect", match: ["/reflect", "/r"], Icon: Pencil },
  { key: "history", href: "/history", match: ["/history"], Icon: History },
  { key: "saved", href: "/saved", match: ["/saved"], Icon: Bookmark },
  { key: "settings", href: "/settings", match: ["/settings"], Icon: Settings2 },
] as const;

function isCurrent(pathname: string, prefixes: readonly string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** The 256 px app sidebar; below 900 px it becomes a top bar of icons. */
export function Sidebar({ account }: { account: Account }) {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <aside className="mv-side">
      <Link href="/" aria-label={t("app.home")} className="flex min-h-11 items-center px-2">
        <Wordmark labelClassName="mv-navlabel" />
      </Link>

      <nav aria-label={t("nav.label")}>
        {NAV.map(({ key, href, match, Icon }) => (
          <Link
            key={key}
            href={href}
            className="mv-navlink"
            aria-current={isCurrent(pathname, match) ? "page" : undefined}
          >
            <Icon size={22} />
            <span className="mv-navlabel">{t(`nav.${key}`)}</span>
          </Link>
        ))}
      </nav>

      {/* Guests go to sign-in to start syncing; members to their settings. */}
      <Link href={account.kind === "guest" ? "/sign-in" : "/settings"} className="mv-sidefoot">
        <span className="mv-avatar" aria-hidden="true">
          {account.kind === "user" && account.email ? account.email.charAt(0).toUpperCase() : <User size={18} />}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-extrabold">
            {account.kind === "guest" ? t("account.guest") : (account.email ?? t("account.signedIn"))}
          </span>
          <span className="text-xs text-ink-3">
            {account.kind === "user" ? t("account.synced") : t("account.guestNote")}
          </span>
        </span>
      </Link>
    </aside>
  );
}
