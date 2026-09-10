/**
 * The HTTP layer for the console.
 *
 * Everything goes through `send`, which returns the whole exchange - request
 * line, headers, body, status, timing, raw response text - rather than just
 * the parsed payload. Reading that exchange is the point of this app, so it is
 * captured once here instead of reconstructed in the UI.
 */

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface RequestRecord {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  /** Pretty-printed body, or a description of one that cannot be shown. */
  body?: string;
}

export interface ResponseRecord {
  status: number;
  statusText: string;
  ok: boolean;
  headers: Record<string, string>;
  /** Parsed JSON when the response is JSON, otherwise undefined. */
  json?: unknown;
  /** Exactly what came back, before parsing. */
  raw: string;
  durationMs: number;
}

export interface Exchange {
  id: string;
  at: number;
  endpointId: string;
  label: string;
  request: RequestRecord;
  response?: ResponseRecord;
  /** Set when the request never completed: network failure, CORS, DNS. */
  error?: string;
}

export interface SendOptions {
  baseUrl: string;
  method: HttpMethod;
  /** Path only; the base URL is joined on. */
  path: string;
  query?: Record<string, string>;
  /** JSON body. Mutually exclusive with `form` and `multipart`. */
  json?: unknown;
  /** application/x-www-form-urlencoded body, as OAuth2 password login needs. */
  form?: Record<string, string>;
  /** multipart/form-data body, for the voice upload. */
  multipart?: FormData;
  bearer?: string | null;
  endpointId: string;
  label: string;
}

let exchangeCounter = 0;

function nextId(): string {
  exchangeCounter += 1;
  return `x${exchangeCounter}-${Date.now().toString(36)}`;
}

export function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function describeMultipart(form: FormData): string {
  const lines: string[] = [];
  form.forEach((value, key) => {
    if (value instanceof File) {
      lines.push(`${key}: <file ${value.name}, ${value.type || "unknown"}, ${value.size} bytes>`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  });
  return lines.join("\n");
}

export async function send(options: SendOptions): Promise<Exchange> {
  const { baseUrl, method, path, query, json, form, multipart, bearer } = options;

  const url = new URL(joinUrl(baseUrl, path));
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== "") url.searchParams.set(key, value);
  }

  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  let shownBody: string | undefined;

  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    shownBody = JSON.stringify(json, null, 2);
    body = shownBody;
  } else if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    const encoded = new URLSearchParams(form);
    body = encoded;
    shownBody = encoded.toString();
  } else if (multipart) {
    // Content-Type is deliberately unset: the browser must add the multipart
    // boundary itself, and setting it by hand produces an unparseable body.
    body = multipart;
    shownBody = describeMultipart(multipart);
  }

  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

  const request: RequestRecord = {
    method,
    url: url.toString(),
    headers: {
      ...headers,
      ...(bearer ? { Authorization: `Bearer ${maskToken(bearer)}` } : {}),
      ...(multipart ? { "Content-Type": "multipart/form-data; boundary=<set by browser>" } : {}),
    },
    body: shownBody,
  };

  const startedAt = performance.now();

  try {
    const response = await fetch(url, { method, headers, body });
    const raw = await response.text();
    const durationMs = Math.round(performance.now() - startedAt);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let parsed: unknown;
    try {
      parsed = raw === "" ? undefined : JSON.parse(raw);
    } catch {
      parsed = undefined;
    }

    return {
      id: nextId(),
      at: Date.now(),
      endpointId: options.endpointId,
      label: options.label,
      request,
      response: {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: responseHeaders,
        json: parsed,
        raw,
        durationMs,
      },
    };
  } catch (cause) {
    // A browser reports a CORS rejection as an indistinguishable TypeError, so
    // name the likely cause rather than leaving "Failed to fetch" on screen.
    const message = cause instanceof Error ? cause.message : String(cause);
    return {
      id: nextId(),
      at: Date.now(),
      endpointId: options.endpointId,
      label: options.label,
      request,
      error:
        `${message} - the API may be down, or this origin may not be listed in ` +
        `CORS_ALLOWED_ORIGINS. Check that the stack is up: docker compose ps`,
    };
  }
}

export function maskToken(token: string): string {
  if (token.length <= 18) return token;
  return `${token.slice(0, 12)}…${token.slice(-6)}`;
}

/** Read a field out of a JSON response body without asserting its shape. */
export function pick(json: unknown, key: string): unknown {
  if (json && typeof json === "object" && key in json) {
    return (json as Record<string, unknown>)[key];
  }
  return undefined;
}

export function pickString(json: unknown, key: string): string | undefined {
  const value = pick(json, key);
  return typeof value === "string" ? value : undefined;
}

export function pickNumber(json: unknown, key: string): number | undefined {
  const value = pick(json, key);
  return typeof value === "number" ? value : undefined;
}
