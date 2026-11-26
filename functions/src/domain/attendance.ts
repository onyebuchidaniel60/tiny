import { DomainError, type AttendanceEntryRecord } from '../shared/contracts';

export interface AttendanceValidation {
  valid: boolean;
  missingPupilIds: string[];
  duplicatePupilIds: string[];
  unknownPupilIds: string[];
  futureDate: boolean;
}

export function validateAttendance(
  activePupilIds: string[],
  entries: AttendanceEntryRecord[],
  schoolDate: string,
  today = new Date(),
): AttendanceValidation {
  const active = new Set(activePupilIds);
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  const unknown: string[] = [];
  for (const entry of entries) {
    if (!active.has(entry.pupilId)) unknown.push(entry.pupilId);
    if (seen.has(entry.pupilId)) duplicates.add(entry.pupilId);
    seen.add(entry.pupilId);
    if (!['present', 'absent', 'late'].includes(entry.status)) {
      throw new DomainError('VALIDATION_FAILED', 'Attendance status must be present, absent or late.');
    }
  }
  const missing = [...active].filter((id) => !seen.has(id));
  const futureDate = new Date(`${schoolDate}T00:00:00Z`).getTime() > today.getTime();
  return {
    valid: missing.length === 0 && duplicates.size === 0 && unknown.length === 0 && !futureDate,
    missingPupilIds: missing,
    duplicatePupilIds: [...duplicates],
    unknownPupilIds: unknown,
    futureDate,
  };
}

export function absencePupilIds(entries: AttendanceEntryRecord[]): string[] {
  return entries.filter((entry) => entry.status === 'absent').map((entry) => entry.pupilId);
}

export function sessionDocumentId(classId: string, schoolDate: string): string {
  return `${classId}_${schoolDate}`.replace(/[^A-Za-z0-9_-]/g, '_');
}
