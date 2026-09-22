import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarPage } from './CalendarPage';

const mockSearch = vi.fn();
const mockGetServices = vi.fn();
const mockGetStaff = vi.fn();
let refreshCallback: ((signal?: AbortSignal) => void | Promise<void>) | undefined;

vi.mock('@/lib/api', () => ({
  bookingsApi: {
    search: (...args: unknown[]) => mockSearch(...args),
    create: vi.fn(),
  },
  servicesApi: {
    getAll: () => mockGetServices(),
  },
  staffDirectoryApi: {
    getAll: () => mockGetStaff(),
  },
}));

vi.mock('@/lib/use-refresh', () => ({
  useRefresh: (_topic: string, callback: (signal?: AbortSignal) => void | Promise<void>) => {
    refreshCallback = callback;
  },
}));

describe('CalendarPage', () => {
  let container: HTMLDivElement;
  let root: Root;
  let selectedDateKey: string;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    selectedDateKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());

    mockSearch.mockImplementation(({ page }: { page: number }) => Promise.resolve(page === 0 ? {
      content: [{
        id: 1,
        bookingCode: 'LNR-FIRST',
        status: 'CONFIRMED',
        customerName: 'Nguyễn Hoàng Minh',
        staffAccountId: 7,
        staffName: 'KTV 7',
        serviceNames: ['Massage đá nóng'],
        bookingStart: `${selectedDateKey}T10:00:00`,
        bookingEnd: `${selectedDateKey}T11:00:00`,
        totalAmount: 350000,
      }],
      totalPages: 2,
    } : {
      content: [{
        id: 2,
        bookingCode: 'LNR-SECOND',
        status: 'PENDING',
        customerName: 'Khách chưa gán',
        serviceNames: ['Chăm sóc da'],
        bookingStart: `${selectedDateKey}T14:00:00`,
        bookingEnd: `${selectedDateKey}T15:00:00`,
        totalAmount: 250000,
      }],
      totalPages: 2,
    }));
    mockGetServices.mockResolvedValue([{ id: 1, name: 'Massage đá nóng', minimumDurationMinutes: 60 }]);
    mockGetStaff.mockResolvedValue(Array.from({ length: 7 }, (_, index) => ({
      accountId: index + 1,
      displayName: `KTV ${index + 1}`,
      jobTitle: 'Therapist',
      isBookable: true,
    })));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    document.body.removeChild(container);
    refreshCallback = undefined;
    vi.clearAllMocks();
  });

  it('loads every page in the selected day and renders all staff plus unassigned bookings', async () => {
    await act(async () => root.render(<CalendarPage />));
    expect(refreshCallback).toBeTypeOf('function');

    await act(async () => {
      await refreshCallback?.(new AbortController().signal);
    });

    expect(mockSearch).toHaveBeenCalledTimes(2);
    expect(mockSearch).toHaveBeenNthCalledWith(1, expect.objectContaining({
      page: 0,
      size: 100,
      from: `${selectedDateKey}T00:00:00`,
      sortBy: 'BOOKING_START',
      sortDirection: 'ASC',
    }), expect.any(AbortSignal));
    expect(mockSearch).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 1 }), expect.any(AbortSignal));
    expect(container.textContent).toContain('KTV 7');
    expect(container.textContent).toContain('Massage đá nóng');
    expect(container.textContent).toContain('Chưa phân công');
    expect(container.textContent).toContain('Khách chưa gán');
  });
});
