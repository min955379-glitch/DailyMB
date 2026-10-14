
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
