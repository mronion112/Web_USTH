// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  getCookie,
  setCookie,
  getStoredToken,
  setStoredToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
} from './api';

describe('Cookie & Storage Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    // clear document cookies
    document.cookie.split(';').forEach((c) => {
      const eqPos = c.indexOf('=');
      const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  });

  it('stores and retrieves token in both localStorage and cookies', () => {
    setStoredToken('test-access-token-123');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('test-access-token-123');
    expect(getCookie(TOKEN_KEY)).toBe('test-access-token-123');
    expect(getStoredToken()).toBe('test-access-token-123');
  });

  it('falls back to cookie if localStorage is empty', () => {
    setCookie(TOKEN_KEY, 'cookie-only-token');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(getStoredToken()).toBe('cookie-only-token');
  });

  it('clears token from both localStorage and cookies', () => {
    setStoredToken('token-to-remove');
    expect(getStoredToken()).toBe('token-to-remove');

    setStoredToken(null);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(getCookie(TOKEN_KEY)).toBeNull();
    expect(getStoredToken()).toBeNull();
  });

  it('stores and retrieves refresh token in both localStorage and cookies', () => {
    setStoredRefreshToken('refresh-token-xyz');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-token-xyz');
    expect(getCookie(REFRESH_TOKEN_KEY)).toBe('refresh-token-xyz');
    expect(getStoredRefreshToken()).toBe('refresh-token-xyz');

    setStoredRefreshToken(null);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(getCookie(REFRESH_TOKEN_KEY)).toBeNull();
    expect(getStoredRefreshToken()).toBeNull();
  });
});
