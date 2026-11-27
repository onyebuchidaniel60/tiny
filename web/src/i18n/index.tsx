import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { dictionaries, supportedLanguages, type Language, type TranslationKey } from './dictionaries';

const STORAGE_KEY = 'tiny-web-language';
const STATE_KEY = 'tiny-web-state-v1';

export type { Language, TranslationKey };
export { supportedLanguages };

export const languageNames: Record<Language, string> = {
  en: 'English',
  ha: 'Hausa',
  yo: 'Yorùbá',
  ig: 'Igbo',
};

export const languageLocales: Record<Language, string> = {
  en: 'en-NG',
  ha: 'ha-NG',
  yo: 'yo-NG',
  ig: 'ig-NG',
};

function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (supportedLanguages as string[]).includes(value);
}

function detectLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) return stored;
    const state = localStorage.getItem(STATE_KEY);
    if (state) {
      const parsed = JSON.parse(state) as { settings?: { language?: unknown } };
      if (isLanguage(parsed.settings?.language)) return parsed.settings.language;
    }
  } catch {
    // Storage can be unavailable in private or restricted contexts.
  }
  return 'en';
}

interface I18nValue {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  tn: (base: string, count: number, values?: Record<string, string | number>) => string;
  formatDate: (value: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value: string | Date) => string;
  formatNumber: (value: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template.replace(/\{[a-zA-Z0-9_]+(?::[a-zA-Z])?\}/g, '');
  return template.replace(/\{([a-zA-Z0-9_]+)(?::([a-zA-Z]))?\}/g, (_match, name: string) => {
    const value = values[name];
    return value === undefined ? '' : String(value);
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage);
  const locale = languageLocales[language];

  const setLanguage = useCallback((next: Language) => {
    if (!isLanguage(next)) return;
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persistence is best effort; the visible interface still updates.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = `Tiny — ${dictionaries[language].brand_teacher_workspace}`;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== language) localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore restricted storage.
    }
  }, [language, locale]);

  const value = useMemo<I18nValue>(() => {
    const dictionary = dictionaries[language];
    const fallback = dictionaries.en;
    const t = (key: TranslationKey, values?: Record<string, string | number>) => {
      const template = dictionary[key] ?? fallback[key] ?? key;
      if (import.meta.env.DEV && !(key in dictionary)) {
        console.warn(`[i18n] Missing ${language} translation for "${key}"`);
      }
      return interpolate(template, values);
    };
    const tn = (base: string, count: number, values?: Record<string, string | number>) => {
      const rule = language === 'en' ? new Intl.PluralRules('en-NG').select(count) : count === 1 ? 'one' : 'other';
      const key = `${base}_${rule === 'one' ? 'one' : 'other'}` as TranslationKey;
      return t(key, { count, ...values });
    };
    const formatDate = (input: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => {
      if (!input) return '—';
      const date = input instanceof Date ? input : new Date(input);
      if (Number.isNaN(date.getTime())) return '—';
      // Chromium's ICU data does not consistently provide month/weekday names
      // for ha/yo/ig even when the locale tag is accepted. Use an unambiguous
      // numeric date instead of silently falling back to English words.
      if (language !== 'en') {
        return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
      }
      return new Intl.DateTimeFormat(locale, options ?? { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    };
    const formatTime = (input: string | Date) => {
      const date = input instanceof Date ? input : new Date(input);
      if (Number.isNaN(date.getTime())) return '—';
      return new Intl.DateTimeFormat(language === 'en' ? locale : 'en-GB', { hour: '2-digit', minute: '2-digit' }).format(date);
    };
    const formatNumber = (input: number) => new Intl.NumberFormat(locale).format(input);
    return { language, locale, setLanguage, t, tn, formatDate, formatTime, formatNumber };
  }, [language, locale, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}

/** Locale-aware subject label. Falls back to a readable form for unknown ids. */
export function subjectLabel(t: I18nValue['t'], subjectId: string): string {
  const key = `subject_${subjectId}` as TranslationKey;
  if (key in dictionaries.en) return t(key);
  return subjectId.replaceAll('_', ' ');
}

export function statusLabel(t: I18nValue['t'], value: string): string {
  const key = `status_${value}` as TranslationKey;
  if (key in dictionaries.en) return t(key);
  return value.replaceAll('_', ' ');
}

export function guardianStatusLabel(t: I18nValue['t'], value: string): string {
  if (value === 'opted_in') return t('opted_in');
  if (value === 'opted_out') return t('opted_out');
  if (value === 'pending') return t('consent_pending');
  return value.replaceAll('_', ' ');
}

export function relationshipLabel(t: I18nValue['t'], value: string): string {
  const normal = value.trim().toLowerCase();
  if (normal === 'mother' || normal === 'mum' || normal === 'mom') return t('mother');
  if (normal === 'father' || normal === 'dad') return t('father');
  if (normal === 'parent') return t('parent_relationship');
  if (normal === 'guardian') return t('guardian');
  return value;
}

export function commandLabel(t: I18nValue['t'], value: string): string {
  const key = `command_${value.replaceAll('.', '_')}` as TranslationKey;
  if (key in dictionaries.en) return t(key);
  return value;
}
