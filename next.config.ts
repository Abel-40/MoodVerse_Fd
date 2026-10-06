import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // AVIF first (smallest), WebP for browsers without it.
  images: { formats: ["image/avif", "image/webp"] },
};

export default withNextIntl(nextConfig);
