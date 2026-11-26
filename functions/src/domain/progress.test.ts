import { describe, expect, it } from 'vitest';
import { eligibleForDigest, nextRevision, progressDocumentId, validateProgress } from './progress';

const base = {
  pupilId: 'p1',
  classId: 'c1',
  periodStart: '2026-11-16',
  periodEnd: '2026-11-20',
  subjectId: 'science',
  indicator: 'developing' as const,
  teacherNote: 'Names two water sources with prompting.',
};

describe('progress rules', () => {
  it('accepts a valid observation', () => {
    expect(validateProgress(base).valid).toBe(true);
  });

  it('rejects overlong notes and negative not-assessed text', () => {
    expect(validateProgress({ ...base, teacherNote: 'a'.repeat(301) }).valid).toBe(false);
    expect(validateProgress({ ...base, indicator: 'not_assessed', teacherNote: 'Needs to improve' }).valid).toBe(false);
  });

  it('resets approval on edit', () => {
    expect(nextRevision(1, true)).toBe(2);
    expect(nextRevision(1, false)).toBe(1);
  });

  it('requires approval and excludes not-assessed from digest eligibility', () => {
    expect(eligibleForDigest('doing_well', 'approved')).toBe(true);
    expect(eligibleForDigest('doing_well', 'draft')).toBe(false);
    expect(eligibleForDigest('not_assessed', 'approved')).toBe(false);
  });

  it('builds a stable period document id', () => {
    expect(progressDocumentId(base)).toBe('p1_science_2026-11-16_2026-11-20');
  });
});
