import { planDailyQuizWrites } from '../lib/answer-core';
import type { Confidence, StoredQuizRow, VerifiedQuestion } from '../lib/answer-core';

const stored = (questionNo: number, questionText: string, confidence: Confidence): StoredQuizRow => ({ questionNo, questionText, confidence });
const incoming = (questionNo: number, questionText: string, confidence: Confidence): VerifiedQuestion => ({
  questionNo, questionText, options: ['a', 'b'], correctText: 'a', correctLetter: 'A',
  confidence, candidates: [], sources: ['s1'], agreeingSources: confidence === 'verified' ? 2 : 1,
});

// The exact live failure of 2026-10-15: the app held yesterday's Q4/Q5 as
// single_source rows while the web-verified Q4/Q5 were different questions.
const STALE_Q4 = 'Before installing apps, you should check for?';
const STALE_Q5 = 'He here yesterday';
const FRESH_Q4 = 'He is senior to me.';
const FRESH_Q5 = 'Please reply to me soon.';

describe('planDailyQuizWrites (live failure 2026-10-15)', () => {
  it('a complete verified run replaces the stale single_source Q4/Q5', () => {
    const existing = [stored(1, 'Q1', 'verified'), stored(2, 'Q2', 'verified'), stored(3, 'Q3', 'verified'),
      stored(4, STALE_Q4, 'single_source'), stored(5, STALE_Q5, 'single_source')];
    const run = [incoming(1, 'Q1', 'verified'), incoming(2, 'Q2', 'verified'), incoming(3, 'Q3', 'verified'),
      incoming(4, FRESH_Q4, 'verified'), incoming(5, FRESH_Q5, 'verified')];
    const plan = planDailyQuizWrites(existing, run);
    expect(plan.toUpsert.map((q) => q.questionNo)).toEqual([1, 2, 3, 4, 5]);
    expect(plan.toUpsert.find((q) => q.questionNo === 4)?.questionText).toBe(FRESH_Q4);
    expect(plan.toUpsert.find((q) => q.questionNo === 5)?.questionText).toBe(FRESH_Q5);
  });

  it('a partial verified run deletes stale single_source orphans instead of leaving wrong answers', () => {
    const existing = [stored(1, 'Q1', 'verified'), stored(2, 'Q2', 'verified'), stored(3, 'Q3', 'verified'),
      stored(4, STALE_Q4, 'single_source'), stored(5, STALE_Q5, 'single_source')];
    const run = [incoming(1, 'Q1', 'verified'), incoming(2, 'Q2', 'verified'), incoming(3, 'Q3', 'verified')];
    const plan = planDailyQuizWrites(existing, run);
    expect(plan.toDelete).toEqual([4, 5]);
  });

  it('never downgrades a verified stored row with a lagging single_source one', () => {
    const existing = [stored(4, FRESH_Q4, 'verified')];
    const run = [incoming(4, STALE_Q4, 'single_source')];
    const plan = planDailyQuizWrites(existing, run);
    expect(plan.toUpsert).toEqual([]);
    expect(plan.toDelete).toEqual([]);
  });

  it('upgrades the same question from single_source to verified', () => {
    const existing = [stored(4, FRESH_Q4, 'single_source')];
    const run = [incoming(4, FRESH_Q4, 'verified')];
    const plan = planDailyQuizWrites(existing, run);
    expect(plan.toUpsert.map((q) => q.questionNo)).toEqual([4]);
  });

  it('keeps a stored verified orphan when a partial run does not mention its number', () => {
    const existing = [stored(5, FRESH_Q5, 'verified')];
    const run = [incoming(1, 'Q1', 'verified'), incoming(2, 'Q2', 'verified'), incoming(3, 'Q3', 'verified')];
    const plan = planDailyQuizWrites(existing, run);
    expect(plan.toDelete).toEqual([]);
  });
});
