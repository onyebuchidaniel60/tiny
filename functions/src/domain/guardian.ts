import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { normalizeNigerianPhone } from './phone';
import { DomainError, type GuardianRecord } from '../shared/contracts';

export function guardianPhoneKey(workspaceId: string, phoneE164: string, secret: string): string {
  return createHmac('sha256', secret).update(`${workspaceId}|${phoneE164}`).digest('hex');
}

export function verificationCode(): string {
  return randomBytes(6).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

export function verificationCodeHash(workspaceId: string, guardianId: string, code: string): string {
  return createHash('sha256').update(`${workspaceId}|${guardianId}|${code.trim().toUpperCase()}`).digest('hex');
}

export function hashMatches(expectedHash: string, actualHash: string): boolean {
  const a = Buffer.from(expectedHash, 'hex');
  const b = Buffer.from(actualHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export function canNotifyGuardian(guardian: Pick<GuardianRecord, 'verificationStatus' | 'consentStatus'>): boolean {
  return guardian.verificationStatus === 'verified' && guardian.consentStatus === 'opted_in';
}

export function dedupeGuardiansByPhone(guardians: GuardianRecord[]): GuardianRecord[] {
  const seen = new Set<string>();
  return guardians.filter((guardian) => {
    if (seen.has(guardian.phoneEndpointHash)) return false;
    seen.add(guardian.phoneEndpointHash);
    return true;
  });
}

export function assertValidGuardianPhone(raw: string): string {
  const normalized = normalizeNigerianPhone(raw);
  if (!normalized) throw new DomainError('VALIDATION_FAILED', 'Enter a valid Nigerian phone number.');
  return normalized;
}

export function isStopKeyword(body: string): boolean {
  return /^\s*stop\s*$/i.test(body);
}

export function isStartKeyword(body: string): boolean {
  return /^\s*start\s*$/i.test(body);
}
