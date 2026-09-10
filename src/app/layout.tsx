import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoodVerse API console",
  description:
    "Exercise every MoodVerse backend endpoint from the browser and read the raw HTTP exchange.",
};

export const viewport: Viewport = { colorScheme: "dark" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
