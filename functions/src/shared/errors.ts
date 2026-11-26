import { HttpsError } from 'firebase-functions/v2/https';
import { DomainError } from './contracts';

export function toHttpsError(error: unknown): HttpsError {
  if (error instanceof HttpsError) return error;
  if (error instanceof DomainError) {
    const code = (() => {
      switch (error.code) {
        case 'AUTH_REQUIRED': return 'unauthenticated';
        case 'APP_CHECK_REQUIRED': return 'failed-precondition';
        case 'PERMISSION_DENIED': return 'permission-denied';
        case 'VALIDATION_FAILED':
        case 'AI_PII_REJECTED':
        case 'AI_OUTPUT_REJECTED': return 'invalid-argument';
        case 'ATTENDANCE_ALREADY_SUBMITTED':
        case 'VERSION_CONFLICT': return 'already-exists';
        case 'IDEMPOTENCY_KEY_REUSED': return 'failed-precondition';
        case 'GUARDIAN_UNVERIFIED':
        case 'GUARDIAN_OPTED_OUT': return 'failed-precondition';
        case 'BUDGET_LIMIT_REACHED': return 'resource-exhausted';
        case 'RATE_LIMITED': return 'resource-exhausted';
        case 'PROVIDER_UNAVAILABLE':
        case 'AI_UNAVAILABLE': return 'unavailable';
        default: return 'internal';
      }
    })();
    return new HttpsError(code, error.message);
  }
  return new HttpsError('internal', 'The request could not be processed.');
}

export function safeMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
