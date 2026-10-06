"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/mv/Button";
import { GlassPanel, IconBadge } from "@/components/mv/Surfaces";
import { finishSignIn, startGuestSession } from "@/lib/client/session";

type ErrorCode =
  | "generic"
  | "unreachable"
  | "invalidEmail"
  | "wrongPassword"
  | "exists"
  | "passwordShort"
  | "link"
  | "google";

/** Errors a redirect can bring back to this page. */
export type SignInError = Extract<ErrorCode, "link" | "google">;

type Method = "link" | "password";
type PasswordMode = "signIn" | "create";

const INPUT =
  "h-[52px] w-full rounded-2xl border-0 bg-surface px-[18px] text-base shadow-[inset_0_0_0_1.5px_var(--mv-line-strong)]";

/** Google's "G", per its sign-in branding guidelines. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function SignInCard({ initialError }: { initialError: SignInError | null }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const ids = { title: useId(), email: useId(), password: useId(), error: useId() };
  const [method, setMethod] = useState<Method>("link");
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<ErrorCode | null>(initialError);
  const [busy, setBusy] = useState(false);

  async function post(path: string, body: unknown): Promise<ErrorCode | null> {
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) return null;
      const data = (await response.json().catch(() => ({}))) as { error?: ErrorCode };
      return data.error ?? "generic";
    } catch {
      return "unreachable";
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    if (method === "link") {
      const failure = await post("/api/auth/magic-link", { email });
      setBusy(false);
      if (failure) setError(failure);
      else setSentTo(email.trim());
      return;
    }

    const failure = await post("/api/auth/password", { mode: passwordMode, email, password });
    if (failure) {
      setBusy(false);
      setError(failure);
      return;
    }
    await finishSignIn((href) => router.replace(href));
  }

  function continueAsGuest() {
    startGuestSession();
    router.push("/reflect");
  }

  if (sentTo) {
    return (
      <GlassPanel
        as="section"
        aria-labelledby={ids.title}
        className="mv-fade-in relative flex w-full max-w-[460px] flex-col items-center gap-4 rounded-[36px] px-9 pt-10 pb-8 text-center"
      >
        <IconBadge className="size-16 rounded-[22px]">
          <MailCheck size={30} />
        </IconBadge>
        <h1 id={ids.title} className="font-serif text-[38px] leading-[1.06] font-medium tracking-[-0.02em]">
          {t("sent.title")}
        </h1>
        <p role="status" className="text-base leading-6 text-ink-2">
          {t("sent.body", { email: sentTo })}
        </p>
        <Button
          variant="ghost"
          className="text-ink"
          onClick={() => {
            setSentTo(null);
            setError(null);
          }}
        >
          {t("sent.different")}
        </Button>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel
      as="section"
      aria-labelledby={ids.title}
      className="mv-fade-in relative flex w-full max-w-[460px] flex-col gap-[22px] rounded-[36px] px-9 pt-10 pb-[30px] max-[440px]:px-6"
    >
      <div className="flex flex-col gap-2 text-center">
        <h1 id={ids.title} className="font-serif text-[38px] leading-[1.06] font-medium tracking-[-0.02em]">
          {t.rich("title", { accent: (chunks) => <span className="mv-grad-text">{chunks}</span> })}
        </h1>
        <p className="text-base leading-6 text-ink-2">{t("body")}</p>
      </div>

      {/* Full navigation: the backend runs Google's OIDC flow. */}
      <a href="/api/auth/google" className="mv-btn mv-btn-secondary w-full">
        <GoogleMark />
        {t("google")}
      </a>

      <div className="flex items-center gap-3">
        <span className="h-px grow bg-line" />
        <span className="text-[13px] text-ink-2">{t("divider")}</span>
        <span className="h-px grow bg-line" />
      </div>

      <form className="flex flex-col gap-2.5" onSubmit={onSubmit} noValidate aria-describedby={error ? ids.error : undefined}>
        {error && (
          <p id={ids.error} role="alert" className="rounded-2xl bg-accent-soft px-3.5 py-2.5 text-sm leading-5">
            {t(`errors.${error}`)}
          </p>
        )}
        <label htmlFor={ids.email} className="text-sm font-bold">
          {t("emailLabel")}
        </label>
        <input
          id={ids.email}
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={INPUT}
        />
        {method === "password" && (
          <>
            <label htmlFor={ids.password} className="mt-1 text-sm font-bold">
              {t("password.label")}
            </label>
            <input
              id={ids.password}
              type="password"
              autoComplete={passwordMode === "create" ? "new-password" : "current-password"}
              required
              minLength={passwordMode === "create" ? 8 : undefined}
              aria-describedby={passwordMode === "create" ? `${ids.password}-hint` : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT}
            />
            {passwordMode === "create" && (
              <span id={`${ids.password}-hint`} className="text-[13px] text-ink-2">
                {t("password.hint")}
              </span>
            )}
          </>
        )}
        <Button type="submit" className="mt-1 w-full" disabled={busy}>
          {method === "link" ? t("sendLink") : t(`password.${passwordMode === "create" ? "create" : "signIn"}`)}
        </Button>
        <div className="flex flex-wrap justify-center gap-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm"
            onClick={() => {
              setMethod(method === "link" ? "password" : "link");
              setError(null);
            }}
          >
            {method === "link" ? t("password.use") : t("password.useLink")}
          </Button>
          {method === "password" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-sm"
              onClick={() => {
                setPasswordMode(passwordMode === "signIn" ? "create" : "signIn");
                setError(null);
              }}
            >
              {passwordMode === "signIn" ? t("password.toCreate") : t("password.toSignIn")}
            </Button>
          )}
        </div>
      </form>

      <div className="flex flex-col items-center gap-1 border-t border-line pt-1.5">
        <Button variant="ghost" className="text-base text-ink" onClick={continueAsGuest}>
          {t("guest")}
        </Button>
        <p className="text-center text-xs leading-[18px] text-ink-2">
          {t.rich("guestNote", {
            terms: (chunks) => (
              <Link href="/terms" className="underline">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </GlassPanel>
  );
}
