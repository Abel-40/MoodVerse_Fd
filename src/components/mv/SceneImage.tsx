import Image, { type ImageProps } from "next/image";

import { cx } from "@/lib/cx";

type SceneImageProps = Omit<ImageProps, "alt" | "fill" | "src"> & { src: string };

/**
 * A decorative full-bleed photo that turns into the starry night in dark mode.
 * Both are in the markup so the theme can switch before paint; the hidden one
 * is lazy, so it only downloads once it is shown.
 */
export function SceneImage({ src, className, preload, loading, sizes, ...props }: SceneImageProps) {
  return (
    <>
      <Image
        src={src}
        alt=""
        fill
        preload={preload}
        loading={loading}
        sizes={sizes}
        className={cx(className, "dark:hidden")}
        {...props}
      />
      <Image
        src="/images/starry-night.jpg"
        alt=""
        fill
        sizes={sizes}
        className={cx(className, "hidden dark:block")}
        {...props}
      />
    </>
  );
}
