import type { ComponentProps, HTMLAttributes } from "react";

import { cx } from "@/lib/cx";

interface ChipProps extends HTMLAttributes<HTMLElement> {
  /** Render as a list item when the chips sit in a <ul>. */
  as?: "span" | "li";
}

/** A read-only emotion. Emotions stay neutral; only the need gets colour. */
export function Chip({ as: Tag = "span", className, ...props }: ChipProps) {
  return <Tag className={cx("mv-chip", className)} {...props} />;
}

/** The need ("Seeking comfort"), marked with the gradient dot. */
export function NeedChip({ className, ...props }: ChipProps) {
  return <Chip className={cx("mv-chip-need", className)} {...props} />;
}

interface FilterChipProps extends Omit<ComponentProps<"button">, "aria-pressed"> {
  pressed: boolean;
}

/** A toggleable filter: 40 px tall with a 44 px touch area. */
export function FilterChip({ pressed, className, type = "button", ...props }: FilterChipProps) {
  return <button type={type} aria-pressed={pressed} className={cx("mv-chip-filter", className)} {...props} />;
}
