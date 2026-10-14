
// DailyMB single design-token file. Components must read colours ONLY from here
// (via useTheme). No hardcoded hex values in components or screens.
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const radii = { sm: 8, md: 12, card: 16, pill: 999 } as const;
export const typography = {
  body: { fontSize: 16, lineHeight: 23 },
  bodyLarge: { fontSize: 17, lineHeight: 25 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  small: { fontSize: 13, lineHeight: 18 },
  tabLabel: { fontSize: 13 },
} as const;

export interface ColorTokens {
  bg: string; surface: string; elevated: string; border: string;
  primary: string; onPrimary: string; primarySoft: string;
  accent: string; onAccent: string;
  success: string; successSoft: string;
  warning: string; warningSoft: string; onWarningSoft: string;
  error: string; errorSoft: string;
  text: string; subtext: string; skeleton: string; scrim: string;
  statusBarStyle: 'light' | 'dark';
}

export const darkColors: ColorTokens = {
  bg: '#0B1210', surface: '#121C19', elevated: '#182623', border: '#243531',
  primary: '#2DD4BF', onPrimary: '#04211C', primarySoft: '#14332D',
  accent: '#FBBF24', onAccent: '#231A02',
  success: '#4ADE80', successSoft: '#12291A',
  warning: '#FBBF24', warningSoft: '#2A2110', onWarningSoft: '#FBBF24',
  error: '#F87171', errorSoft: '#2C1717',
  text: '#E8F1EF', subtext: '#9FB3AE', skeleton: '#182623', scrim: 'rgba(0,0,0,0.55)',
  statusBarStyle: 'light',
};

export const lightColors: ColorTokens = {
  bg: '#F2F6F4', surface: '#FBFDFC', elevated: '#FFFFFF', border: '#D8E3DF',
  primary: '#0F766E', onPrimary: '#FFFFFF', primarySoft: '#D9F2EC',
  accent: '#B45309', onAccent: '#FFFFFF',
  success: '#166534', successSoft: '#DCF2E3',
  warning: '#FBBF24', warningSoft: '#FEF3C7', onWarningSoft: '#92400E',
  error: '#B91C1C', errorSoft: '#FDE3E3',
  text: '#12211D', subtext: '#47635B', skeleton: '#DFEAE6', scrim: 'rgba(0,0,0,0.45)',
  statusBarStyle: 'dark',
};
