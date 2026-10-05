/** A failed call to the backend. `status` 0 means it couldn't be reached. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(`${status} ${code}`);
    this.name = "ApiError";
  }

  /** The person has no session the backend accepts (signed out, or a guest). */
  get signedOut() {
    return this.status === 401;
  }

  get unreachable() {
    return this.status === 0 || this.status === 502 || this.status === 503;
  }
}

/** Fired on window when a call comes back signed out (see SessionExpiredDialog). */
export const SIGNED_OUT_EVENT = "mv:signed-out";

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  json?: unknown;
  signal?: AbortSignal;
}

/**
 * Call the backend through the same-origin proxy: `apiFetch("api/v1/...")`
 * reaches `<backend>/api/v1/...` with this session's credentials attached.
 */
export async function apiFetch<T>(path: string, { method = "GET", json, signal }: ApiOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/mv/${path.replace(/^\/+/, "")}`, {
      method,
      headers: json === undefined ? undefined : { "Content-Type": "application/json" },
      body: json === undefined ? undefined : JSON.stringify(json),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, "unreachable");
  }

  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
    const body = (await response.json().catch(() => ({}))) as { error?: string; detail?: unknown };
    throw new ApiError(response.status, body.error ?? (typeof body.detail === "string" ? body.detail : "http_error"));
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}
