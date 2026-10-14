
import { crossVerify } from '../lib/answer-core';
const q = (n:number, correct:string, options=['then','from','than','to']) => ({ questionNo:n, questionText:'She is taller ___ her sister.', options, correctText:correct });
describe('crossVerify', () => {
  it('marks verified when 2 independent sources agree', () => {
    const [r] = crossVerify([{sourceName:'a',questions:[q(2,'than')]},{sourceName:'b',questions:[q(2,'Than.')]}]);
    expect(r?.confidence).toBe('verified'); expect(r?.correctLetter).toBe('C'); expect(r?.agreeingSources).toBe(2);
  });
  it('marks uncertain with both candidates when sources disagree', () => {
    const [r] = crossVerify([{sourceName:'a',questions:[q(2,'than')]},{sourceName:'b',questions:[q(2,'then')]}]);
    expect(r?.confidence).toBe('uncertain'); expect(r?.candidates).toHaveLength(2);
  });
  it('stays verified if 2 agree and a third disagrees', () => {
    const [r] = crossVerify([{sourceName:'a',questions:[q(2,'than')]},{sourceName:'b',questions:[q(2,'than')]},{sourceName:'c',questions:[q(2,'then')]}]);
    expect(r?.confidence).toBe('verified');
  });
  it('marks single_source when only one source reports', () => {
    const [r] = crossVerify([{sourceName:'a',questions:[q(2,'than')]}]);
    expect(r?.confidence).toBe('single_source');
  });
  it('ignores out-of-range question numbers', () => {
    expect(crossVerify([{sourceName:'a',questions:[q(9,'than')]}])).toHaveLength(0);
  });
});

describe('crossVerify with stale question sets (live failure 2026-10-14)', () => {
  it('never glues one set\'s questions to another set\'s answers', () => {
    const today = (n:number, qt:string, ct:string, o:string[]) => ({ questionNo:n, questionText:qt, options:o, correctText:ct });
    const real = [today(1,'Choose the correct sentence.','I could not understand what he said.',['x','I could not understand what he said.','y','z']),
                  today(2,'She is taller ___ her sister.','than',['then','than','to','from'])];
    const stale = [today(1,'Neither Ali nor Sara ___ coming.','is',['is','are','was','were']),
                   today(2,'Which sentence is correct?','I prefer tea',['I prefer tea','a','b','c'])];
    const out = crossVerify([{sourceName:'a',questions:real},{sourceName:'b',questions:real},{sourceName:'c',questions:stale}]);
    const q1 = out.find(r=>r.questionNo===1);
    expect(q1?.questionText).toContain('Choose the correct sentence');
    expect(q1?.correctText).toContain('what he said');
    expect(q1?.confidence).toBe('verified');
    expect(out.find(r=>r.questionText.includes('Neither Ali'))).toBeUndefined();
  });
});
