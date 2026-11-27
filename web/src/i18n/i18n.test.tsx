import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { dictionaries, supportedLanguages } from './dictionaries';
import { I18nProvider, languageLocales, useI18n } from './index';

const englishKeys = Object.keys(dictionaries.en).sort();

function Probe() {
  const { t, tn, language, setLanguage, formatDate } = useI18n();
  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="greeting">{t('home_greeting', { name: 'Ada' })}</span>
      <span data-testid="plural">{tn('classes_pupil_count', 2)}</span>
      <span data-testid="date">{formatDate(new Date('2026-11-27T12:00:00Z'), { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      <button type="button" onClick={() => setLanguage('ha')}>Hausa</button>
      <button type="button" onClick={() => setLanguage('yo')}>Yoruba</button>
      <button type="button" onClick={() => setLanguage('ig')}>Igbo</button>
    </div>
  );
}

describe('translation catalogue', () => {
  it.each(supportedLanguages)('%s has every English key and no extras', (language) => {
    const keys = Object.keys(dictionaries[language]).sort();
    expect(keys).toEqual(englishKeys);
    for (const key of keys) expect(dictionaries[language][key as keyof typeof dictionaries.en].trim()).not.toBe('');
  });

  it('keeps interpolation placeholders aligned across languages', () => {
    const placeholders = (value: string) => [...value.matchAll(/\{([a-zA-Z0-9_]+)/g)].map((match) => match[1]).sort();
    for (const language of supportedLanguages) {
      for (const key of englishKeys) {
        expect(placeholders(dictionaries[language][key as keyof typeof dictionaries.en]))
          .toEqual(placeholders(dictionaries.en[key as keyof typeof dictionaries.en]));
      }
    }
  });

  it('has a locale for every supported language', () => {
    for (const language of supportedLanguages) expect(languageLocales[language]).toBeTruthy();
  });
});

describe('I18nProvider', () => {
  it('updates rendered content immediately and persists the choice', async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByTestId('language')).toHaveTextContent('en');
    await user.click(screen.getByRole('button', { name: 'Hausa' }));
    expect(screen.getByTestId('language')).toHaveTextContent('ha');
    expect(screen.getByTestId('greeting')).toHaveTextContent('Ina kwana, Ada');
    expect(localStorage.getItem('tiny-web-language')).toBe('ha');
    expect(document.documentElement.lang).toBe('ha-NG');
  });

  it('changes already-rendered plural and date output', async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<I18nProvider><Probe /></I18nProvider>);
    const englishDate = screen.getByTestId('date').textContent;
    await user.click(screen.getByRole('button', { name: 'Yoruba' }));
    expect(screen.getByTestId('plural').textContent).not.toContain('active pupils');
    expect(screen.getByTestId('date').textContent).not.toBe(englishDate);
  });

  it('restores the saved language after a remount', () => {
    localStorage.setItem('tiny-web-language', 'ig');
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByTestId('language')).toHaveTextContent('ig');
    expect(screen.getByTestId('greeting')).toHaveTextContent('Ụtụtụ ọma, Ada');
  });
});
