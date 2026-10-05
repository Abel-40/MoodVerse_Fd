import Image, { type ImageProps } from "next/image";

import { cx } from "@/lib/cx";

type SceneImageProps = Omit<ImageProps, "alt" | "fill" | "src"> & { src: string };

/**
 * A decorative full-bleed photo that turns into the starry night in dark mode.
 * Both are in the markup so the theme can switch before paint. The night one
 * loads like the day one (it is the hero in dark mode) but is never preloaded.
 */
export function SceneImage({ src, className, preload, ...props }: SceneImageProps) {
  return (
    <>
      <Image src={src} alt="" fill preload={preload} className={cx(className, "dark:hidden")} {...props} />
      <Image src="/images/starry-night.jpg" alt="" fill className={cx(className, "hidden dark:block")} {...props} />
    </>
  );
}
