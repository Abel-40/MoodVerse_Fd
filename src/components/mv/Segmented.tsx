"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";

import { cx } from "@/lib/cx";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** md is 44 px, sm 40 px (used in Settings rows). */
  size?: "md" | "sm";
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/**
 * A radio group drawn as pills in a track. Follows the ARIA radio group
 * pattern: one tab stop, and the arrow keys move the selection (mirrored in
 * right-to-left layouts).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
  ...labelling
}: SegmentedProps<T>) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const tabStop = options.some((option) => option.value === value) ? value : options[0]?.value;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const last = options.length - 1;
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = index + 1;
        break;
      case "ArrowUp":
        next = index - 1;
        break;
      case "ArrowRight":
        next = rtl ? index - 1 : index + 1;
        break;
      case "ArrowLeft":
        next = rtl ? index + 1 : index - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (next < 0) next = last;
    if (next > last) next = 0;
    onChange(options[next].value);
    buttons.current[next]?.focus();
  }

  return (
    <div role="radiogroup" className={cx("mv-seg", size === "sm" && "mv-seg-sm", className)} {...labelling}>
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(element) => {
            buttons.current[index] = element;
          }}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          tabIndex={option.value === tabStop ? 0 : -1}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
