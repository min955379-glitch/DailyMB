
import React from 'react'; import { View, Text, StyleSheet } from 'react-native'; import { BadgeCheck, TriangleAlert, Info } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme'; import { useTranslation } from 'react-i18next';
export function StatusBadge({ status }: { status: 'verified'|'uncertain'|'partial'|'none' }) {
  const { colors } = useTheme(); const { t } = useTranslation();
  if (status==='none') return null;
  const cfg = status==='verified' ? { bg: colors.successSoft, fg: colors.success, Icon: BadgeCheck, label: t('verified') }
    : status==='uncertain' ? { bg: colors.errorSoft, fg: colors.error, Icon: TriangleAlert, label: t('uncertain') }
    : { bg: colors.warningSoft, fg: colors.onWarningSoft, Icon: Info, label: t('singleSource') };
  return (<View style={[styles.badge,{backgroundColor:cfg.bg}]} accessibilityRole="text" accessibilityLabel={cfg.label}><cfg.Icon size={18} color={cfg.fg} /><Text style={[styles.text,{color:cfg.fg}]}>{cfg.label}</Text></View>);
}
const styles = StyleSheet.create({ badge:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:12,paddingVertical:7,borderRadius:999,alignSelf:'flex-start'}, text:{fontSize:15,fontWeight:'700'} });
