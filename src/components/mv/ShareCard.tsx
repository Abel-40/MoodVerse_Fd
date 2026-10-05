import Image from "next/image";
import { useTranslations } from "next-intl";

import { cx } from "@/lib/cx";
import type { Passage } from "@/lib/scripture";

import { Wordmark } from "./Wordmark";

export type ShareBackground =
  | "photo"
  | "transparent"
  | "dawn"
  | "misty"
  | "sea"
  | "hills"
  | "night"
  | "clouds"
  | "sky"
  | "daybreak"
  | "midnight"
  | "clean";

type Tone = "light" | "dark";

interface Look {
  image?: string;
  base: string;
  overlay?: string;
  tone: Tone;
}

// design-kit/docs/SHARE-CARD-SPEC.md. The card is an image people post, so
// these colours are fixed rather than themed: it must look the same whether
// the app is in light or dark mode.
const LOOKS: Record<ShareBackground, Look> = {
  dawn: {
    image: "/images/dawn-lake.jpg",
    base: "#0A0F1F",
    overlay: "linear-gradient(180deg, rgba(20,16,56,.30), rgba(20,16,56,.38) 55%, rgba(14,12,40,.55))",
    tone: "light",
  },
  misty: {
    image: "/images/misty-morning.jpg",
    base: "#0A0F1F",
    overlay: "linear-gradient(180deg, rgba(22,32,80,.20), rgba(22,32,80,.42) 50%, rgba(18,26,66,.55))",
    tone: "light",
  },
  sea: {
    image: "/images/calm-sea.jpg",
    base: "#0A0F1F",
    overlay: "linear-gradient(180deg, rgba(24,26,72,.30), rgba(24,26,72,.40) 50%, rgba(20,22,60,.5))",
    tone: "light",
  },
  hills: {
    image: "/images/golden-hills.jpg",
    base: "#0A0F1F",
    overlay: "linear-gradient(180deg, rgba(18,26,52,.34), rgba(18,26,52,.46) 55%, rgba(14,24,30,.55))",
    tone: "light",
  },
  night: {
    image: "/images/starry-night.jpg",
    base: "#0A0F1F",
    overlay: "linear-gradient(180deg, rgba(5,8,25,.10), rgba(5,8,25,.30))",
    tone: "light",
  },
  clouds: {
    image: "/images/soft-clouds.jpg",
    base: "#0A0F1F",
    overlay: "linear-gradient(180deg, rgba(255,255,255,.20), rgba(255,255,255,.50) 50%, rgba(255,255,255,.30))",
    tone: "dark",
  },
  sky: {
    base: "linear-gradient(160deg, #2F5BEA 0%, #5B4DE8 60%, #8B6CF0 100%)",
    overlay: "radial-gradient(80% 50% at 50% 0%, rgba(255,255,255,.22), rgba(255,255,255,0))",
    tone: "light",
  },
  daybreak: {
    base: "linear-gradient(180deg, #FFE6D2 0%, #FFD0D9 48%, #D8CEFF 100%)",
    overlay: "radial-gradient(70% 40% at 50% 100%, rgba(255,255,255,.55), rgba(255,255,255,0))",
    tone: "dark",
  },
  midnight: {
    base: "radial-gradient(90% 55% at 50% 100%, #2B2F7A 0%, #0F1433 60%, #0A0F1F 100%)",
    overlay: "radial-gradient(40% 25% at 70% 15%, rgba(143,176,255,.18), rgba(143,176,255,0))",
    tone: "light",
  },
  clean: {
    base: "#FFFFFF",
    overlay:
      "radial-gradient(90% 45% at 50% 0%, rgba(110,140,255,.18), rgba(110,140,255,0)), radial-gradient(70% 35% at 50% 100%, rgba(255,170,120,.16), rgba(255,170,120,0))",
    tone: "dark",
  },
  transparent: { base: "transparent", tone: "light" },
  photo: {
    image: "/images/your-photo.jpg",
    base: "#0A0F1F",
    overlay: "linear-gradient(180deg, rgba(10,14,38,.30), rgba(10,14,38,.45) 50%, rgba(10,14,38,.6))",
    tone: "light",
  },
};

const PHOTO_DARK_TEXT_OVERLAY = LOOKS.clouds.overlay;
const CHECKERBOARD = "repeating-conic-gradient(#3A3F5C 0% 25%, #4A5070 0% 50%) 0 0 / 24px 24px";
const TEXT = { light: "#FFFFFF", dark: "#131A33" } as const;
const PHOTO_BACKGROUNDS: ReadonlySet<ShareBackground> = new Set(["dawn", "misty", "sea", "hills", "night", "photo"]);

interface ShareCardProps {
  passage: Passage;
  background: ShareBackground;
  /** Rendered width in px. The card is laid out at 360 × 640 and scaled. */
  width?: number;
  /** Text colour on Transparent and Your photo, where the user picks it. */
  tone?: Tone;
  /** Object URL of the user's photo. It stays on the device. */
  photoUrl?: string;
  /** Passage size, 0.8 to 1.2. */
  textScale?: number;
  /** "Show reference & translation". */
  showAttribution?: boolean;
  /** Draw the editor's checkerboard behind a transparent card. */
  checkerboard?: boolean;
  className?: string;
}

/**
 * The 9:16 share card. It shows the passage, its reference and translation,
 * and the MoodVerse name, and never the user's reflection.
 */
export function ShareCard({
  passage,
  background,
  width = 360,
  tone,
  photoUrl,
  textScale = 1,
  showAttribution = true,
  checkerboard = false,
  className,
}: ShareCardProps) {
  const t = useTranslations();
  const look = LOOKS[background];
  const userPicksTone = background === "transparent" || background === "photo";
  const textTone = userPicksTone && tone ? tone : look.tone;
  const image = background === "photo" ? (photoUrl ?? look.image) : look.image;
  const overlay = background === "photo" && textTone === "dark" ? PHOTO_DARK_TEXT_OVERLAY : look.overlay;
  const shadow = textTone === "light" && PHOTO_BACKGROUNDS.has(background);
  const quran = passage.tradition === "quran";
  const translation = quran ? t("passage.translationName", { name: passage.translation }) : passage.translation;
  const label = t(background === "transparent" ? "share.cardLabelTransparent" : "share.cardLabel", {
    reference: passage.reference,
    translation,
  });
  const scale = width / 360;

  return (
    <div className={cx("relative shrink-0 overflow-hidden", className)} style={{ width, height: (width * 16) / 9 }}>
      <div
        role="img"
        aria-label={label}
        className="absolute top-0 left-0 h-[640px] w-[360px] origin-top-left overflow-hidden"
        style={{
          transform: scale === 1 ? undefined : `scale(${scale})`,
          background: background === "transparent" && checkerboard ? CHECKERBOARD : look.base,
          color: TEXT[textTone],
        }}
      >
        {image && (
          <Image
            src={image}
            alt=""
            fill
            sizes={`${Math.ceil(width)}px`}
            className="object-cover"
            unoptimized={image.startsWith("blob:")}
          />
        )}
        {overlay && <div aria-hidden="true" className="absolute inset-0" style={{ background: overlay }} />}

        <div
          className="absolute inset-0 flex flex-col justify-between px-9 pt-[52px] pb-10"
          style={{ textShadow: shadow ? "0 1px 14px rgba(8,10,30,.28)" : undefined }}
        >
          <div className="flex justify-center">
            <Wordmark markOnly size={26} tone={textTone === "light" ? "white" : "color"} />
          </div>

          {quran ? (
            <div className="flex flex-col items-center gap-[18px]">
              <p
                lang="ar"
                dir="rtl"
                className="text-center font-arabic font-medium"
                style={{ fontSize: 28 * textScale, lineHeight: 1.95 }}
              >
                {passage.arabic}
              </p>
              <span aria-hidden="true" className="h-0.5 w-7 rounded-sm" style={{ background: textTone === "light" ? "rgba(255,255,255,.8)" : "rgba(19,26,51,.5)" }} />
              <p
                className="text-center font-serif font-medium italic text-balance"
                style={{ fontSize: 20 * textScale, lineHeight: 1.38 }}
              >
                {passage.text}
              </p>
            </div>
          ) : (
            <p
              className="text-center font-serif font-medium tracking-[-0.005em] text-balance"
              style={{ fontSize: 29 * textScale, lineHeight: 1.32 }}
            >
              {passage.text}
            </p>
          )}

          <div className="flex flex-col items-center gap-4">
            {showAttribution && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-extrabold tracking-[.14em] uppercase">{passage.reference}</span>
                <span className="text-xs font-medium opacity-85">{translation}</span>
              </div>
            )}
            <span className="font-serif text-[15px] font-semibold opacity-90">{t("app.name")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
