
export const STREAK_REWARDS_MB = [25, 50, 80, 100, 125] as const;
// claimedDates: ISO dates (Asia/Karachi) the user marked claimed, any order.
export function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}
export interface StreakState { currentStreak: number; cycleDay: number; todayRewardMb: number; nextRewardMb: number; claimedToday: boolean; totalClaimedDays: number; }
export function computeStreak(claimedDates: string[], today: string): StreakState {
  const set = new Set(claimedDates);
  const claimedToday = set.has(today);
  let streak = 0; let cursor = claimedToday ? today : shiftDate(today, -1);
  while (set.has(cursor)) { streak += 1; cursor = shiftDate(cursor, -1); }
  // If neither today nor yesterday is claimed, the streak has reset.
  if (!claimedToday && !set.has(shiftDate(today, -1))) streak = 0;
  const cycleDay = streak === 0 ? (claimedToday ? 1 : 0) : ((streak - 1) % 5) + 1;
  const todayRewardMb = STREAK_REWARDS_MB[claimedToday ? cycleDay - 1 : Math.min(streak, 4)] ?? 25;
  const nextRewardMb = STREAK_REWARDS_MB[claimedToday ? cycleDay % 5 : Math.min(streak, 4)] ?? 25;
  return { currentStreak: streak, cycleDay, todayRewardMb, nextRewardMb, claimedToday, totalClaimedDays: set.size };
}
export function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
