import { api } from '@/lib/api';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
}

export const exchangeAuthCode = async (code: string): Promise<TokenResponse> => {
  const response = await api<ApiResponse<TokenResponse>>('/api/v1/auth/exchange', {
    method: 'POST',
    body: JSON.stringify({ code })
  });
  return response.data;
};

export const logoutUser = async (): Promise<void> => {
  await api('/api/v1/auth/logout', { method: 'POST' });
};
