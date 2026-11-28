import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n';

export function renderWithI18n(ui: ReactNode) {
  return render(<MemoryRouter><I18nProvider>{ui}</I18nProvider></MemoryRouter>);
}

export { screen };
