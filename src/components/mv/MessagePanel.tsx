import type { ReactNode } from "react";

import { SceneImage } from "./SceneImage";
import { GlassPanel, IconBadge } from "./Surfaces";

interface MessagePanelProps {
  icon: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  /** The buttons, laid out two to a row. */
  actions: ReactNode;
  /** A quieter link under the buttons. */
  footer?: ReactNode;
  /** Announce it as it appears; off when the panel is the whole page. */
  alert?: boolean;
}

/**
 * A glass card over soft clouds filling the pane: what a screen shows when it
 * can't show its content (couldn't find a passage, needs sign-in, not found).
 */
export function MessagePanel({ icon, title, body, actions, footer, alert = true }: MessagePanelProps) {
  return (
    <div className="relative flex h-full min-h-[640px] items-center justify-center overflow-hidden px-6 py-10 text-ink">
      <SceneImage
        src="/images/soft-clouds.jpg"
        loading="eager"
        sizes="(max-width: 900px) 100vw, calc(100vw - 256px)"
        className="mv-drift object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-white/15 dark:bg-transparent" />
      <GlassPanel
        as="section"
        role={alert ? "alert" : undefined}
        className="mv-fade-in relative flex w-full max-w-[520px] flex-col items-center gap-3.5 rounded-[36px] px-9 pt-10 pb-[30px] text-center max-[440px]:px-6"
      >
        <IconBadge className="size-16 rounded-[22px]">{icon}</IconBadge>
        <h1 className="font-serif text-4xl leading-[1.08] font-medium tracking-[-0.01em] text-balance">{title}</h1>
        {body && <p className="text-base leading-[25px] text-ink-2">{body}</p>}
        <div className="mt-2.5 grid w-full grid-cols-2 gap-2.5 max-[420px]:grid-cols-1">{actions}</div>
        {footer}
      </GlassPanel>
    </div>
  );
}
