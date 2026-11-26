import { DomainError, MAX_HOME_ACTIVITY_LENGTH, MAX_NOTE_LENGTH, type ProgressInput } from '../shared/contracts';

export interface ProgressValidation {
  valid: boolean;
  errors: string[];
}

export function validateProgress(input: ProgressInput): ProgressValidation {
  const errors: string[] = [];
  if (!['doing_well', 'developing', 'needs_support', 'not_assessed'].includes(input.indicator)) {
    errors.push('Unsupported progress indicator.');
  }
  if ((input.teacherNote?.length ?? 0) > MAX_NOTE_LENGTH) errors.push('Teacher note is too long.');
  if ((input.homeActivity?.length ?? 0) > MAX_HOME_ACTIVITY_LENGTH) errors.push('Home activity is too long.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.periodStart) || !/^\d{4}-\d{2}-\d{2}$/.test(input.periodEnd)) {
    errors.push('Period dates must use YYYY-MM-DD.');
  }
  if (input.periodEnd < input.periodStart) errors.push('Period end must not precede period start.');
  if (input.indicator === 'not_assessed' && input.teacherNote?.trim()) {
    errors.push('A not-assessed entry must not carry a negative progress judgment.');
  }
  return { valid: errors.length === 0, errors };
}

export function assertValidProgress(input: ProgressInput): void {
  const validation = validateProgress(input);
  if (!validation.valid) throw new DomainError('VALIDATION_FAILED', validation.errors.join(' '));
}

export function progressDocumentId(input: ProgressInput): string {
  return `${input.pupilId}_${input.subjectId}_${input.periodStart}_${input.periodEnd}`.replace(/[^A-Za-z0-9_-]/g, '_');
}

export function nextRevision(currentRevision: number, wasApproved: boolean): number {
  return wasApproved ? currentRevision + 1 : currentRevision;
}

export function eligibleForDigest(indicator: string, approvalStatus: string): boolean {
  return approvalStatus === 'approved' && indicator !== 'not_assessed';
}
