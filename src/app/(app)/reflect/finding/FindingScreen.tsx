"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CircleAlert, LogIn } from "lucide-react";

import { BreathingSun } from "@/components/mv/BreathingSun";
import { Button, ButtonLink } from "@/components/mv/Button";
import { MessagePanel } from "@/components/mv/MessagePanel";
import { ApiError, apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/hooks";
import type { ReflectionDto, SubmitDto } from "@/lib/api/types";
import {
  clearDraft,
  discardPendingReflection,
  excerpt,
  parsePendingReflection,
  readPendingReflection,
  type PendingReflection,
} from "@/lib/client/reflection-draft";
import { cx } from "@/lib/cx";

const MIN_VISIBLE_MS = 1200;
const FADE_MS = 400;
const POLL_MS = 1000;
const GIVE_UP_MS = 90_000;
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

type Phase = "finding" | "failed" | "signIn" | "leaving";

const noSubscription = () => () => {};

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

/** Network trouble and server errors are worth one more try; nothing else is. */
function retryable(error: unknown) {
  return error instanceof ApiError && (error.status === 0 || error.status >= 500);
}

/** Submit, then poll until the background matcher finishes. Resolves to the finished reflection. */
async function findPassage(pending: PendingReflection, signal: AbortSignal): Promise<ReflectionDto> {
  const submit = () =>
    apiFetch<SubmitDto>("api/v1/recommendations", {
      method: "POST",
      json: { text: pending.text, religion: pending.tradition },
      signal,
    });
  let submitted: SubmitDto;
  try {
    submitted = await submit();
  } catch (error) {
    if (!retryable(error)) throw error;
    await wait(800, signal);
    submitted = await submit();
  }

  const deadline = Date.now() + GIVE_UP_MS;
  while (Date.now() < deadline) {
    await wait(POLL_MS, signal);
    const reflection = await apiFetch<ReflectionDto>(`api/v1/reflections/${submitted.reflection_id}`, { signal });
    if (reflection.status === "completed") {
      if (reflection.results.length === 0) throw new Error("no passage");
      return reflection;
    }
    if (reflection.status === "failed") throw new Error("matching failed");
  }
  throw new Error("timed out");
}

/*
 * One search per staged reflection and attempt. React mounts effects twice in
 * development, and a remount must join the search already running rather than
 * submit the reflection again. A search is only aborted once nobody has
 * rejoined it, or when the person presses Cancel.
 */
interface Flight {
  promise: Promise<ReflectionDto>;
  controller: AbortController;
  watchers: number;
  abortTimer?: number;
}
const flights = new Map<string, Flight>();

function joinFlight(key: string, pending: PendingReflection): Flight {
  let flight = flights.get(key);
  if (!flight) {
    const controller = new AbortController();
    const created: Flight = { promise: findPassage(pending, controller.signal), controller, watchers: 0 };
    created.promise.then(
      () => flights.delete(key),
      () => flights.delete(key),
    );
    flights.set(key, created);
    flight = created;
  }
  window.clearTimeout(flight.abortTimer);
  flight.watchers += 1;
  return flight;
}

function leaveFlight(key: string) {
  const flight = flights.get(key);
  if (!flight) return;
  flight.watchers -= 1;
  if (flight.watchers > 0) return;
  flight.abortTimer = window.setTimeout(() => {
    flight.controller.abort();
    flights.delete(key);
  }, 0);
}

export function FindingScreen({ guest }: { guest: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  // null until hydrated (the server can't see sessionStorage), then the
  // staged reflection, or "" when there is none.
  const raw = useSyncExternalStore(noSubscription, readPendingReflection, () => null);
  const pending = useMemo<PendingReflection | null>(() => (raw ? parsePendingReflection(raw) : null), [raw]);
  const [phase, setPhase] = useState<Phase>(guest ? "signIn" : "finding");
  const [attempt, setAttempt] = useState(0);
  const flight = useRef<Flight | null>(null);

  useEffect(() => {
    if (raw === null) return;
    if (!pending) {
      router.replace("/reflect");
      return;
    }
    if (guest) return;

    const key = `${raw}#${attempt}`;
    const current = joinFlight(key, pending);
    flight.current = current;
    // Ends this screen's own waits (not the search) when it unmounts.
    const local = new AbortController();
    const startedAt = Date.now();

    current.promise
      .then(async (reflection) => {
        // Don't flash: stay at least MIN_VISIBLE_MS, then fade into the result.
        await wait(Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt)), local.signal);
        queryClient.setQueryData(queryKeys.reflection(reflection.id), reflection);
        await clearDraft();
        setPhase("leaving");
        await wait(FADE_MS, local.signal);
        discardPendingReflection();
        router.replace(`/r/${reflection.id}`);
      })
      .catch((error: unknown) => {
        if (local.signal.aborted || current.controller.signal.aborted) return;
        setPhase(error instanceof ApiError && error.signedOut ? "signIn" : "failed");
      });

    return () => {
      local.abort();
      leaveFlight(key);
    };
  }, [attempt, guest, pending, queryClient, raw, router]);

  function cancel() {
    flight.current?.controller.abort();
    discardPendingReflection();
    router.push("/reflect");
  }

  function retry() {
    setPhase("finding");
    setAttempt((count) => count + 1);
  }

  const preview = pending ? excerpt(pending.text) : "";

  if (phase === "signIn") {
    return (
      <MessagePanel
        icon={<LogIn size={28} />}
        title={t("finding.guest.title")}
        body={t("finding.guest.body")}
        actions={
          <>
            <ButtonLink href="/reflect" variant="secondary">
              {t("finding.guest.back")}
            </ButtonLink>
            <ButtonLink href="/sign-in">{t("finding.guest.signIn")}</ButtonLink>
          </>
        }
      />
    );
  }

  if (phase === "failed") {
    return (
      <MessagePanel
        icon={<CircleAlert size={30} strokeWidth={1.5} />}
        title={t("error.title")}
        body={t("error.body")}
        actions={
          <>
            <ButtonLink href="/reflect" variant="secondary">
              {t("error.edit")}
            </ButtonLink>
            <Button onClick={retry}>{t("error.retry")}</Button>
          </>
        }
        footer={
          SUPPORT_EMAIL && (
            // The report never carries the reflection, only that it happened.
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t("error.reportSubject"))}`}
              className="mv-btn mv-btn-ghost text-sm"
            >
              {t("error.report")}
            </a>
          )
        }
      />
    );
  }

  return (
    <div
      aria-busy="true"
      className={cx(
        "relative flex h-full min-h-[640px] flex-col items-center justify-center gap-9 overflow-hidden px-6 py-10 text-white transition-opacity duration-[400ms] ease-mv",
        phase === "leaving" && "opacity-0",
      )}
    >
      <Image src="/images/hero-dawn.jpg" alt="" fill preload loading="eager" sizes="calc(100vw - 256px)" className="mv-drift object-cover" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,14,48,.35),rgba(16,14,48,.18)_40%,rgba(16,14,48,.55))]"
      />

      <BreathingSun />

      <div className="relative flex flex-col items-center gap-2.5 text-center [text-shadow:0_1px_14px_rgba(8,10,30,.35)]">
        <p role="status" className="font-serif text-[40px] font-medium tracking-[-0.01em]">
          {t("finding.title")}
        </p>
        {pending && <p className="text-[15px] font-semibold opacity-92">{t(`tradition.${pending.tradition}`)}</p>}
        {preview && (
          <p dir="auto" className="mt-3.5 max-w-[460px] font-serif text-xl leading-[1.45] italic opacity-92">“{preview}”</p>
        )}
      </div>

      <Button variant="glass" size="sm" className="relative" onClick={cancel}>
        {t("finding.cancel")}
      </Button>
    </div>
  );
}
