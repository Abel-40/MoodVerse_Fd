import { cx } from "@/lib/cx";

/**
 * The waiting state: rings that breathe in turn around a warm core, for use on
 * imagery. Purely decorative; with reduced motion it simply holds still.
 */
export function BreathingSun({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cx("relative block size-60", className)}>
      <span className="mv-breathe absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,.35)] [animation-delay:-1.4s]" />
      <span className="mv-breathe absolute inset-[34px] rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,.5)] [animation-delay:-.7s]" />
      <span className="mv-breathe absolute inset-16 rounded-full bg-white/18 shadow-[inset_0_0_0_1px_rgba(255,255,255,.45)] backdrop-blur-md" />
      <span className="absolute inset-[100px] rounded-full bg-white shadow-[0_0_48px_12px_rgba(255,230,190,.6)]" />
    </span>
  );
}
