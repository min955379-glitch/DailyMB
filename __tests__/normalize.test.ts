
import { normalizeText, textsEqual, letterForOption } from '../lib/answer-core';
describe('normalizeText', () => {
  it('lowercases, trims and collapses spaces', () => { expect(normalizeText('  Than  ')).toBe('than'); });
  it('is punctuation-insensitive', () => { expect(textsEqual('I ordered a pizza.', 'i ordered a pizza')).toBe(true); });
  it('normalises smart quotes', () => { expect(textsEqual('She doesn\u2019t know me', "She doesn't know me")).toBe(true); });
  it('distinguishes different answers', () => { expect(textsEqual('than', 'then')).toBe(false); });
});
describe('letterForOption', () => {
  it('maps by normalised text, not position claims', () => {
    expect(letterForOption(['then','from','than','to'], 'Than.')).toBe('C');
  });
  it('returns ? when missing', () => { expect(letterForOption(['a'], 'b')).toBe('?'); });
});
