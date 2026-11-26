import { describe, expect, it } from 'vitest';
import { assertDeidentified, lessonAssistSchema, parseAiJson } from './ai';

describe('AI privacy and schema', () => {
  it('rejects phone numbers, emails and pupil identifiers', () => {
    expect(() => assertDeidentified('Call 0803 123 4567')).toThrow();
    expect(() => assertDeidentified('parent@example.com')).toThrow();
    expect(() => assertDeidentified('pupil_abc123')).toThrow();
  });

  it('accepts generic teaching context', () => {
    expect(() => assertDeidentified('Primary 4 basic science: water sources and uses')).not.toThrow();
  });

  it('rejects malformed model output', () => {
    expect(() => parseAiJson(lessonAssistSchema, '{"title":"x"}')).toThrow();
  });
});
