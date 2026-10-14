
// Expo config plugin. No-op unless DAILYMB_AUTO_ASSIST=1 (EAS 'sideload' profile).
// In the sideload build it registers the AccessibilityService in the manifest.
// Store builds run this plugin too, but it changes nothing for them.
/** @type {import('expo/config-plugins').ConfigPlugin} */
const withAutoAssist = (config) => {
  if (process.env.DAILYMB_AUTO_ASSIST !== '1') return config;
  const { withAndroidManifest } = require('expo/config-plugins');
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application[0];
    app.service = [...(app.service ?? []), { $: { 'android:name': 'app.dailymb.autoassist.DailyMbAccessibilityService', 'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE', 'android:exported': 'true' },
      'intent-filter': [{ action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }] }],
      'meta-data': [{ $: { 'android:name': 'android.accessibilityservice', 'android:resource': '@xml/accessibility_service_config' } }] }];
    return cfg;
  });
};
module.exports = withAutoAssist;
