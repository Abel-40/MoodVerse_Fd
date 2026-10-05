import Image from "next/image";
import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

/** The floating cloud: when there's nothing to show yet. */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: ReactNode;
  body: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center justify-center gap-4 px-6 py-10 text-center", className)}>
      <div className="relative size-[220px]">
        <div
          aria-hidden="true"
          className="absolute -inset-[30px] rounded-full bg-[radial-gradient(circle,rgba(110,140,255,.22),rgba(110,140,255,0)_70%)]"
        />
        <div className="relative size-[220px] overflow-hidden rounded-full shadow-sheet [animation:mv-float_6s_ease-in-out_infinite]">
          <Image src="/images/soft-clouds.jpg" alt="" fill loading="eager" sizes="220px" className="object-cover" />
        </div>
      </div>
      <h2 className="mt-3 font-serif text-[38px] leading-[1.1] font-medium">{title}</h2>
      <p className="max-w-[420px] text-[17px] leading-[26px] text-ink-2">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
