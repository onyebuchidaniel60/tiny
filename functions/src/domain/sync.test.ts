import { describe, expect, it } from 'vitest';
import { assertValidBatch, retryDelaySeconds, validateSyncBatch } from './sync';

describe('sync batch rules', () => {
  it('rejects oversized and duplicate-key batches', () => {
    expect(validateSyncBatch(Array.from({ length: 21 }, (_, i) => ({
      idempotencyKey: `k${i}`,
      commandType: 'attendance.submit',
      schemaVersion: 1,
      payload: {},
    }))).valid).toBe(false);
    expect(validateSyncBatch([
      { idempotencyKey: 'same', commandType: 'a', schemaVersion: 1, payload: {} },
      { idempotencyKey: 'same', commandType: 'b', schemaVersion: 1, payload: {} },
    ]).valid).toBe(false);
  });

  it('accepts a normal batch and caps backoff', () => {
    expect(() => assertValidBatch([
      { idempotencyKey: 'a', commandType: 'attendance.submit', schemaVersion: 1, payload: {} },
    ])).not.toThrow();
    expect(retryDelaySeconds(20)).toBe(300);
  });
});
