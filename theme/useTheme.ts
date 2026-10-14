
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ColorTokens } from './tokens';
import { useSettingsStore } from '../store/settings';
// Dark is the DEFAULT on first launch, regardless of the system setting.
export function useTheme(): { colors: ColorTokens; isDark: boolean } {
  const system = useColorScheme(); const pref = useSettingsStore((s) => s.theme);
  const isDark = pref === 'dark' || (pref === 'system' && system === 'dark');
  return { colors: isDark ? darkColors : lightColors, isDark };
}
export function resolveTheme(pref: 'dark'|'light'|'system', system: string | null | undefined): boolean {
  return pref === 'dark' || (pref === 'system' && system === 'dark');
}
