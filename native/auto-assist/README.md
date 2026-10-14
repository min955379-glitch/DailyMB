
# Auto-Assist (Android only, sideload build only)

Status: implemented as an isolated native module, **OFF by default**, and
**excluded from store builds**. Only the EAS `sideload` profile sets
`DAILYMB_AUTO_ASSIST=1`, and the config plugin in `plugins/` copies these
files into the generated Android project for that profile only.

What it does, and nothing more:
1. After explicit opt-in on its own consent screen, the user turns the
   service on in Android Accessibility Settings (only the OS can do this).
2. While the foreground package is exactly `com.telenor.pakistan.mytelenor`,
   it reads visible text nodes, matches a question against today's
   **verified** answers by normalised text, and taps the option whose text
   matches the verified correct text. Then taps a node labelled Submit,
   and at the end a node labelled Claim Now.
3. It stops immediately and logs the reason if: the package changes, a
   screen is unrecognised, an answer is uncertain/single-source, two
   options match, or no Submit/Claim node is found.

Guarantees: never taps outside that one package, never reads or stores
personal data, keeps its step log on-device only (in its own private
files dir), and has an in-app off switch that disables the service
component via PackageManager.

The main app is fully functional without this folder.
Files: `DailyMbAccessibilityService.kt` (full node traversal + tap logic),
`AutoAssistMatcher.kt` (pure matching logic, unit-testable on the JVM),
`accessibility_service_config.xml`, `AutoAssistConsentScreen.tsx`
(React side, sideload flavour only).

Before any sideload release this module still needs on-device testing
against the real quiz screens - it has never been run on a phone in this
workspace, and quiz screen layouts change. Treat it as beta until then.
