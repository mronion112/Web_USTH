import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MyBookingsPage } from './MyBookingsPage';

const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetMy = vi.fn();
vi.mock('@/lib/api', () => ({
  bookingsApi: {
    getMy: () => mockGetMy(),
  },
}));

vi.mock('@/lib/use-refresh', () => ({
  useRefresh: vi.fn(),
}));

describe('MyBookingsPage Component', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('renders login prompt when user is not logged in', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <BrowserRouter>
          <MyBookingsPage />
        </BrowserRouter>
      );
    });

    expect(container.textContent).toContain('Lịch hẹn trị liệu của bạn');
    expect(container.textContent).toContain('Đăng nhập để xem lịch hẹn');
  });

  it('renders bookings list and filter tabs when user has bookings', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'customer@lunara.demo', displayName: 'Chị Lan', roleCode: 'CUSTOMER' },
      loading: false,
    });

    mockGetMy.mockResolvedValue([
      {
        id: 101,
        bookingCode: 'BK-LUNARA-101',
        status: 'CONFIRMED',
        bookingStart: '2026-09-25T14:00:00',
        bookingEnd: '2026-09-25T15:30:00',
        totalAmount: 650000,
      },
      {
        id: 102,
        bookingCode: 'BK-LUNARA-102',
        status: 'PENDING_PAYMENT',
        bookingStart: '2026-09-26T10:00:00',
        bookingEnd: '2026-09-26T11:00:00',
        totalAmount: 420000,
      },
    ]);

    const root = createRoot(container);

    await act(async () => {
      root.render(
        <BrowserRouter>
          <MyBookingsPage />
        </BrowserRouter>
      );
    });

    expect(container.textContent).toContain('Lịch Hẹn Của Tôi');
    expect(container.textContent).toContain('BK-LUNARA-101');
    expect(container.textContent).toContain('BK-LUNARA-102');
    expect(container.textContent).toContain('Đã xác nhận');
    expect(container.textContent).toContain('Chờ thanh toán');
    expect(container.textContent).toContain('Xem vé hẹn');
  });
});
