import type { BookingSearchParams } from './api';

const SPA_TIME_ZONE = 'Asia/Ho_Chi_Minh';

function spaDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SPA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function latestBookingsQuery({ search, status, page }: {
  search: string;
  status: string;
  page: number;
}): BookingSearchParams {
  return {
    ...(search.trim() ? { code: search.trim() } : {}),
    ...(status !== 'ALL' ? { status } : {}),
    page,
    size: 50,
    sortBy: 'CREATED_AT',
    sortDirection: 'DESC',
  };
}

export function liveBookingsQuery(now = new Date()): BookingSearchParams {
  const today = spaDate(now);
  return {
    from: `${today}T00:00:00`,
    to: `${addDays(today, 7)}T00:00:00`,
    page: 0,
    size: 100,
    sortBy: 'BOOKING_START',
    sortDirection: 'ASC',
  };
}
