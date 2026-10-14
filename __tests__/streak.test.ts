
import { computeStreak } from '../lib/streak';
describe('computeStreak', () => {
  it('day 1 reward is 25 MB', () => { const s=computeStreak(['2026-10-14'],'2026-10-14'); expect(s.currentStreak).toBe(1); expect(s.todayRewardMb).toBe(25); expect(s.nextRewardMb).toBe(50); });
  it('5th day reward is 125 MB then cycle restarts', () => { const s=computeStreak(['2026-10-10','2026-10-11','2026-10-12','2026-10-13','2026-10-14'],'2026-10-14'); expect(s.currentStreak).toBe(5); expect(s.todayRewardMb).toBe(125); expect(s.nextRewardMb).toBe(25); });
  it('a missed day resets the streak', () => { const s=computeStreak(['2026-10-10','2026-10-11'],'2026-10-14'); expect(s.currentStreak).toBe(0); });
  it('yesterday claimed keeps streak alive before today is claimed', () => { const s=computeStreak(['2026-10-13'],'2026-10-14'); expect(s.currentStreak).toBe(1); expect(s.claimedToday).toBe(false); });
});
