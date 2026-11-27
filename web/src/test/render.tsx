import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nProvider } from '../i18n';

export function renderWithI18n(ui: ReactNode) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

export { screen };
