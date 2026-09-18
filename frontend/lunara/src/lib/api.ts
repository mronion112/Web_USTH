import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from './storage';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_ORIGIN}${path}`, { ...init, method, headers });
  
  // Auto-refresh logic on 401
  if (response.status === 401 && retry && !path.includes('/api/v1/auth/refresh')) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_ORIGIN}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setAccessToken(data.data.accessToken);
          setRefreshToken(data.data.refreshToken);
          return api(path, init, false); // Retry original request
        }
      } catch (err) {
        // Fallthrough to clear tokens
      }
    }
    clearTokens();
    window.location.href = '/auth'; // Force login
    throw new ApiError(401, 'Session expired');
  }

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new ApiError(response.status, details.message || `HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const json = (value: unknown) => JSON.stringify(value);
export const googleLogin = () => { window.location.assign(`${API_ORIGIN}/oauth2/authorization/google`); };
export const exchangeOAuthCode = (code: string) => api<{ accessToken: string; refreshToken?: string }>('/api/v1/auth/exchange', { method: 'POST', body: json({ code }) });
export const events = () => new EventSource(`${API_ORIGIN}/api/v1/events`, { withCredentials: true });

export interface ApiService {
  id: string; name: string; category: string; description?: string; imageUrl?: string;
  basePrice: number; minimumDurationMinutes: number; isDurationAdjustable: boolean;
  durationStepMinutes?: number; pricePerDurationStep?: number;
  preparationBufferMinutes: number; cleanupBufferMinutes: number; isActive: boolean;
}
export interface PublicStaff {
  accountId: string; displayName: string; jobTitle: string; isBookable: boolean; serviceIds: string[];
}
export interface ApiBooking {
  id: string; bookingCode: string; status: string; customerNameSnapshot: string; customerEmailSnapshot: string;
  customerPhoneSnapshot?: string; staffAccountId: string; bookingStart: string; bookingEnd: string;
  holdExpiresAt?: string; serverNow: string; totalDurationMinutes: number; totalAmount: number; paymentStatus: string;
  qrImageUrl: string; bank: string; bankAccount: string; paymentMemo: string;
  items: { serviceId: string; serviceNameSnapshot: string; durationMinutes: number; lineAmount: number }[];
}
