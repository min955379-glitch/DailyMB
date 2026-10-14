
import { Linking, Platform } from 'react-native'; import * as IntentLauncher from 'expo-intent-launcher';
// Verified 2026-10-14: Android package for My Telenor (Pakistan).
export const TARGET_PACKAGE = 'com.telenor.pakistan.mytelenor';
const PLAY_STORE = `https://play.google.com/store/apps/details?id=${TARGET_PACKAGE}`;
const APP_STORE_SEARCH = 'https://apps.apple.com/pk/search?term=My%20Telenor';
export async function openTargetApp(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.MAIN', { packageName: TARGET_PACKAGE, flags: 268435456 });
      return;
    } catch { /* not installed - fall through to the store listing */ }
    await Linking.openURL(PLAY_STORE); return;
  }
  // iOS has no public URL scheme guarantee for the target app; use its store search page.
  await Linking.openURL(APP_STORE_SEARCH);
}
