"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { ApiError } from "@/lib/api/client";

// Dev only: NEXT_PUBLIC_API_MOCKING=1 answers /api/mv calls with the sample
// responses (src/mocks), so screens can be built without the backend or LLM.
const MOCKING = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_API_MOCKING === "1";

function useMockServiceWorker() {
  const [ready, setReady] = useState(!MOCKING);
  useEffect(() => {
    if (!MOCKING) return;
    import("@/mocks/browser").then(({ startMocking }) => startMocking()).then(() => setReady(true));
  }, []);
  return ready;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // Retrying won't fix a missing session or a bad request.
            retry: (count, error) =>
              count < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
          },
        },
      }),
  );
  const ready = useMockServiceWorker();
  if (!ready) return null;
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
