"use client";

import { useCallback, useMemo, useState } from "react";

import { send, type Exchange } from "@/lib/api";
import { initialValues, randomEmail, type EndpointSpec, type FieldSpec } from "@/lib/endpoints";
import { buildSend, navigateUrl, type FormState } from "@/lib/request";
import { useSession } from "@/lib/session";

import { ReflectionPoll } from "./ReflectionPoll";
import { ResponseView } from "./ResponseView";
import { VoiceRecorder } from "./VoiceRecorder";

const METHOD_TONE: Record<string, string> = {
  GET: "border-info/40 bg-info/10 text-info",
  POST: "border-ok/40 bg-ok/10 text-ok",
  PATCH: "border-warn/40 bg-warn/10 text-warn",
  DELETE: "border-bad/40 bg-bad/10 text-bad",
};

function Label({ field }: { field: FieldSpec }) {
  return (
    <div className="mb-1 flex items-baseline gap-2">
      <span className="font-mono text-xs text-ink-200">{field.label}</span>
      {field.required && <span className="text-[10px] text-bad">required</span>}
      <span className="text-[10px] text-ink-500">{field.in}</span>
    </div>
  );
}

export function EndpointCard({ spec }: { spec: EndpointSpec }) {
  const session = useSession();
  const [typed, setTyped] = useState<Record<string, string>>(() => initialValues(spec));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [pending, setPending] = useState(false);

  const setValue = useCallback((name: string, value: string) => {
    setTyped((current) => ({ ...current, [name]: value }));
    setTouched((current) => (current[name] ? current : { ...current, [name]: true }));
  }, []);

  const { accessToken, refreshToken, reflectionId, canonicalId } = session;

  // Values carried forward from earlier calls - a refresh token from login, the
  // id of the reflection just submitted. Derived rather than copied into state,
  // so a later call updates the form without an effect racing what you typed;
  // once a field is touched it belongs to you, blank included.
  const values = useMemo(() => {
    const available: Record<string, string | null> = {
      accessToken,
      refreshToken,
      reflectionId,
      canonicalId,
    };
    const next = { ...typed };
    for (const field of spec.fields) {
      if (!field.fill || touched[field.name] || next[field.name]) continue;
      const incoming = available[field.fill];
      if (incoming) next[field.name] = incoming;
    }
    return next;
  }, [spec, typed, touched, accessToken, refreshToken, reflectionId, canonicalId]);

  const form: FormState = useMemo(() => ({ values, files }), [values, files]);

  const missing = spec.fields.filter((field) => {
    if (!field.required) return false;
    if (field.kind === "file") return !files[field.name];
    return !(values[field.name] ?? "").trim();
  });

  const needsToken = spec.auth && !session.accessToken;
  const blocked = missing.length > 0 || needsToken || pending;

  const submit = useCallback(async () => {
    if (spec.navigate) {
      window.open(
        navigateUrl(spec, form, { baseUrl: session.baseUrl, accessToken }),
        "_blank",
        "noopener",
      );
      return;
    }

    setPending(true);
    const result = await send(
      buildSend(spec, form, { baseUrl: session.baseUrl, accessToken }),
    );
    setExchange(result);
    session.absorb(result);
    setPending(false);
  }, [spec, form, session, accessToken]);

  const submittedReflectionId =
    (spec.id === "recommendations" || spec.id === "voice") &&
    exchange?.response?.ok &&
    typeof exchange.response.json === "object" &&
    exchange.response.json !== null
      ? (exchange.response.json as { reflection_id?: number }).reflection_id
      : undefined;

  return (
    <section
      id={spec.id}
      className="scroll-mt-24 rounded-xl border border-ink-800 bg-ink-900/40 p-4 transition-colors hover:border-ink-700"
    >
      <header className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
            METHOD_TONE[spec.method] ?? METHOD_TONE.GET
          }`}
        >
          {spec.method}
        </span>
        <code className="font-mono text-sm text-ink-100">{spec.path}</code>
        {spec.auth && (
          <span
            className="rounded border border-accent-dim bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent"
            title="Sends Authorization: Bearer with the captured access token"
          >
            bearer
          </span>
        )}
        <span className="ml-auto text-xs text-ink-500">{spec.title}</span>
      </header>

      <p className="mt-2 text-sm leading-relaxed text-ink-300">{spec.description}</p>

      {spec.note && (
        <p className="mt-2 border-l-2 border-ink-700 pl-3 text-xs leading-relaxed text-ink-400">
          {spec.note}
        </p>
      )}

      {spec.fields.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {spec.fields.map((field) => (
            <div
              key={field.name}
              className={
                field.kind === "textarea" || field.kind === "file" ? "sm:col-span-2" : ""
              }
            >
              <Label field={field} />

              {field.kind === "textarea" && (
                <textarea
                  rows={3}
                  value={values[field.name] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) => setValue(field.name, event.target.value)}
                />
              )}

              {(field.kind === "text" || field.kind === "password") && (
                <div className="flex gap-2">
                  <input
                    type={field.kind === "password" ? "password" : "text"}
                    value={values[field.name] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(event) => setValue(field.name, event.target.value)}
                  />
                  {field.suggest === "email" && (
                    <button
                      type="button"
                      onClick={() => setValue(field.name, randomEmail())}
                      title="Fill a fresh unused address"
                      className="shrink-0 rounded-md border border-ink-700 px-2 text-xs text-ink-300 hover:bg-ink-800 hover:text-ink-100"
                    >
                      random
                    </button>
                  )}
                </div>
              )}

              {field.kind === "number" && (
                <input
                  type="number"
                  value={values[field.name] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) => setValue(field.name, event.target.value)}
                />
              )}

              {field.kind === "select" && (
                <select
                  value={values[field.name] ?? ""}
                  onChange={(event) => setValue(field.name, event.target.value)}
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {field.kind === "tristate" && (
                <select
                  value={values[field.name] ?? ""}
                  onChange={(event) => setValue(field.name, event.target.value)}
                >
                  <option value="">omit (null)</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              )}

              {field.kind === "boolean" && (
                <select
                  value={values[field.name] ?? "false"}
                  onChange={(event) => setValue(field.name, event.target.value)}
                >
                  <option value="false">false</option>
                  <option value="true">true</option>
                </select>
              )}

              {field.kind === "file" && (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(event) =>
                      setFiles((current) => ({
                        ...current,
                        [field.name]: event.target.files?.[0] ?? null,
                      }))
                    }
                  />
                  <VoiceRecorder
                    onRecorded={(file) =>
                      setFiles((current) => ({ ...current, [field.name]: file }))
                    }
                  />
                  {files[field.name] && (
                    <p className="font-mono text-xs text-ink-400">
                      {files[field.name]?.name} · {files[field.name]?.type || "unknown type"} ·{" "}
                      {files[field.name]?.size} B
                    </p>
                  )}
                </div>
              )}

              {field.help && (
                <p className="mt-1 text-[11px] text-ink-500">{field.help}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={blocked}
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-ink-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {pending ? "sending…" : spec.navigate ? "open in a new tab" : "send"}
        </button>

        <span className="text-xs text-ink-500">
          expects <span className="font-mono text-ink-400">{spec.expect}</span>
        </span>

        {needsToken && (
          <span className="text-xs text-warn">sign in first - no access token yet</span>
        )}
        {missing.length > 0 && !needsToken && (
          <span className="text-xs text-ink-500">
            missing: {missing.map((field) => field.name).join(", ")}
          </span>
        )}
      </div>

      {exchange && <ResponseView exchange={exchange} expect={spec.expect} />}

      {submittedReflectionId !== undefined && (
        <ReflectionPoll reflectionId={submittedReflectionId} />
      )}
    </section>
  );
}
