import type { ComponentProps } from "react";

import { cx } from "@/lib/cx";

interface SliderProps extends Omit<ComponentProps<"input">, "type"> {
  /** What a screen reader announces instead of the raw number. */
  valueText?: string;
  /** Classes for the row that holds the two "A" marks and the range. */
  rowClassName?: string;
}

/** A range input between a small and a large "A", for text size. */
export function Slider({ valueText, rowClassName, ...props }: SliderProps) {
  return (
    <div className={cx("mv-slider", rowClassName)}>
      <span aria-hidden="true" className="text-[15px]">
        A
      </span>
      <input type="range" aria-valuetext={valueText} {...props} />
      <span aria-hidden="true" className="text-[24px]">
        A
      </span>
    </div>
  );
}
