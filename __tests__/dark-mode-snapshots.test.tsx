
// Dark-mode snapshot tests: the settings store defaults to dark, so every
// component below renders with the dark token palette.
import React from 'react'; import TestRenderer from 'react-test-renderer';
import '../locales/i18n';
import { StatusBadge } from '../components/StatusBadge';
import { AnswerList } from '../components/AnswerList';
import { ModeToggle } from '../components/ModeToggle';
import { SkeletonCards } from '../components/Skeleton';
import { useSettingsStore } from '../store/settings';
import { darkColors } from '../theme/tokens';
import type { DayAnswers } from '../lib/types';

const day: DayAnswers = { date: '2026-10-14', status: 'uncertain', questions: [
  { questionNo: 1, questionText: 'She is taller ___ her sister.', options: ['then','from','than','to'], correctText: 'than', correctLetter: 'C', confidence: 'verified', candidates: [], sources: ['a','b'] },
  { questionNo: 2, questionText: 'He ___ here yesterday.', options: ['come','comes','came','coming'], correctText: 'came', correctLetter: 'C', confidence: 'uncertain', candidates: ['came','come'], sources: ['a','b'] },
]};

function snap(el: React.ReactElement): unknown {
  let r: TestRenderer.ReactTestRenderer | undefined;
  TestRenderer.act(() => { r = TestRenderer.create(el); });
  const json = r!.toJSON();
  TestRenderer.act(() => { r!.unmount(); });
  return json;
}
describe('dark mode', () => {
  it('dark is the default theme on first launch', () => { expect(useSettingsStore.getState().theme).toBe('dark'); });
  it('dark palette matches the spec', () => {
    expect(darkColors.bg).toBe('#0B1210'); expect(darkColors.surface).toBe('#121C19');
    expect(darkColors.primary).toBe('#2DD4BF'); expect(darkColors.accent).toBe('#FBBF24');
    expect(darkColors.text).toBe('#E8F1EF'); expect(darkColors.subtext).toBe('#9FB3AE');
  });
  it('verified badge (dark) snapshot', () => { expect(snap(<StatusBadge status="verified" />)).toMatchSnapshot(); });
  it('uncertain badge (dark) snapshot', () => { expect(snap(<StatusBadge status="uncertain" />)).toMatchSnapshot(); });
  it('short mode answers (dark) snapshot', () => { expect(snap(<AnswerList day={day} mode="short" />)).toMatchSnapshot(); });
  it('full mode answers (dark) snapshot', () => { expect(snap(<AnswerList day={day} mode="full" />)).toMatchSnapshot(); });
  it('mode toggle selected state (dark) snapshot', () => { expect(snap(<ModeToggle mode="full" onChange={() => undefined} />)).toMatchSnapshot(); });
  it('skeleton loader (dark) snapshot', () => { expect(snap(<SkeletonCards count={2} />)).toMatchSnapshot(); });
});
