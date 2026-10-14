
import React, { useState } from 'react'; import { useSafeAreaInsets } from 'react-native-safe-area-context'; import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Linking, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../theme/useTheme'; import { useTranslation } from 'react-i18next'; import { useSettingsStore } from '../../store/settings'; import { requestNotificationPermission } from '../../services/notifications';
const NOTIFY_PRESETS = ['05:30','06:00','06:30','07:00','08:00'];
function Row({label, children}:{label:string; children:React.ReactNode}) { const { colors } = useTheme(); return (<View style={[styles.row,{backgroundColor:colors.surface,borderColor:colors.border}]}><Text style={[styles.label,{color:colors.text}]}>{label}</Text><View style={styles.control}>{children}</View></View>); }
function Choice<T extends string>({ value, options, onChange, labels }: { value:T; options:readonly T[]; onChange:(v:T)=>void; labels:Record<string,string> }) { const { colors } = useTheme(); return (<View style={styles.choices}>{options.map((o)=>(<Pressable key={o} onPress={()=>onChange(o)} accessibilityRole="radio" accessibilityState={{selected:value===o}} style={[styles.chip,{borderColor:colors.border,backgroundColor:value===o?colors.primary:'transparent'}]}><Text style={{color:value===o?colors.onPrimary:colors.text,fontSize:15,fontWeight:value===o?'700':'400'}}>{labels[o]??o}</Text></Pressable>))}</View>); }
export default function SettingsScreen() { const insets = useSafeAreaInsets(); const { colors } = useTheme(); const { t } = useTranslation(); const s = useSettingsStore();
  const isCustomTime = !NOTIFY_PRESETS.includes(s.notifyTime);
  const [pickerOpen, setPickerOpen] = useState(false);
  const timeToDate = (hhmm: string) => { const parts = hhmm.split(':').map(Number); const d = new Date(); d.setHours(parts[0] ?? 6, parts[1] ?? 0, 0, 0); return d; };
  const onPickTime = (e: DateTimePickerEvent, d?: Date) => { if (Platform.OS === 'android') setPickerOpen(false); if (e.type === 'set' && d) { const hh = String(d.getHours()).padStart(2, '0'); const mm = String(d.getMinutes()).padStart(2, '0'); s.setNotifyTime(`${hh}:${mm}`); } };
  return (<ScrollView style={{backgroundColor:colors.bg}} contentContainerStyle={[styles.pad,{paddingTop:insets.top+16,paddingBottom:insets.bottom+16}]}>
    <Text style={[styles.title,{color:colors.text}]} accessibilityRole="header">{t('settings')}</Text>
    <Row label={t('notificationTime')}>
      <View style={styles.choices}>
        {NOTIFY_PRESETS.map((p)=>(<Pressable key={p} onPress={()=>s.setNotifyTime(p)} accessibilityRole="radio" accessibilityState={{selected:s.notifyTime===p}} style={[styles.chip,{borderColor:colors.border,backgroundColor:s.notifyTime===p?colors.primary:'transparent'}]}><Text style={{color:s.notifyTime===p?colors.onPrimary:colors.text,fontSize:15,fontWeight:s.notifyTime===p?'700':'400'}}>{p}</Text></Pressable>))}
        <Pressable onPress={()=>setPickerOpen(true)} accessibilityRole="button" accessibilityState={{selected:isCustomTime}} style={[styles.chip,{borderColor:colors.border,backgroundColor:isCustomTime?colors.primary:'transparent'}]}><Text style={{color:isCustomTime?colors.onPrimary:colors.text,fontSize:15,fontWeight:isCustomTime?'700':'400'}}>{isCustomTime ? `${t('custom')} · ${s.notifyTime}` : t('custom')}</Text></Pressable>
      </View>
      {pickerOpen ? <DateTimePicker value={timeToDate(s.notifyTime)} mode="time" is24Hour onChange={onPickTime} /> : null}
      {pickerOpen && Platform.OS === 'ios' ? <Pressable onPress={()=>setPickerOpen(false)} accessibilityRole="button" style={[styles.chip,{borderColor:colors.border,alignSelf:'flex-start',marginTop:8}]}><Text style={{color:colors.text,fontSize:15,fontWeight:'600'}}>{t('done')}</Text></Pressable> : null}
    </Row>
    <Row label={`${t('eveningReminder')} (${t('eveningReminderHint')})`}><Switch value={s.eveningReminder} onValueChange={s.setEveningReminder} accessibilityLabel={t('eveningReminder')} /></Row>
    <Row label={t('defaultMode')}><Choice value={s.mode} options={['short','full'] as const} onChange={s.setMode} labels={{ short:t('short'), full:t('full') }} /></Row>
    <Row label={t('theme')}><Choice value={s.theme} options={['dark','light','system'] as const} onChange={s.setTheme} labels={{ dark:'Dark', light:'Light', system:'System' }} /></Row>
    <Pressable onPress={()=>void requestNotificationPermission()} style={[styles.btn,{borderColor:colors.border,backgroundColor:colors.surface}]} accessibilityRole="button"><Text style={{color:colors.primary,fontSize:16,fontWeight:'600'}}>{t('allowNotifications')}</Text></Pressable>
    <View style={[styles.about,{backgroundColor:colors.surface,borderColor:colors.border}]}><Text style={[styles.label,{color:colors.text}]}>{t('about')}</Text><Text style={[styles.body,{color:colors.subtext}]}>{t('disclaimer')}</Text>
    <Pressable onPress={()=>void Linking.openURL('https://dailymb.app/privacy')} accessibilityRole="link"><Text style={{color:colors.primary,fontSize:15,marginTop:8}}>Privacy Policy</Text></Pressable></View>
  </ScrollView>); }
const styles = StyleSheet.create({ pad:{padding:20}, title:{fontSize:28,fontWeight:'800',marginBottom:14}, row:{borderWidth:1,borderRadius:16,padding:16,marginBottom:10}, label:{fontSize:16,fontWeight:'600',marginBottom:10}, control:{}, choices:{flexDirection:'row',flexWrap:'wrap',gap:8}, chip:{minHeight:44,paddingHorizontal:14,borderRadius:999,borderWidth:1,alignItems:'center',justifyContent:'center'}, btn:{minHeight:52,borderRadius:16,borderWidth:1,alignItems:'center',justifyContent:'center',marginBottom:10}, about:{borderWidth:1,borderRadius:16,padding:16}, body:{fontSize:15,lineHeight:22} });
