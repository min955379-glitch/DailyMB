
import { readFileSync } from 'fs'; import { join } from 'path';
import { parseGeneric } from '../lib/answer-core';
const fx = (n:string) => readFileSync(join(__dirname,'fixtures',n),'utf8');
describe('parsers (one per source pattern)', () => {
  it('answer-is-option pattern (apna4g style)', () => {
    const qs = parseGeneric(fx('source-answer-is-option.html'));
    expect(qs).toHaveLength(2); expect(qs[0]?.correctText.toLowerCase()).toContain('than'); expect(qs[1]?.correctText).toBe('came');
  });
  it('correct-answer-label pattern (telenortodayquiz style)', () => {
    const qs = parseGeneric(fx('source-correct-answer.html'));
    expect(qs).toHaveLength(2); expect(qs[0]?.options).toContain('than');
  });
  it('malformed / redesigned page returns [] instead of throwing', () => {
    expect(parseGeneric(fx('source-malformed.html'))).toEqual([]); expect(parseGeneric('')).toEqual([]);
  });
});
