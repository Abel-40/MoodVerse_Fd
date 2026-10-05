# MoodVerse web

## This repository

- **Design kit path.** The kit's prompts refer to `design-kit/`. In this repo
  the kit lives at `moodverse-web-kit/moodverse-web-kit/` (gitignored). Read
  every `design-kit/...` path as `moodverse-web-kit/moodverse-web-kit/...`.
- **Build order.** Prompts `02`–`11` in `moodverse-web-kit/moodverse-web-kit/prompts/`
  are run one at a time, in order. After each, compare every screen with its
  PNG in `design/screens/` and its HTML in `design/html/` before moving on.
- **Stack deviations from the kit.** This repo is on Next.js 16 and Tailwind v4
  (the kit was written for Next 15 and ships a Tailwind v3 preset). The preset
  is ported to an `@theme inline` block in `src/app/globals.css`.
- **Backend already exists.** The FastAPI backend is in `../MoodVerse_bd`
  (custom JWT, magic-link email, Google OIDC, async reflection submit-and-poll).
  Prompt 06 becomes "match the kit's API contract against that backend" rather
  than building a new one.
- **Auth and backend calls.** The browser never holds backend tokens: the
  `/api/auth/*` route handlers keep them in httpOnly cookies (`mv-at`, `mv-rt`)
  and `src/proxy.ts` refreshes them before a page renders. Server code calls
  the backend with `backendFetch` (`src/lib/server/backend.ts`); client
  components go through the same-origin proxy `/api/mv/<path>`, which only
  forwards `auth/me` and `api/v1/*`. Guests get a `guest=1` cookie and keep
  their data in this browser (IndexedDB via `idb-keyval`, plus localStorage).
- **Scripture never goes in `messages/*.json`.** Translators could change it;
  passage text always comes from passage data (`src/lib/fixtures.ts` in mocks).
- **Component classes are prefixed `mv-`.** The kit's CSS uses bare names
  (`.btn`, `.chip`, `.overline`, ...) scoped under `.mv`. Here they are global
  and prefixed (`.mv-btn`, `.mv-chip`, `.mv-overline`, ...) in
  `src/styles/mv.css`, because Tailwind v4 ships an `overline` utility that
  would otherwise win. When porting markup from `design/html/*.html`, add the
  prefix. `.sr` becomes Tailwind's `sr-only`; `.serif`/`.arabic` become
  `font-serif`/`font-arabic`.
- **Theme.** `data-theme` on `<html>` is `light` or `dark` (system is resolved
  before paint by the inline script in `src/app/layout.tsx`); the preference
  lives in the `mv-theme` cookie. Any subtree can force a theme with
  `data-theme="light|dark"`. Use `usePreferences()` from
  `src/lib/use-preferences.ts` to change theme or motion.
- **Legacy code.** The API console (`Console`, `EndpointCard`, `LogPanel`,
  `ResponseView`, `TopBar`, `ReflectionPoll`, `VoiceRecorder`, and
  `src/lib/{api,endpoints,request,session}`) predates the kit and is no
  longer routed. Don't extend it.

---

# MoodVerse web: master context

You are building **MoodVerse**, a spiritual reflection web app. A person writes how they feel, chooses **Holy Bible** or **Holy Quran**, and receives **one** verified scripture passage with a short "Why this passage" note. They can save it, give feedback, and share it as a 9:16 image card.

The complete design and spec are in `/design-kit`. Read these before writing code:
- `design-kit/docs/PRODUCT-BRIEF.md`: principles, visual direction, and the exact sample content.
- `design-kit/docs/COPY-AND-CONTENT.md`: every UI string. Use these strings word for word.
- `design-kit/SCREEN-MAP.md`: routes, states and navigation.
- `design-kit/tokens/design-tokens.json` and `tokens.css`: design tokens. Never hard-code a colour that has a token.
- `design-kit/design/screens/*.png` and `design-kit/design/html/*.html`: the visual source of truth.
- `design-kit/assets/css/moodverse.css`: the reference CSS for every component in the designs.

## Non-negotiable rules
1. **Scripture is never AI-generated.** Passage text comes only from the verified scripture store, always with its reference and translation name. No model may write, paraphrase, summarise or complete scripture. The only scripture in fixtures is Psalm 34:18 (KJV) and Surah Ash-Sharh 94:5–6 (Arabic with Pickthall). Do not add others to mocks.
2. **Not a chatbot, not therapy, not social.** No chat bubbles, assistant avatars, typing indicators, sparkle or magic-wand icons, streaks, likes, followers or confetti.
3. **Equal care for both traditions.** Same layout quality and feature set for each. Never mix religious symbols on a screen. No images of people, prophets or animals anywhere near Quran text. Use only the landscapes in `assets/images`.
4. **Private by default.** Reflection text is never shown on share cards, never logged, and never sent anywhere except the matching endpoint. Users can export or delete everything.
5. **Safety alongside scripture.** When the API returns `support: true`, show the support card *in addition to* the passage, never instead of it.
6. **Accessibility:** WCAG 2.2 AA contrast, everything keyboard-operable, visible focus rings (2 px primary, 3 px offset), touch targets of at least 44 px, works at 200% zoom, respects `prefers-reduced-motion`, and Arabic is always `dir="rtl" lang="ar"`.

## Stack
- **Next.js 15 (App Router) + TypeScript (strict) + React Server Components where natural.**
- Styling: Tailwind with `design-kit/tokens/tailwind.preset.ts` plus `tokens.css`. Plain CSS modules are also fine. Port the component classes from `moodverse.css` faithfully.
- Fonts: `next/font/google`:
  - Newsreader: 400, 500 and 600, plus italic.
  - Plus Jakarta Sans: 400–800.
  - Noto Naskh Arabic: 400–700, Arabic subset.
  - Expose them as the CSS variables `--font-newsreader`, `--font-jakarta` and `--font-naskh`.
- Icons: `lucide-react` with a 1.75–2 px stroke. Never use sparkle, wand or bot icons.
- Data: Postgres with Drizzle or Prisma. Auth.js (Apple, Google, email magic link). Zod for validation. TanStack Query for client cache.
- Images: `next/image` with the files in `public/images` (copied from `design-kit/assets/images`).
- i18n: `next-intl` with `messages/en.json` built from COPY-AND-CONTENT.md. Structure it so an `ar` locale can be added with RTL.
- Tests: Vitest for logic and Playwright for flows and visual checks.

## Visual language ("Morning Light")
- White and sky-wash backgrounds, a blue→violet gradient (`#2F5BEA → #6A4DE8`, 120°) for primary buttons and accent words, frosted-glass panels, and soft landscape images with scrims.
- Newsreader for headings and scripture, Plus Jakarta Sans for the interface, Noto Naskh Arabic for Quran text (line height at least 1.9).
- Radii: 28 for cards, 999 for pills, 20 for rows. Soft shadows in light mode; hairlines instead of shadows in dark mode.
- Motion:
  - 800 ms fade-up on enter.
  - 4 s breathing loop, only while waiting.
  - 30 s slow drift on large landscape images.
  - Nothing bouncy.
  - With reduced motion, use cross-fades only.

## Conventions
- Components in `src/components/mv/*`: `Button` (primary, secondary, ghost, glass, danger; sizes md 52 and sm 44), `Chip`, `NeedChip`, `FilterChip`, `Segmented`, `Field`, `GlassPanel`, `Card`, `PassageView` (bible and quran variants), `WhyCard`, `FeedbackBox`, `SupportCard`, `ShareCard`, `Sidebar`, `Toggle`, `Slider`, `EmptyState`, `Banner`.
- Every string comes from the messages file. No inline copy.
- Never put reflection text in URLs, analytics events, logs or error reports.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
