
import React from 'react'; import { View, Pressable, Text, StyleSheet } from 'react-native'; import { useTheme } from '../theme/useTheme'; import { useTranslation } from 'react-i18next'; import type { AnswerMode } from '../lib/types';
export function ModeToggle({ mode, onChange }: { mode: AnswerMode; onChange:(m:AnswerMode)=>void }) { const { colors } = useTheme(); const { t } = useTranslation();
  return (<View style={[styles.wrap,{backgroundColor:colors.border}]} accessibilityRole="tablist">{(['short','full'] as AnswerMode[]).map((m)=>(
    <Pressable key={m} onPress={()=>onChange(m)} accessibilityRole="tab" accessibilityState={{selected:mode===m}} style={({pressed})=>[styles.btn, mode===m && {backgroundColor:colors.surface}, pressed && {opacity:0.7}]}>
      <Text style={[styles.text,{color:colors.text}, mode===m && styles.active]}>{t(m)}</Text></Pressable>))}</View>); }
const styles = StyleSheet.create({ wrap:{flexDirection:'row',borderRadius:999,padding:3}, btn:{flex:1,minHeight:44,borderRadius:999,alignItems:'center',justifyContent:'center'}, text:{fontSize:16}, active:{fontWeight:'700'} });
