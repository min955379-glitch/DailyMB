# Dark-mode QA report - DailyMB (2026-10-14)

## Environment note (read first)
This workspace is a Linux VM with **no Android SDK/emulator and no Xcode/iOS
simulator** (checked: no `emulator`, `avdmanager` or `sdkmanager` binaries;
iOS simulators do not exist on Linux). The on-device screenshot step is
therefore marked NOT RUN here - everything that can be verified without a
device was verified, and the exact device steps are listed at the end so
they can be completed on a Mac/Windows machine in about 20 minutes.
`docs/screenshots/dark/` contains a README with the capture script.

## Checklist

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | App launches in dark mode on first run, ignoring system setting | PASS | Settings store default theme is now `dark`; unit test asserts it (`dark-mode-snapshots.test.tsx`) |
| 2 | Settings offers Dark (default) / Light / System and remembers the choice | PASS | Settings screen, persisted Zustand store |
| 3 | Single token file; no hardcoded hex in components/screens | PASS | `grep -rn '#[0-9A-Fa-f]' app/ components/` returns nothing; all colours come from `theme/tokens.ts` |
| 4 | Dark palette matches the required spec exactly | PASS | Snapshot test asserts bg #0B1210, surface #121C19, primary #2DD4BF, accent #FBBF24, text #E8F1EF, subtext #9FB3AE; borders #243531, elevated #182623, success #4ADE80, error #F87171 |
| 5 | WCAG AA contrast, all text/background pairs, both palettes | PASS | `scripts/check-contrast.ts`: 34/34 pairs pass (dark body text 16.48:1, secondary 8.60:1, button label 9.10:1; full output in the final report) |
| 6 | Home: verified, uncertain, skeleton/loading, Short and Full modes in dark | PASS (component level) | Dark snapshots of StatusBadge (verified + uncertain), AnswerList (short + full), Skeleton - snapshots contain the dark token colours |
| 7 | Streak, History, Settings, Onboarding in dark | PASS (code audit) | All four read colours only from tokens; no light-only values remain |
| 8 | Empty, error, offline states in dark | PASS (code audit) | Same token-driven cards; offline state renders the cached day or the token-styled empty card with Retry |
| 9 | Permission-denied state | PASS (code audit) | Notification flow returns false and the app continues without a blocking screen; Settings has a token-styled "Allow notifications" action to retry |
| 10 | No content behind status bar / notch / gesture bar / keyboard | PASS (fixed) | All screens now use `useSafeAreaInsets` for top+bottom padding (was a fixed 56pt); History search uses themed `keyboardAppearance` |
| 11 | Status bar, splash, Android navigation bar match dark theme | PASS | Themed StatusBar (light content on token bg), splash background #0B1210 (no white flash), `androidNavigationBar` #0B1210 light-content |
| 12 | Pull-to-refresh, modal, bottom sheet themed | PASS | RefreshControl tinted with the primary token; ClaimChecklist sheet uses surface + token scrim |
| 13 | Button/toggle/tab states: pressed, selected, checked distinguishable | PASS (fixed) | Pressed opacity/elevated states added to all CTAs and the mode toggle; selected toggle = surface pill on border track + bold; selected tab = primary tint; streak checkbox = filled primary box with check |
| 14 | Disabled states | N/A | No control in the app ships in a disabled state; loading is shown with skeletons instead |
| 15 | Layout at 360x640, 390x844, 430x932 and 100%/130% font size | PASS (static audit) / device check pending | Flex layouts, min-heights (never fixed heights) on rows/chips/cards, wrapping choice chips; text scales (font scaling left enabled). Re-verify visually in the device pass below |
| 16 | English LTR and Urdu RTL | PASS (code audit) | Urdu sets I18nManager RTL; rows/tabs use flex direction which mirrors automatically; no absolute left/right positioning is used |
| 17 | Notification appearance on dark and light phone themes | PARTIAL | Title/body copy is theme-independent text; small icon is white-on-transparent (correct on both); channel light uses the primary token. Visual check pending in the device pass |
| 18 | Icon on dark wallpaper + Android 13 themed icon | PASS | Teal rounded square reads on dark backgrounds (icon inspected at 1024px); monochrome adaptive layer generated for themed icons |
| 19 | Emulator/simulator screenshots of every screen in dark mode | NOT RUN in this workspace | No Android/iOS simulator exists here - see the device pass below |

## Issues found during this QA and fixed
1. Default theme was System - changed to Dark.
2. Hardcoded `#92400E` warning colour in StatusBadge/Streak - moved to the `onWarningSoft` token.
3. Hardcoded white button text (`#fff`) in several StyleSheets - replaced with `onPrimary` (also fixes light-theme consistency).
4. Fixed 56pt top padding on every screen (notch/cut-out risk) - replaced with safe-area insets.
5. Splash background was teal (#0F766E) - changed to the dark background token value so there is no flash on launch.
6. History keyboard was unthemed - now follows the app theme.
7. Pull-to-refresh spinner had no tint - now uses the primary token.
8. Modal scrim was a hardcoded rgba value - now the `scrim` token.
9. Light-theme success green on its badge background failed AA (4.26:1) - darkened to #166534 (6.06:1). Found by the contrast script.
10. Buttons had no pressed state - added pressed opacity/elevated states.

## Device pass still to do (on a machine with the SDKs)
```bash
npm install && npm run icons
npx expo run:android   # emulator: Pixel, 360x640 and 430x932, font size 100% and 130%
npx expo run:ios       # simulator: iPhone SE (small) and iPhone 15 Pro Max (large)
# Set the app to Urdu in Settings and confirm the RTL layout, then save
# screenshots of Home/Streak/History/Settings/Onboarding into docs/screenshots/dark/
```
