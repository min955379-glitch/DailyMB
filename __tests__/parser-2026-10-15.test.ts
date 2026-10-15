import { parseGeneric, stripHtml } from '../lib/answer-core';

// Regressions from the live pages of 2026-10-15 (todaymytelenoranswer layout):
//  1. The last question block runs to the end of the page; a footer heading
//     "Today Telenor Correct Answers." made the "Correct Answer" pattern
//     capture "s." and the real Q5 was dropped as invalid.
//  2. "I&#8217;m" was never entity-decoded, so the question text differed
//     from other sites' "I'm ..." and its votes never grouped in crossVerify.
const block = (no: string, question: string, options: string[], answer: string) => `
  <p><strong>Question No: ${no}</strong></p>
  <p><strong>${question}</strong></p>
  <ul>${options.map((o) => `<li>${o}</li>`).join('')}</ul>
  <p><strong>Answer</strong></p>
  <p><strong>${answer}</strong></p>`;

const html = `<html><body>
  ${block('01', 'Which sentence is correct?',
    ['She explained me the problem.', 'She explained the problem to me.', 'She explained to me about the problem.', 'She explain me the problem.'],
    'She explained the problem to me.')}
  ${block('02', 'Choose the correct sentence.',
    ['Did you ate lunch?', 'Did you eaten lunch?', 'Did you eat lunch?', 'Did you eating lunch?'],
    'Did you eat lunch?')}
  ${block('03', 'I&#8217;m looking forward to ___ you.',
    ['see', 'saw', 'seeing', 'seen'], 'seeing')}
  ${block('04', 'Which sentence is correct?',
    ['He is senior than me.', 'He is senior to me.', 'He is senior from me.', 'He is senior then me.'],
    'He is senior to me.')}
  ${block('05', 'Which sentence is correct?',
    ['Please reply me soon.', 'Please reply to me soon.', 'Please reply me back soon.', 'Please reply on me soon.'],
    'Please reply to me soon.')}
  <h2>Today Telenor Correct Answers.</h2>
  <p>Video guide and more about the quiz.</p>
</body></html>`;

describe('parser regressions 2026-10-15', () => {
  it('parses all five questions, including the last one before the footer', () => {
    const qs = parseGeneric(html);
    expect(qs).toHaveLength(5);
    expect(qs.map((q) => q.questionNo)).toEqual([1, 2, 3, 4, 5]);
  });

  it('the footer "Correct Answers." heading does not poison Q5', () => {
    const q5 = parseGeneric(html).find((q) => q.questionNo === 5);
    expect(q5?.correctText).toBe('Please reply to me soon.');
  });

  it('decodes numeric entities so question texts group across sites', () => {
    expect(stripHtml('I&#8217;m')).toContain('I\u2019m');
    const q3 = parseGeneric(html).find((q) => q.questionNo === 3);
    expect(q3?.questionText).toContain('looking forward to ___ you.');
    expect(q3?.questionText).not.toContain('&#8217;');
  });
});
