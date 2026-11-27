import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AiPage } from './AiPage';

vi.mock('../ai/service', () => ({
  onDeviceBrowserStatus: () => 'Chrome built-in AI unavailable',
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
    render(<AiPage />);
    await user.click(screen.getAllByRole('button', { name: /generate a strategy/i })[0]);
    expect(await screen.findByText('Cloud Gemini')).toBeInTheDocument();
    expect(screen.getByText(/SDK reported cloud inference/i)).toBeInTheDocument();
    expect(screen.queryByText('On-device Gemini Nano')).not.toBeInTheDocument();
  });
});
