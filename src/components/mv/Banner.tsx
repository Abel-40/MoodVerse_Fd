import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

import { IconBadge } from "./Surfaces";

interface BannerProps {
  icon: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  /** Usually a small secondary button, e.g. "Try again". */
  action?: ReactNode;
  className?: string;
}

/** A status card that fades in above the content, like the offline notice. */
export function Banner({ icon, title, children, action, className }: BannerProps) {
  return (
    <div role="status" className={cx("mv-card mv-banner mv-fade-in", className)}>
      <IconBadge className="size-10">{icon}</IconBadge>
      <div className="flex grow flex-col gap-0.5">
        <span className="text-[15px] font-extrabold">{title}</span>
        {children && <span className="text-[13px] text-ink-2">{children}</span>}
      </div>
      {action}
    </div>
  );
}
