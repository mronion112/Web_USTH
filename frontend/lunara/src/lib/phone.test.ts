import { describe, expect, it } from 'vitest';
import { isValidPhoneNumber, normalizePhoneNumber } from './phone';

describe('phone validation', () => {
  it('normalizes supported Vietnamese and international numbers', () => {
    expect(normalizePhoneNumber('0912 345-678')).toBe('0912345678');
    expect(normalizePhoneNumber('+84 (912) 345 678')).toBe('+84912345678');
    expect(isValidPhoneNumber('0912 345 678')).toBe(true);
    expect(isValidPhoneNumber('+84 912 345 678')).toBe(true);
  });

  it('rejects short, malformed and prefix-less numbers', () => {
    expect(isValidPhoneNumber('123')).toBe(false);
    expect(isValidPhoneNumber('---12')).toBe(false);
    expect(isValidPhoneNumber('84912345678')).toBe(false);
  });
});
