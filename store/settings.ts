
import { create } from 'zustand'; import { persist, createJSONStorage } from 'zustand/middleware'; import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AnswerMode, ThemePref, LanguagePref } from '../lib/types';
interface SettingsState { mode: AnswerMode; theme: ThemePref; language: LanguagePref; notifyTime: string; eveningReminder: boolean; onboarded: boolean;
  setMode:(m:AnswerMode)=>void; setTheme:(t:ThemePref)=>void; setLanguage:(l:LanguagePref)=>void; setNotifyTime:(t:string)=>void; setEveningReminder:(b:boolean)=>void; setOnboarded:()=>void; }
export const useSettingsStore = create<SettingsState>()(persist((set) => ({
  mode: 'full', theme: 'dark', language: 'en', notifyTime: '06:00', eveningReminder: true, onboarded: false,
  setMode: (mode) => set({ mode }), setTheme: (theme) => set({ theme }), setLanguage: (language) => set({ language }),
  setNotifyTime: (notifyTime) => set({ notifyTime }), setEveningReminder: (eveningReminder) => set({ eveningReminder }), setOnboarded: () => set({ onboarded: true }),
}), { name: 'dailymb-settings', storage: createJSONStorage(() => AsyncStorage) }));
