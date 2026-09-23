export function normalizePhoneNumber(value: string): string {
  return value.trim().replace(/[\s().-]/g, '');
}

export function isValidPhoneNumber(value: string): boolean {
  const normalized = normalizePhoneNumber(value);
  return /^0\d{9}$/.test(normalized) || /^\+[1-9]\d{8,14}$/.test(normalized);
}
