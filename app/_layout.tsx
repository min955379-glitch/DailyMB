
import React, { useEffect } from 'react'; import { Stack, useRouter } from 'expo-router'; import { StatusBar } from 'expo-status-bar'; import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../locales/i18n'; import { useSettingsStore } from '../store/settings'; import { useStreakStore } from '../store/streak';
import { registerPushToken, scheduleLocalFallbacks, addNotificationTapListener } from '../services/notifications'; import { useTheme } from '../theme/useTheme'; import { karachiToday } from '../lib/answer-core';
const client = new QueryClient({ defaultOptions: { queries: { staleTime: 60000, retry: 2 } } });
function ThemedStatusBar() { const { colors } = useTheme(); return <StatusBar style={colors.statusBarStyle} backgroundColor={colors.bg} />; }
function Effects() { const router = useRouter(); const { notifyTime, eveningReminder } = useSettingsStore(); const claimed = useStreakStore((s)=>s.claimedDates.includes(karachiToday()));
  useEffect(()=>{ void registerPushToken(notifyTime, eveningReminder); void scheduleLocalFallbacks({ notifyTime, eveningReminder, claimedToday: claimed }); },[notifyTime, eveningReminder, claimed]);
  useEffect(()=>{ const sub = addNotificationTapListener((screen)=>{ router.push(screen==='streak' ? '/(tabs)/streak' : '/(tabs)'); }); return ()=>sub.remove(); },[router]);
  return null; }
export default function RootLayout() { const onboarded = useSettingsStore((s)=>s.onboarded);
  return (<QueryClientProvider client={client}><ThemedStatusBar /><Effects /><Stack screenOptions={{ headerShown:false }}>
    {!onboarded ? <Stack.Screen name="onboarding" /> : null}<Stack.Screen name="(tabs)" /></Stack></QueryClientProvider>); }
