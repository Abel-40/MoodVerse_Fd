import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

/** Start answering /api/mv calls from the mocks. Anything else goes to the network. */
export async function startMocking() {
  await setupWorker(...handlers).start({ onUnhandledRequest: "bypass", quiet: true });
}
