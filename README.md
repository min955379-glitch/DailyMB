# DailyMB

DailyMB shows today's 5 "Test Your Skills" quiz answers every morning,
cross-checked against several public answer sites, with a 5-day streak
tracker (25 / 50 / 80 / 100 / 125 MB). Independent helper app - not affiliated
with or endorsed by any mobile operator. Answers come from public websites
and may occasionally be wrong; always check.

## Project structure

```
app/                  Expo Router screens
  (tabs)/index.tsx    Home - today's answers, Short/Full modes
  (tabs)/streak.tsx   5-day reward tracker
  (tabs)/history.tsx  Last 30 days, searchable
  (tabs)/settings.tsx Notifications, mode, theme, language (EN/UR, RTL)
  onboarding.tsx      3 screens: explainer, notifications, battery guidance
components/           StatusBadge, AnswerList, ModeToggle, Skeleton, ClaimChecklist
features/             Feature barrels (quiz, streak, notifications, settings) grouping services + components
services/             supabase client, quiz fetch + offline cache, notifications, deeplink
store/                Zustand stores (settings, streak) persisted to AsyncStorage
lib/                  answer-core.ts (normalise + cross-verify + parsers), streak.ts, types.ts
theme/tokens.ts      Single design-token file (dark default; dark + light palettes, spacing, radii, type)
locales/             en.json / ur.json
supabase/
  migrations/         Tables: sources, daily_quiz, quiz_runs, fetch_logs, devices + RLS
  seed.sql            The 9 verified answer sources (config, editable without redeploy)
  cron.sql            pg_cron at 00:05 and 05:30 Asia/Karachi (19:05 / 00:30 UTC)
  functions/fetch-answers/   The answer engine (fetch, parse, verify, store, push)
  functions/health/          GET health status (last run, verified today, failures)
native/auto-assist/   Optional Android AccessibilityService - sideload build ONLY, off by default
plugins/              withAutoAssist.js config plugin (no-op unless DAILYMB_AUTO_ASSIST=1)
scripts/              generate-icons.js (sharp, from assets/icon.svg), sync-shared.mjs
__tests__/            Normalisation, cross-verification, streak, parser tests + HTML fixtures
assets/icon.svg       Original icon artwork (data drop + signal arc + check, amber sparkle)
```

## Setup

```bash
npm install
cp .env.example .env   # fill EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npm run icons          # generates all PNG icons from assets/icon.svg
```

## Run

```bash
npx expo start         # then press a for Android, i for iOS
```
Android: Expo Go or a development build on a device/emulator.
iOS: Expo Go or a development build (a Mac or EAS is needed for a device build).

## Backend deploy

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push                       # applies migrations/ (schema + register rate limits)
supabase db execute --file supabase/seed.sql   # or paste seed.sql in the SQL editor
supabase secrets set FUNCTION_SECRET=choose-a-long-random-value
supabase functions deploy fetch-answers health register-device
# Then run supabase/cron.sql once in the SQL editor (needs pg_cron + pg_net
# enabled and project_url + function_secret stored in Vault).
curl https://YOUR_PROJECT.supabase.co/functions/v1/health
```

Trigger a run by hand:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/fetch-answers -H "x-function-secret: YOUR_SECRET"
```

## Build with EAS

```bash
eas build -p android --profile preview     # installable APK (store flavour, no Auto-Assist)
eas build -p android --profile production  # Play Store AAB
eas build -p ios --profile production      # App Store build (needs Apple account)
eas build -p android --profile sideload    # APK WITH the optional Auto-Assist module
eas submit -p ios --profile production
```

## Add a new answer source

No redeploy needed. Insert one row (SQL editor or Table editor):

```sql
insert into public.sources (name, url, parser, priority, enabled)
values ('my-new-site', 'https://example.pk/today/', 'generic', 100, true);
```

Parsers available: `generic`, `answer-is-option`, `correct-answer-label`,
`question-answer-block` (all use the tolerant generic parser today).
Set `enabled = false` to disable a site. Watch `fetch_logs` / the health
endpoint after the next run to confirm it returns 5 questions.

## Tests

```bash
npm test          # normalisation, cross-verification, streak maths, parsers
npm run typecheck
npm run lint
```

## How verification works

Each source is fetched with 3 attempts (backoff 1s/2s/4s, 15s timeout).
Parsed answers are compared after normalisation (lowercase, trimmed,
punctuation-insensitive). An answer is **verified** only when at least 2
independent sources agree; disagreements are stored as **uncertain** with
both candidates and shown with a warning. A source that returns nothing or
malformed data is skipped and logged - it never stops the run.

## No accounts, by design

There is no login, sign-up, profile or password anywhere in this app, and no
auth code: the app reads the public `daily_quiz` table through the anon REST
endpoint (read-only RLS) and registers its anonymous push token through the
rate-limited `register-device` edge function (20 req/10 min per IP, 30/hour
per token). The app opens straight to Home after onboarding.

## Dark theme

Dark is the default on first launch. All colours live in `theme/tokens.ts`.
Run the WCAG AA contrast check (34 pairs, both palettes) with:

```bash
npm run contrast
```

Dark-mode QA results: see `docs/dark-mode-qa.md`.
