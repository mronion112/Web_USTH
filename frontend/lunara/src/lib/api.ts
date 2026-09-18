const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const csrfCookie = () => decodeURIComponent(document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='))?.split('=')[1] || '');

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (unsafe && !csrfCookie()) await fetch(`${API_ORIGIN}/api/v1/auth/csrf`, { credentials: 'include' });
  const headers = new Headers(init.headers);
  const accessToken = localStorage.getItem('lunara.accessToken');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (unsafe) headers.set('X-XSRF-TOKEN', csrfCookie());
  const response = await fetch(`${API_ORIGIN}${path}`, { ...init, method, headers, credentials: 'include' });
  if (response.status === 401 && retry && !['/api/v1/auth/refresh', '/api/v1/auth/logout', '/api/v1/auth/csrf'].includes(path)) {
    await api('/api/v1/auth/refresh', { method: 'POST' }, false);
    return api(path, init, false);
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
