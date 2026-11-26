import { DomainError, MAX_SYNC_BATCH, type SyncCommandRecord } from '../shared/contracts';

export interface BatchValidation {
  valid: boolean;
  errors: string[];
}

export function validateSyncBatch(commands: SyncCommandRecord[]): BatchValidation {
  const errors: string[] = [];
  if (commands.length === 0) errors.push('A sync batch cannot be empty.');
  if (commands.length > MAX_SYNC_BATCH) errors.push(`A sync batch may contain at most ${MAX_SYNC_BATCH} commands.`);
  const keys = new Set<string>();
  for (const command of commands) {
    if (!command.idempotencyKey?.trim()) errors.push('Every command needs an idempotency key.');
    if (keys.has(command.idempotencyKey)) errors.push('Idempotency keys must be unique within a batch.');
    keys.add(command.idempotencyKey);
    if (!Number.isInteger(command.schemaVersion) || command.schemaVersion < 1) {
      errors.push('Schema version must be a positive integer.');
    }
  }
  return { valid: errors.length === 0, errors };
}

export function assertValidBatch(commands: SyncCommandRecord[]): void {
  const validation = validateSyncBatch(commands);
  if (!validation.valid) throw new DomainError('VALIDATION_FAILED', validation.errors.join(' '));
}

export function retryDelaySeconds(attempt: number): number {
  return Math.min(300, 5 * 2 ** Math.max(0, Math.min(attempt, 6)));
}
