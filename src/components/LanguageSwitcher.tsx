import { useLanguage } from '@/i18n/LanguageContext';
import { Language, languageLabels } from '@/i18n/translations';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const languages: { code: Language; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'te', label: 'తెలుగు', short: 'తె' },
  { code: 'hi', label: 'हिन्दी', short: 'हि' },
];

export default function LanguageSwitcher({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = languages.find((l) => l.code === language) || languages[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:bg-accent/10 ${
          variant === 'compact' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
        }`}
        aria-label="Switch language"
      >
        <Globe className={variant === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span className="font-medium">{current.short}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-lg border border-border/50 bg-card shadow-surface-lg overflow-hidden animate-fade-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent/10 ${
                language === lang.code
                  ? 'font-semibold text-primary bg-primary/5'
                  : 'text-foreground'
              }`}
            >
              <span className="text-xs font-mono w-5">{lang.short}</span>
              <span>{lang.label}</span>
              {language === lang.code && (
                <span className="ml-auto text-primary text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
