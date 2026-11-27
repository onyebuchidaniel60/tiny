import { describe, expect, it, vi } from 'vitest';
import { InferenceSource } from 'firebase/ai';

vi.mock('../firebase/config', () => ({ app: null }));

import { curatedStrategies, fallbackStrategy, sourceLabel } from './service';

describe('AI source reporting', () => {
  it('labels only the SDK-reported source', () => {
    expect(sourceLabel(InferenceSource.ON_DEVICE)).toBe('On-device Gemini Nano');
    expect(sourceLabel(InferenceSource.IN_CLOUD)).toBe('Cloud Gemini');
    expect(sourceLabel(undefined)).toBe('Unknown inference source');
  });

  it('returns a curated fallback without claiming a model source', () => {
    const fallback = fallbackStrategy(0);
    expect(fallback.source).toBe('Curated offline library');
    expect(fallback.text).toBe(curatedStrategies[0].body);
    expect(fallback.detail).toContain('No model was used');
  });

  it('cycles curated strategies', () => {
    expect(fallbackStrategy(1).text).toBe(curatedStrategies[1].body);
    expect(fallbackStrategy(3).text).toBe(curatedStrategies[0].body);
  });
});
