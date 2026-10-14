
import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: 'DailyMB', slug: 'dailymb', version: '1.0.0', orientation: 'portrait', scheme: 'dailymb',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: '#0B1210' },
  assetBundlePatterns: ['**/*'],
  ios: { supportsTablet: true, bundleIdentifier: 'app.dailymb', infoPlist: { UIBackgroundModes: ['remote-notification'] } },
  android: { package: 'app.dailymb', adaptiveIcon: { foregroundImage: './assets/adaptive-icon-foreground.png', backgroundImage: './assets/adaptive-icon-background.png', monochromeImage: './assets/adaptive-icon-monochrome.png' }, permissions: ['POST_NOTIFICATIONS'] },
  web: { favicon: './assets/favicon.png', bundler: 'metro' },
  plugins: ['expo-router', ['expo-notifications', { icon: './assets/notification-icon.png', color: '#2DD4BF', sounds: [] }], './plugins/withAutoAssist.js'],
  experiments: { typedRoutes: true },
  androidNavigationBar: { backgroundColor: '#0B1210', barStyle: 'light-content' },
  extra: { eas: { projectId: process.env.EAS_PROJECT_ID ?? '' } },
};
export default config;
