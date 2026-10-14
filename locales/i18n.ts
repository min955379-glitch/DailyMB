
import i18n from 'i18next'; import { initReactI18next } from 'react-i18next'; import { I18nManager } from 'react-native';
import en from './en.json'; import ur from './ur.json';
void i18n.use(initReactI18next).init({ resources: { en: { translation: en }, ur: { translation: ur } }, lng: 'en', fallbackLng: 'en', interpolation: { escapeValue: false } });
export function applyLanguage(lng: 'en' | 'ur'): void {
  void i18n.changeLanguage(lng);
  const rtl = lng === 'ur';
  if (I18nManager.isRTL !== rtl) { I18nManager.allowRTL(true); I18nManager.forceRTL(rtl); }
  // Note: a full RTL flip needs an app restart on some devices; text still renders correctly without it.
}
export default i18n;
