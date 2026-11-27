import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AiPage } from './AiPage';
import { renderWithI18n } from '../test/render';

vi.mock('../ai/service', () => ({
  aiModes: ['lesson_plan', 'explain', 'adapt', 'assess', 'support', 'parent_note'],
  browserAiAvailability: () => 'unavailable',
  generateTeachingStrategy: vi.fn().mockResolvedValue({
    title: 'Water detectives',
    text: 'Use a picture sort and a short class discussion.',
    source: 'Cloud Gemini',
    detail: 'The SDK reported cloud inference.',
  }),
}));

describe('AI page', () => {
  it('shows the actual SDK source after generation', async () => {
    const user = userEvent.setup();
    renderWithI18n(<AiPage />);
    await user.click(screen.getAllByRole('button', { name: /generate a strategy/i })[0]);
    expect(await screen.findByText('Cloud Gemini')).toBeInTheDocument();
    expect(screen.getByText(/water detectives/i)).toBeInTheDocument();
    expect(screen.queryByText('On-device Gemini Nano')).not.toBeInTheDocument();
  });
});
