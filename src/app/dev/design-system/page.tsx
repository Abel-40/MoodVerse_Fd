import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DesignSystemSheet } from "./Sheet";

export const metadata: Metadata = { title: "Design system · MoodVerse" };

/**
 * Every mv component, rendered once in each theme for comparison with
 * design-kit/design/design-system/components.png. Development only.
 */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main>
      {(["light", "dark"] as const).map((theme) => (
        <div key={theme} data-theme={theme} className="relative overflow-hidden bg-bg text-ink">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[700px] bg-[radial-gradient(50%_60%_at_85%_0%,rgba(110,140,255,.18),rgba(110,140,255,0))]"
          />
          <div className="relative mx-auto flex max-w-[1440px] flex-col gap-[88px] px-[clamp(20px,6.7vw,96px)] py-20">
            <header className="flex flex-col gap-3.5">
              <span className="mv-eyebrow self-start">MoodVerse design system · {theme}</span>
              <h1 className="font-serif text-[clamp(56px,7.2vw,104px)] leading-[0.95] font-medium tracking-[-0.025em]">
                Components<span className="mv-grad-text">.</span>
              </h1>
            </header>
            <DesignSystemSheet />
          </div>
        </div>
      ))}
    </main>
  );
}
