import type { ComponentProps } from "react";

import { cx } from "@/lib/cx";

interface ToggleProps extends Omit<ComponentProps<"button">, "role" | "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** An on/off switch. Name it with aria-label or aria-labelledby. */
export function Toggle({ checked, onCheckedChange, className, type = "button", ...props }: ToggleProps) {
  return (
    <button
      type={type}
      role="switch"
      aria-checked={checked}
      className={cx("mv-toggle", className)}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      <span aria-hidden="true" />
    </button>
  );
}
