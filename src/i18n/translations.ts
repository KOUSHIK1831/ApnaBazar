import { en } from './locales/en';
import { hi } from './locales/hi';
import { te } from './locales/te';

export type Language = 'en' | 'hi' | 'te';

export const languageLabels: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी',
  te: 'తెలుగు',
};

export type TranslationKey = keyof typeof en;

export type TranslationMap = Record<TranslationKey, Record<Language, string>>;

const translations: TranslationMap = {} as TranslationMap;

const keys = Object.keys(en) as TranslationKey[];

for (const key of keys) {
  translations[key] = {
    en: en[key],
    hi: hi[key as keyof typeof hi] || en[key],
    te: te[key as keyof typeof te] || en[key],
  };
}

export const getTranslation = (key: TranslationKey, lang: Language): string => {
  return translations[key]?.[lang] || en[key] || key;
};

export default translations;
