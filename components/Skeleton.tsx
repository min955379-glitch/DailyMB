
import React, { useEffect, useRef } from 'react'; import { View, Animated, StyleSheet } from 'react-native'; import { useTheme } from '../theme/useTheme';
export function SkeletonCards({ count = 5 }: { count?: number }) { const { colors } = useTheme(); const o = useRef(new Animated.Value(0.4)).current;
  useEffect(()=>{ const loop = Animated.loop(Animated.sequence([Animated.timing(o,{toValue:1,duration:700,useNativeDriver:true}),Animated.timing(o,{toValue:0.4,duration:700,useNativeDriver:true})])); loop.start(); return ()=>loop.stop(); },[o]);
  return (<View>{Array.from({length:count}).map((_,i)=>(<Animated.View key={i} style={[styles.card,{backgroundColor:colors.skeleton,opacity:o}]} />))}</View>); }
const styles = StyleSheet.create({ card:{height:84,borderRadius:16,marginBottom:10} });
