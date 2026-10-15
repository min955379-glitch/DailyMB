import { crossVerify } from '../lib/answer-core';
import type { ParsedQuestion, SourceResult } from '../lib/answer-core';

const q = (questionNo: number, questionText: string, correctText: string, options: string[]): ParsedQuestion =>
  ({ questionNo, questionText, correctText, options });

// Regression for the live failure of 2026-10-15. The day's real set reused the
// stem "Which sentence is correct?" for Q1, Q4 and Q5. The old crossVerify
// kept only the strongest answer cluster per question-text group, so the
// real Q4/Q5 never became slot candidates and stale single-source questions
// from lagging sources ("Before installing apps..." / "He here yesterday.")
// occupied slots 4/5 in the app all day.
describe('crossVerify with repeated question stems (live failure 2026-10-15)', () => {
  const freshSet = (): ParsedQuestion[] => [
    q(1, 'Which sentence is correct?', 'She explained the problem to me.',
      ['She explained me the problem.', 'She explained the problem to me.', 'She explained to me about the problem.', 'She explain me the problem.']),
    q(2, 'Choose the correct sentence.', 'Did you eat lunch?',
      ['Did you ate lunch?', 'Did you eaten lunch?', 'Did you eat lunch?', 'Did you eating lunch?']),
    q(3, "I'm looking forward to ___ you.", 'seeing', ['see', 'saw', 'seeing', 'seen']),
    q(4, 'Which sentence is correct?', 'He is senior to me.',
      ['He is senior than me.', 'He is senior to me.', 'He is senior from me.', 'He is senior then me.']),
    q(5, 'Which sentence is correct?', 'Please reply to me soon.',
      ['Please reply me soon.', 'Please reply to me soon.', 'Please reply me back soon.', 'Please reply on me soon.']),
  ];
  // Lagging sources still serving an older set (as theiq / apna4g did).
  const staleA: ParsedQuestion[] = [
    q(4, 'Before installing apps, you should check for?', 'Reviews', ['Reviews', 'Ratings', 'Ads', 'Price']),
  ];
  const staleB: ParsedQuestion[] = [
    q(5, 'He here yesterday.', 'came', ['come', 'came', 'comes', 'coming']),
  ];
  const results: SourceResult[] = [
    { sourceName: 'fresh-1', questions: freshSet() },
    { sourceName: 'fresh-2', questions: freshSet() },
    { sourceName: 'fresh-3', questions: freshSet() },
    { sourceName: 'stale-a', questions: staleA },
    { sourceName: 'stale-b', questions: staleB },
  ];

  it('verifies all five slots of the real set, including the repeated stems', () => {
    const out = crossVerify(results);
    expect(out).toHaveLength(5);
    expect(out.map((r) => r.questionNo)).toEqual([1, 2, 3, 4, 5]);
    for (const r of out) expect(r.confidence).toBe('verified');
    expect(out.find((r) => r.questionNo === 1)?.correctText).toBe('She explained the problem to me.');
    expect(out.find((r) => r.questionNo === 4)?.correctText).toBe('He is senior to me.');
    expect(out.find((r) => r.questionNo === 5)?.correctText).toBe('Please reply to me soon.');
  });

  it('keeps the stale single-source questions out of slots 4 and 5', () => {
    const out = crossVerify(results);
    expect(out.find((r) => r.questionText.includes('Before installing apps'))).toBeUndefined();
    expect(out.find((r) => r.questionText.includes('He here yesterday'))).toBeUndefined();
    expect(out.find((r) => r.questionNo === 4)?.correctLetter).toBe('B');
    expect(out.find((r) => r.questionNo === 5)?.correctLetter).toBe('B');
  });

  it('a repeated stem with only one agreeing source per answer stays below verified', () => {
    const single: SourceResult[] = [{ sourceName: 'only', questions: freshSet() }];
    const out = crossVerify(single);
    expect(out).toHaveLength(5);
    for (const r of out) expect(r.confidence).toBe('single_source');
    expect(out.find((r) => r.questionNo === 4)?.correctText).toBe('He is senior to me.');
    expect(out.find((r) => r.questionNo === 5)?.correctText).toBe('Please reply to me soon.');
  });
});
