"use client";

import { ProductApp } from "@/components/ProductApp";
import { SessionProvider } from "@/lib/session";

export default function Page() {
  return (
    <SessionProvider>
      <ProductApp />
    </SessionProvider>
  );
}
