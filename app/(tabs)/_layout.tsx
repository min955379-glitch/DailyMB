
import React from 'react'; import { Tabs } from 'expo-router'; import { Home, Flame, History, Settings } from 'lucide-react-native'; import { useTheme } from '../../theme/useTheme'; import { useTranslation } from 'react-i18next';
export default function TabsLayout() { const { colors } = useTheme(); const { t } = useTranslation();
  return (<Tabs screenOptions={{ headerShown:false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.subtext, tabBarStyle:{ backgroundColor: colors.surface, borderTopColor: colors.border, minHeight:60 }, tabBarLabelStyle:{ fontSize:13 } }}>
    <Tabs.Screen name="index" options={{ title:t('home'), tabBarIcon:({color,size})=><Home color={color} size={size} />, tabBarAccessibilityLabel:t('home') }} />
    <Tabs.Screen name="streak" options={{ title:t('streak'), tabBarIcon:({color,size})=><Flame color={color} size={size} />, tabBarAccessibilityLabel:t('streak') }} />
    <Tabs.Screen name="history" options={{ title:t('history'), tabBarIcon:({color,size})=><History color={color} size={size} />, tabBarAccessibilityLabel:t('history') }} />
    <Tabs.Screen name="settings" options={{ title:t('settings'), tabBarIcon:({color,size})=><Settings color={color} size={size} />, tabBarAccessibilityLabel:t('settings') }} />
  </Tabs>); }
