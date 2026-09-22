// Lunara's local backend is a separate service on port 8080. Falling back to a
// relative URL silently sends OAuth requests to the SPA server, whose history
// fallback then turns `/oauth2/authorization/google` into the `/` page.
// Keep the local default explicit; deployments can override it at build time.
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');

export function getApiOrigin(): string {
  return API_ORIGIN;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const TOKEN_KEY = 'lunara_access_token';
export const REFRESH_TOKEN_KEY = 'lunara_refresh_token';

export function getCookie(name: string): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const val = parts.pop()?.split(';').shift();
      return val ? decodeURIComponent(val) : null;
    }
  } catch {
    // Ignore cookie read error
  }
  return null;
}

export function setCookie(name: string, value: string | null, days: number = 7): void {
  try {
    if (typeof document === 'undefined') return;
    if (value) {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    } else {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    }
  } catch {
    // Ignore cookie write error
  }
}

export function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) return token;
  } catch {
    // Fall back to cookie
  }
  return getCookie(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
  setCookie(TOKEN_KEY, token, 7);
}

export function getStoredRefreshToken(): string | null {
  try {
    const token = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (token) return token;
  } catch {
    // Fall back to cookie
  }
  return getCookie(REFRESH_TOKEN_KEY);
}

export function setStoredRefreshToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
  setCookie(REFRESH_TOKEN_KEY, token, 30);
}

function clearStoredTokens(): void {
  setStoredToken(null);
  setStoredRefreshToken(null);
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_ORIGIN}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const body = await response.json();
        const tokens = body?.data ?? body;
        if (!tokens?.accessToken) return false;
        setStoredToken(tokens.accessToken);
        if (tokens.refreshToken) setStoredRefreshToken(tokens.refreshToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);

  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
  const response = await fetch(url, {
    ...init,
    method,
    headers,
    credentials: 'include',
  });

  const isAuthEndpoint = path.includes('/api/auth/exchange')
    || path.includes('/api/auth/refresh-token');
  if (response.status === 401 && retry && !isAuthEndpoint && await refreshAccessToken()) {
    return api<T>(path, init, false);
  }
  if (response.status === 401 && !isAuthEndpoint) {
    clearStoredTokens();
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const json = await response.json();
  // Handle backend ResponseBuilder: { success: true, status: 200, message: "...", data: ... }
  if (json && typeof json === 'object' && 'data' in json && json.data !== undefined) {
    return json.data as T;
  }
  return json as T;
}

export const googleLogin = (redirectPath?: string) => {
  if (redirectPath) {
    try {
      sessionStorage.setItem('oauth2_redirect_path', redirectPath);
    } catch {}
  }
  window.location.assign(`${API_ORIGIN}/oauth2/authorization/google`);
};

export const json = (data: unknown) => JSON.stringify(data);

export interface PublicStaff {
  id: number | string;
  accountId: number | string;
  displayName: string;
  avatarUrl?: string;
  jobTitle?: string;
  isBookable?: boolean;
}

export const staffDirectoryApi = {
  getAll: () => api<PublicStaff[]>('/api/staff'),
};

export interface ApiBookingItem {
  serviceId: number;
  serviceName?: string;
  serviceNameSnapshot?: string;
  durationMinutes: number;
  lineAmount: number;
}

export interface ApiBooking {
  id: number;
  bookingCode: string;
  status: string;
  customerName?: string;
  customerNameSnapshot?: string;
  customerEmail?: string;
  customerEmailSnapshot?: string;
  customerPhoneSnapshot?: string;
  staffAccountId?: number;
  staff?: {
    accountId: number;
    displayName: string;
  };
  bookingStart: string;
  bookingEnd: string;
  totalDurationMinutes: number;
  totalAmount: number;
  holdExpiresAt?: string;
  items: ApiBookingItem[];
}

export interface CreateBookingRequest {
  customerPhone: string;
  staffAccountId?: number;
  bookingStart: string;
  customerNote?: string;
  items: { serviceId: number; durationMinutes: number }[];
}

export interface ApiBookingSummary {
  id: number;
  bookingCode: string;
  status: string;
  bookingStart: string;
  bookingEnd: string;
  totalAmount: number;
}

export interface CheckInResponse {
  bookingId: number;
  status: string;
  checkedInAt: string;
}

export interface AssignStaffResponse {
  bookingId: number;
  staffAccountId: number;
  assignmentSource: string;
}

export interface RescheduleBookingResponse {
  bookingId: number;
  bookingCode: string;
  staffAccountId: number;
  bookingStart: string;
  bookingEnd: string;
}

export interface EmailDispatchResponse {
  bookingId: number;
  bookingCode: string;
  status: 'QUEUED';
}

// ----------------- Service Types & APIs -----------------

export interface ApiService {
  id: string | number;
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  minimumDurationMinutes: number;
  isDurationAdjustable?: boolean;
  durationStepMinutes?: number;
  pricePerDurationStep?: number;
  preparationBufferMinutes?: number;
  cleanupBufferMinutes?: number;
  displayOrder?: number;
  isActive?: boolean;
  active?: boolean;
  staff?: { accountId: number; displayName: string }[];
  staffAccountIds?: number[];
}

export const servicesApi = {
  getAll: () => api<ApiService[]>('/api/services'),
  getById: (id: string | number) => api<ApiService>(`/api/services/${id}`),
  create: (data: Partial<ApiService>) => api<ApiService>('/api/manager/services', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string | number, data: Partial<ApiService>) => api<ApiService>(`/api/manager/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  toggleActive: (id: string | number) => api<{ id: number; active: boolean }>(`/api/manager/services/${id}`, {
    method: 'DELETE',
  }),
};

// ----------------- Bookings & Availability APIs -----------------

export interface AvailabilitySlot {
  staffAccountId: number;
  staffName: string;
  bookingStart: string;
  bookingEnd: string;
}

export interface AvailabilityResponse {
  totalDurationMinutes: number;
  slots: AvailabilitySlot[];
}

export interface ApiBookingSearch {
  id: number;
  bookingCode: string;
  status: string;
  customerAccountId: number;
  customerName: string;
  customerPhone?: string;
  staffAccountId?: number;
  staffName?: string;
  serviceNames?: string[];
  bookingStart: string;
  bookingEnd: string;
  totalAmount: number;
}

export interface PageableBookings {
  content: ApiBookingSearch[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export interface BookingSearchParams {
  from?: string;
  to?: string;
  status?: string;
  staffId?: number;
  code?: string;
  page?: number;
  size?: number;
  sortBy?: 'BOOKING_START' | 'CREATED_AT';
  sortDirection?: 'ASC' | 'DESC';
}

export const bookingsApi = {
  getAvailability: (req: {
    from: string;
    to: string;
    items: { serviceId: number; durationMinutes: number }[];
    staffAccountId?: number;
    excludedBookingId?: number;
  }, signal?: AbortSignal) => api<AvailabilityResponse>('/api/availability', {
    method: 'POST',
    body: JSON.stringify(req),
    signal,
  }),

  create: (req: CreateBookingRequest) => api<ApiBooking>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(req),
  }),

  createManager: (req: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerNote?: string;
    bookingStart: string;
    staffAccountId?: number;
    items: { serviceId: number; durationMinutes: number }[];
  }) => api<ApiBooking>('/api/manager/bookings', { method: 'POST', body: JSON.stringify(req) }),

  getMy: () => api<ApiBookingSummary[]>('/api/bookings/my'),
  getByCode: (code: string, signal?: AbortSignal) => api<ApiBooking>(`/api/bookings/${code}`, { signal }),

  search: (params: BookingSearchParams = {}, signal?: AbortSignal) => {
    const q = new URLSearchParams();
    if (params.from) q.set('from', params.from);
    if (params.to) q.set('to', params.to);
    if (params.status && params.status !== 'ALL') q.set('status', params.status);
    if (params.staffId) q.set('staffId', String(params.staffId));
    if (params.code) q.set('code', params.code);
    if (params.page !== undefined) q.set('page', String(params.page));
    if (params.size !== undefined) q.set('size', String(params.size));
    if (params.sortBy) q.set('sortBy', params.sortBy);
    if (params.sortDirection) q.set('sortDirection', params.sortDirection);
    return api<PageableBookings>(`/api/manager/bookings?${q.toString()}`, { signal });
  },

  checkIn: (bookingId: number | string) => api<CheckInResponse>(`/api/manager/bookings/${bookingId}/check-in`, {
    method: 'PATCH',
  }),

  assignStaff: (bookingId: number | string, staffAccountId: number) => api<AssignStaffResponse>(`/api/manager/bookings/${bookingId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ staffAccountId }),
  }),

  reschedule: (bookingCode: string, bookingStart: string, staffAccountId?: number) => api<RescheduleBookingResponse>(`/api/bookings/${bookingCode}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify({ bookingStart, ...(staffAccountId ? { staffAccountId } : {}) }),
  }),

  managerReschedule: (bookingId: number | string, bookingStart: string, staffAccountId?: number) => api<RescheduleBookingResponse>(`/api/manager/bookings/${bookingId}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify({ bookingStart, ...(staffAccountId ? { staffAccountId } : {}) }),
  }),

  resendEmail: (bookingId: number | string) => api<EmailDispatchResponse>(`/api/manager/bookings/${bookingId}/email/resend`, {
    method: 'POST',
  }),
};

// ----------------- Staff Tasks & Schedule APIs -----------------

export interface ApiTask {
  bookingId: number;
  bookingCode: string;
  status: string;
  bookingStart: string;
  bookingEnd: string;
  customerName: string;
  services: { name: string; durationMinutes: number }[];
}

export interface TaskTransitionResponse {
  bookingId: number;
  status: string;
  serviceStartedAt?: string;
  completedAt?: string;
}

export const staffTasksApi = {
  getTasks: (date?: string, signal?: AbortSignal) => api<ApiTask[]>(date ? `/api/staff/tasks?date=${date}` : '/api/staff/tasks', { signal }),
  start: (bookingId: number | string) => api<TaskTransitionResponse>(`/api/staff/tasks/${bookingId}/start`, {
    method: 'PATCH',
  }),
  complete: (bookingId: number | string) => api<TaskTransitionResponse>(`/api/staff/tasks/${bookingId}/complete`, {
    method: 'PATCH',
  }),
};

export interface ApiWorkingHour {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface ApiTimeOff {
  id: number;
  staffId: number;
  startAt: string;
  endAt: string;
  reason?: string;
}

export interface ApiBookingBlock {
  bookingId: number;
  bookingCode: string;
  status: string;
  startAt: string;
  endAt: string;
}

export interface ApiStaffSchedule {
  staffId: number;
  workingHours: ApiWorkingHour[];
  timeOff: ApiTimeOff[];
  bookingBlocks: ApiBookingBlock[];
}

export const staffScheduleApi = {
  getSchedule: (staffId: number | string, from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    const query = q.toString() ? `?${q.toString()}` : '';
    return api<ApiStaffSchedule>(`/api/manager/staff/${staffId}/schedule${query}`);
  },
  updateWorkingHours: (staffId: number | string, workingHours: { dayOfWeek: number; startTime: string; endTime: string; isActive?: boolean }[]) =>
    api<{ staffId: number; updated: boolean }>(`/api/manager/staff/${staffId}/working-hours`, {
      method: 'PUT',
      body: JSON.stringify({ workingHours }),
    }),
  createTimeOff: (staffId: number | string, data: { startAt: string; endAt: string; reason?: string }) =>
    api<ApiTimeOff>(`/api/manager/staff/${staffId}/time-off`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ----------------- Dashboard & Reports APIs -----------------

export interface DashboardMetrics {
  totalCustomers: number;
  totalStaff: number;
  totalServices: number;
  totalBookings: number;
  todayBookings: number;
  completedBookings: number;
  pendingPayments: number;
  todayRevenue: number;
  averageRating: number;
}

export const dashboardApi = {
  getMetrics: () => api<DashboardMetrics>('/api/manager/dashboard'),
};

export interface ReportPeriod {
  period: string;
  bookingCount: number;
  completedCount: number;
  paidRevenue: number;
}

export interface ReportSummary {
  from: string;
  to: string;
  groupBy: string;
  totalBookings: number;
  completedBookings: number;
  paidRevenue: number;
  series: ReportPeriod[];
}

export const reportsApi = {
  getSummary: (from: string, to: string, groupBy: 'DAY' | 'WEEK' | 'MONTH' = 'DAY') =>
    api<ReportSummary>(`/api/reports/summary?from=${from}&to=${to}&groupBy=${groupBy}`),
};

// ----------------- Payments APIs -----------------

export interface ApiPayment {
  id: number;
  transactionCode: string;
  bookingId: number;
  bookingCode?: string;
  customerName?: string;
  status: string;
  method: string;
  amount: number;
  paidAt?: string;
  createdAt?: string;
  qrPayload?: string;
  bankBin?: string;
  bankAccount?: string;
  bankAccountName?: string;
  bankReference?: string;
  paymentProvider?: string;
}

export interface ApiSepayTransaction {
  id: number;
  sepayId: number;
  gateway: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string;
  paymentCode?: string;
  content?: string;
  transferType: string;
  transferAmount: number;
  referenceCode?: string;
  matchedPaymentId?: number;
  status: 'RECEIVED' | 'CONFIRMED' | 'MANUAL_REVIEW' | 'IGNORED';
  reviewReason?: string;
  createdAt: string;
}

export const paymentsApi = {
  getAll: (params: { search?: string; status?: string; page?: number; size?: number } = {}, signal?: AbortSignal) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.status && params.status !== 'ALL') q.set('status', params.status);
    if (params.page !== undefined) q.set('page', String(params.page));
    if (params.size !== undefined) q.set('size', String(params.size));
    return api<ApiPayment[]>(`/api/payments?${q.toString()}`, { signal });
  },
  getByBooking: (bookingId: number | string, signal?: AbortSignal) => api<ApiPayment>(`/api/payments/booking/${bookingId}`, { signal }),
  create: (req: { bookingId: number; method: string }) => api<ApiPayment>('/api/payments', {
    method: 'POST',
    body: JSON.stringify(req),
  }),
  markPaid: (paymentId: number | string, transactionCode: string) => api<ApiPayment>(`/api/payments/${paymentId}/paid`, {
    method: 'PATCH',
    body: JSON.stringify({ transactionCode }),
  }),
  refund: (paymentId: number | string) => api<ApiPayment>(`/api/payments/${paymentId}/refund`, {
    method: 'POST',
  }),
  getSepayTransactions: (status?: ApiSepayTransaction['status'], signal?: AbortSignal) => {
    const query = status ? `?status=${status}` : '';
    return api<ApiSepayTransaction[]>(`/api/payments/sepay/transactions${query}`, { signal });
  },
  reconcileSepay: (sepayId: number, action: 'CONFIRM' | 'IGNORE', paymentId?: number) =>
    api<ApiSepayTransaction>(`/api/payments/sepay/transactions/${sepayId}/reconcile`, {
      method: 'POST',
      body: JSON.stringify({ action, ...(paymentId ? { paymentId } : {}) }),
    }),
};

// ----------------- Customers APIs -----------------

export interface ApiCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  preferences?: string;
  internalNotes?: string;
  bookingsCount: number;
  completedCount: number;
  totalSpent: number;
  lastVisit?: string;
}

export const customersApi = {
  getAll: (search?: string, page = 0, size = 100) => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    q.set('page', String(page));
    q.set('size', String(size));
    return api<ApiCustomer[]>(`/api/manager/customers?${q.toString()}`);
  },
  updateNotes: (accountId: number, notes?: string, preferences?: string) =>
    api<{ message: string }>(`/api/manager/customers/${accountId}/notes`, {
      method: 'PUT',
      body: JSON.stringify({ internalNotes: notes, preferences }),
    }),
  create: (data: { name: string; phone: string; email?: string; internalNotes?: string; preferences?: string }) =>
    api<Pick<ApiCustomer, 'id' | 'name' | 'phone' | 'email'>>('/api/manager/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ----------------- Accounts & Users APIs -----------------

export interface ApiAccount {
  id: number;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  isActive: boolean;
}

export const accountsApi = {
  getAll: () => api<ApiAccount[]>('/api/manager/accounts'),
  toggleActive: (id: number | string) => api<{ id: number; isActive: boolean }>(`/api/manager/accounts/${id}/toggle-active`, {
    method: 'PATCH',
  }),
  updateRole: (id: number | string, role: string) => api<{ id: number; role: string }>(`/api/manager/accounts/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }),
  create: (data: { email: string; name: string; role: string }) => api<ApiAccount>('/api/manager/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const staffOnboardingApi = {
  create: (data: { name: string; email: string; jobTitle: string; isBookable: boolean; serviceIds: number[];
    workingHours: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[] }) =>
    api<{ accountId: number; email: string; displayName: string; role: 'THERAPIST'; employeeCode: string; isBookable: boolean }>(
      '/api/manager/staff', { method: 'POST', body: JSON.stringify(data) }),
};

// ----------------- Notifications APIs -----------------

export interface ApiNotification {
  id: number;
  bookingId?: number;
  bookingCode?: string;
  eventType: string;
  message: string;
  occurredAt: string;
}

export const notificationsApi = {
  getRecent: (limit = 10, offset = 0, signal?: AbortSignal) => api<ApiNotification[]>(`/api/manager/notifications?limit=${limit}&offset=${offset}`, { signal }),
};

// ----------------- Profile APIs -----------------

export interface ApiProfile {
  id: number;
  accountId: number;
  displayName: string;
  email: string;
  phone?: string;
  preferences?: string;
  role: string;
  employeeCode?: string;
  jobTitle?: string;
  isBookable?: boolean;
}

export const profileApi = {
  getMe: () => api<ApiProfile>('/api/profile/me'),
  updateMe: (data: { displayName?: string; phone?: string; preferences?: string }) =>
    api<ApiProfile>('/api/profile/me', { method: 'PUT', body: JSON.stringify(data) }),
};

// ----------------- Auth APIs -----------------

export const authApi = {
  getMe: () => api<ApiAccount>('/api/auth/me'),
  exchange: async (code: string) => {
    const res = await api<{ accessToken: string; refreshToken: string }>('/api/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    if (res.accessToken) {
      setStoredToken(res.accessToken);
    }
    if (res.refreshToken) {
      setStoredRefreshToken(res.refreshToken);
    }
    return res;
  },
  logout: async () => {
    const refreshToken = getStoredRefreshToken();
    try {
      await api('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      clearStoredTokens();
    }
  },
};
