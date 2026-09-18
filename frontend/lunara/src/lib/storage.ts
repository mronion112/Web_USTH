const ACCESS_TOKEN_KEY = 'LUNARA_ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'LUNARA_REFRESH_TOKEN';

export const getAccessToken = (): string | null => sessionStorage.getItem(ACCESS_TOKEN_KEY);
export const setAccessToken = (token: string): void => sessionStorage.setItem(ACCESS_TOKEN_KEY, token);

export const getRefreshToken = (): string | null => sessionStorage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token: string): void => sessionStorage.setItem(REFRESH_TOKEN_KEY, token);

export const clearTokens = (): void => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
};
