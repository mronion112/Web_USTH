const ACCESS_TOKEN_KEY = 'LUNARA_ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'LUNARA_REFRESH_TOKEN';

export const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.warn('Storage access denied or unavailable', error);
    return null;
  }
};

export const setAccessToken = (token: string): void => {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.warn('Failed to save to storage (QuotaExceeded or SecurityError)', error);
  }
};

export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn('Storage access denied or unavailable', error);
    return null;
  }
};

export const setRefreshToken = (token: string): void => {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.warn('Failed to save to storage (QuotaExceeded or SecurityError)', error);
  }
};

export const clearTokens = (): void => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to remove from storage', error);
  }
};
