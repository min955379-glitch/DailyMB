
import { create } from 'zustand'; import { persist, createJSONStorage } from 'zustand/middleware'; import AsyncStorage from '@react-native-async-storage/async-storage';
interface StreakStore { claimedDates: string[]; toggleClaimed:(date:string, claimed:boolean)=>void; }
export const useStreakStore = create<StreakStore>()(persist((set) => ({
  claimedDates: [],
  toggleClaimed: (date, claimed) => set((s) => ({ claimedDates: claimed ? [...new Set([...s.claimedDates, date])] : s.claimedDates.filter((d) => d !== date) })),
}), { name: 'dailymb-streak', storage: createJSONStorage(() => AsyncStorage) }));
