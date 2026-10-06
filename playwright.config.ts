import { defineConfig } from "@playwright/test";

/*
 * End-to-end tests against the dev server with the API mocked (src/mocks),
 * in the installed Chrome. An already-running `npm run dev` is reused, so
 * start that one with NEXT_PUBLIC_API_MOCKING=1 too.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3200",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3200/sources",
    reuseExistingServer: true,
    timeout: 180_000,
    // Mocked API; the real backend address points nowhere, so sessions are
    // judged by their cookies alone.
    env: { NEXT_PUBLIC_API_MOCKING: "1", MOODVERSE_API_URL: "http://127.0.0.1:9" },
  },
});
