import { useI18n, languageNames, supportedLanguages, type Language } from '../i18n';

export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useI18n();
  return (
    <label className={`language-select ${compact ? 'compact' : ''}`}>
      <span className="sr-only">{t('language_label')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        aria-label={t('cd_language')}
        title={t('language_label')}
      >
        {supportedLanguages.map((value) => (
          <option key={value} value={value}>{languageNames[value]}</option>
        ))}
      </select>
    </label>
  );
}
