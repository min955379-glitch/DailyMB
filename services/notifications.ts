
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { registerDevice } from './backend';
import { karachiToday } from '../lib/answer-core';
import { shiftDate } from '../lib/streak';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

export async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('daily-answers', { name: 'Daily answers', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 200, 100, 200], lightColor: '#2DD4BF' });
  await Notifications.setNotificationChannelAsync('streak-reminders', { name: 'Streak reminders', importance: Notifications.AndroidImportance.DEFAULT });
}

// Proper permission flow: Android 13+ and iOS 13+ both go through get/requestPermissionsAsync.
export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannels();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } });
  return asked.granted;
}

export async function registerPushToken(notifyTime: string, eveningReminder: boolean): Promise<string | null> {
  if (!Device.isDevice) return null; // push tokens do not exist on simulators
  const granted = await requestNotificationPermission();
  if (!granted) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const token = data;
  await registerDevice({ expo_push_token: token, platform: Platform.OS, notify_time: notifyTime, evening_reminder: eveningReminder });
  return token;
}

function nextTrigger(hourMinute: string, dayOffset: number): Date {
  const [h, m] = hourMinute.split(':').map(Number);
  // Device is expected in Asia/Karachi for the target users; schedule by local wall-clock.
  const d = new Date(); d.setDate(d.getDate() + dayOffset); d.setHours(h ?? 6, m ?? 0, 0, 0);
  if (dayOffset === 0 && d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

// Local fallback: works with the app closed, covers the case where the
// morning push is delayed. Rolling 7-day schedule, refreshed on app open.
export async function scheduleLocalFallbacks(opts: { notifyTime: string; eveningReminder: boolean; claimedToday: boolean }): Promise<void> {
  await ensureAndroidChannels();
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) if ((n.content.data as { kind?: string })?.kind?.startsWith('local-')) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  for (let i = 0; i < 7; i++) {
    const dateIso = shiftDate(karachiToday(), i);
    await Notifications.scheduleNotificationAsync({
      content: { title: "Today's answers are ready", body: '5 answers verified. Tap to view.', data: { screen: 'home', kind: 'local-daily' }, sound: 'default' },
      trigger: { date: nextTrigger(opts.notifyTime, i), channelId: 'daily-answers' },
    });
    if (opts.eveningReminder && !(i === 0 && opts.claimedToday)) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Your streak is waiting', body: `You have not marked ${dateIso} as claimed yet. Open the quiz and claim before midnight.`, data: { screen: 'streak', kind: 'local-evening' } },
        trigger: { date: nextTrigger('20:00', i), channelId: 'streak-reminders' },
      });
    }
  }
}
export function addNotificationTapListener(onOpen: (screen: string) => void): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((res) => {
    const screen = (res.notification.request.content.data as { screen?: string })?.screen ?? 'home';
    onOpen(screen);
  });
}
