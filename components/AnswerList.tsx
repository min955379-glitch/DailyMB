
import React, { useState } from 'react'; import { View, Text, StyleSheet, Pressable } from 'react-native'; import { Info, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme'; import { useTranslation } from 'react-i18next'; import type { DayAnswers } from '../lib/types';
export function AnswerList({ day, mode }: { day: DayAnswers; mode: 'short'|'full' }) {
  const { colors } = useTheme(); const { t } = useTranslation(); const [expanded, setExpanded] = useState<number | null>(null);
  if (mode==='short') return (
    <View>
      <View style={styles.noteRow}><Info size={15} color={colors.subtext} /><Text style={[styles.note,{color:colors.subtext}]}>{t('letterNote')}</Text></View>
      {day.questions.map((q)=>(
        <View key={q.questionNo}>
          <Pressable onPress={()=>setExpanded(expanded===q.questionNo?null:q.questionNo)} accessibilityRole="button" accessibilityLabel={`${q.questionNo}. ${q.correctLetter}. ${t('showFullAnswer')}`} style={[styles.row,{backgroundColor:colors.surface,borderColor:colors.border}]}>
            <Text style={[styles.shortText,{color:colors.text}]}>{q.questionNo}. {q.correctLetter}</Text><ChevronDown size={18} color={colors.subtext} />
          </Pressable>
          {expanded===q.questionNo ? <Text style={[styles.fullAnswer,{color:colors.subtext}]}>{q.questionText} — {t('answer')}: {q.correctText}</Text> : null}
          {q.confidence==='uncertain' ? <Text style={[styles.warn,{color:colors.error}]}>{t('candidates')} {q.candidates.join(' / ')}</Text> : null}
        </View>))}
    </View>);
  return (<View>{day.questions.map((q)=>(
    <View key={q.questionNo} style={[styles.card,{backgroundColor:colors.surface,borderColor:colors.border}]} accessibilityLabel={`${t('question')} ${q.questionNo}: ${q.questionText}. ${t('answer')}: ${q.correctText}`}>
      <Text style={[styles.q,{color:colors.text}]}>{t('question')} {q.questionNo}: {q.questionText}</Text>
      <Text style={[styles.a,{color:colors.primary}]}>{t('answer')}: {q.correctText}</Text>
      {q.confidence==='uncertain' ? <Text style={[styles.warn,{color:colors.error}]}>{t('candidates')} {q.candidates.join(' / ')}</Text> : null}
    </View>))}</View>);
}
const styles = StyleSheet.create({ noteRow:{flexDirection:'row',gap:6,marginBottom:10}, note:{fontSize:13,flex:1,lineHeight:18}, row:{minHeight:52,borderWidth:1,borderRadius:16,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}, shortText:{fontSize:19,fontWeight:'700'}, fullAnswer:{fontSize:16,marginBottom:10,marginHorizontal:4,lineHeight:22}, card:{borderWidth:1,borderRadius:16,padding:16,marginBottom:10}, q:{fontSize:17,lineHeight:24,marginBottom:6}, a:{fontSize:17,fontWeight:'700',lineHeight:24}, warn:{fontSize:14,marginTop:6,lineHeight:20} });
