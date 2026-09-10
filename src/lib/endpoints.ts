/**
 * Every endpoint the MoodVerse backend exposes, described once.
 *
 * The console renders its form, builds its request and reads its response from
 * this registry, so adding a route to the API means adding an entry here and
 * nothing else. Kept in sync by hand with backend/app/api/.
 */

import type { HttpMethod } from "./api";

export type GroupId = "meta" | "auth" | "oidc" | "reflections" | "scriptures";

export interface Group {
  id: GroupId;
  title: string;
  blurb: string;
}

export const GROUPS: Group[] = [
  {
    id: "meta",
    title: "Meta",
    blurb: "Liveness. The only route that needs no credentials.",
  },
  {
    id: "auth",
    title: "Auth",
    blurb:
      "Password sign-in, token rotation and email verification. Tokens returned here are captured automatically and reused by every protected call below.",
  },
  {
    id: "oidc",
    title: "Google OIDC",
    blurb:
      "Browser redirect flow. Returns 503 for every route unless GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set on the API.",
  },
  {
    id: "reflections",
    title: "Reflections",
    blurb:
      "The product. Submitting returns 202 immediately and a worker does the analysis, so poll the reflection until its status leaves pending.",
  },
  {
    id: "scriptures",
    title: "Scriptures",
    blurb: "Read one curated verse from the corpus by its canonical id.",
  },
];

export type FieldKind =
  | "text"
  | "password"
  | "textarea"
  | "number"
  | "select"
  | "file"
  | "boolean"
  | "tristate";

export interface FieldSpec {
  name: string;
  label: string;
  kind: FieldKind;
  /** Where the value ends up in the request. */
  in: "path" | "query" | "body";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  initial?: string;
  help?: string;
  /** Filled from console state when still empty - see fillValue in page.tsx. */
  fill?: "accessToken" | "refreshToken" | "reflectionId" | "canonicalId";
  /** Offers a one-click value, so a fresh account is one button away. */
  suggest?: "email" | "password";
}

export interface EndpointSpec {
  id: string;
  group: GroupId;
  method: HttpMethod;
  /** `{name}` segments are substituted from fields whose `in` is "path". */
  path: string;
  title: string;
  description: string;
  /** Sends Authorization: Bearer with the captured access token. */
  auth: boolean;
  encoding: "none" | "json" | "form" | "multipart";
  /** The documented success status, shown next to the actual one. */
  expect: number;
  fields: FieldSpec[];
  /**
   * A redirect flow the browser must follow itself. fetch() would chase the
   * 302 to Google and fail CORS, telling you nothing, so these open a tab.
   */
  navigate?: boolean;
  note?: string;
}

const RELIGION_OPTIONS = [
  { value: "bible", label: "bible" },
  { value: "quran", label: "quran" },
];

export const ENDPOINTS: EndpointSpec[] = [
  {
    id: "health",
    group: "meta",
    method: "GET",
    path: "/health",
    title: "Health",
    description:
      "Liveness probe. Start here: if this fails, the API is not reachable and nothing else will work.",
    auth: false,
    encoding: "none",
    expect: 200,
    fields: [],
  },

  {
    id: "register",
    group: "auth",
    method: "POST",
    path: "/auth/register",
    title: "Register",
    description:
      "Create an account and receive a token pair. Also enqueues a verification email, which is logged rather than sent unless SMTP_HOST is configured.",
    auth: false,
    encoding: "json",
    expect: 201,
    fields: [
      {
        name: "email",
        label: "email",
        kind: "text",
        in: "body",
        required: true,
        suggest: "email",
        placeholder: "you@example.com",
      },
      {
        name: "password",
        label: "password",
        kind: "password",
        in: "body",
        required: true,
        initial: "testpassword123",
        help: "8-128 characters.",
      },
      {
        name: "display_name",
        label: "display_name",
        kind: "text",
        in: "body",
        placeholder: "optional",
      },
    ],
    note: "A second registration with the same email returns 409.",
  },
  {
    id: "login",
    group: "auth",
    method: "POST",
    path: "/auth/login",
    title: "Login",
    description:
      "OAuth2 password form, not JSON. There is no separate username, so the email goes in the username field - which is what makes Swagger's Authorize button work.",
    auth: false,
    encoding: "form",
    expect: 200,
    fields: [
      {
        name: "username",
        label: "username (the email)",
        kind: "text",
        in: "body",
        required: true,
        placeholder: "you@example.com",
      },
      {
        name: "password",
        label: "password",
        kind: "password",
        in: "body",
        required: true,
      },
    ],
  },
  {
    id: "me",
    group: "auth",
    method: "GET",
    path: "/auth/me",
    title: "Current user",
    description:
      "The account behind the access token, including which OIDC providers are linked to it.",
    auth: true,
    encoding: "none",
    expect: 200,
    fields: [],
  },
  {
    id: "refresh",
    group: "auth",
    method: "POST",
    path: "/auth/refresh",
    title: "Refresh",
    description:
      "Exchange a refresh token for a new pair. Single-use: the token you send is revoked, so replaying it returns 401 - which is how a stolen token is detected.",
    auth: false,
    encoding: "json",
    expect: 200,
    fields: [
      {
        name: "refresh_token",
        label: "refresh_token",
        kind: "textarea",
        in: "body",
        required: true,
        fill: "refreshToken",
      },
    ],
  },
  {
    id: "logout",
    group: "auth",
    method: "POST",
    path: "/auth/logout",
    title: "Logout",
    description:
      "Revoke one refresh token. Idempotent by design - revoking an already-revoked or invalid token is a 204, never an error.",
    auth: false,
    encoding: "json",
    expect: 204,
    fields: [
      {
        name: "refresh_token",
        label: "refresh_token",
        kind: "textarea",
        in: "body",
        required: true,
        fill: "refreshToken",
      },
    ],
  },
  {
    id: "resend-verification",
    group: "auth",
    method: "POST",
    path: "/auth/resend-verification",
    title: "Resend verification",
    description:
      "Re-enqueue the verification email for the signed-in account. Returns {already_verified: true} instead if there is nothing to send.",
    auth: true,
    encoding: "none",
    expect: 202,
    fields: [],
  },
  {
    id: "verify-email",
    group: "auth",
    method: "GET",
    path: "/auth/verify-email",
    title: "Verify email",
    description:
      "Public - the token in the link is the credential, not a session. Idempotent, so clicking a stale link twice confirms rather than erroring.",
    auth: false,
    encoding: "none",
    expect: 200,
    fields: [
      {
        name: "token",
        label: "token",
        kind: "textarea",
        in: "query",
        required: true,
        placeholder: "the token from the verification email",
      },
    ],
    note: "Without SMTP configured, read the token from the worker log: docker compose logs worker-light",
  },

  {
    id: "oidc-login",
    group: "oidc",
    method: "GET",
    path: "/auth/oidc/login",
    title: "Start Google sign-in",
    description:
      "Opens Google in a new tab. redirect_uri is your app's deep link to return to, not the callback registered with Google, and is refused unless it appears verbatim in OIDC_ALLOWED_APP_REDIRECTS.",
    auth: false,
    encoding: "none",
    expect: 302,
    navigate: true,
    fields: [
      {
        name: "redirect_uri",
        label: "redirect_uri",
        kind: "text",
        in: "query",
        placeholder: "moodverse://auth (optional)",
        help: "Leave empty to have the callback return the tokens as JSON.",
      },
    ],
  },
  {
    id: "oidc-callback",
    group: "oidc",
    method: "GET",
    path: "/auth/oidc/callback",
    title: "Callback",
    description:
      "Google calls this, not you. Requesting it by hand is still worth doing once: it should refuse a missing or replayed code rather than issuing anything.",
    auth: false,
    encoding: "none",
    expect: 400,
    fields: [
      { name: "code", label: "code", kind: "text", in: "query", placeholder: "optional" },
      { name: "state", label: "state", kind: "text", in: "query", placeholder: "optional" },
    ],
  },
  {
    id: "oidc-logout",
    group: "oidc",
    method: "GET",
    path: "/auth/oidc/logout",
    title: "Logout",
    description:
      "RP-initiated logout, written against the OIDC spec. Google publishes no end_session_endpoint, so against Google it clears the local session and reports that it could go no further.",
    auth: false,
    encoding: "none",
    expect: 200,
    fields: [
      {
        name: "post_logout_redirect_uri",
        label: "post_logout_redirect_uri",
        kind: "text",
        in: "query",
        placeholder: "optional, allow-listed only",
      },
    ],
  },

  {
    id: "recommendations",
    group: "reflections",
    method: "POST",
    path: "/api/v1/recommendations",
    title: "Submit a text reflection",
    description:
      "Returns 202 with a reflection id straight away; analysis, retrieval and ranking all happen in the heavy worker. The console captures the id and can poll it for you.",
    auth: true,
    encoding: "json",
    expect: 202,
    fields: [
      {
        name: "text",
        label: "text",
        kind: "textarea",
        in: "body",
        required: true,
        initial: "I feel anxious and alone tonight, and I do not know what to do.",
        help: "1-4000 characters.",
      },
      {
        name: "religion",
        label: "religion",
        kind: "select",
        in: "body",
        required: true,
        options: RELIGION_OPTIONS,
        initial: "bible",
      },
    ],
  },
  {
    id: "voice",
    group: "reflections",
    method: "POST",
    path: "/api/v1/reflections/voice",
    title: "Submit a voice reflection",
    description:
      "Multipart upload, same 202-then-poll contract with transcription ahead of it. Accepts flac, m4a, mp4, mpeg, mpga, ogg, wav and webm.",
    auth: true,
    encoding: "multipart",
    expect: 202,
    fields: [
      {
        name: "religion",
        label: "religion",
        kind: "select",
        in: "body",
        required: true,
        options: RELIGION_OPTIONS,
        initial: "bible",
      },
      {
        name: "audio",
        label: "audio",
        kind: "file",
        in: "body",
        required: true,
        help: "Or record one below. Rejected with 415 if the type is not on the list.",
      },
    ],
    note: "Without CARTESIA_API_KEY the upload is still accepted; the reflection then fails with a clear error, which is itself worth seeing.",
  },
  {
    id: "reflection",
    group: "reflections",
    method: "GET",
    path: "/api/v1/reflections/{reflection_id}",
    title: "Poll one reflection",
    description:
      "The poll target for both submit routes. status moves pending → processing → completed or failed, and the verses appear under results once it completes.",
    auth: true,
    encoding: "none",
    expect: 200,
    fields: [
      {
        name: "reflection_id",
        label: "reflection_id",
        kind: "number",
        in: "path",
        required: true,
        fill: "reflectionId",
      },
    ],
    note: "Someone else's reflection returns 404, identically to one that does not exist, so its existence is never revealed.",
  },
  {
    id: "history",
    group: "reflections",
    method: "GET",
    path: "/api/v1/reflections/history",
    title: "History",
    description: "Every reflection this account has submitted, newest first.",
    auth: true,
    encoding: "none",
    expect: 200,
    fields: [
      {
        name: "limit",
        label: "limit",
        kind: "number",
        in: "query",
        initial: "20",
        help: "1-100.",
      },
      { name: "offset", label: "offset", kind: "number", in: "query", initial: "0" },
    ],
  },
  {
    id: "feedback",
    group: "reflections",
    method: "POST",
    path: "/api/v1/reflections/{reflection_id}/feedback",
    title: "Leave feedback",
    description:
      "Rate one served verse. canonical_id is optional only when the reflection returned exactly one result; with several it is required and checked against them.",
    auth: true,
    encoding: "json",
    expect: 201,
    fields: [
      {
        name: "reflection_id",
        label: "reflection_id",
        kind: "number",
        in: "path",
        required: true,
        fill: "reflectionId",
      },
      {
        name: "canonical_id",
        label: "canonical_id",
        kind: "text",
        in: "body",
        fill: "canonicalId",
        placeholder: "bible:john:3:16",
      },
      {
        name: "helpful",
        label: "helpful",
        kind: "tristate",
        in: "body",
        initial: "",
      },
      {
        name: "note",
        label: "note",
        kind: "textarea",
        in: "body",
        placeholder: "optional, up to 2000 characters",
      },
      {
        name: "reported_harmful",
        label: "reported_harmful",
        kind: "boolean",
        in: "body",
        initial: "false",
      },
    ],
  },

  {
    id: "scripture",
    group: "scriptures",
    method: "GET",
    path: "/api/v1/scriptures/{canonical_id}",
    title: "Read a verse",
    description:
      "Protected like everything else under /api/v1 - the rule is that every business endpoint sits behind auth, with no per-route judgement about what counts as sensitive.",
    auth: true,
    encoding: "none",
    expect: 200,
    fields: [
      {
        name: "canonical_id",
        label: "canonical_id",
        kind: "text",
        in: "path",
        required: true,
        fill: "canonicalId",
        placeholder: "take one from a completed reflection",
      },
    ],
  },
];

export const ENDPOINTS_BY_GROUP = GROUPS.map((group) => ({
  group,
  endpoints: ENDPOINTS.filter((endpoint) => endpoint.group === group.id),
}));

export function initialValues(spec: EndpointSpec): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of spec.fields) values[field.name] = field.initial ?? "";
  return values;
}

export function randomEmail(): string {
  return `console+${Math.random().toString(36).slice(2, 8)}@example.com`;
}
