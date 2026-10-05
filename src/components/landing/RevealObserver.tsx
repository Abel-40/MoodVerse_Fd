"use client";

import { useEffect } from "react";

/**
 * Fades each `.mv-reveal` section up the first time it scrolls into view.
 * With reduced motion (system or Gentle motion off) everything shows at once.
 */
export function RevealObserver() {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".mv-reveal:not(.is-in)"));
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-motion") === "reduced";

    if (reduced || !("IntersectionObserver" in window)) {
      sections.forEach((section) => section.classList.add("is-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return null;
}
