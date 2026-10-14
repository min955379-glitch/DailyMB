
// WCAG AA contrast check for every text/background pair used in the app.
// Run: node --experimental-strip-types scripts/check-contrast.ts
// Exits 1 if any pair fails: 4.5:1 for body text, 3:1 for large text / icons.
import { darkColors, lightColors, type ColorTokens } from '../theme/tokens.ts';

function lum(hex: string): number {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(n.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

type Pair = { name: string; fg: (c: ColorTokens) => string; bg: (c: ColorTokens) => string; min: number };
const BODY = 4.5, LARGE = 3.0;
const pairs: Pair[] = [
  { name: 'body text / background', fg: (c) => c.text, bg: (c) => c.bg, min: BODY },
  { name: 'body text / surface', fg: (c) => c.text, bg: (c) => c.surface, min: BODY },
  { name: 'body text / elevated', fg: (c) => c.text, bg: (c) => c.elevated, min: BODY },
  { name: 'secondary text / background', fg: (c) => c.subtext, bg: (c) => c.bg, min: BODY },
  { name: 'secondary text / surface', fg: (c) => c.subtext, bg: (c) => c.surface, min: BODY },
  { name: 'secondary text / primarySoft (toggle track)', fg: (c) => c.subtext, bg: (c) => c.border, min: LARGE },
  { name: 'primary (links/icons) / background', fg: (c) => c.primary, bg: (c) => c.bg, min: LARGE },
  { name: 'primary / surface', fg: (c) => c.primary, bg: (c) => c.surface, min: LARGE },
  { name: 'button label / primary button', fg: (c) => c.onPrimary, bg: (c) => c.primary, min: BODY },
  { name: 'accent (streak) / surface', fg: (c) => c.accent, bg: (c) => c.surface, min: LARGE },
  { name: 'success (verified) / surface', fg: (c) => c.success, bg: (c) => c.surface, min: BODY },
  { name: 'success / successSoft badge', fg: (c) => c.success, bg: (c) => c.successSoft, min: BODY },
  { name: 'warning text / warningSoft card', fg: (c) => c.onWarningSoft, bg: (c) => c.warningSoft, min: BODY },
  { name: 'error / surface', fg: (c) => c.error, bg: (c) => c.surface, min: BODY },
  { name: 'error / errorSoft badge', fg: (c) => c.error, bg: (c) => c.errorSoft, min: BODY },
  { name: 'selected tab text / surface', fg: (c) => c.primary, bg: (c) => c.surface, min: BODY },
  { name: 'inactive tab text / surface', fg: (c) => c.subtext, bg: (c) => c.surface, min: BODY },
];

let failures = 0;
for (const [themeName, colors] of [['dark', darkColors], ['light', lightColors]] as const) {
  console.log(`\n[${themeName} theme]`);
  for (const p of pairs) {
    const ratio = contrast(p.fg(colors), p.bg(colors));
    const ok = ratio >= p.min;
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2)}:1 (min ${p.min}:1)  ${p.name}: ${p.fg(colors)} on ${p.bg(colors)}`);
  }
}
console.log(failures === 0 ? '\nAll contrast checks passed.' : `\n${failures} contrast check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
