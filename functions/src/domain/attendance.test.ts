import { describe, expect, it } from 'vitest';
import { absencePupilIds, sessionDocumentId, validateAttendance } from './attendance';

describe('attendance rules', () => {
  const active = ['p1', 'p2', 'p3'];

  it('blocks incomplete or unknown rosters', () => {
    const result = validateAttendance(active, [
      { pupilId: 'p1', status: 'present' },
      { pupilId: 'p2', status: 'absent' },
      { pupilId: 'unknown', status: 'late' },
    ], '2026-11-26', new Date('2026-11-27T00:00:00Z'));
    expect(result.valid).toBe(false);
    expect(result.missingPupilIds).toEqual(['p3']);
    expect(result.unknownPupilIds).toEqual(['unknown']);
  });

  it('only returns absent pupils for immediate notifications', () => {
    expect(absencePupilIds([
      { pupilId: 'p1', status: 'present' },
      { pupilId: 'p2', status: 'absent' },
      { pupilId: 'p3', status: 'late' },
    ])).toEqual(['p2']);
  });

  it('rejects future dates', () => {
    const result = validateAttendance(active, [
      { pupilId: 'p1', status: 'present' },
      { pupilId: 'p2', status: 'present' },
      { pupilId: 'p3', status: 'present' },
    ], '2026-12-01', new Date('2026-11-26T00:00:00Z'));
    expect(result.valid).toBe(false);
    expect(result.futureDate).toBe(true);
  });

  it('builds a deterministic session id', () => {
    expect(sessionDocumentId('class-1', '2026-11-26')).toBe('class-1_2026-11-26');
  });
});
