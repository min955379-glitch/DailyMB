import { parseGeneric } from '../lib/answer-core';

describe('real-world layouts found live on 2026-10-14', () => {
  it('parses the badge-number layout (number separate, "Correct Answer:" bar)', () => {
    const html = `<div><span>01</span><h3>Choose the correct sentence.</h3>
      <ul><li>I could not understand what did he say.</li><li>I could not understand what he said.</li>
      <li>I could not understood what he said.</li><li>I could not understand what he say.</li></ul>
      <p>Correct Answer: <strong>I could not understand what he said.</strong></p></div>
      <div><span>02</span><h3>She is taller ___ her sister.</h3>
      <ul><li>then</li><li>than</li><li>to</li><li>from</li></ul>
      <p>Correct Answer: <strong>than</strong></p></div>`;
    const qs = parseGeneric(html);
    expect(qs).toHaveLength(2);
    expect(qs[0]?.correctText).toBe('I could not understand what he said.');
    expect(qs[1]?.correctText).toBe('than');
  });

  it('parses the "Question No: 01" heading layout', () => {
    const html = `<p><strong>Question No: 01</strong></p><p><strong>He ___ here yesterday.</strong></p>
      <ul><li>come</li><li>came</li><li>comes</li><li>coming</li></ul><p><strong>Answer</strong></p><p><strong>came</strong></p>`;
    const qs = parseGeneric(html);
    expect(qs).toHaveLength(1);
    expect(qs[0]?.correctText).toBe('came');
  });
});
