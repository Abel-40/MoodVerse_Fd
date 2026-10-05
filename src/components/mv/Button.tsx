import Link from "next/link";
import type { ComponentProps } from "react";

import { cx } from "@/lib/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "glass" | "danger";

interface ButtonStyle {
  /** One primary (gradient) button per screen. Glass is only for imagery. */
  variant?: ButtonVariant;
  /** md is 52 px tall, sm 44 px. */
  size?: "md" | "sm";
  /** A 48 px round button holding only an icon. Give it an aria-label. */
  icon?: boolean;
}

function buttonClassName({ variant = "primary", size = "md", icon = false }: ButtonStyle, className?: string) {
  return cx("mv-btn", `mv-btn-${variant}`, size === "sm" && "mv-btn-sm", icon && "mv-btn-icon", className);
}

export function Button({
  variant,
  size,
  icon,
  className,
  type = "button",
  ...props
}: ButtonStyle & ComponentProps<"button">) {
  return <button type={type} className={buttonClassName({ variant, size, icon }, className)} {...props} />;
}

/** A link that looks like a button, for actions that navigate. */
export function ButtonLink({ variant, size, icon, className, ...props }: ButtonStyle & ComponentProps<typeof Link>) {
  return <Link className={buttonClassName({ variant, size, icon }, className)} {...props} />;
}
