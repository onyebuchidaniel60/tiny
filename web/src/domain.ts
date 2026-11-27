import type { AttendanceEntry, AttendanceStatus } from './types';

export function validateAttendance(activePupilIds: string[], entries: AttendanceEntry[]) {
  const active = new Set(activePupilIds);
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const unknown: string[] = [];
  for (const entry of entries) {
    if (!active.has(entry.pupilId)) unknown.push(entry.pupilId);
    if (seen.has(entry.pupilId)) duplicates.push(entry.pupilId);
    seen.add(entry.pupilId);
  }
  const missing = activePupilIds.filter((pupilId) => !seen.has(pupilId));
  return {
    valid: missing.length === 0 && unknown.length === 0 && duplicates.length === 0,
    missing,
    unknown,
    duplicates,
  };
}

export function attendanceCounts(activePupilIds: string[], entries: AttendanceEntry[]) {
  const byPupil = new Map(entries.map((entry) => [entry.pupilId, entry.status]));
  const counts: Record<AttendanceStatus | 'unmarked', number> = { present: 0, absent: 0, late: 0, unmarked: 0 };
  for (const pupilId of activePupilIds) {
    counts[byPupil.get(pupilId) ?? 'unmarked'] += 1;
  }
  return counts;
}

export function normalizeNigerianPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^[0-9+ ()-]+$/.test(trimmed) || trimmed.length === 0) return null;
  const digits = trimmed.replace(/\D/g, '');
  const national = digits.startsWith('234') && digits.length === 13
    ? digits.slice(3)
    : digits.startsWith('0') && digits.length === 11
      ? digits.slice(1)
      : digits.length === 10
        ? digits
        : null;
  if (!national || !/^[789]\d{9}$/.test(national)) return null;
  return `+234${national}`;
}
