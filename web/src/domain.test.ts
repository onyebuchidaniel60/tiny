import { describe, expect, it } from 'vitest';
import { attendanceCounts, normalizeNigerianPhone, validateAttendance } from './domain';

describe('web domain rules', () => {
  it('requires every active pupil exactly once', () => {
    const result = validateAttendance(['p1', 'p2', 'p3'], [
      { pupilId: 'p1', status: 'present' },
      { pupilId: 'p3', status: 'absent' },
    ]);
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(['p2']);
  });

  it('rejects unknown and duplicate entries', () => {
    const result = validateAttendance(['p1'], [
      { pupilId: 'p1', status: 'present' },
      { pupilId: 'p1', status: 'late' },
      { pupilId: 'p2', status: 'absent' },
    ]);
    expect(result.valid).toBe(false);
    expect(result.duplicates).toEqual(['p1']);
    expect(result.unknown).toEqual(['p2']);
  });

  it('counts present, absent, late and unmarked', () => {
    expect(attendanceCounts(['p1', 'p2', 'p3'], [
      { pupilId: 'p1', status: 'present' },
      { pupilId: 'p2', status: 'late' },
    ])).toEqual({ present: 1, absent: 0, late: 1, unmarked: 1 });
  });

  it('normalizes Nigerian guardian numbers', () => {
    expect(normalizeNigerianPhone('0803 123 4567')).toBe('+2348031234567');
    expect(normalizeNigerianPhone('2348031234567')).toBe('+2348031234567');
    expect(normalizeNigerianPhone('12345')).toBeNull();
  });
});
