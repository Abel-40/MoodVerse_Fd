import { NextResponse } from "next/server";

import { authError, forbiddenUnlessSameOrigin, readJson } from "@/lib/server/auth-routes";
import { backendFetch } from "@/lib/server/backend";

/** Ask the backend to email a sign-in link. */
export async function POST(request: Request) {
  const forbidden = forbiddenUnlessSameOrigin(request);
  if (forbidden) return forbidden;

  const body = await readJson<{ email: string }>(request);
  if (typeof body?.email !== "string") return authError("invalidEmail", 422);

  try {
    const response = await backendFetch("/auth/magic-link", { json: { email: body.email.trim() } });
    if (response.status === 422) return authError("invalidEmail", 422);
    if (!response.ok) return authError("generic", 502);
    return NextResponse.json({ sent: true }, { status: 202 });
  } catch {
    return authError("unreachable", 502);
  }
}
