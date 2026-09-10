/**
 * Turns an EndpointSpec plus the values typed into its form into the arguments
 * `send` wants. Kept apart from the UI so the endpoint cards, the reflection
 * poller and the smoke flow all build requests the same way.
 */

import type { SendOptions } from "./api";
import type { EndpointSpec, FieldSpec } from "./endpoints";

export interface FormState {
  values: Record<string, string>;
  files: Record<string, File | null>;
}

/** An optional field left blank is omitted rather than sent as "". */
function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim() === "";
}

function coerce(field: FieldSpec, value: string): unknown {
  switch (field.kind) {
    case "number":
      return Number(value);
    case "boolean":
      return value === "true";
    case "tristate":
      return value === "true";
    default:
      return value;
  }
}

export function resolvePath(spec: EndpointSpec, values: Record<string, string>): string {
  return spec.path.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = values[name] ?? "";
    return encodeURIComponent(value);
  });
}

export interface BuildContext {
  baseUrl: string;
  accessToken: string | null;
}

export function buildSend(
  spec: EndpointSpec,
  form: FormState,
  context: BuildContext,
): SendOptions {
  const query: Record<string, string> = {};
  const jsonBody: Record<string, unknown> = {};
  const formBody: Record<string, string> = {};
  const multipart = new FormData();

  for (const field of spec.fields) {
    const raw = form.values[field.name] ?? "";

    if (field.in === "path") continue;

    if (field.in === "query") {
      if (!isBlank(raw)) query[field.name] = raw;
      continue;
    }

    if (field.kind === "file") {
      const file = form.files[field.name];
      if (file) multipart.append(field.name, file);
      continue;
    }

    // A tristate left unset means "no opinion" and must not be sent as false.
    if (field.kind === "tristate" && isBlank(raw)) continue;
    if (field.kind !== "boolean" && !field.required && isBlank(raw)) continue;

    switch (spec.encoding) {
      case "json":
        jsonBody[field.name] = coerce(field, raw);
        break;
      case "form":
        formBody[field.name] = raw;
        break;
      case "multipart":
        multipart.append(field.name, raw);
        break;
      default:
        break;
    }
  }

  return {
    baseUrl: context.baseUrl,
    method: spec.method,
    path: resolvePath(spec, form.values),
    query,
    json: spec.encoding === "json" ? jsonBody : undefined,
    form: spec.encoding === "form" ? formBody : undefined,
    multipart: spec.encoding === "multipart" ? multipart : undefined,
    bearer: spec.auth ? context.accessToken : null,
    endpointId: spec.id,
    label: `${spec.method} ${spec.path}`,
  };
}

/** The URL a navigate-only endpoint should open, tokens included. */
export function navigateUrl(
  spec: EndpointSpec,
  form: FormState,
  context: BuildContext,
): string {
  const url = new URL(
    `${context.baseUrl.replace(/\/+$/, "")}${resolvePath(spec, form.values)}`,
  );
  for (const field of spec.fields) {
    if (field.in !== "query") continue;
    const value = form.values[field.name] ?? "";
    if (!isBlank(value)) url.searchParams.set(field.name, value);
  }
  return url.toString();
}
