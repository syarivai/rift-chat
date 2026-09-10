import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { useAppStore } from '../store/store';
import en from './locales/en.json';
import id from './locales/id.json';
import ms from './locales/ms.json';

export const SUPPORTED_LANGUAGES = ['en', 'ms', 'id'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: { translation: en },
  ms: { translation: ms },
  id: { translation: id },
};

function isSupported(code: string | null | undefined): code is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(code as SupportedLanguage);
}

/** The device's language if we ship it, otherwise English. */
export function deviceLanguage(): SupportedLanguage {
  const code = getLocales()[0]?.languageCode;
  return isSupported(code) ? code : 'en';
}

/** The user's explicit choice if set, otherwise the device's. */
export function resolveLanguage(): SupportedLanguage {
  const choice = useAppStore.getState().language;
  return choice === 'system' ? deviceLanguage() : choice;
}

export function initI18n(): typeof i18n {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: resolveLanguage(),
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });
  }
  return i18n;
}

/** Called by the Settings language picker. */
export function changeLanguage(): void {
  void i18n.changeLanguage(resolveLanguage());
}

export default i18n;
