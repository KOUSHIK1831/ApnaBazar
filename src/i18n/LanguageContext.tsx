import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language, TranslationKey, getTranslation } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem('apnabazar-lang');
    if (saved === 'en' || saved === 'te' || saved === 'hi') return saved;
  } catch {
    // localStorage unavailable
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('apnabazar-lang', lang);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) => getTranslation(key, language),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
