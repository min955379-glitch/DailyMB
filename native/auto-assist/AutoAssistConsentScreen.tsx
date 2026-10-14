
import React, { useState } from 'react'; import { View, Text, Pressable, StyleSheet, Switch } from 'react-native';
// Rendered ONLY in the sideload flavour (DAILYMB_AUTO_ASSIST=1). Store builds never import this file.
export function AutoAssistConsentScreen() { const [on,setOn]=useState(false);
  return (<View style={styles.wrap}><Text style={styles.title}>Auto-Assist (Android, sideload build only)</Text>
  <Text style={styles.body}>When switched on, DailyMB will use an Android accessibility service inside the My Telenor app only. It reads the question on screen, matches it by text against today's verified answers, taps the matching option, then Submit, then Claim Now. It stops at once if anything is unrecognised or an answer is uncertain. It never taps anything outside that one app, and it does not read or store personal data. Step logs stay on this phone. You can switch it off here at any time.</Text>
  <View style={styles.row}><Text style={styles.body}>Enable Auto-Assist</Text><Switch value={on} onValueChange={setOn} accessibilityLabel="Enable Auto-Assist" /></View>
  <Pressable style={styles.btn} accessibilityRole="button"><Text>Open Accessibility Settings</Text></Pressable></View>); }
const styles = StyleSheet.create({ wrap:{padding:20,gap:12}, title:{fontSize:20,fontWeight:'700'}, body:{fontSize:16,lineHeight:23}, row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',minHeight:48}, btn:{minHeight:48,alignItems:'center',justifyContent:'center'} });
