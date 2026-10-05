import { useId, type ComponentProps, type ReactNode } from "react";

import { cx } from "@/lib/cx";

interface FieldProps extends ComponentProps<"textarea"> {
  /** Read by screen readers; the placeholder is the only visible prompt. */
  label: string;
  /** A row under the text, e.g. the voice button and the word count. */
  footer?: ReactNode;
  /** 17 px text with 20 px padding instead of the Reflect screen's 19 px. */
  compact?: boolean;
  /** Draw the focus ring without focus, for design-system previews. */
  focused?: boolean;
  /** Classes for the outer card; `className` goes to the textarea. */
  fieldClassName?: string;
}

/** The reflection field: a textarea in a soft card that rings on focus. */
export function Field({ label, footer, compact, focused, fieldClassName, id, ...props }: FieldProps) {
  const fallbackId = useId();
  const textareaId = id ?? fallbackId;

  return (
    <div className={cx("mv-field flex flex-col", compact && "mv-field-compact", focused && "is-focus", fieldClassName)}>
      <label htmlFor={textareaId} className="sr-only">
        {label}
      </label>
      <textarea id={textareaId} {...props} />
      {footer && <div className="flex items-center justify-between pt-2 pr-3 pb-3 pl-3.5">{footer}</div>}
    </div>
  );
}
