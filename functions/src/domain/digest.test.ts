import { describe, expect, it } from 'vitest';
import { buildDigest } from './digest';
import { estimateSegments, fitsSegments } from './sms';

describe('SMS and digest rules', () => {
  it('estimates GSM-7 and Unicode segments', () => {
    expect(estimateSegments('Tiny: Amina is absent today.')).toBe(1);
    expect(estimateSegments('A'.repeat(161))).toBe(2);
    expect(estimateSegments('Ẹ káàárọ̀')).toBe(1);
  });

  it('keeps a digest within the segment ceiling', () => {
    const digest = buildDigest({
      guardianId: 'g1',
      workspaceName: 'Demo Primary',
      locale: 'en',
      pupils: Array.from({ length: 8 }, (_, i) => ({
        displayName: `Pupil ${i}`,
        indicator: 'developing' as const,
        note: 'A short factual observation.',
      })),
    }, 2);
    expect(fitsSegments(digest, 2)).toBe(true);
  });
});
