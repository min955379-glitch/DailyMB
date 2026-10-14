import { create } from 'zustand'; import { persist, createJSONStorage } from 'zustand/middleware'; import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AnswerMode, ThemePref } from '../lib/types';
interface SettingsState { mode: AnswerMode; theme: ThemePref; notifyTime: string; eveningReminder: boolean; onboarded: boolean;
  setMode:(m:AnswerMode)=>void; setTheme:(t:ThemePref)=>void; setNotifyTime:(t:string)=>void; setEveningReminder:(b:boolean)=>void; setOnboarded:()=>void; }
export const useSettingsStore = create<SettingsState>()(persist((set) => ({
  mode: 'full', theme: 'dark', notifyTime: '06:00', eveningReminder: true, onboarded: false,
  setMode: (mode) => set({ mode }), setTheme: (theme) => set({ theme }),
  setNotifyTime: (notifyTime) => set({ notifyTime }), setEveningReminder: (eveningReminder) => set({ eveningReminder }), setOnboarded: () => set({ onboarded: true }),
}), { name: 'dailymb-settings', storage: createJSONStorage(() => AsyncStorage) }));
