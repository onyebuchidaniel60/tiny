import { describe, expect, it } from 'vitest';
import { maskPhone, normalizeNigerianPhone } from './phone';

describe('normalizeNigerianPhone', () => {
  it('normalizes local and country-code forms', () => {
    expect(normalizeNigerianPhone('0803 123 4567')).toBe('+2348031234567');
    expect(normalizeNigerianPhone('2348031234567')).toBe('+2348031234567');
  });
  it('rejects invalid numbers', () => {
    expect(normalizeNigerianPhone('12345')).toBeNull();
    expect(normalizeNigerianPhone('06031234567')).toBeNull();
    expect(normalizeNigerianPhone('not a phone')).toBeNull();
  });
  it('masks phone numbers for logs', () => {
    expect(maskPhone('+2348031234567')).toBe('+234****67');
  });
});
