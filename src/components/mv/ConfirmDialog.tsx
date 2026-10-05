"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  /** Ask the person to type this word before the danger button works. */
  typedConfirmation?: { word: string; label: string };
  busy?: boolean;
  /** "danger" for destructive actions; "primary" when nothing is lost. */
  tone?: "danger" | "primary";
}

/**
 * A modal confirmation, on the native <dialog>: focus is trapped, Escape
 * closes it, and focus returns to what opened it.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  typedConfirmation,
  busy = false,
  tone = "danger",
}: ConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ids = { title: useId(), body: useId(), input: useId() };
  const [typed, setTyped] = useState("");
  const confirmed = !typedConfirmation || typed.trim().toLowerCase() === typedConfirmation.word.toLowerCase();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={ids.title}
      aria-describedby={ids.body}
      onClose={() => {
        setTyped("");
        onClose();
      }}
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-sheet bg-surface p-0 text-ink shadow-sheet backdrop:bg-[rgba(10,14,38,.45)] backdrop:backdrop-blur-sm"
    >
      <form
        method="dialog"
        className="flex flex-col gap-4 p-7"
        onSubmit={(event) => {
          event.preventDefault();
          if (confirmed && !busy) onConfirm();
        }}
      >
        <h2 id={ids.title} className="font-serif text-[28px] leading-[1.15] font-medium">
          {title}
        </h2>
        <p id={ids.body} className="text-[15px] leading-6 text-ink-2">
          {body}
        </p>
        {typedConfirmation && (
          <>
            <label htmlFor={ids.input} className="sr-only">
              {typedConfirmation.label}
            </label>
            <input
              id={ids.input}
              autoComplete="off"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={typedConfirmation.word}
              className="h-12 rounded-2xl bg-surface px-4 text-base shadow-[inset_0_0_0_1.5px_var(--mv-line-strong)]"
            />
          </>
        )}
        <div className="mt-2 flex justify-end gap-2.5">
          <Button variant="secondary" size="sm" onClick={() => dialog.current?.close()}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant={tone} size="sm" aria-disabled={!confirmed || busy || undefined}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
