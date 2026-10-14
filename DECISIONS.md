# Decisions made (no questions asked, per instructions)

1. **Verified sources (checked live, 2026-10-14):** nine sites were publishing a
   dated today page that day and are seeded in `supabase/seed.sql`:
   apna4g.com, telenortodayquiz.com, todaymytelenoranswer.pk,
   telenorquiztoday.io, mytelenorquiz.pk, theiq.pk, telenorquiztodays.pk,
   telenorequiztoday.pk, todaytelenoranswers.pk. `mytelenoranswertoday.pk`
   (named in the brief) did NOT appear in search results and could not be
   verified, so it is not seeded - add it in the `sources` table if it returns.
   Note: on 2026-10-14 some of these sites disagreed with each other about
   that day's set, which is exactly why an answer needs 2 agreeing sources
   before it is shown as verified.
2. **Target app package (verified 2026-10-14):** `com.telenor.pakistan.mytelenor`,
   used for the Android launch and the Auto-Assist package lock.
3. **Cache:** AsyncStorage instead of MMKV - same offline behaviour, works in
   Expo Go and needs no native rebuild. Zustand (persisted) for settings/streak,
   React Query for server data.
4. **Default answer mode:** Full (the text is shuffle-proof). Short is one tap away.
5. **Cron times:** Supabase cron runs in UTC; Karachi is UTC+5 with no DST, so
   00:05 Karachi = 19:05 UTC and 05:30 Karachi = 00:30 UTC (`supabase/cron.sql`).
6. **Push de-duplication:** the 05:30 run does not re-push if the 00:05 run
   already sent that day's verified push.
7. **iOS target-app open:** iOS gives no public way to deep-link that app, so
   the fallback is its App Store search page. Android launches the package
   directly, with the Play Store listing as fallback.
8. **Assisted claim:** a checklist sheet + answers copied to the clipboard
   before launch. A true cross-app floating overlay is not possible in
   React Native on iOS, and on Android needs a separate draw-over-apps
   permission - not used in the store build.
9. **Parser approach:** one tolerant generic parser with named strategies,
   because all checked sites use one of three layouts (Answer-is-option,
   Correct-Answer label, Question/Answer block). A layout change returns 0
   questions for that source and the run continues with the others.
10. **Icon PNGs are generated, not committed** (`.gitignore`): run `npm run icons`.

## Needs your input before a public release
- A Supabase project (URL + anon key + service-role secret) and an EAS project ID.
  NOTE from your account history: your Supabase free plan was already at its
  2-active-project limit in October (Blue Peak + one other, with ReviewNudge
  paused). DailyMB will need a free slot - pause another project, reuse an
  existing project's schema, or use a second account/org.
- The real privacy-policy URL (Settings links to dailymb.app/privacy as a placeholder).
- On-device testing of Auto-Assist against the real quiz screens (never run on a phone here).
- Confirm the 25/50/80/100/125 MB streak mapping still matches the current offer.

## Verification done in this workspace (2026-10-14)
- Jest: 4 suites, 18 tests, all passing (normalisation, cross-verification, streak, parsers).
- TypeScript strict typecheck: clean (exit 0). ESLint: clean (exit 0).
- Expo config validates (`expo config`). Icon PNGs generated and inspected:
  iOS icon is 1024x1024 RGB (no transparency), adaptive foreground 1024x1024 RGBA.
- Dependencies were installed here with Bun because npm hit an OS chown
  restriction on this Linux VM; on a normal Windows/Mac machine `npm install`
  is the documented path and package.json / scripts are npm-standard.
- NOT done here: a device/emulator run, an EAS build, a live Supabase deploy,
  and on-device Auto-Assist testing. Those need your accounts and a phone.

## Addendum 2026-10-14 (no-accounts + dark-default requirements)
- Supabase Auth removed entirely: the app no longer ships the Supabase JS
  client at all. Reads are plain REST with the anon key (read-only RLS);
  push tokens are registered via the new rate-limited register-device
  edge function, and the anon key can no longer write the devices table.
- Dark theme is the first-launch default; theme choices are Dark / Light /
  System, persisted. All colours moved into the single token file
  theme/tokens.ts with the exact dark palette specified; no hardcoded hex
  remains in app/ or components/.
- Contrast QA found and fixed one real failure (light success badge 4.26:1).
