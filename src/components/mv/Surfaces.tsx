import type { ElementType, HTMLAttributes } from "react";

import { cx } from "@/lib/cx";

interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

interface CardProps extends SurfaceProps {
  /** Adds a 1 px hairline, for cards that sit on white rather than sky. */
  bordered?: boolean;
}

/** A 28 px radius surface with the soft card shadow. */
export function Card({ as: Tag = "div", bordered, className, ...props }: CardProps) {
  return <Tag className={cx("mv-card", bordered && "mv-card-line", className)} {...props} />;
}

interface GlassPanelProps extends SurfaceProps {
  /** glass: frosted white (navy in dark). glass-dark: navy glass for imagery. */
  variant?: "glass" | "glass-dark";
}

export function GlassPanel({ as: Tag = "div", variant = "glass", className, ...props }: GlassPanelProps) {
  return <Tag className={cx(variant === "glass" ? "mv-glass" : "mv-glass-dark", className)} {...props} />;
}

/** A 44 px rounded square holding an icon. Resize with utilities if needed. */
export function IconBadge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("mv-icon-badge", className)} {...props} />;
}
