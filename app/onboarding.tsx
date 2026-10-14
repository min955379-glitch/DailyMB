
import React, { useState } from 'react'; import { useSafeAreaInsets } from 'react-native-safe-area-context'; import { View, Text, StyleSheet, Pressable, Linking, Platform } from 'react-native'; import { useRouter } from 'expo-router'; import { Bell, CalendarCheck, BatteryFull } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme'; import { useTranslation } from 'react-i18next'; import { useSettingsStore } from '../store/settings'; import { requestNotificationPermission } from '../services/notifications';
const ICONS = [CalendarCheck, Bell, BatteryFull];
export default function Onboarding() { const insets = useSafeAreaInsets(); const { colors } = useTheme(); const { t } = useTranslation(); const router = useRouter(); const setOnboarded = useSettingsStore((s)=>s.setOnboarded); const [step,setStep]=useState(0); const Icon = ICONS[step]!;
  const next = async () => { if (step===1) await requestNotificationPermission(); if (step===2 && Platform.OS==='android') { /* Battery settings are user-only; we open app settings as the closest stock route. */ }
    if (step<2) setStep(step+1); else { setOnboarded(); router.replace('/(tabs)'); } };
  const keys = [['onboarding1Title','onboarding1Body'],['onboarding2Title','onboarding2Body'],['onboarding3Title','onboarding3Body']] as const; const [titleKey, bodyKey] = keys[step]!;
  return (<View style={[styles.wrap,{backgroundColor:colors.bg,paddingTop:insets.top+16,paddingBottom:insets.bottom+16}]}><Icon size={56} color={colors.primary} />
    <Text style={[styles.title,{color:colors.text}]} accessibilityRole="header">{t(titleKey)}</Text><Text style={[styles.body,{color:colors.subtext}]}>{t(bodyKey)}</Text>
    <View style={styles.dots}>{[0,1,2].map(i=>(<View key={i} style={[styles.dot,{backgroundColor:i===step?colors.primary:colors.border}]} />))}</View>
    <Pressable onPress={next} style={({pressed})=>[styles.primary,{backgroundColor:colors.primary,opacity:pressed?0.85:1}]} accessibilityRole="button"><Text style={[styles.primaryText,{color:colors.onPrimary}]}>{step===1?t('allowNotifications'):step===2?t('done'):t('continue')}</Text></Pressable>
    {step===2 && Platform.OS==='android' ? <Pressable onPress={()=>void Linking.openSettings()} style={styles.link} accessibilityRole="button"><Text style={{color:colors.primary,fontSize:16}}>Open app settings</Text></Pressable> : null}
  </View>); }
const styles = StyleSheet.create({ wrap:{flex:1,padding:28,justifyContent:'center',alignItems:'center'}, title:{fontSize:26,fontWeight:'800',textAlign:'center',marginTop:22,marginBottom:12}, body:{fontSize:17,lineHeight:25,textAlign:'center'}, dots:{flexDirection:'row',gap:8,marginVertical:28}, dot:{width:10,height:10,borderRadius:5}, primary:{minHeight:54,borderRadius:16,paddingHorizontal:28,alignItems:'center',justifyContent:'center',alignSelf:'stretch'}, primaryText:{fontSize:17,fontWeight:'700'}, link:{minHeight:44,alignItems:'center',justifyContent:'center',marginTop:8} });
